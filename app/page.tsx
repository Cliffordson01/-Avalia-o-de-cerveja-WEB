// app/page.tsx - VERSÃO FINAL CORRIGIDA E FUNCIONAL
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Swords, Beer, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { 
  CervejaComDetalhes, 
  RankingItemFromDB,
  BeerTransformer 
} from "@/lib/types"
import { HomePageError } from "@/components/home-page-error"
import { BeerCardSafe } from "@/components/beer-card-safe" // ✅ Componente seguro

export default async function HomePage() {
  try {
    const supabase = await getSupabaseServerClient()

    // Buscar usuário atual
    let user = null
    try {
      const { data: userData } = await supabase.auth.getUser()
      user = userData.user
    } catch (authError) {
      console.error('Erro na autenticação:', authError)
      user = null
    }

    // Buscar dados principais
    let top3: RankingItemFromDB[] = []
    let top5: RankingItemFromDB[] = []
    let recentBeers: any[] = []

    try {
      const { data: top3Data } = await supabase
        .from("ranking")
        .select(`
          *,
          cerveja:cerveja_id (*),
          selo:selo(tipo_selo)
        `)
        .order("posicao", { ascending: true })
        .limit(3)
      top3 = top3Data || []
    } catch (error) {
      console.error('Erro ao buscar top3:', error)
      top3 = []
    }

    try {
      const { data: top5Data } = await supabase
        .from("ranking")
        .select(`
          *,
          cerveja:cerveja_id (*)
        `)
        .order("posicao", { ascending: true })
        .limit(5)
      top5 = top5Data || []
    } catch (error) {
      console.error('Erro ao buscar top5:', error)
      top5 = []
    }

    try {
      const { data: recentBeersData } = await supabase
        .from("cerveja")
        .select(`
          *,
          ranking:ranking(*)
        `)
        .eq("ativo", true)
        .order("criado_em", { ascending: false }) 
        .limit(8)
      recentBeers = recentBeersData || []
    } catch (error) {
      console.error('Erro ao buscar cervejas recentes:', error)
      recentBeers = []
    }

    // Buscar interações do usuário
    let userVotes: string[] = []
    let userFavorites: string[] = []

    if (user) {
      try {
        const { data: votosData } = await supabase
          .from("voto")
          .select("cerveja_id")
          .eq("usuario_id", user.id)
          .eq("deletado", false)
        
        const { data: favoritosData } = await supabase
          .from("favorito")
          .select("cerveja_id")
          .eq("usuario_id", user.id)
          .eq("deletado", false)

        userVotes = votosData?.map((v) => v.cerveja_id) || []
        userFavorites = favoritosData?.map((f) => f.cerveja_id) || []
      } catch (interactionError) {
        console.error('Erro ao buscar interações:', interactionError)
      }
    }

    // ✅ Função de transformação com tipagem forte
    const transformBeer: BeerTransformer = (
      beer: any, 
      rankingData?: RankingItemFromDB, 
      selo?: Array<{ tipo_selo: string; imagem_url?: string }>
    ): CervejaComDetalhes => {
      const defaultRanking = {
        uuid: '',
        cerveja_id: beer.uuid,
        total_votos: 0,
        media_estrelas: 0,
        media_avaliacao: 0,
        total_favoritos: 0,
        total_comentarios: 0,
        pontuacao_total: 0,
        posicao: 0,
        status: true,
        ultima_atualizacao: new Date().toISOString(),
        taças_breja: 0
      }

      return {
        ...beer,
        user_voto: user ? userVotes.includes(beer.uuid) : false,
        user_favorito: user ? userFavorites.includes(beer.uuid) : false,
        ranking: rankingData ? [{
          ...defaultRanking,
          ...rankingData,
          media_avaliacao: rankingData.media_avaliacao || 0,
          total_votos: rankingData.total_votos || 0,
          posicao: rankingData.posicao || 0
        }] : beer.ranking || [defaultRanking],
        selo: selo || beer.selo || []
      }
    }

    // Filtrar itens válidos
    const top3Valido = top3?.filter(item => item.cerveja !== null) || []
    const top5Valido = top5?.filter((item: RankingItemFromDB) => item.cerveja !== null) || []

    // URLs dos selos
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const seloOuro = `${baseUrl}/storage/v1/object/public/selos/ouro.png`
    const seloPrata = `${baseUrl}/storage/v1/object/public/selos/prata.png`
    const seloBronze = `${baseUrl}/storage/v1/object/public/selos/bronze.png`

    // Estado vazio
    if (top3Valido.length === 0 && top5Valido.length === 0 && recentBeers.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <Beer className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-4">Bem-vindo ao TopBreja!</h1>
          <p className="text-gray-600 mb-8">
            O catálogo de cervejas está sendo carregado.
          </p>
          <Button asChild className="flex items-center gap-2 mx-auto">
            <Link href="/">
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="mb-4 font-bebas text-6xl tracking-wide text-balance md:text-7xl">
            Descubra as Melhores
            <span className="block text-primary">Cervejas Artesanais</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
            Vote, avalie e compartilhe suas experiências com as melhores cervejas artesanais do Brasil. Junte-se à
            comunidade TopBreja!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/cervejas">
                <Trophy className="mr-2 h-5 w-5" />
                Explorar Cervejas
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/batalha">
                <Swords className="mr-2 h-5 w-5" />
                Batalha VS
              </Link>
            </Button>
          </div>
        </section>

        {/* Top 3 Podium */}
        {top3Valido.length >= 3 && (
          <section className="mb-16">
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-bebas text-4xl tracking-wide">Top 3 Cervejas</h2>
              <p className="text-muted-foreground">As mais votadas pela comunidade</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Silver - 2nd place */}
              <div className="order-2 md:order-1">
                <BeerCardSafe 
                  cerveja={transformBeer(
                    top3Valido[1].cerveja, 
                    top3Valido[1],
                    [{ tipo_selo: "prata", imagem_url: seloPrata }]
                  )} 
                  userId={user?.id} 
                  showActions={true}
                  priority={true}
                />
              </div>

              {/* Gold - 1st place */}
              <div className="order-1 md:order-2 md:-mt-8">
                <BeerCardSafe 
                  cerveja={transformBeer(
                    top3Valido[0].cerveja, 
                    top3Valido[0],
                    [{ tipo_selo: "ouro", imagem_url: seloOuro }]
                  )} 
                  userId={user?.id} 
                  showActions={true}
                  priority={true}
                />
              </div>

              {/* Bronze - 3rd place */}
              <div className="order-3">
                <BeerCardSafe 
                  cerveja={transformBeer(
                    top3Valido[2].cerveja, 
                    top3Valido[2],
                    [{ tipo_selo: "bronze", imagem_url: seloBronze }]
                  )} 
                  userId={user?.id} 
                  showActions={true}
                  priority={true}
                />
              </div>
            </div>
          </section>
        )}

        {/* Top 5 List */}
        {top5Valido.length > 0 && (
          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-bebas text-4xl tracking-wide">Top 5 Ranking</h2>
                <p className="text-muted-foreground">As cervejas mais bem avaliadas</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/ranking">Ver Ranking Completo</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {top5Valido.map((item: RankingItemFromDB, index: number) => (
                <div key={item.cerveja.uuid}>
                  <Link
                    href={`/cerveja/${item.cerveja.uuid}`}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bebas text-2xl text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.cerveja.nome}</h3>
                      <p className="text-sm text-muted-foreground">{item.cerveja.marca}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{Number(item.total_votos ?? 0)} votos</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {Number(item.media_avaliacao ?? 0).toFixed(1)} ★
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Beers Gallery */}
        {recentBeers && recentBeers.length > 0 && (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-bebas text-4xl tracking-wide">Cervejas Recentes</h2>
                <p className="text-muted-foreground">Adicionadas recentemente à plataforma</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/cervejas">Ver Todas</Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentBeers.map((beer: any, index: number) => (
                <BeerCardSafe 
                  key={beer.uuid} 
                  cerveja={transformBeer(beer)} 
                  userId={user?.id} 
                  showActions={true}
                  priority={index < 4}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    )

  } catch (error) {
    console.error('Erro crítico na HomePage:', error)
    return <HomePageError message="Erro ao carregar a página principal" />
  }
}