// app/page.tsx (CORRIGIDO)
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BeerCard } from "@/components/beer-card"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { CervejaComDetalhes } from "@/lib/types"

export default async function HomePage() {
  const supabase = await getSupabaseServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get top 3 - filtrando cervejas que não são null
  const { data: top3 } = await supabase
    .from("ranking")
    .select(`
*,
cerveja:cerveja_id (*),
selo:selo(tipo_selo)
    `)
    .order("posicao", { ascending: true })
    .limit(3)

  // Get top 5 for the list - filtrando cervejas que não são null
  const { data: top5 } = await supabase
    .from("ranking")
    .select(`
*,
cerveja:cerveja_id (*)
    `)
    .order("posicao", { ascending: true })
    .limit(5)

  // Get recent beers with ranking data
  const { data: recentBeers } = await supabase
    .from("cerveja")
    .select(`
      *,
      ranking:ranking(*)
    `)
    .order("criado_em", { ascending: false }) 
    .limit(8)

  // Get user interactions if logged in
  let userVotes: string[] = []
  let userFavorites: string[] = []

  if (user) {
    const { data: votosData } = await supabase.from("voto").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false)
    const { data: favoritosData } = await supabase.from("favorito").select("cerveja_id").eq("usuario_id", user.id).eq("deletado", false)

    userVotes = votosData?.map((v) => v.cerveja_id) || []
    userFavorites = favoritosData?.map((f) => f.cerveja_id) || []
  }

  // Transform data to include user interactions and ensure ranking data
  const transformBeer = (beer: any, rankingData?: any, selo?: any): CervejaComDetalhes => {
    // Se a cerveja não tem ranking, criar um objeto de ranking padrão
    const defaultRanking = {
      media_avaliacao: 0,
      total_votos: 0,
      total_favoritos: 0,
      total_comentarios: 0,
      posicao: null
    }

    return {
      ...beer,
      user_voto: userVotes.includes(beer.uuid),
      user_favorito: userFavorites.includes(beer.uuid),
      // Garantir que sempre tenha dados de ranking
      ranking: rankingData || beer.ranking || [defaultRanking],
      // Adicionar selo se fornecido
      selo: selo || beer.selo || []
    }
  }

  // Filtrar top3 e top5 para remover itens com cerveja null
  const top3Valido = top3?.filter(item => item.cerveja !== null) || []
  const top5Valido = top5?.filter((item: any) => item.cerveja !== null) || []

  // URLs dos selos no Supabase Storage
  const seloOuro = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/ouro.png`
  const seloPrata = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/prata.png`
  const seloBronze = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/bronze.png`

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
              <Zap className="mr-2 h-5 w-5" />
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
            {/* Silver - 2nd place (ESQUERDA) */}
            <div className="order-2 md:order-1">
              <BeerCard 
                cerveja={transformBeer(
                  top3Valido[1].cerveja, 
                  [top3Valido[1]],
                  [{ tipo: "prata", imagem_url: seloPrata }]
                )} 
                userId={user?.id} 
                showActions={true} 
              />
            </div>

            {/* Gold - 1st place (MEIO) */}
            <div className="order-1 md:order-2 md:-mt-8">
              <BeerCard 
                cerveja={transformBeer(
                  top3Valido[0].cerveja, 
                  [top3Valido[0]],
                  [{ tipo: "ouro", imagem_url: seloOuro }]
                )} 
                userId={user?.id} 
                showActions={true} 
              />
            </div>

            {/* Bronze - 3rd place (DIREITA) */}
            <div className="order-3">
              <BeerCard 
                cerveja={transformBeer(
                  top3Valido[2].cerveja, 
                  [top3Valido[2]],
                  [{ tipo: "bronze", imagem_url: seloBronze }]
                )} 
                userId={user?.id} 
                showActions={true} 
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
            {top5Valido.map((item: any, index: number) => (
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
            {recentBeers.map((beer: any) => (
              <BeerCard 
                key={beer.uuid} 
                cerveja={transformBeer(beer)} 
                userId={user?.id} 
                showActions={true} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}