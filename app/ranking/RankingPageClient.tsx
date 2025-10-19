"use client"

import { useState, useMemo } from "react"
import { 
  Trophy, 
  TrendingUp, 
  Star, 
  Heart, 
  MessageCircle, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown,
  Crown,
  Award,
  Medal,
  Sparkles
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"

interface Beer {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  ativo: boolean
  criado_em: string
}

interface Ranking {
  uuid: string
  cerveja_id: string
  posicao?: number | null
  media_avaliacao?: number | null
  total_votos?: number | null
  total_favoritos?: number | null
  total_comentarios?: number | null
  criado_em: string
  cerveja: Beer
  selo?: any[]
}

interface RankingPageProps {
  rankings: Ranking[]
}

type SortOption = "posicao" | "recentes" | "votadas" | "comentadas" | "favoritadas"

export default function RankingPageClient({ rankings }: RankingPageProps) {
  console.log('📊 Rankings recebidos no client:', rankings?.length || 0)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("posicao")

  // Garantir que rankings seja um array válido
  const safeRankings: Ranking[] = Array.isArray(rankings) ? rankings : []

  // Função para obter URL da imagem da cerveja
  const getBeerImageUrl = (imageName: string | null | undefined): string => {
    if (!imageName) return "/placeholder.svg"
    if (imageName.startsWith("http")) return imageName
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/beer-images/${imageName}`
  }

  // Função para formatar números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // URLs dos selos
  const getSeloImageUrl = (posicao: number): string => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) return ''
    
    if (posicao === 1) return `${baseUrl}/storage/v1/object/public/selos/ouro.png`
    if (posicao === 2) return `${baseUrl}/storage/v1/object/public/selos/prata.png`
    if (posicao === 3) return `${baseUrl}/storage/v1/object/public/selos/bronze.png`
    return ''
  }

  // Filtrar e ordenar cervejas
  const filteredAndSortedRankings = useMemo(() => {
    let filtered = safeRankings.filter(ranking => {
      if (!ranking || !ranking.cerveja) return false
      
      const nome = ranking.cerveja.nome || ''
      const marca = ranking.cerveja.marca || ''
      
      return (
        nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marca.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Ordenação
    switch (sortBy) {
      case "posicao":
        filtered.sort((a, b) => (a.posicao || 999) - (b.posicao || 999))
        break
      case "recentes":
        filtered.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
        break
      case "votadas":
        filtered.sort((a, b) => (b.total_votos || 0) - (a.total_votos || 0))
        break
      case "comentadas":
        filtered.sort((a, b) => (b.total_comentarios || 0) - (a.total_comentarios || 0))
        break
      case "favoritadas":
        filtered.sort((a, b) => (b.total_favoritos || 0) - (a.total_favoritos || 0))
        break
    }

    return filtered
  }, [safeRankings, searchTerm, sortBy])

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "posicao": return "Posição"
      case "recentes": return "Recentes"
      case "votadas": return "Mais Votadas"
      case "comentadas": return "Mais Comentadas"
      case "favoritadas": return "Mais Favoritadas"
      default: return "Posição"
    }
  }

  const getSortIcon = (option: SortOption): React.JSX.Element => {
    switch (option) {
      case "posicao": return <Trophy className="h-4 w-4" />
      case "recentes": return <Calendar className="h-4 w-4" />
      case "votadas": return <TrendingUp className="h-4 w-4" />
      case "comentadas": return <MessageCircle className="h-4 w-4" />
      case "favoritadas": return <Heart className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  // Se não há cervejas
  if (safeRankings.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="relative">
            <Trophy className="mx-auto h-32 w-32 text-muted-foreground mb-6" />
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="font-bebas text-7xl text-foreground mb-6">
            Ranking Vazio
          </h1>
          <p className="text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            O ranking está esperando pelas primeiras cervejas para começar a competição!
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            Seja o primeiro a adicionar uma cerveja e ver ela subir no ranking.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-3 h-auto">
            <Link href="/admin/cerveja/nova" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Adicionar Primeira Cerveja
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Hero - Ajustado para mobile */}
      <div className="relative bg-primary text-primary-foreground py-12 md:py-16 mb-8 md:mb-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 md:mb-6">
              <div className="relative">
                <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-300 animate-bounce" />
                <div className="absolute -inset-3 sm:-inset-4 bg-yellow-400/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="font-bebas text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-primary-foreground drop-shadow-2xl">
                RANKING
              </h1>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/80 mb-4 md:mb-6 font-light">
              Descubra as {safeRankings.length} cervejas mais populares da comunidade
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-primary-foreground/70 text-sm sm:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Mais Votadas</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Melhor Avaliadas</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Mais Favoritadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 -mt-6 md:-mt-8 relative z-20">
        {/* Filtros e Busca - Melhorado para mobile */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Barra de Pesquisa */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar cervejas ou marcas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>

              {/* Filtros */}
              <div className="flex justify-center sm:justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-14 gap-2 sm:gap-3 px-4 sm:px-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
                    >
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="truncate">Ordenar: {getSortLabel(sortBy)}</span>
                      <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-56">
                    <DropdownMenuItem 
                      onClick={() => setSortBy("posicao")}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-sm sm:text-base cursor-pointer"
                    >
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Posição no Ranking</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("recentes")}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-sm sm:text-base cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Mais Recentes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("votadas")}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-sm sm:text-base cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Mais Votadas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("comentadas")}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-sm sm:text-base cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Mais Comentadas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("favoritadas")}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-sm sm:text-base cursor-pointer"
                    >
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Mais Favoritadas</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Info da busca */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">
                Mostrando {filteredAndSortedRankings.length} de {safeRankings.length} cervejas
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs">
                  <Search className="h-3 w-3" />
                  Buscando: "{searchTerm}"
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 sm:gap-2 text-xs">
                {getSortIcon(sortBy)}
                {getSortLabel(sortBy)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ranking - Layout responsivo melhorado */}
        <div className="space-y-4 sm:space-y-6">
          {filteredAndSortedRankings.length > 0 ? (
            filteredAndSortedRankings.map((ranking, index) => {
              const isTopThree = ranking.posicao && ranking.posicao <= 3
              const seloImageUrl = ranking.posicao && ranking.posicao <= 3 ? getSeloImageUrl(ranking.posicao) : null

              return (
                <Link key={ranking.uuid} href={`/cerveja/${ranking.cerveja.uuid}`}>
                  <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]">
                    <CardContent className="p-4 sm:p-6 relative">
                      {/* Layout para mobile compacto */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Posição e Imagem lado a lado no mobile */}
                        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                          {/* Posição */}
                          <div className="relative shrink-0">
                            <div className={`
                              flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl sm:rounded-3xl font-bebas text-2xl sm:text-3xl md:text-4xl font-bold
                              shadow-lg border-4 transition-all duration-300 group-hover:scale-105 sm:group-hover:scale-110
                              ${isTopThree 
                                ? ranking.posicao === 1 
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-300" 
                                  : ranking.posicao === 2
                                  ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white border-gray-300"
                                  : "bg-gradient-to-br from-amber-600 to-amber-800 text-white border-amber-400"
                                : "bg-muted text-muted-foreground border-border hover:border-primary"
                              }
                            `}>
                              {ranking.posicao || index + 1}
                            </div>
                            
                            {/* Selo para Top 3 */}
                            {seloImageUrl && (
                              <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 md:-right-4 md:-top-4 z-10 animate-pulse">
                                <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20">
                                  <Image
                                    src={seloImageUrl}
                                    alt={`Top ${ranking.posicao}`}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Ícone para top 3 */}
                            {isTopThree && (
                              <div className="absolute -left-1 -bottom-1 sm:-left-2 sm:-bottom-2">
                                {ranking.posicao === 1 && <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500" />}
                                {ranking.posicao === 2 && <Award className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-500" />}
                                {ranking.posicao === 3 && <Medal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" />}
                              </div>
                            )}
                          </div>

                          {/* Imagem da Cerveja */}
                          <div className="relative h-20 w-16 sm:h-24 sm:w-20 md:h-28 md:w-24 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-muted shadow-lg group-hover:shadow-xl transition-all">
                            <Image
                              src={getBeerImageUrl(ranking.cerveja.imagem_main)}
                              alt={ranking.cerveja.nome}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105 sm:group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        </div>

                        {/* Informações da Cerveja */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                            <h3 className="font-bold text-xl sm:text-2xl md:text-3xl text-foreground truncate group-hover:text-primary transition-colors">
                              {ranking.cerveja.nome}
                            </h3>
                            {isTopThree && (
                              <Badge className={`
                                text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-1.5 border-2
                                ${ranking.posicao === 1 ? "bg-yellow-500 text-white border-yellow-600" :
                                  ranking.posicao === 2 ? "bg-gray-500 text-white border-gray-600" :
                                  "bg-amber-600 text-white border-amber-700"}
                              `}>
                                TOP {ranking.posicao}
                              </Badge>
                            )}
                          </div>
                          <p className="mb-3 text-base sm:text-lg md:text-xl text-muted-foreground truncate font-semibold">
                            {ranking.cerveja.marca}
                          </p>

                          {/* Estatísticas - Mobile compacto */}
                          <div className="flex flex-wrap gap-4 sm:hidden">
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-semibold">{Number(ranking.media_avaliacao ?? 0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">{formatNumber(Number(ranking.total_votos ?? 0))}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Heart className="h-4 w-4 text-red-500" />
                              <span className="font-semibold">{formatNumber(Number(ranking.total_favoritos ?? 0))}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">{formatNumber(Number(ranking.total_comentarios ?? 0))}</span>
                            </div>
                          </div>
                        </div>

                        {/* Estatísticas - Desktop */}
                        <div className="hidden sm:flex shrink-0 gap-4 lg:gap-6 xl:gap-8">
                          <div className="text-center">
                            <div className="mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2 font-bold text-lg sm:text-xl md:text-2xl text-foreground">
                              <Star className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 fill-yellow-500 text-yellow-500" />
                              {Number(ranking.media_avaliacao ?? 0).toFixed(1)}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Avaliação</p>
                          </div>

                          <div className="text-center">
                            <div className="mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2 font-bold text-lg sm:text-xl md:text-2xl text-foreground">
                              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600" />
                              {formatNumber(Number(ranking.total_votos ?? 0))}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Votos</p>
                          </div>

                          <div className="text-center">
                            <div className="mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2 font-bold text-lg sm:text-xl md:text-2xl text-foreground">
                              <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-red-500" />
                              {formatNumber(Number(ranking.total_favoritos ?? 0))}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Favoritos</p>
                          </div>

                          <div className="text-center">
                            <div className="mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2 font-bold text-lg sm:text-xl md:text-2xl text-foreground">
                              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600" />
                              {formatNumber(Number(ranking.total_comentarios ?? 0))}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Comentários</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 sm:p-16 text-center">
                <Search className="mx-auto mb-4 sm:mb-6 h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
                <h3 className="mb-3 sm:mb-4 font-bold text-2xl sm:text-3xl text-foreground">Nenhuma cerveja encontrada</h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? `Não encontramos resultados para "${searchTerm}". Tente outros termos.`
                    : "Não há cervejas que correspondam aos filtros atuais."
                  }
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm("")}
                    variant="outline"
                    size="sm"
                    className="text-sm sm:text-base"
                  >
                    Limpar Busca
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Stats - Responsivo */}
        {filteredAndSortedRankings.length > 0 && (
          <div className="mt-12 sm:mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8 bg-card rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-4 sm:py-6 shadow-lg border w-full max-w-md sm:max-w-none mx-auto">
              <div className="text-center">
                <div className="font-bebas text-3xl sm:text-4xl text-primary">{safeRankings.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Cervejas no Total</div>
              </div>
              <div className="hidden sm:block w-px h-12 sm:h-16 bg-border"></div>
              <div className="sm:hidden w-full h-px bg-border"></div>
              <div className="text-center">
                <div className="font-bebas text-3xl sm:text-4xl text-primary">
                  {Math.max(...safeRankings.map(r => r.total_votos || 0)).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Recorde de Votos</div>
              </div>
              <div className="hidden sm:block w-px h-12 sm:h-16 bg-border"></div>
              <div className="sm:hidden w-full h-px bg-border"></div>
              <div className="text-center">
                <div className="font-bebas text-3xl sm:text-4xl text-primary">
                  {Math.max(...safeRankings.map(r => r.media_avaliacao || 0)).toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Melhor Avaliação</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}