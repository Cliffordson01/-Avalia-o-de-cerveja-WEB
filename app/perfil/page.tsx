// app/perfil/page.tsx - VERSÃO FINAL CORRIGIDA
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Heart, MessageCircle, Star, Beer } from "lucide-react"
import Link from "next/link"
import { ProfileImageUploader } from "@/components/profile-image-uploader" 
import { ProfileNameEditor } from "@/components/profile-name-editor"

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
  
  // Buscar estatísticas em paralelo para melhor performance
  const [
    votosCount,
    favoritosCount,
    comentariosCount,
    avaliacoesCount,
    recentVotes,
    recentComments
  ] = await Promise.all([
    // VOTOS
    supabase
      .from("voto")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.uuid)
      .eq("deletado", false),
    
    // Favoritos Ativos
    supabase
      .from("favorito")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.uuid)
      .eq("deletado", false),
    
    // Comentários
    supabase
      .from("comentario")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.uuid),
    
    // AVALIAÇÕES
    supabase
      .from("avaliacao")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", usuario.uuid)
      .eq("deletado", false),
    
    // Votos Recentes
    supabase
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
      .limit(5),
    
    // Comentários Recentes
    supabase
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
  ])

  const totalVotos = votosCount.count || 0
  const totalFavoritos = favoritosCount.count || 0
  const totalComentarios = comentariosCount.count || 0
  const totalAvaliacoes = avaliacoesCount.count || 0

  // Filtrar votos recentes para remover aqueles com cerveja null
  const votosValidos = recentVotes.data?.filter(voto => voto.cerveja !== null) || []

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Card */}
          <Card className="theme-transition hover:shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <ProfileImageUploader 
                  initialUser={{ 
                    uuid: usuario.uuid, 
                    nome: usuario.nome, 
                    foto_url: usuario.foto_url 
                  }} 
                  userId={user.id}
                />
              </div>

              <div className="mb-4">
                <ProfileNameEditor 
                  initialName={usuario.nome || "Usuário"}
                  userId={usuario.uuid}
                  userEmail={usuario.email}
                />
              </div>

              <Badge 
                variant="secondary" 
                className="bg-accent/50 text-accent-foreground border-accent/30 theme-transition"
              >
                Membro desde{" "}
                {new Date(usuario?.criado_em || "").toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </Badge>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="theme-transition hover:shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <StatItem 
                icon={TrendingUp}
                label="Votos"
                value={totalVotos}
                color="text-green-500"
              />
              <StatItem 
                icon={Heart}
                label="Favoritos"
                value={totalFavoritos}
                color="text-red-500"
              />
              <StatItem 
                icon={Star}
                label="Avaliações"
                value={totalAvaliacoes}
                color="text-yellow-500"
              />
              <StatItem 
                icon={MessageCircle}
                label="Comentários"
                value={totalComentarios}
                color="text-blue-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Votes */}
          <Card className="theme-transition hover:shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Votos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {votosValidos.length > 0 ? (
                <div className="space-y-3">
                  {votosValidos.map((voto) => (
                    <ActivityItem 
                      key={voto.uuid}
                      type="vote"
                      title={voto.cerveja.nome}
                      subtitle={voto.cerveja.marca}
                      date={voto.criado_em}
                      href={`/cerveja/${voto.cerveja.uuid}`}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="Você ainda não votou em nenhuma cerveja."
                  actionText="Explorar Cervejas"
                  actionHref="/cervejas"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card className="theme-transition hover:shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageCircle className="h-5 w-5 text-primary" />
                Comentários Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentComments.data && recentComments.data.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.data.map((comentario) => (
                    <ActivityItem 
                      key={comentario.uuid}
                      type="comment"
                      title={comentario.cerveja?.nome || "Cerveja não encontrada"}
                      subtitle={comentario.descricao}
                      date={comentario.criado_em}
                      href={`/cerveja/${comentario.cerveja?.uuid || '#'}`}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="Você ainda não fez nenhum comentário."
                  actionText="Ver Cervejas"
                  actionHref="/cervejas"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Componente para item de estatística
function StatItem({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string; 
}) {
  return (
    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-accent/20 theme-transition hover:bg-accent/30">
      <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
        <span className="text-sm sm:text-base">{label}</span>
      </div>
      <span className="font-bold text-lg sm:text-xl text-foreground theme-transition">
        {value}
      </span>
    </div>
  )
}

// Componente para item de atividade
function ActivityItem({
  type,
  title,
  subtitle,
  date,
  href
}: {
  type: 'vote' | 'comment';
  title: string;
  subtitle: string;
  date: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between rounded-lg border border-border p-3 sm:p-4 transition-all duration-300 hover:bg-accent/30 hover:border-accent/50 hover:shadow-md group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {type === 'vote' && (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
          )}
          {type === 'comment' && (
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
          )}
          <p className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
            {title}
          </p>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {subtitle}
        </p>
      </div>
      <p className="text-xs text-muted-foreground ml-2 sm:ml-4 shrink-0 whitespace-nowrap">
        {new Date(date).toLocaleDateString("pt-BR")}
      </p>
    </Link>
  )
}

// Componente para estado vazio
function EmptyState({
  message,
  actionText,
  actionHref
}: {
  message: string;
  actionText: string;
  actionHref: string;
}) {
  return (
    <div className="text-center py-6 sm:py-8">
      <div className="mb-3 sm:mb-4 text-muted-foreground">
        <Beer className="h-8 w-8 sm:h-12 sm:w-12 mx-auto opacity-50" />
      </div>
      <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
        {message}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href={actionHref}>
          {actionText}
        </Link>
      </Button>
    </div>
  )
}