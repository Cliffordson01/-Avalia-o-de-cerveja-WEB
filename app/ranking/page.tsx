import { getSupabaseServerClient } from "@/lib/supabase/server"
import RankingPageClient from "./RankingPageClient"
import { Trophy, Sparkles } from "lucide-react"
import Link from "next/link"

// Componente de erro otimizado
function RankingError() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-amber-50/20 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Trophy className="mx-auto h-16 w-16 text-red-400 mb-4" />
        <h1 className="font-bebas text-4xl text-red-600 mb-3">Erro no Ranking</h1>
        <p className="text-gray-600 mb-6">
          Não foi possível carregar o ranking no momento.
        </p>
        <Link 
          href="/ranking"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors inline-block"
        >
          Tentar Novamente
        </Link>
      </div>
    </div>
  )
}

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
  selo: any[]
}

interface CervejaComStats {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  ativo: boolean
  criado_em: string
  avaliacao: Array<{ quantidade_estrela: number }>
  votos: Array<{ count: number }>
  favoritos: Array<{ count: number }>
  comentarios: Array<{ count: number }>
  ranking: Array<{
    uuid: string
    posicao?: number | null
    media_avaliacao?: number | null
    total_votos?: number | null
    total_favoritos?: number | null
    total_comentarios?: number | null
    criado_em: string
  }>
}

// ✅ BUSCA OTIMIZADA - TODOS OS DADOS EM UMA QUERY
async function getRankingsOtimizado(supabase: any): Promise<Ranking[]> {
  try {
    // Busca única com todas as relações
    const { data: cervejasComStats, error } = await supabase
      .from("cerveja")
      .select(`
        uuid,
        nome,
        marca,
        imagem_main,
        ativo,
        criado_em,
        avaliacao:avaliacao(quantidade_estrela),
        votos:voto(count),
        favoritos:favorito(count),
        comentarios:comentario(count),
        ranking:ranking(*)
      `)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })

    if (error) throw error
    if (!cervejasComStats) return []

    // Processamento em memória - muito mais rápido
    const rankings = cervejasComStats.map((cerveja: CervejaComStats) => {
      // Cálculo otimizado da média
      const avaliacoes = cerveja.avaliacao || []
      const somaAvaliacoes = avaliacoes.reduce((acc: number, curr: { quantidade_estrela: number }) => 
        acc + (curr.quantidade_estrela || 0), 0
      )
      const totalAvaliacoes = avaliacoes.length
      const mediaAvaliacao = totalAvaliacoes > 0 ? somaAvaliacoes / totalAvaliacoes : 0

      // Contagens otimizadas
      const totalVotos = cerveja.votos?.[0]?.count || 0
      const totalFavoritos = cerveja.favoritos?.[0]?.count || 0
      const totalComentarios = cerveja.comentarios?.[0]?.count || 0

      const rankingExistente = cerveja.ranking?.[0]

      return {
        uuid: rankingExistente?.uuid || `virtual-${cerveja.uuid}`,
        cerveja_id: cerveja.uuid,
        posicao: rankingExistente?.posicao || 999,
        media_avaliacao: rankingExistente?.media_avaliacao || Number(mediaAvaliacao.toFixed(1)),
        total_votos: rankingExistente?.total_votos || totalVotos,
        total_favoritos: rankingExistente?.total_favoritos || totalFavoritos,
        total_comentarios: rankingExistente?.total_comentarios || totalComentarios,
        criado_em: rankingExistente?.criado_em || cerveja.criado_em,
        cerveja: {
          uuid: cerveja.uuid,
          nome: cerveja.nome,
          marca: cerveja.marca,
          imagem_main: cerveja.imagem_main,
          ativo: cerveja.ativo,
          criado_em: cerveja.criado_em
        },
        selo: []
      }
    })

    // Ordenação otimizada com tipos explícitos
    return rankings.sort((a: Ranking, b: Ranking) => {
      const diffAvaliacao = (b.media_avaliacao || 0) - (a.media_avaliacao || 0)
      if (diffAvaliacao !== 0) return diffAvaliacao

      const diffVotos = (b.total_votos || 0) - (a.total_votos || 0)
      if (diffVotos !== 0) return diffVotos

      const diffFavoritos = (b.total_favoritos || 0) - (a.total_favoritos || 0)
      if (diffFavoritos !== 0) return diffFavoritos

      const diffComentarios = (b.total_comentarios || 0) - (a.total_comentarios || 0)
      if (diffComentarios !== 0) return diffComentarios

      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    }).map((ranking: Ranking, index: number) => ({
      ...ranking,
      posicao: index + 1
    }))

  } catch (error) {
    console.error("Erro ao buscar rankings:", error)
    return []
  }
}

// ✅ COMPONENTE PRINCIPAL COM PRE-FETCH
export default async function RankingPage() {
  try {
    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      return <RankingError />
    }

    const rankingsCompletos = await getRankingsOtimizado(supabase)

    if (rankingsCompletos.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="relative">
              <Trophy className="mx-auto h-20 w-20 text-muted-foreground mb-4" />
              <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-primary animate-pulse" />
            </div>
            <h1 className="font-bebas text-5xl text-foreground mb-4">
              Ranking Vazio
            </h1>
            <p className="text-muted-foreground mb-6">
              Ainda não há cervejas no ranking.
            </p>
            <Link 
              href="/cervejas" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold transition-colors inline-block"
            >
              Explorar Cervejas
            </Link>
          </div>
        </div>
      )
    }

    return <RankingPageClient rankings={rankingsCompletos} />

  } catch (error) {
    console.error("Erro na página de ranking:", error)
    return <RankingError />
  }
}