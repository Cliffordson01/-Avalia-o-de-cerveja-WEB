// components/beer-filters-debug.tsx
"use client"

import { useState, useEffect } from "react"
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

export function BeerFiltersDebug({ 
  initialQuery = "", 
  initialSort = "recent",
  resultCount 
}: BeerFiltersProps) {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort)

  console.log("🔍 BeerFiltersDebug - Estado atual:", { query, sort, initialQuery, initialSort })

  // REMOVEMOS o useRouter e useSearchParams temporariamente
  // para testar se é isso que está causando o redirecionamento

  return (
    <Card className="bg-amber-950/50 backdrop-blur-sm border-amber-800/50 shadow-2xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Campo de Busca - SEM redirecionamento automático */}
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400" />
            <Input
              type="search"
              placeholder="Buscar cervejas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 h-12 bg-amber-900/30 border-amber-700/50 text-amber-100"
            />
          </div>

          {/* Filtro de Ordenação - SEM redirecionamento automático */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full lg:w-[180px] h-12 bg-amber-900/30 border-amber-700/50 text-amber-100">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent className="bg-amber-900 border-amber-700 text-amber-100">
              <SelectItem value="recent">📅 Mais Recentes</SelectItem>
              <SelectItem value="avaliacao">⭐ Melhor Avaliação</SelectItem>
              <SelectItem value="votos">📊 Mais Votadas</SelectItem>
              <SelectItem value="favoritos">❤️ Mais Favoritadas</SelectItem>
              <SelectItem value="comentarios">💬 Mais Comentadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Badge de Resultados */}
        <div className="flex items-center justify-between mt-4">
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 border-amber-500/30">
            <Beer className="h-3 w-3 mr-1" />
            {resultCount} {resultCount === 1 ? 'cerveja encontrada' : 'cervejas encontradas'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}