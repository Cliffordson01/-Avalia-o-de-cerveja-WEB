// app/cerveja/[id]/BeerDetailClient.tsx - CORRIGIDO SISTEMA DE AVALIAÇÃO
"use client"

import { useState, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft, Heart, ThumbsUp, Star, MapPin, Droplet, Wine, Thermometer, UtensilsCrossed, MessageCircle, Trophy, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/contexts/AuthContext"
import Link from "next/link"
import Image from "next/image"

// ✅ CORREÇÃO: CommentsSection é export default
const CommentsSection = lazy(() => import('@/components/CommentsSection'))

interface BeerInfo {
  origem?: string | null
  teor_alcoolico?: number | null
  amargor?: number | null
  aparencia?: string | null
  aroma?: string | null
  sabor?: string | null
  corpo_textura?: string | null
  harmonizacao?: string | null
  temperatura_ideal?: string | null
  impressao_geral?: string | null
}

interface BeerDetail {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  informacao: BeerInfo[]
  ranking: any[]
  selo?: { tipo: string; imagem_url?: string }[]
  user_voto: boolean
  user_favorito: boolean
  user_avaliacao: number
}

interface BeerDetailClientProps {
  initialBeer: BeerDetail
}

// ✅ Skeleton para comentários
const CommentsSkeleton = () => (
  <div className="mt-12">
    <div className="text-center py-8">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-muted-foreground">Carregando comentários...</p>
    </div>
  </div>
)

export function BeerDetailClient({ initialBeer }: BeerDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [beer, setBeer] = useState(initialBeer)
  const [userRating, setUserRating] = useState(initialBeer.user_avaliacao)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isFavorited, setIsFavorited] = useState(initialBeer.user_favorito)
  const [hasVoted, setHasVoted] = useState(initialBeer.user_voto)
  const [loading, setLoading] = useState(false)

  // ✅ FUNÇÃO MELHORADA - USA CONTEXTO EM VEZ DE PROPS
  const showLoginError = (action: string) => {
    toast({
      title: "Login necessário",
      description: `Você precisa estar logado para ${action}.`,
      variant: "destructive",
    })
    router.push("/login")
  }

  // ✅ FUNÇÃO DE AVALIAÇÃO CORRIGIDA - PERMITE REMOVER COMPLETAMENTE
  const handleRating = async (rating: number) => {
    if (!user) return showLoginError("avaliar")

    setLoading(true)
    try {
      // Se clicar na mesma estrela que já está selecionada, REMOVE COMPLETAMENTE a avaliação
      const isRemovingRating = userRating === rating

      if (isRemovingRating) {
        // REMOVER AVALIAÇÃO COMPLETAMENTE
        const { error } = await supabase
          .from("avaliacao")
          .delete()
          .eq("usuario_id", user.uuid)
          .eq("cerveja_id", beer.uuid)

        if (error) throw error

        setUserRating(0)
        setHoveredRating(0)
        
        toast({ 
          title: "Avaliação removida!", 
          description: "Sua avaliação foi removida com sucesso." 
        })
      } else {
        // ADICIONAR/ALTERAR AVALIAÇÃO
        const { error } = await supabase
          .from("avaliacao")
          .upsert({
            usuario_id: user.uuid,
            cerveja_id: beer.uuid,
            quantidade_estrela: rating,
            deletado: false,
          }, { onConflict: "usuario_id,cerveja_id" })

        if (error) throw error

        setUserRating(rating)
        toast({ 
          title: "🍻 Avaliação registrada!", 
          description: `Você avaliou com ${rating} estrela${rating > 1 ? "s" : ""}!` 
        })
      }
      
      router.refresh()
    } catch (error) {
      console.error("Error rating:", error)
      toast({ 
        title: "Erro", 
        description: "Erro ao avaliar a cerveja", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  // ✅ FUNÇÃO DEDICADA PARA REMOVER AVALIAÇÃO
  const handleRemoveRating = async () => {
    if (!user) return showLoginError("remover avaliação")

    setLoading(true)
    try {
      const { error } = await supabase
        .from("avaliacao")
        .delete()
        .eq("usuario_id", user.uuid)
        .eq("cerveja_id", beer.uuid)

      if (error) throw error

      setUserRating(0)
      setHoveredRating(0)
      
      toast({ 
        title: "Avaliação removida!", 
        description: "Sua avaliação foi removida com sucesso." 
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error removing rating:", error)
      toast({ 
        title: "Erro", 
        description: "Erro ao remover avaliação", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!user) return showLoginError("votar")

    setLoading(true)
    try {
      if (hasVoted) {
        await supabase
          .from("voto")
          .update({ deletado: true })
          .eq("usuario_id", user.uuid)
          .eq("cerveja_id", beer.uuid)
        setHasVoted(false)
        toast({ 
          title: "Voto removido", 
          description: "Seu voto foi cancelado" 
        })
      } else {
        await supabase
          .from("voto")
          .upsert({
            usuario_id: user.uuid,
            cerveja_id: beer.uuid,
            quantidade: 1,
            deletado: false,
          }, { onConflict: "usuario_id,cerveja_id" })
        setHasVoted(true)
        toast({ 
          title: "🍻 Voto computado!", 
          description: "Sua preferência foi registrada!" 
        })
      }
      router.refresh()
    } catch (error) {
      console.error("Error voting:", error)
      toast({ 
        title: "Erro", 
        description: "Erro ao registrar voto", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!user) return showLoginError("favoritar")

    setLoading(true)
    try {
      if (isFavorited) {
        await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", user.uuid)
          .eq("cerveja_id", beer.uuid)
        setIsFavorited(false)
        toast({ 
          title: "Removido dos favoritos", 
          description: "Cerveja removida da sua lista" 
        })
      } else {
        await supabase
          .from("favorito")
          .upsert({
            usuario_id: user.uuid,
            cerveja_id: beer.uuid,
            deletado: false,
          }, { onConflict: "usuario_id,cerveja_id" })
        setIsFavorited(true)
        toast({ 
          title: "🎉 Adicionado aos favoritos!", 
          description: "Agora está na sua coleção pessoal!" 
        })
      }
      router.refresh()
    } catch (error) {
      console.error("Error favoriting:", error)
      toast({ 
        title: "Erro", 
        description: "Erro ao gerenciar favoritos", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const info = beer.informacao[0]
  const ranking = beer.ranking[0]

  // ✅ LOADING DURANTE VERIFICAÇÃO DE AUTENTICAÇÃO
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-12">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Image */}
          <div className="relative">
            <div className="sticky top-6">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl relative bg-card">
                <Image
                  src={beer.imagem_main || "/placeholder-beer.png"}
                  alt={beer.nome}
                  width={600}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                />
                <RankingBadge beer={beer} />
                {beer.selo?.[0] && (
                  <div className="absolute left-4 top-4 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm px-3 py-1 shadow-lg">
                      {beer.selo[0].tipo === "ouro" && "🥇 TOP 1"}
                      {beer.selo[0].tipo === "prata" && "🥈 TOP 2"}
                      {beer.selo[0].tipo === "bronze" && "🥉 TOP 3"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-muted-foreground sm:text-base">{beer.marca}</p>
              <h1 className="mb-4 font-bebas text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl text-balance">
                {beer.nome}
              </h1>
              
              {ranking?.posicao && (
                <div className="mb-4">
                  {beer.selo?.[0] ? (
                    <Badge variant="secondary" className="text-base bg-gradient-to-r from-accent to-accent/80 text-accent-foreground border-accent/50">
                      <Trophy className="h-4 w-4 mr-1" />
                      Ranking: {beer.selo[0].tipo === "ouro" && "🥇 1º Lugar (Ouro)"}
                      {beer.selo[0].tipo === "prata" && "🥈 2º Lugar (Prata)"}
                      {beer.selo[0].tipo === "bronze" && "🥉 3º Lugar (Bronze)"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-base">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Ranking: #{ranking.posicao}º Lugar
                    </Badge>
                  )}
                </div>
              )}

              <div className="mb-6 flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-base">
                  ★ {(ranking?.media_avaliacao || 0).toFixed(1)}
                </Badge>
                <Badge variant="outline" className="text-base">
                  {ranking?.total_votos || 0} votos
                </Badge>
                <Badge variant="outline" className="text-base">
                  <Heart className="mr-1 h-4 w-4" />
                  {ranking?.total_favoritos || 0}
                </Badge>
                <Badge variant="outline" className="text-base">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {ranking?.total_comentarios || 0}
                </Badge>
                {ranking?.taças_breja && (
                  <Badge variant="outline" className="text-base">
                    <Trophy className="mr-1 h-4 w-4" />
                    {ranking.taças_breja}
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating Card - ATUALIZADO */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Avalie esta cerveja</h3>
                  {userRating > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveRating}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remover avaliação
                    </Button>
                  )}
                </div>
                
                <div className="mb-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 relative group"
                      disabled={!user || loading}
                    >
                      <Star
                        className={`h-8 w-8 sm:h-10 sm:w-10 ${
                          star <= (hoveredRating || userRating) 
                            ? "fill-yellow-500 text-yellow-500" 
                            : "text-muted-foreground"
                        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      
                      {/* Tooltip para indicar remoção */}
                      {userRating === star && userRating > 0 && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Clique para remover
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <p className="mb-6 text-sm text-muted-foreground">
                  {userRating > 0
                    ? `Sua avaliação: ${userRating} estrela${userRating > 1 ? "s" : ""}`
                    : user ? "Clique nas estrelas para avaliar" : "Faça login para avaliar"}
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    className="flex-1" 
                    onClick={handleVote} 
                    disabled={!user || loading}
                    variant={hasVoted ? "default" : "outline"}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {hasVoted ? "Votado (Cancelar)" : "Votar"}
                  </Button>
                  <Button 
                    size="lg" 
                    variant={isFavorited ? "default" : "outline"} 
                    onClick={handleFavorite} 
                    disabled={!user || loading}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            {info && <BeerInfoCard info={info} />}
          </div>
        </div>

        {/* ✅ SEÇÃO DE COMENTÁRIOS */}
        <Suspense fallback={<CommentsSkeleton />}>
          <CommentsSection
            cervejaId={beer.uuid}
            totalComments={ranking?.total_comentarios || 0}
            onUpdateBeer={() => router.refresh()}
          />
        </Suspense>
      </div>
    </div>
  )
}

// Componente de selo de ranking
const RankingBadge = ({ beer }: { beer: BeerDetail }) => {
  const ranking = beer?.ranking?.[0]
  const selo = beer?.selo?.[0]

  if (selo?.imagem_url) {
    return (
      <div className="absolute right-4 top-4 z-10">
        <div className="relative h-20 w-20">
          <Image
            src={selo.imagem_url}
            alt={`Selo de ${selo.tipo}`}
            fill
            className="object-contain drop-shadow-2xl animate-pulse"
            priority
          />
        </div>
      </div>
    )
  }

  if (ranking?.posicao && ranking.posicao <= 10) {
    return (
      <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground shadow-2xl">
        #{ranking.posicao}
      </div>
    )
  }

  return null
}

// Componente de informações da cerveja
const BeerInfoCard = ({ info }: { info: BeerInfo }) => {
  const infoItems = [
    { icon: MapPin, label: "Origem", value: info.origem },
    { icon: Droplet, label: "Teor Alcoólico", value: info.teor_alcoolico ? `${info.teor_alcoolico}%` : null },
    { icon: Wine, label: "Amargor (IBU)", value: info.amargor },
    { icon: Thermometer, label: "Temperatura Ideal", value: info.temperatura_ideal },
    { icon: UtensilsCrossed, label: "Harmonização", value: info.harmonizacao },
  ].filter(item => item.value)

  const sensoryItems = [
    { label: "Aparência", value: info.aparencia },
    { label: "Aroma", value: info.aroma },
    { label: "Sabor", value: info.sabor },
    { label: "Corpo e Textura", value: info.corpo_textura },
  ].filter(item => item.value)

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h3 className="mb-4 text-xl font-bold">Informações</h3>
        
        {infoItems.map((item, index) => (
          <div key={index} className="flex gap-3">
            <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
              <p className="text-foreground">{item.value}</p>
            </div>
          </div>
        ))}

        {sensoryItems.length > 0 && (
          <>
            <div className="border-t border-border pt-4" />
            {sensoryItems.map((item, index) => (
              <div key={index}>
                <p className="mb-1 text-sm font-semibold text-muted-foreground">{item.label}</p>
                <p className="text-sm text-foreground">{item.value}</p>
              </div>
            ))}
          </>
        )}

        {info.impressao_geral && (
          <>
            <div className="border-t border-border pt-4" />
            <div>
              <p className="mb-2 text-sm font-semibold text-muted-foreground">Impressão Geral</p>
              <p className="text-sm italic text-foreground">{info.impressao_geral}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}