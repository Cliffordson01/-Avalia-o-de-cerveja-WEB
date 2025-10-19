import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BeerCard } from "@/components/beer-card"
import { Beer, Search, ArrowDownWideNarrow, ListFilter } from "lucide-react"
import type { CervejaComDetalhes } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

// Definição dos tipos para os parâmetros de busca
interface BeersPageProps {
  searchParams: {
    q?: string 
    sort?: string 
  }
}

export default async function BeersPage({ searchParams }: BeersPageProps) {
  const supabase = await getSupabaseServerClient()

  const { q: query = "", sort: sortParam = "recent" } = searchParams

  // Buscar usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  
  // Buscar interações do usuário se estiver logado
  let userVotes: string[] = []
  let userFavorites: string[] = []

  if (user) {
    const [votosData, favoritosData] = await Promise.all([
      supabase.from("voto").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false),
      supabase.from("favorito").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false)
    ])

    userVotes = votosData.data?.map((v) => v.cerveja_id) || []
    userFavorites = favoritosData.data?.map((f) => f.cerveja_id) || []
  }

  // CONSULTA PRINCIPAL CORRIGIDA - GARANTINDO DADOS COMPLETOS
  let baseQuery = supabase
    .from("cerveja")
    .select(`
      *,
      ranking!left (
        media_avaliacao,
        total_votos,
        total_favoritos,
        total_comentarios,
        posicao
      ),
      selo!left (
        tipo_selo,
        imagem_url
      )
    `)
    .eq("ativo", true)

  // Aplicar filtro de busca se houver query
  if (query) {
    baseQuery = baseQuery.or(`nome.ilike.%${query}%,marca.ilike.%${query}%`)
  }

  // APLICAR ORDENAÇÃO CORRETA
  switch (sortParam) {
    case "recent":
      baseQuery = baseQuery.order("criado_em", { ascending: false })
      break
    case "votos":
      baseQuery = baseQuery.order("total_votos", { 
        ascending: false,
        referencedTable: "ranking",
        nullsFirst: false 
      })
      break
    case "avaliacao":
      baseQuery = baseQuery.order("media_avaliacao", { 
        ascending: false,
        referencedTable: "ranking",
        nullsFirst: false 
      })
      break
    case "favoritos":
      baseQuery = baseQuery.order("total_favoritos", { 
        ascending: false,
        referencedTable: "ranking",
        nullsFirst: false 
      })
      break
    case "comentarios":
      baseQuery = baseQuery.order("total_comentarios", { 
        ascending: false,
        referencedTable: "ranking",
        nullsFirst: false 
      })
      break
    default:
      baseQuery = baseQuery.order("criado_em", { ascending: false })
  }

  const { data: cervejas, error } = await baseQuery

  if (error) {
    console.error("Erro na consulta:", error)
  }

  // DEBUG: Verificar dados recebidos
  console.log('DEBUG - Total de cervejas:', cervejas?.length);
  if (cervejas && cervejas.length > 0) {
    console.log('DEBUG - Primeira cerveja:', {
      nome: cervejas[0].nome,
      ranking: cervejas[0].ranking,
      temRanking: !!cervejas[0].ranking,
      rankingData: cervejas[0].ranking
    });
  }

  // Transformar dados para o formato esperado - CORRIGIDO
  const transformBeer = (beer: any): CervejaComDetalhes => {
    // CORREÇÃO: Lidar com diferentes formatos de ranking
    let rankingData = null;
    if (beer.ranking && Array.isArray(beer.ranking) && beer.ranking.length > 0) {
      rankingData = beer.ranking[0];
    } else if (beer.ranking && !Array.isArray(beer.ranking)) {
      rankingData = beer.ranking;
    }

    // CORREÇÃO: Lidar com diferentes formatos de selo
    let seloData = null;
    if (beer.selo && Array.isArray(beer.selo) && beer.selo.length > 0) {
      seloData = beer.selo[0];
    } else if (beer.selo && !Array.isArray(beer.selo)) {
      seloData = beer.selo;
    }

    return {
      ...beer,
      ranking: rankingData ? {
        media_avaliacao: Number(rankingData.media_avaliacao) || 0,
        total_votos: Number(rankingData.total_votos) || 0,
        total_favoritos: Number(rankingData.total_favoritos) || 0,
        total_comentarios: Number(rankingData.total_comentarios) || 0,
        posicao: rankingData.posicao ? Number(rankingData.posicao) : null
      } : {
        media_avaliacao: 0,
        total_votos: 0,
        total_favoritos: 0,
        total_comentarios: 0,
        posicao: null
      },
      selo: seloData,
      user_voto: userVotes.includes(beer.uuid),
      user_favorito: userFavorites.includes(beer.uuid),
    }
  }

  const transformedCervejas = cervejas?.map(transformBeer) || []

  // Componente de Filtro Simplificado
  const FilterForm = () => {
    return (
      <form 
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
        action={async (formData: FormData) => {
          "use server"
          const query = formData.get("query") as string
          const sort = formData.get("sort") as string

          const newParams = new URLSearchParams()
          if (query && query.trim()) newParams.set("q", query.trim())
          if (sort && sort !== "recent") newParams.set("sort", sort)

          const url = newParams.toString() ? `/cervejas?${newParams.toString()}` : "/cervejas"
          redirect(url)
        }}
      >
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="search" 
            name="query"
            placeholder="Buscar por nome ou marca..." 
            defaultValue={query}
            className="w-full pl-10 h-10" 
          />
        </div>

        {/* Filtro de Ordenação */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowDownWideNarrow className="h-5 w-5 text-muted-foreground" />
          <Select name="sort" defaultValue={sortParam}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="votos">Mais Votadas</SelectItem>
              <SelectItem value="avaliacao">Melhor Avaliação</SelectItem>
              <SelectItem value="favoritos">Mais Favoritadas</SelectItem>
              <SelectItem value="comentarios">Mais Comentadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Botão submit */}
        <Button type="submit" className="h-10">
          Aplicar Filtros
        </Button>
      </form>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Beer className="h-10 w-10 text-primary" />
          <h1 className="font-bebas text-6xl tracking-wide">Catálogo de Cervejas</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {query ? (
            <>Encontramos <strong>{transformedCervejas.length}</strong> cerveja{transformedCervejas.length !== 1 ? "s" : ""} para "<strong>{query}</strong>"</>
          ) : (
            <>Mostrando <strong>{transformedCervejas.length}</strong> cerveja{transformedCervejas.length !== 1 ? "s" : ""} no catálogo</>
          )}
          {sortParam !== "recent" && ` • Ordenado por ${getSortLabel(sortParam)}`}
        </p>
      </div>

      {/* Seção de Filtros */}
      <Card className="mb-8 p-4">
        <CardContent className="p-0">
          <FilterForm />
        </CardContent>
      </Card>

      {/* Exibição da Lista */}
      {transformedCervejas.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {transformedCervejas.map((cerveja) => (
            <BeerCard 
              key={cerveja.uuid} 
              cerveja={cerveja} 
              userId={user?.id}
              showActions={true} 
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
          <ListFilter className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">Nenhuma cerveja encontrada</h2>
          <p className="text-muted-foreground text-center">
            {query 
              ? `Não encontramos cervejas para "${query}". Tente outros termos.`
              : "Não há cervejas disponíveis no momento."
            }
          </p>
        </div>
      )}
    </div>
  )
}

// Função auxiliar para obter o label da ordenação
function getSortLabel(sortParam: string): string {
  const labels: Record<string, string> = {
    recent: "Mais Recentes",
    votos: "Mais Votadas",
    avaliacao: "Melhor Avaliação",
    favoritos: "Mais Favoritadas",
    comentarios: "Mais Comentadas"
  }
  return labels[sortParam] || "Mais Recentes"
}