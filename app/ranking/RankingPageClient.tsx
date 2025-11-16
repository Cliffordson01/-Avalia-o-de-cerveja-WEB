"use client"

import React, { useState, useMemo, useCallback, lazy, Suspense } from "react"
import { 
  Trophy, 
  TrendingUp, 
  Star, 
  Heart, 
  MessageCircle, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// ✅ LAZY LOADING para imagens pesadas
const LazyRankingCard = lazy(() => import('./LazyRankingCard'))

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

// ✅ SKELETON para loading
const RankingCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-300 rounded-xl"></div>
        <div className="h-16 w-12 sm:h-20 sm:w-16 bg-gray-300 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-300 rounded w-8"></div>
            <div className="h-3 bg-gray-300 rounded w-8"></div>
            <div className="h-3 bg-gray-300 rounded w-8"></div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function RankingPageClient({ rankings }: RankingPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("posicao")
  const [visibleCount, setVisibleCount] = useState(20) // ✅ PAGINAÇÃO VIRTUAL

  const safeRankings: Ranking[] = Array.isArray(rankings) ? rankings : []

  // ✅ FUNÇÕES MEMOIZADAS
  const getSortLabel = useCallback((option: SortOption): string => {
    const labels = {
      "posicao": "Posição",
      "recentes": "Recentes", 
      "votadas": "Mais Votadas",
      "comentadas": "Mais Comentadas",
      "favoritadas": "Mais Favoritadas"
    }
    return labels[option]
  }, [])

  // ✅ FILTRO E ORDENAÇÃO OTIMIZADOS
  const filteredAndSortedRankings = useMemo(() => {
    if (!safeRankings.length) return []

    let filtered = safeRankings.filter((ranking: Ranking) => {
      if (!ranking?.cerveja) return false
      
      const searchLower = searchTerm.toLowerCase()
      return (
        ranking.cerveja.nome?.toLowerCase().includes(searchLower) ||
        ranking.cerveja.marca?.toLowerCase().includes(searchLower)
      )
    })

    const sortFunctions = {
      "posicao": (a: Ranking, b: Ranking) => (a.posicao || 999) - (b.posicao || 999),
      "recentes": (a: Ranking, b: Ranking) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
      "votadas": (a: Ranking, b: Ranking) => (b.total_votos || 0) - (a.total_votos || 0),
      "comentadas": (a: Ranking, b: Ranking) => (b.total_comentarios || 0) - (a.total_comentarios || 0),
      "favoritadas": (a: Ranking, b: Ranking) => (b.total_favoritos || 0) - (a.total_favoritos || 0)
    }

    return filtered.sort(sortFunctions[sortBy])
  }, [safeRankings, searchTerm, sortBy])

  // ✅ RANKINGS VISÍVEIS (PAGINAÇÃO)
  const visibleRankings = useMemo(() => 
    filteredAndSortedRankings.slice(0, visibleCount),
    [filteredAndSortedRankings, visibleCount]
  )

  const hasMore = visibleCount < filteredAndSortedRankings.length

  // ✅ LOAD MORE OTIMIZADO
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 20)
  }, [])

  if (safeRankings.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Trophy className="mx-auto h-20 w-20 text-muted-foreground mb-4" />
          <h1 className="font-bebas text-5xl text-foreground mb-4">
            Ranking Vazio
          </h1>
          <p className="text-muted-foreground mb-6">
            Ainda não há cervejas no ranking.
          </p>
          <Button asChild>
            <Link href="/cervejas">
              Explorar Cervejas
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-yellow-300" />
              <h1 className="font-bebas text-6xl tracking-tight">
                RANKING
              </h1>
            </div>
            <p className="text-lg text-primary-foreground/80">
              {safeRankings.length} cervejas ranqueadas pela comunidade
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cervejas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {getSortLabel(sortBy)}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("posicao")}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Posição
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("recentes")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Recentes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("votadas")}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Mais Votadas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("comentadas")}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mais Comentadas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("favoritadas")}>
                    <Heart className="h-4 w-4 mr-2" />
                    Mais Favoritadas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Mostrando {Math.min(visibleCount, filteredAndSortedRankings.length)} de {filteredAndSortedRankings.length} cervejas
              </span>
              {searchTerm && (
                <Badge variant="secondary">
                  Busca: "{searchTerm}"
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ranking com Lazy Loading */}
        <div className="space-y-3">
          <Suspense fallback={
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <RankingCardSkeleton key={i} />
              ))}
            </div>
          }>
            {visibleRankings.map((ranking: Ranking, index: number) => (
              <LazyRankingCard 
                key={ranking.uuid} 
                ranking={ranking} 
                index={index}
              />
            ))}
          </Suspense>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-6">
            <Button onClick={loadMore} variant="outline" size="lg">
              Carregar Mais 20 Cervejas
            </Button>
          </div>
        )}

        {/* Estado vazio da busca */}
        {filteredAndSortedRankings.length === 0 && searchTerm && (
          <Card className="text-center p-8">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">Nenhuma cerveja encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Não encontramos resultados para "{searchTerm}"
            </p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Limpar Busca
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}