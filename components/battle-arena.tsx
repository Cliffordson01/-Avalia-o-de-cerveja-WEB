"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Zap, Heart, MessageCircle, Trophy, Sparkles, X, Crown } from "lucide-react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getBeerImageUrl } from "@/lib/utils"
import Link from "next/link"

interface BattleArenaProps {
  cervejas: any[]
  userId?: string
}

export function BattleArena({ cervejas, userId }: BattleArenaProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [beer1, setBeer1] = useState<any>(null)
  const [beer2, setBeer2] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [battleCount, setBattleCount] = useState(0)
  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (cervejas.length >= 2) {
      loadUserInteractions()
      selectRandomBeers()
    }
  }, [cervejas])

  useEffect(() => {
    setAnimateIn(true)
    const timer = setTimeout(() => setAnimateIn(false), 1000)
    return () => clearTimeout(timer)
  }, [beer1, beer2])

  const loadUserInteractions = async () => {
    if (!userId) return

    try {
      const [votesResponse, favoritesResponse] = await Promise.all([
        supabase
          .from("voto")
          .select("cerveja_id")
          .eq("usuario_id", userId)
          .eq("deletado", false)
          .eq("status", true),
        supabase
          .from("favorito")
          .select("cerveja_id")
          .eq("usuario_id", userId)
          .eq("deletado", false)
          .eq("status", true)
      ])

      if (votesResponse.data) {
        setUserVotes(new Set(votesResponse.data.map((v: { cerveja_id: string }) => v.cerveja_id)))
      }
      if (favoritesResponse.data) {
        setUserFavorites(new Set(favoritesResponse.data.map((f: { cerveja_id: string }) => f.cerveja_id)))
      }
    } catch (error) {
      console.error("Erro ao carregar interações:", error)
    }
  }

  const selectRandomBeers = () => {
    if (cervejas.length < 2) return

    const availableCervejas = cervejas.filter(cerveja => 
      !usedPairs.has(getPairKey(beer1, cerveja)) && 
      !usedPairs.has(getPairKey(beer2, cerveja))
    )

    if (availableCervejas.length < 2) {
      setUsedPairs(new Set())
      selectRandomBeers()
      return
    }

    const shuffled = [...availableCervejas].sort(() => Math.random() - 0.5)
    const newBeer1 = shuffled[0]
    const newBeer2 = shuffled[1]
    
    setBeer1(newBeer1)
    setBeer2(newBeer2)
    setShowWinner(false)
    setWinner(null)

    const pairKey = getPairKey(newBeer1, newBeer2)
    setUsedPairs(prev => new Set([...prev, pairKey]))
  }

  const getPairKey = (beerA: any, beerB: any) => {
    const ids = [beerA?.uuid, beerB?.uuid].sort()
    return ids.join('_')
  }

  const handleVote = async (beerId: string) => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para votar.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Se já votou, cancela o voto
    if (userVotes.has(beerId)) {
      await cancelVote(beerId)
      return
    }

    setLoading(beerId)

    try {
      // Usar upsert para prevenir duplicatas
      const { error } = await supabase
        .from("voto")
        .upsert({
          usuario_id: userId,
          cerveja_id: beerId,
          quantidade: 1,
          status: true,
          deletado: false,
          criado_em: new Date().toISOString()
        }, {
          onConflict: 'usuario_id,cerveja_id',
          ignoreDuplicates: false
        })

      if (error) throw error

      // Atualizar estado local
      setUserVotes(prev => new Set([...prev, beerId]))

      // Mostrar vencedor
      const winnerBeer = beerId === beer1.uuid ? beer1 : beer2
      setWinner(winnerBeer)
      setShowWinner(true)

      toast({
        title: "🏆 Voto registrado!",
        description: `Você escolheu ${winnerBeer.nome}!`,
      })

      // Avançar após delay
      setTimeout(() => {
        setBattleCount(prev => prev + 1)
        selectRandomBeers()
        router.refresh()
      }, 2000)

    } catch (error: any) {
      console.error("Erro ao votar:", error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const cancelVote = async (beerId: string) => {
    if (!userId) return

    setLoading(beerId)

    try {
      const { error } = await supabase
        .from("voto")
        .update({ 
          deletado: true,
          status: false 
        })
        .eq("usuario_id", userId)
        .eq("cerveja_id", beerId)
        .eq("deletado", false)

      if (error) throw error

      setUserVotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(beerId)
        return newSet
      })

      toast({
        title: "Voto removido",
        description: "Seu voto foi cancelado.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao cancelar o voto.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const toggleFavorite = async (beerId: string) => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para favoritar.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      if (userFavorites.has(beerId)) {
        const { error } = await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", userId)
          .eq("cerveja_id", beerId)
          .eq("deletado", false)

        if (error) throw error

        setUserFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(beerId)
          return newSet
        })

        toast({
          title: "Removido dos favoritos",
          description: "Cerveja removida da sua lista.",
        })
      } else {
        const { error } = await supabase
          .from("favorito")
          .upsert({
            usuario_id: userId,
            cerveja_id: beerId,
            status: true,
            deletado: false,
            criado_em: new Date().toISOString()
          }, {
            onConflict: 'usuario_id,cerveja_id'
          })

        if (error) throw error

        setUserFavorites(prev => new Set([...prev, beerId]))

        toast({
          title: "⭐ Adicionado aos favoritos!",
          description: "Cerveja salva na sua lista.",
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      })
    }
  }

  const getRankingData = (beer: any) => {
    if (!beer.ranking) return {
      media_avaliacao: 0,
      total_votos: 0,
      total_favoritos: 0,
      total_comentarios: 0
    }

    const ranking = Array.isArray(beer.ranking) ? beer.ranking[0] : beer.ranking
    return {
      media_avaliacao: Number(ranking?.media_avaliacao) || 0,
      total_votos: Number(ranking?.total_votos) || 0,
      total_favoritos: Number(ranking?.total_favoritos) || 0,
      total_comentarios: Number(ranking?.total_comentarios) || 0
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getVotePercentage = (beer: any, totalVotos: number) => {
    if (totalVotos === 0) return 0
    const ranking = getRankingData(beer)
    return Math.round((ranking.total_votos / totalVotos) * 100)
  }

  if (!beer1 || !beer2) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-12 text-center">
          <Zap className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg">Não há cervejas suficientes para batalha.</p>
          <p className="text-sm text-muted-foreground mt-2">Adicione mais cervejas para começar as batalhas!</p>
        </CardContent>
      </Card>
    )
  }

  const ranking1 = getRankingData(beer1)
  const ranking2 = getRankingData(beer2)
  const totalVotos = ranking1.total_votos + ranking2.total_votos
  const votePercentage1 = getVotePercentage(beer1, totalVotos)
  const votePercentage2 = getVotePercentage(beer2, totalVotos)
  
  const hasVoted1 = userVotes.has(beer1.uuid)
  const hasVoted2 = userVotes.has(beer2.uuid)
  const isFavorite1 = userFavorites.has(beer1.uuid)
  const isFavorite2 = userFavorites.has(beer2.uuid)

  const isBeer1Loading = loading === beer1.uuid
  const isBeer2Loading = loading === beer2.uuid

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`text-center space-y-4 transition-all duration-500 ${
        animateIn ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}>
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="h-7 w-7 text-yellow-500 animate-pulse" />
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ARENA DE BATALHA
          </h1>
          <Sparkles className="h-7 w-7 text-yellow-500 animate-pulse" />
        </div>
        
        {battleCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 rounded-full text-white font-semibold shadow-lg animate-bounce">
            <Trophy className="h-4 w-4" />
            <span>{battleCount} batalha{battleCount > 1 ? "s" : ""} completada{battleCount > 1 ? "s" : ""}</span>
          </div>
        )}
        
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          Escolha a cerveja que merece sua vitória! Você pode votar em quantas quiser e 
          <span className="font-semibold text-primary"> alterar seus votos a qualquer momento</span>.
        </p>
      </div>

      {/* Winner Animation */}
      {showWinner && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-card to-primary/10 border-2 border-primary rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="animate-bounce mb-4">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-500 mx-auto" />
                <Crown className="h-8 w-8 text-yellow-300 absolute -top-2 -right-2" />
              </div>
            </div>
            <h3 className="text-3xl font-bebas mb-3 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              🏆 VOTO CONFIRMADO! 🏆
            </h3>
            <p className="text-xl font-bold mb-2">{winner.nome}</p>
            <p className="text-muted-foreground mb-4">sua escolha foi registrada!</p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Arena */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 relative">
        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full blur-md opacity-75 animate-pulse"></div>
            <Badge className="relative bg-gradient-to-r from-red-500 to-yellow-500 text-white px-8 py-4 text-xl font-bebas border-4 border-background shadow-2xl">
              VS
            </Badge>
          </div>
        </div>

        {/* Beer 1 */}
        <div className={`transition-all duration-500 ${
          animateIn ? "opacity-0 -translate-x-8" : "opacity-100 translate-x-0"
        }`}>
          <Card className={`beer-card group transition-all duration-300 relative overflow-hidden border-2 ${
            hasVoted1
              ? "border-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
              : "border-border hover:border-primary hover:shadow-xl"
          } ${loading === beer1.uuid ? "animate-pulse" : ""}`}>
            
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-md hover:scale-110 transition-transform"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(beer1.uuid)
              }}
              disabled={!!loading}
            >
              <Heart 
                className={`h-5 w-5 transition-all ${
                  isFavorite1 
                    ? "fill-red-500 text-red-500 scale-110 animate-pulse" 
                    : "text-muted-foreground hover:text-red-500 hover:scale-110"
                }`}
              />
            </Button>

            {/* Vote Badge */}
            {hasVoted1 && (
              <div className="absolute top-3 left-3 z-10 animate-bounce">
                <Badge className="bg-green-500 text-white px-3 py-1 shadow-lg border-2 border-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Seu Voto
                </Badge>
              </div>
            )}

            {/* Vote Percentage */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm px-3 py-1 font-bold">
                {votePercentage1}%
              </Badge>
            </div>

            <Link href={`/cerveja/${beer1.uuid}`} className="block cursor-pointer">
              <CardContent className="p-6">
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-muted/50">
                  <Image
                    src={getBeerImageUrl(beer1.imagem_url || beer1.imagem_main) || "/placeholder.svg"}
                    alt={beer1.nome}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bebas text-3xl tracking-wide text-balance leading-tight">{beer1.nome}</h3>
                    <p className="text-muted-foreground font-medium">{beer1.marca}</p>
                  </div>

                  {beer1.estilo && (
                    <Badge variant="secondary" className="text-xs">
                      {beer1.estilo}
                    </Badge>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                      <div>
                        <div className="font-bold">{ranking1.media_avaliacao.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">avaliação</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking1.total_votos)}</div>
                        <div className="text-xs text-muted-foreground">votos</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking1.total_comentarios)}</div>
                        <div className="text-xs text-muted-foreground">comentários</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking1.total_favoritos)}</div>
                        <div className="text-xs text-muted-foreground">favoritos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>

            <div className="px-6 pb-6">
              <Button
                className={`w-full h-12 text-base font-semibold transition-all duration-200 relative overflow-hidden ${
                  hasVoted1 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" 
                    : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md hover:shadow-lg"
                }`}
                size="lg"
                disabled={!!loading}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleVote(beer1.uuid)
                }}
              >
                {isBeer1Loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : hasVoted1 ? (
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5" />
                    Remover Voto
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Votar Agora
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Beer 2 */}
        <div className={`transition-all duration-500 delay-100 ${
          animateIn ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
        }`}>
          <Card className={`beer-card group transition-all duration-300 relative overflow-hidden border-2 ${
            hasVoted2
              ? "border-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
              : "border-border hover:border-primary hover:shadow-xl"
          } ${loading === beer2.uuid ? "animate-pulse" : ""}`}>
            
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-md hover:scale-110 transition-transform"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(beer2.uuid)
              }}
              disabled={!!loading}
            >
              <Heart 
                className={`h-5 w-5 transition-all ${
                  isFavorite2 
                    ? "fill-red-500 text-red-500 scale-110 animate-pulse" 
                    : "text-muted-foreground hover:text-red-500 hover:scale-110"
                }`}
              />
            </Button>

            {/* Vote Badge */}
            {hasVoted2 && (
              <div className="absolute top-3 left-3 z-10 animate-bounce">
                <Badge className="bg-green-500 text-white px-3 py-1 shadow-lg border-2 border-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Seu Voto
                </Badge>
              </div>
            )}

            {/* Vote Percentage */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm px-3 py-1 font-bold">
                {votePercentage2}%
              </Badge>
            </div>

            <Link href={`/cerveja/${beer2.uuid}`} className="block cursor-pointer">
              <CardContent className="p-6">
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-muted/50">
                  <Image
                    src={getBeerImageUrl(beer2.imagem_url || beer2.imagem_main) || "/placeholder.svg"}
                    alt={beer2.nome}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bebas text-3xl tracking-wide text-balance leading-tight">{beer2.nome}</h3>
                    <p className="text-muted-foreground font-medium">{beer2.marca}</p>
                  </div>

                  {beer2.estilo && (
                    <Badge variant="secondary" className="text-xs">
                      {beer2.estilo}
                    </Badge>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                      <div>
                        <div className="font-bold">{ranking2.media_avaliacao.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">avaliação</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking2.total_votos)}</div>
                        <div className="text-xs text-muted-foreground">votos</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking2.total_comentarios)}</div>
                        <div className="text-xs text-muted-foreground">comentários</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">{formatNumber(ranking2.total_favoritos)}</div>
                        <div className="text-xs text-muted-foreground">favoritos</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>

            <div className="px-6 pb-6">
              <Button
                className={`w-full h-12 text-base font-semibold transition-all duration-200 relative overflow-hidden ${
                  hasVoted2 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" 
                    : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md hover:shadow-lg"
                }`}
                size="lg"
                disabled={!!loading}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleVote(beer2.uuid)
                }}
              >
                {isBeer2Loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : hasVoted2 ? (
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5" />
                    Remover Voto
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Votar Agora
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Skip Button */}
      <div className={`text-center transition-all duration-500 delay-200 ${
        animateIn ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}>
        <Button 
          variant="outline" 
          onClick={selectRandomBeers} 
          disabled={!!loading}
          className="relative overflow-hidden hover:scale-105 active:scale-95 transition-transform border-2 h-12 px-8"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Pular Batalha</span>
          </div>
        </Button>
      </div>
    </div>
  )
}