// app/cervejas/page.tsx - VERSÃO COM DADOS REAIS
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { CervejaPageClient } from "./CervejaPageClient"
import { Beer } from "lucide-react"

interface CervejasPageProps {
  searchParams?: Promise<{
    query?: string
    page?: string
    style?: string
    brewery?: string
  }>
}

export default async function CervejasPage({ searchParams }: CervejasPageProps) {
  const resolvedSearchParams = await searchParams
  
  try {
    const supabase = await getSupabaseServerClient()

    // ✅ BUSCAR USUÁRIO
    let user = null
    try {
      const { data: { user: userData } } = await supabase.auth.getUser()
      user = userData
    } catch (userError) {
      console.warn("Erro ao buscar usuário:", userError)
    }

    // ✅ BUSCAR CERVEJAS COM ESTATÍSTICAS EM UMA ÚNICA QUERY
    const { data: cervejasComRanking, error } = await supabase
      .from("cerveja")
      .select(`
        *,
        ranking (*),
        selo (*)
      `)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar cervejas:", error)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-orange-800">
          <div className="text-center text-white">
            <Beer className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erro ao carregar cervejas</h2>
            <p className="text-amber-200">Tente recarregar a página</p>
          </div>
        </div>
      )
    }

    // ✅ BUSCAR INTERAÇÕES DO USUÁRIO (se estiver logado)
    let userVotes: string[] = []
    let userFavorites: string[] = []

    if (user) {
      try {
        const [votosData, favoritosData] = await Promise.all([
          supabase.from("voto").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false),
          supabase.from("favorito").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false)
        ])

        userVotes = votosData.data?.map((v: any) => v.cerveja_id) || []
        userFavorites = favoritosData.data?.map((f: any) => f.cerveja_id) || []
      } catch (interactionError) {
        console.warn("Erro ao buscar interações do usuário:", interactionError)
      }
    }

    // ✅ PROCESSAR DADOS COM ESTATÍSTICAS REAIS
    const cervejasComEstatisticas = cervejasComRanking?.map((cerveja: any) => {
      // Extrair dados do ranking (pode ser array ou objeto)
      const rankingData = cerveja.ranking && !Array.isArray(cerveja.ranking) 
        ? cerveja.ranking
        : (cerveja.ranking && Array.isArray(cerveja.ranking) && cerveja.ranking.length > 0 
            ? cerveja.ranking[0] 
            : null)

      return {
        ...cerveja,
        ranking: rankingData || {
          media_avaliacao: 0,
          total_votos: 0,
          total_favoritos: 0,
          total_comentarios: 0,
          posicao: null
        },
        selo: cerveja.selo || [],
        user_voto: userVotes.includes(cerveja.uuid),
        user_favorito: userFavorites.includes(cerveja.uuid),
      }
    }) || []

    return (
      <CervejaPageClient 
        initialCervejas={cervejasComEstatisticas} 
        userId={user?.id}
        searchParams={resolvedSearchParams}
      />
    )

  } catch (mainError) {
    console.error("Erro geral na página de cervejas:", mainError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-orange-800">
        <div className="text-center text-white">
          <Beer className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar</h2>
          <p className="text-amber-200 mb-4">Problema ao conectar com o servidor</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }
}