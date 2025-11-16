"use client"

import { Search, Filter, Sparkles, TrendingUp, Star, Heart, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FilterSectionProps {
  searchParams: {
    q?: string
    sort?: string
    category?: string
  }
}

export function FilterSection({ searchParams }: FilterSectionProps) {
  const { q: query = "", sort: sortParam = "recent", category = "all" } = searchParams
  const router = useRouter()

  const handleCategoryClick = (categoryValue: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (sortParam) params.set('sort', sortParam)
    params.set('category', categoryValue)
    router.push(`/cervejas?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Pesquisa com Efeito Vidro */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-2 shadow-lg">
          <form action="/cervejas" method="GET">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-600" />
                  <Input 
                    type="search" 
                    name="q"
                    placeholder="Buscar cervejas por nome, marca ou estilo..." 
                    defaultValue={query}
                    className="w-full pl-12 h-14 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-amber-600/60" 
                  />
                </div>
              </div>

              {/* Filtro Rápido de Ordenação */}
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="h-5 w-5 text-amber-600" />
                <Select name="sort" defaultValue={sortParam}>
                  <SelectTrigger className="w-[200px] h-12 bg-amber-50 border-amber-200 text-amber-900">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-amber-200">
                    <SelectItem value="recent" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Mais Recentes
                    </SelectItem>
                    <SelectItem value="votos" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Mais Votadas
                    </SelectItem>
                    <SelectItem value="avaliacao" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Melhor Avaliação
                    </SelectItem>
                    <SelectItem value="favoritos" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Mais Favoritadas
                    </SelectItem>
                    <SelectItem value="comentarios" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Mais Comentadas
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="h-12 bg-amber-500 hover:bg-amber-600 text-white">
                  Filtrar
                </Button>
              </div>
            </div>
            <input type="hidden" name="category" value={category} />
          </form>
        </div>
      </div>

      {/* Filtros Rápidos - Categorias */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { value: "all", label: "🍻 Todas", icon: "🍻" },
          { value: "top-rated", label: "⭐ Top Avaliadas", icon: "⭐" },
          { value: "most-voted", label: "🔥 Mais Votadas", icon: "🔥" },
          { value: "trending", label: "🚀 Em Alta", icon: "🚀" },
          { value: "new", label: "🆕 Novidades", icon: "🆕" }
        ].map((cat) => (
          <Badge
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            className={`px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 ${
              category === cat.value 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg" 
                : "bg-white/80 text-amber-700 border-amber-300 hover:bg-amber-50 hover:shadow-md"
            }`}
            onClick={() => handleCategoryClick(cat.value)}
          >
            {cat.icon} {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}