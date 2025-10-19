import { getSupabaseServerClient } from "@/lib/supabase/server"
import RankingPageClient from "./RankingPageClient"
import { Trophy, Sparkles } from "lucide-react"
import Link from "next/link"

// Componente de erro SIMPLIFICADO para Server Component
function RankingError() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-amber-50/20 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 text-center">
        <Trophy className="mx-auto h-24 w-24 text-red-400 mb-6" />
        <h1 className="font-bebas text-6xl text-red-600 mb-4">Erro no Ranking</h1>
        <p className="text-xl text-gray-600 mb-4">
          Ocorreu um erro ao carregar o ranking.
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Tente recarregar a página ou verificar a conexão.
        </p>
        <Link 
          href="/ranking"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
        >
          Recarregar Página
        </Link>
      </div>
    </div>
  )
}

// Interfaces para tipagem
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

interface SupabaseRanking {
  uuid: string
  cerveja_id: string
  posicao?: number | null
  media_avaliacao?: number | null
  total_votos?: number | null
  total_favoritos?: number | null
  total_comentarios?: number | null
  criado_em: string
}

interface SupabaseBeer {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  ativo: boolean
  criado_em: string
}

// Buscar estatísticas em tempo real para uma cerveja
async function getEstatisticasCerveja(supabase: any, cervejaId: string) {
  try {
    const [
      { data: avaliacoes },
      { data: votos },
      { data: favoritos },
      { data: comentarios }
    ] = await Promise.all([
      supabase
        .from("avaliacao")
        .select("quantidade_estrela")
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false),
      supabase
        .from("voto")
        .select("uuid")
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false),
      supabase
        .from("favorito")
        .select("uuid")
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false),
      supabase
        .from("comentario")
        .select("uuid")
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false)
    ])

    // Calcular média de avaliações
    const totalAvaliacoes = avaliacoes?.length || 0
    const somaAvaliacoes = avaliacoes?.reduce((acc: number, curr: any) => acc + (curr.quantidade_estrela || 0), 0) || 0
    const mediaAvaliacao = totalAvaliacoes > 0 ? somaAvaliacoes / totalAvaliacoes : 0

    return {
      media_avaliacao: Number(mediaAvaliacao.toFixed(1)),
      total_votos: votos?.length || 0,
      total_favoritos: favoritos?.length || 0,
      total_comentarios: comentarios?.length || 0
    }
  } catch (error) {
    console.error(`Erro ao buscar estatísticas para cerveja ${cervejaId}:`, error)
    return {
      media_avaliacao: 0,
      total_votos: 0,
      total_favoritos: 0,
      total_comentarios: 0
    }
  }
}

