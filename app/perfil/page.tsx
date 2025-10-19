// /perfil/page.tsx (CORRIGIDO)
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Heart, MessageCircle, Star } from "lucide-react"
import Link from "next/link"
import { ProfileImageUploader } from "@/components/profile-image-uploader" 

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login") 
    return null 
  }

  // Get user data
  const { data: usuario, error: userError } = await supabase
    .from("usuario")
    .select("*")
    .eq("email", user.email)
    .single()

  if (userError || !usuario) {
     console.error("Erro ao carregar dados do usuário (email):", userError?.message);
     redirect("/login"); 
     return null; 
  }

  // --- ESTATÍSTICAS CORRIGIDAS ---
  
  // VOTOS: Agora usando a tabela 'voto' (votos simples)
  const { count: totalVotos } = await supabase
    .from("voto")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuario.uuid)
    .eq("deletado", false)

  // Favoritos Ativos
  const { count: totalFavoritos } = await supabase
    .from("favorito")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuario.uuid)
    .eq("deletado", false)

  // Comentários
  const { count: totalComentarios } = await supabase
    .from("comentario")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuario.uuid)

  // AVALIAÇÕES: Usando a tabela 'avaliacao' (sistema de estrelas 1-5)
  const { count: totalAvaliacoes } = await supabase
    .from("avaliacao")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", usuario.uuid)
    .eq("deletado", false)
  
  // Get recent activity - VOTOS (Agora usando a tabela 'voto')
  const { data: recentVotes } = await supabase
    .from("voto")
    .select(
      `
      *,
      cerveja:cerveja_id (uuid, nome, marca)
      `
    )
    .eq("usuario_id", usuario.uuid)
    .eq("deletado", false)
    .order("criado_em", { ascending: false })
    .limit(5)

  // Get recent comments
  const { data: recentComments } = await supabase
    .from("comentario")
    .select(
      `
      *,
      cerveja:cerveja_id (nome, uuid)
      `
    )
    .eq("usuario_id", usuario.uuid)
    .order("criado_em", { ascending: false })
    .limit(5)

  // Filtrar votos recentes para remover aqueles com cerveja null
  const votosValidos = recentVotes?.filter(voto => voto.cerveja !== null) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <ProfileImageUploader 
                initialUser={{ 
                    uuid: usuario.uuid, 
                    nome: usuario.nome, 
                    foto_url: usuario.foto_url 
                }} 
                userId={user.id}
              />

              <h1 className="mb-1 font-bebas text-3xl tracking-wide">{usuario?.nome || "Usuário"}</h1>
              <p className="mb-4 text-sm text-muted-foreground">{usuario?.email}</p>

              <Badge variant="secondary">
                Membro desde{" "}
                {new Date(usuario?.criado_em || "").toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </Badge>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-5 w-5" />
                  <span>Votos</span>
                </div>
                <span className="font-semibold text-lg">{totalVotos || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-5 w-5" />
                  <span>Favoritos</span>
                </div>
                <span className="font-semibold text-lg">{totalFavoritos || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-5 w-5" />
                  <span>Avaliações</span>
                </div>
                <span className="font-semibold text-lg">{totalAvaliacoes || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span>Comentários</span>
                </div>
                <span className="font-semibold text-lg">{totalComentarios || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Votes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Votos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {votosValidos.length > 0 ? (
                <div className="space-y-3">
                  {votosValidos.map((voto) => (
                    <Link
                      key={voto.uuid}
                      href={`/cerveja/${voto.cerveja.uuid}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div>
                        <p className="font-semibold">{voto.cerveja.nome}</p>
                        <p className="text-sm text-muted-foreground">{voto.cerveja.marca}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(voto.criado_em).toLocaleDateString("pt-BR")}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Você ainda não votou em nenhuma cerveja.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Comentários Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentComments && recentComments.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.map((comentario) => (
                    <Link
                      key={comentario.uuid} 
                      href={`/cerveja/${comentario.cerveja?.uuid || '#'}`}
                      className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-sm">{comentario.cerveja?.nome || "Cerveja não encontrada"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(comentario.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{comentario.descricao}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Você ainda não fez nenhum comentário.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}