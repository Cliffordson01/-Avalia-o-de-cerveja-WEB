// app/cervejas/CervejaPageClient.tsx - VERSÃO COM BEER-CARD-SAFE
"use client"

import { useState, useMemo, useEffect } from "react"
import { BeerCardSafe } from "@/components/beer-card-safe" // ✅ Alterado para BeerCardSafe
import { Beer, Sparkles } from "lucide-react"
import { BeerBackground } from "@/components/beer-background"
import { BeerFiltersSimple } from "@/components/beer-filters-simple"

interface CervejaPageClientProps {
  initialCervejas: any[]
  userId?: string
  searchParams?: {
    query?: string
    page?: string
    style?: string
    brewery?: string
  }
}

export function CervejaPageClient({ 
  initialCervejas, 
  userId, 
  searchParams 
}: CervejaPageClientProps) {
  const [searchQuery, setSearchQuery] = useState(searchParams?.query || "")
  const [sortOption, setSortOption] = useState("recent")
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

  // Sincronizar com searchParams da URL
  useEffect(() => {
    if (searchParams?.query) {
      setSearchQuery(searchParams.query)
    }
  }, [searchParams])

  // Função para obter gradiente do header baseado no tema
  const getHeaderGradient = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-gradient-to-r from-amber-400 to-orange-500"
      case 'fresh':
        return "bg-gradient-to-r from-sky-400 to-emerald-500"
      case 'dark':
      default:
        return "bg-gradient-to-r from-amber-500 to-orange-600"
    }
  }

  // Função para obter cores do texto baseado no tema
  const getTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-900"
      case 'fresh':
        return "text-sky-900"
      case 'dark':
      default:
        return "text-amber-100"
    }
  }

  // Função para obter cores do texto secundário
  const getSecondaryTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-700"
      case 'fresh':
        return "text-sky-700"
      case 'dark':
      default:
        return "text-amber-200"
    }
  }

  // Função para obter cores do texto de descrição
  const getDescriptionTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-600"
      case 'fresh':
        return "text-sky-600"
      case 'dark':
      default:
        return "text-amber-100"
    }
  }

  // Função para obter gradiente do card de erro
  const getErrorCardGradient = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-gradient-to-br from-amber-300 to-orange-400"
      case 'fresh':
        return "bg-gradient-to-br from-sky-300 to-emerald-400"
      case 'dark':
      default:
        return "bg-gradient-to-br from-amber-400 to-orange-500"
    }
  }

  // Função para obter cor do botão
  const getButtonStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case 'fresh':
        return "bg-sky-500 hover:bg-sky-600 text-white"
      case 'dark':
      default:
        return "bg-amber-500 hover:bg-amber-600 text-white"
    }
  }

  // ✅ FUNÇÃO CORRIGIDA PARA FILTRAR E ORDENAR AS CERVEJAS
  const filteredAndSortedCervejas = useMemo(() => {
    let filtered = initialCervejas

    // Aplicar filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(cerveja => 
        cerveja.nome.toLowerCase().includes(query) ||
        cerveja.marca.toLowerCase().includes(query)
      )
    }

    // ✅ APLICAR ORDENAÇÃO CORRETA COM DADOS REAIS DO RANKING
    filtered = [...filtered].sort((a, b) => {
      // Garantir que temos objetos de ranking válidos
      const rankingA = a.ranking && typeof a.ranking === 'object' ? a.ranking : {}
      const rankingB = b.ranking && typeof b.ranking === 'object' ? b.ranking : {}

      switch (sortOption) {
        case "name":
          return a.nome.localeCompare(b.nome)
        
        case "name-desc":
          return b.nome.localeCompare(a.nome)
        
        case "recent":
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        
        case "rating":
          // ✅ Usando dados reais do ranking
          return (Number(rankingB.media_avaliacao) || 0) - (Number(rankingA.media_avaliacao) || 0)
        
        case "votes":
          return (Number(rankingB.total_votos) || 0) - (Number(rankingA.total_votos) || 0)
        
        case "favorites":
          return (Number(rankingB.total_favoritos) || 0) - (Number(rankingA.total_favoritos) || 0)
        
        case "comments":
          return (Number(rankingB.total_comentarios) || 0) - (Number(rankingA.total_comentarios) || 0)
        
        default:
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      }
    })

    return filtered
  }, [initialCervejas, searchQuery, sortOption])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleSortChange = (sort: string) => {
    setSortOption(sort)
  }

  return (
    <div className="min-h-screen relative">
      <BeerBackground />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className={`inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6 ${getHeaderGradient()} p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl max-w-full transition-all duration-500`}>
            <div className="relative">
              <Beer className="h-10 w-10 sm:h-16 sm:w-16 text-white animate-bounce" />
              <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-300 absolute -top-1 -right-1 sm:-top-2 sm:-right-2 animate-pulse" />
            </div>
            <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wider text-white drop-shadow-lg break-words">
              CATÁLOGO BREJA
            </h1>
          </div>
          
          {/* TEXTO ATUALIZADO COM CORES DO TEMA */}
          <p className={`text-base sm:text-lg md:text-xl ${getDescriptionTextColor()} font-light max-w-2xl mx-auto px-2 transition-colors duration-500`}>
            Descubra {initialCervejas.length} cervejas artesanais especiais
          </p>
        </div>

        {/* Filtros */}
        <BeerFiltersSimple 
          resultCount={filteredAndSortedCervejas.length}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
        />

        {/* Grid de Cervejas */}
        {filteredAndSortedCervejas.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {filteredAndSortedCervejas.map((cerveja) => (
              <BeerCardSafe // ✅ Alterado para BeerCardSafe
                key={cerveja.uuid} 
                cerveja={cerveja} 
                userId={userId}
                showActions={true} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-24 text-center px-4">
            <div className={`${getErrorCardGradient()} p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl mb-6 sm:mb-8 transition-all duration-500`}>
              <Beer className="h-16 w-16 sm:h-20 sm:w-20 text-white mb-3 sm:mb-4 opacity-80" />
            </div>
            <h2 className={`font-bebas text-2xl sm:text-3xl md:text-4xl ${getTextColor()} mb-3 sm:mb-4 transition-colors duration-500`}>
              {searchQuery ? "NENHUMA BREJA ENCONTRADA" : "NENHUMA BREJA NO CATÁLOGO"}
            </h2>
            <p className={`${getSecondaryTextColor()} text-sm sm:text-base md:text-lg mb-4 sm:mb-6 transition-colors duration-500`}>
              {searchQuery 
                ? `Não encontramos resultados para "${searchQuery}". Tente outros termos.`
                : "O catálogo está vazio no momento."
              }
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className={`mt-3 sm:mt-4 ${getButtonStyles()} px-4 sm:px-6 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base`}
              >
                Limpar Busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}