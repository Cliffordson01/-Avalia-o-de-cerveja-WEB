// components/beer-filters-simple.tsx - ATUALIZADO COM TEMAS
"use client"

import { useState, useEffect } from "react"
import { Search, Beer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BeerFiltersSimpleProps {
  resultCount: number
  onSearchChange: (query: string) => void
  onSortChange: (sort: string) => void
  initialQuery?: string
  initialSort?: string
}

export function BeerFiltersSimple({ 
  resultCount, 
  onSearchChange, 
  onSortChange,
  initialQuery = "",
  initialSort = "recent" 
}: BeerFiltersSimpleProps) {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'fresh'>('light')

  // Detectar tema atual
  useEffect(() => {
    const getCurrentTheme = (): 'light' | 'dark' | 'fresh' => {
      if (document.documentElement.classList.contains('dark')) return 'dark'
      if (document.documentElement.classList.contains('fresh')) return 'fresh'
      return 'light'
    }

    setCurrentTheme(getCurrentTheme())

    // Observar mudanças de tema
    const observer = new MutationObserver(() => {
      setCurrentTheme(getCurrentTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearchChange])

  const handleSearch = (value: string) => {
    setQuery(value)
  }

  const handleSort = (value: string) => {
    setSort(value)
    onSortChange(value)
  }

  // Funções para obter cores baseadas no tema
  const getCardStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-amber-50/80 backdrop-blur-sm border-amber-200 shadow-lg"
      case 'fresh':
        return "bg-sky-50/80 backdrop-blur-sm border-sky-200 shadow-lg"
      case 'dark':
      default:
        return "bg-amber-950/50 backdrop-blur-sm border-amber-800/50 shadow-2xl"
    }
  }

  const getInputStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-white border-amber-300 text-amber-900 placeholder:text-amber-500/70 focus:border-amber-500"
      case 'fresh':
        return "bg-white border-sky-300 text-sky-900 placeholder:text-sky-500/70 focus:border-sky-500"
      case 'dark':
      default:
        return "bg-amber-900/30 border-amber-700/50 text-amber-100 placeholder:text-amber-300/70 focus:border-amber-500"
    }
  }

  const getIconColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-500"
      case 'fresh':
        return "text-sky-500"
      case 'dark':
      default:
        return "text-amber-400"
    }
  }

  const getSelectContentStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-white border-amber-200 text-amber-900"
      case 'fresh':
        return "bg-white border-sky-200 text-sky-900"
      case 'dark':
      default:
        return "bg-amber-900 border-amber-700 text-amber-100"
    }
  }

  const getSelectItemStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "focus:bg-amber-100 focus:text-amber-900"
      case 'fresh':
        return "focus:bg-sky-100 focus:text-sky-900"
      case 'dark':
      default:
        return "focus:bg-amber-800 focus:text-amber-100"
    }
  }

  const getBadgeStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-amber-100 text-amber-800 border-amber-300"
      case 'fresh':
        return "bg-sky-100 text-sky-800 border-sky-300"
      case 'dark':
      default:
        return "bg-amber-500/20 text-amber-200 border-amber-500/30"
    }
  }

  const getFilterTagStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-amber-200 text-amber-800"
      case 'fresh':
        return "bg-sky-200 text-sky-800"
      case 'dark':
      default:
        return "bg-amber-800/50 text-amber-300"
    }
  }

  const getTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-700"
      case 'fresh':
        return "text-sky-700"
      case 'dark':
      default:
        return "text-amber-300"
    }
  }

  return (
    <Card className={`${getCardStyles()} transition-all duration-500 mb-6 sm:mb-8 mx-2 sm:mx-0`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Campo de Busca */}
          <div className="w-full relative">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 ${getIconColor()} transition-colors duration-500`} />
            <Input
              type="search"
              placeholder="Buscar cervejas..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base transition-all duration-500 ${getInputStyles()}`}
            />
          </div>

          {/* Filtro de Ordenação */}
          <div className="w-full">
            <Select value={sort} onValueChange={handleSort}>
              <SelectTrigger className={`w-full h-10 sm:h-12 text-sm sm:text-base transition-all duration-500 ${getInputStyles()}`}>
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent 
                className={`${getSelectContentStyles()} max-h-[60vh] overflow-y-auto transition-all duration-500`}
                position="popper"
                align="start"
                sideOffset={4}
              >
                <SelectItem value="recent" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Mais Recentes
                </SelectItem>
                <SelectItem value="name" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Nome A-Z
                </SelectItem>
                <SelectItem value="name-desc" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Nome Z-A
                </SelectItem>
                <SelectItem value="rating" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Melhor Avaliação
                </SelectItem>
                <SelectItem value="votes" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Mais Votadas
                </SelectItem>
                <SelectItem value="favorites" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Mais Favoritadas
                </SelectItem>
                <SelectItem value="comments" className={`text-sm sm:text-base transition-colors duration-300 ${getSelectItemStyles()}`}>
                  Mais Comentadas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Badge de Resultados - RESPONSIVO */}
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-0 xs:items-center xs:justify-between mt-3 sm:mt-4">
          <Badge variant="secondary" className={`${getBadgeStyles()} w-fit text-xs sm:text-sm transition-all duration-500`}>
            <Beer className="h-3 w-3 mr-1" />
            {resultCount} {resultCount === 1 ? 'cerveja' : 'cervejas'}
          </Badge>
          
          {(query || sort !== "recent") && (
            <div className={`${getTextColor()} text-xs sm:text-sm flex flex-wrap gap-1 transition-colors duration-500`}>
              {query && (
                <span className={`${getFilterTagStyles()} px-2 py-1 rounded transition-all duration-500`}>
                  Busca: "{query}"
                </span>
              )}
              {sort !== "recent" && (
                <span className={`${getFilterTagStyles()} px-2 py-1 rounded transition-all duration-500`}>
                  Ordenado: {getSortLabel(sort)}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper para mostrar labels dos filtros
function getSortLabel(sort: string): string {
  const labels: { [key: string]: string } = {
    "recent": "Recentes",
    "name": "A-Z", 
    "name-desc": "Z-A",
    "rating": "Avaliação",
    "votes": "Votos",
    "favorites": "Favoritos", 
    "comments": "Comentários"
  }
  return labels[sort] || sort
}