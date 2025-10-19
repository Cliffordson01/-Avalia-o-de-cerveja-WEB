import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings, Plus, Users, Beer, Trophy, MessageCircle, Star, TrendingUp, Heart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { BeerManagementTable } from "@/components/admin/beer-management-table"

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin usando a coluna role
  const { data: usuario } = await supabase
    .from("usuario")
    .select("role")
    .eq("uuid", user.id)
    .single()

  if (usuario?.role !== 'admin') {
    redirect("/")
  }

  // Get all beers with ranking and information
  const { data: cervejas } = await supabase
    .from("cerveja")
    .select(`
      *,
      ranking (*),
      informacao (*)
    `)
    .order("criado_em", { ascending: false })

  // Get detailed stats
  const { count: totalCervejas } = await supabase
    .from("cerveja")
    .select("*", { count: "exact", head: true })

  const { count: totalUsuarios } = await supabase
    .from("usuario")
    .select("*", { count: "exact", head: true })

  const { count: totalVotos } = await supabase
    .from("voto")
    .select("*", { count: "exact", head: true })
    .eq("deletado", false)

  const { count: totalComentarios } = await supabase
    .from("comentario")
    .select("*", { count: "exact", head: true })
    .eq("deletado", false)

  // FAVORITOS: MESMA LÓGICA DO BEERMANAGER - USAR A TABELA RANKING
  // Buscar todos os rankings para somar os favoritos
  const { data: todosRankings } = await supabase
    .from("ranking")
    .select("total_favoritos")

  // Calcular total de favoritos somando todos os rankings
  const totalFavoritos = todosRankings?.reduce((acc, ranking) => {
    return acc + (ranking.total_favoritos || 0)
  }, 0) || 0

  console.log('🔍 FAVORITOS DO RANKING:', {
    totalFavoritos,
    rankings: todosRankings?.length,
    soma: totalFavoritos
  })

  const { count: totalAvaliacoes } = await supabase
    .from("avaliacao")
    .select("*", { count: "exact", head: true })
    .eq("deletado", false)

  // Get average rating
  const { data: avaliacoes } = await supabase
    .from("avaliacao")
    .select("quantidade_estrela")
    .eq("deletado", false)

  const avgRating = avaliacoes && avaliacoes.length > 0 
    ? avaliacoes.reduce((acc, curr) => acc + (curr.quantidade_estrela || 0), 0) / avaliacoes.length 
    : 0

  // Buscar estatísticas reais para cada cerveja - USANDO RANKING
  const { data: allCervejas } = await supabase
    .from("cerveja")
    .select("uuid, nome, marca, criado_em, ativo")

  // Buscar estatísticas para cada cerveja
  const cervejasComEstatisticas = await Promise.all(
    (allCervejas || []).map(async (cerveja) => {
      // Buscar ranking da cerveja para pegar estatísticas
      const { data: ranking } = await supabase
        .from("ranking")
        .select("total_votos, total_favoritos, total_comentarios, media_avaliacao")
        .eq("cerveja_id", cerveja.uuid)
        .single()

      // Buscar avaliações e calcular média
      const { data: avaliacoes } = await supabase
        .from("avaliacao")
        .select("quantidade_estrela")
        .eq("cerveja_id", cerveja.uuid)
        .eq("deletado", false)

      const mediaAvaliacao = avaliacoes && avaliacoes.length > 0 
        ? avaliacoes.reduce((acc, curr) => acc + (curr.quantidade_estrela || 0), 0) / avaliacoes.length 
        : (ranking?.media_avaliacao || 0)

      return {
        ...cerveja,
        estatisticas: {
          total_votos: ranking?.total_votos || 0,
          total_favoritos: ranking?.total_favoritos || 0,
          total_comentarios: ranking?.total_comentarios || 0,
          media_avaliacao: mediaAvaliacao
        }
      }
    })
  )

  // Top beers ordenadas por avaliação média
  const topCervejas = [...cervejasComEstatisticas]
    .sort((a, b) => b.estatisticas.media_avaliacao - a.estatisticas.media_avaliacao)
    .slice(0, 5)

  // Recent beers ordenadas por data de criação
  const recentCervejas = [...cervejasComEstatisticas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, 5)

  // Calculate total engagement
  const totalEngajamento = (totalVotos || 0) + (totalComentarios || 0) + (totalFavoritos || 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bebas text-5xl tracking-wide">Painel Admin</h1>
            <p className="text-muted-foreground">Gerencie todo o sistema TopBreja</p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/cerveja/nova">
            <Plus className="mr-2 h-5 w-5" />
            Nova Cerveja
          </Link>
        </Button>
      </div>

      {/* Stats Cards - Expandido */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Cervejas</CardTitle>
            <Beer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{totalCervejas || 0}</div>
            <p className="text-xs text-muted-foreground">No catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{totalUsuarios || 0}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Votos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{totalVotos || 0}</div>
            <p className="text-xs text-muted-foreground">Realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Comentários</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{totalComentarios || 0}</div>
            <p className="text-xs text-muted-foreground">Postados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{totalFavoritos || 0}</div>
            <p className="text-xs text-muted-foreground">Salvos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bebas text-3xl tracking-wide">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">de 5 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Resto do código permanece igual */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="beers">Gerenciar Cervejas</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cervejas com estatísticas REAIS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 5 Cervejas Mais Bem Avaliadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCervejas.map((beer, index) => (
                    <div key={beer.uuid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{beer.nome}</div>
                          <div className="text-sm text-muted-foreground truncate">{beer.marca}</div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold flex items-center gap-1 justify-end">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {beer.estatisticas.media_avaliacao.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span title="Votos">
                            <Trophy className="h-3 w-3 inline mr-1" />
                            {beer.estatisticas.total_votos}
                          </span>
                          <span title="Favoritos">
                            <Heart className="h-3 w-3 inline mr-1" />
                            {beer.estatisticas.total_favoritos}
                          </span>
                          <span title="Comentários">
                            <MessageCircle className="h-3 w-3 inline mr-1" />
                            {beer.estatisticas.total_comentarios}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cervejas Recentes com estatísticas REAIS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Cervejas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCervejas.map((beer) => (
                    <div key={beer.uuid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Beer className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{beer.nome}</div>
                          <div className="text-sm text-muted-foreground truncate">{beer.marca}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(beer.criado_em).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold flex items-center gap-1 justify-end">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {beer.estatisticas.media_avaliacao.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span title="Votos">{beer.estatisticas.total_votos} votos</span>
                          <span title="Favoritos">{beer.estatisticas.total_favoritos} fav</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="beers">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Cervejas</CardTitle>
            </CardHeader>
            <CardContent>
              <BeerManagementTable cervejas={cervejas || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-700">{totalUsuarios || 0}</div>
                  <div className="text-sm text-blue-600 font-medium">Usuários Cadastrados</div>
                </div>
                
                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-green-50 to-green-100">
                  <Trophy className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-700">{totalVotos || 0}</div>
                  <div className="text-sm text-green-600 font-medium">Votos Realizados</div>
                </div>
                
                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-purple-50 to-purple-100">
                  <MessageCircle className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-700">{totalComentarios || 0}</div>
                  <div className="text-sm text-purple-600 font-medium">Comentários Postados</div>
                </div>

                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-pink-50 to-pink-100">
                  <Heart className="h-12 w-12 text-pink-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-pink-700">{totalFavoritos || 0}</div>
                  <div className="text-sm text-pink-600 font-medium">Favoritos Salvos</div>
                </div>

                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <Star className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-yellow-700">{avgRating.toFixed(1)}</div>
                  <div className="text-sm text-yellow-600 font-medium">Avaliação Média</div>
                </div>

                <div className="p-6 border rounded-lg text-center bg-gradient-to-br from-orange-50 to-orange-100">
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-700">{totalEngajamento}</div>
                  <div className="text-sm text-orange-600 font-medium">Total Engajamento</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}