// Criar rankings para TODAS as cervejas ativas
async function criarRankingsCompletos(supabase: any): Promise<Ranking[]> {
  console.log('🍺 Buscando TODAS as cervejas ativas...')
  
  // Buscar TODAS as cervejas ativas
  const { data: cervejas, error: cervejasError } = await supabase
    .from("cerveja")
    .select("uuid, nome, marca, imagem_main, ativo, criado_em")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })

  if (cervejasError) {
    console.error('❌ Erro ao buscar cervejas:', cervejasError)
    return []
  }

  console.log(`✅ ${cervejas?.length || 0} cervejas ativas encontradas`)

  if (!cervejas || cervejas.length === 0) {
    console.log('📭 Nenhuma cerveja ativa no banco')
    return []
  }

  // Buscar rankings existentes para combinar dados
  const { data: rankingsExistentes } = await supabase
    .from("ranking")
    .select("*")

  console.log(`📊 ${rankingsExistentes?.length || 0} rankings existentes encontrados`)

  // Criar rankings para TODAS as cervejas (não apenas as que têm ranking)
  const rankingsCompletos = await Promise.all(
    cervejas.map(async (cerveja: SupabaseBeer) => {
      try {
        // Buscar estatísticas em tempo real para CADA cerveja
        const estatisticas = await getEstatisticasCerveja(supabase, cerveja.uuid)

        // Verificar se já existe um ranking para esta cerveja
        const rankingExistente = rankingsExistentes?.find((r: SupabaseRanking) => r.cerveja_id === cerveja.uuid)

        // Se existe ranking, usar os dados dele, senão usar estatísticas em tempo real
        const ranking: Ranking = {
          uuid: rankingExistente?.uuid || `virtual-${cerveja.uuid}`,
          cerveja_id: cerveja.uuid,
          posicao: rankingExistente?.posicao || 999, // Posição temporária
          media_avaliacao: rankingExistente?.media_avaliacao || estatisticas.media_avaliacao,
          total_votos: rankingExistente?.total_votos || estatisticas.total_votos,
          total_favoritos: rankingExistente?.total_favoritos || estatisticas.total_favoritos,
          total_comentarios: rankingExistente?.total_comentarios || estatisticas.total_comentarios,
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

        console.log(`📈 ${cerveja.nome}: ${estatisticas.total_votos} votos, ${estatisticas.total_favoritos} favoritos`)
        return ranking
      } catch (error) {
        console.error(`Erro ao processar cerveja ${cerveja.nome}:`, error)
        const ranking: Ranking = {
          uuid: `virtual-${cerveja.uuid}`,
          cerveja_id: cerveja.uuid,
          posicao: 999,
          media_avaliacao: 0,
          total_votos: 0,
          total_favoritos: 0,
          total_comentarios: 0,
          criado_em: cerveja.criado_em,
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
        return ranking
      }
    })
  )

  // Ordenar usando a lógica correta: votos > favoritos > comentários > avaliação > data
  const rankingsOrdenados = rankingsCompletos.sort((a, b) => {
    // 1. Por votos (maior primeiro)
    const diffVotos = (b.total_votos || 0) - (a.total_votos || 0)
    if (diffVotos !== 0) return diffVotos
    
    // 2. Por favoritos (maior primeiro)
    const diffFavoritos = (b.total_favoritos || 0) - (a.total_favoritos || 0)
    if (diffFavoritos !== 0) return diffFavoritos
    
    // 3. Por comentários (maior primeiro)
    const diffComentarios = (b.total_comentarios || 0) - (a.total_comentarios || 0)
    if (diffComentarios !== 0) return diffComentarios
    
    // 4. Por avaliação (maior primeiro)
    const diffAvaliacao = (b.media_avaliacao || 0) - (a.media_avaliacao || 0)
    if (diffAvaliacao !== 0) return diffAvaliacao
    
    // 5. Por data (mais recentes primeiro)
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
  })

  // Atualizar posições reais baseado na ordenação
  const rankingsComPosicoes = rankingsOrdenados.map((ranking, index) => ({
    ...ranking,
    posicao: index + 1
  }))

  // Log para debug
  console.log('🏆 TOP 3 no ranking:')
  rankingsComPosicoes.slice(0, 3).forEach((ranking, index) => {
    console.log(`${index + 1}º - ${ranking.cerveja.nome}: ${ranking.total_votos} votos, ${ranking.total_favoritos} favoritos`)
  })

  console.log(`🎯 ${rankingsComPosicoes.length} rankings criados/completados`)
  return rankingsComPosicoes
}

export default async function RankingPage() {
  console.log('🔍 Iniciando página de ranking...')

  try {
    const supabase = await getSupabaseServerClient()
    
    if (!supabase) {
      console.error('❌ Cliente Supabase não encontrado')
      return <RankingError />
    }

    console.log('🍺 Buscando dados completos do ranking...')

    // SEMPRE criar rankings completos com TODAS as cervejas
    const rankingsCompletos = await criarRankingsCompletos(supabase)

    console.log(`✅ ${rankingsCompletos.length} cervejas no ranking completo`)

    if (rankingsCompletos.length === 0) {
      console.log('📭 Nenhuma cerveja encontrada para ranking')
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
            <Link 
              href="/admin/cerveja/nova" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Adicionar Primeira Cerveja
            </Link>
          </div>
        </div>
      )
    }

    return <RankingPageClient rankings={rankingsCompletos} />

  } catch (error) {
    console.error('💥 Erro crítico no ranking:', error)
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return <RankingError />
  }
}