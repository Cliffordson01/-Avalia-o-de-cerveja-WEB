import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BeerCard } from "@/components/beer-card"
import { Heart } from "lucide-react"

export default async function FavoritesPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // CONSULTA SIMPLES E DIRETA: Buscar IDs das cervejas favoritadas
  const { data: favoritos, error } = await supabase
    .from("favorito")
    .select("cerveja_id")
    .eq("usuario_id", user.id)
    .eq("status", true)
    .eq("deletado", false)

  console.log('🔄 DEBUG Favoritos - IDs:', {
    usuario: user.id,
    totalFavoritos: favoritos?.length,
    ids: favoritos?.map(f => f.cerveja_id),
    error: error
  })

  // Se não há favoritos, mostrar mensagem
  if (!favoritos || favoritos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 fill-primary text-primary" />
            <h1 className="font-bebas text-5xl tracking-wide">Minhas Favoritas</h1>
          </div>
          <p className="mt-2 text-muted-foreground">0 cervejas favoritas</p>
        </div>

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
          <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">Nenhuma cerveja favorita ainda</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Explore nosso catálogo de cervejas e adicione suas favoritas clicando no coração!
          </p>
          <div className="mt-6 flex gap-4">
            <a
              href="/cervejas"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explorar Cervejas
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Extrair IDs das cervejas favoritas
  const cervejaIds = favoritos.map(f => f.cerveja_id)

  // Buscar dados completos das cervejas favoritas
  const { data: cervejas, error: errorCervejas } = await supabase
    .from("cerveja")
    .select(`
      *,
      ranking (*),
      selo (*)
    `)
    .in("uuid", cervejaIds)
    .eq("ativo", true)

  console.log('🔄 DEBUG Cervejas Favoritas:', {
    idsBuscados: cervejaIds,
    cervejasEncontradas: cervejas?.length,
    nomes: cervejas?.map(c => c.nome),
    error: errorCervejas
  })

  // Buscar votos do usuário para marcar nos cards
  const { data: userVotos } = await supabase
    .from("voto")
    .select("cerveja_id")
    .eq("usuario_id", user.id)
    .eq("status", true)
    .eq("deletado", false)

  const userVotesIds = userVotos?.map(v => v.cerveja_id) || []

  // Transformar dados para o formato do BeerCard
  const cervejasFormatadas = cervejas?.map(cerveja => ({
    uuid: cerveja.uuid,
    nome: cerveja.nome,
    marca: cerveja.marca,
    imagem_url: cerveja.imagem_url,
    imagem_main: cerveja.imagem_main,
    estilo: cerveja.estilo,
    ativo: cerveja.ativo,
    ranking: cerveja.ranking || [],
    selo: cerveja.selo || [],
    user_voto: userVotesIds.includes(cerveja.uuid),
    user_favorito: true, // Sempre true pois são as favoritas
    data_criacao: cerveja.criado_em,
    ultima_atualizacao: cerveja.criado_em,
  })) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 fill-primary text-primary" />
          <h1 className="font-bebas text-5xl tracking-wide">Minhas Favoritas</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          {cervejasFormatadas.length} cerveja{cervejasFormatadas.length !== 1 ? "s" : ""} favorita
          {cervejasFormatadas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {cervejasFormatadas.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cervejasFormatadas.map((cerveja) => (
            <BeerCard 
              key={cerveja.uuid} 
              cerveja={cerveja} 
              userId={user.id}
              showActions={true} 
            />
          ))}
        </div>
      ) : favoritos.length > 0 ? (
        // Caso onde encontramos favoritos mas não as cervejas
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
          <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">Cervejas não encontradas</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Encontramos {favoritos.length} favorito(s) no banco, mas as cervejas correspondentes não estão disponíveis.
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>IDs encontrados: {cervejaIds.join(', ')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}