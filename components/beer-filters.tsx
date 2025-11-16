"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, X, Beer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BeerFiltersProps {
  initialQuery?: string
  initialSort?: string
  resultCount: number
}

export function BeerFilters({ 
  initialQuery = "", 
  initialSort = "recent",
  resultCount 
}: BeerFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort)

  console.log("🔍 BeerFilters - Estado:", { query, sort, initialQuery, initialSort })

  // Debounce para busca automática
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters()
    }, 500) // 500ms de debounce

    return () => clearTimeout(timeoutId)
  }, [query, sort])

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams()
    
    if (query) params.set('q', query)
    if (sort !== 'recent') params.set('sort', sort)

    const queryString = params.toString()
    const url = queryString ? `/cerveja?${queryString}` : '/cerveja'
    
    console.log("🔄 Atualizando filtros:", { query, sort, url })
    router.push(url, { scroll: false })
  }, [query, sort, router])

  const clearFilters = () => {
    setQuery("")
    setSort("recent")
    // Navega para a URL limpa imediatamente
    router.push('/cerveja', { scroll: false })
  }

  const hasActiveFilters = query || sort !== "recent"

  return (
    <Card className="bg-amber-950/50 backdrop-blur-sm border-amber-800/50 shadow-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Campo de Busca */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400" />
            <Input
              type="search"
              placeholder="Buscar cervejas, marcas, descrições..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 h-12 bg-amber-900/30 border-amber-700/50 text-amber-100 placeholder-amber-400/60 focus:border-amber-500"
            />
          </div>

          {/* Filtros de Ordenação */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full lg:w-[200px] h-12 bg-amber-900/30 border-amber-700/50 text-amber-100">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent className="bg-amber-900 border-amber-700 text-amber-100">
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="avaliacao">Melhor Avaliação</SelectItem>
                <SelectItem value="votos">Mais Votadas</SelectItem>
                <SelectItem value="favoritos">Mais Favoritadas</SelectItem>
                <SelectItem value="comentarios">Mais Comentadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="h-12 bg-red-600/20 border-red-600/50 text-red-100 hover:bg-red-600/30 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Badge de Resultados */}
        <div className="flex items-center justify-between mt-4">
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-amber-500/30">
            <Beer className="h-3 w-3 mr-1" />
            {resultCount} {resultCount === 1 ? 'cerveja encontrada' : 'cervejas encontradas'}
          </Badge>

          {hasActiveFilters && (
            <div className="flex gap-2 flex-wrap">
              {query && (
                <Badge className="bg-amber-600/50 text-amber-100">
                  Busca: "{query}"
                </Badge>
              )}
              {sort !== "recent" && (
                <Badge className="bg-blue-600/50 text-blue-100">
                  Ordenação: {getSortLabel(sort)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getSortLabel(sortParam: string): string {
  const labels: Record<string, string> = {
    recent: "Recentes",
    votos: "Votos",
    avaliacao: "Avaliação", 
    favoritos: "Favoritos",
    comentarios: "Comentários"
  }
  return labels[sortParam] || "Recentes"
}