// app/cerveja/[id]/page.tsx - VERSÃO CORRIGIDA
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BeerDetailClient } from "./BeerDetailClient"

interface BeerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BeerPage({ params }: BeerPageProps) {
  const { id } = await params
  
  if (!id || id === "undefined" || id === "null") {
    notFound()
  }

  const supabase = await getSupabaseServerClient()

  try {
    // Buscar dados em paralelo
    const [cervejaResponse, infoResponse, rankingResponse] = await Promise.all([
      supabase
        .from("cerveja")
        .select("uuid, marca, nome, imagem_main, ativo, criado_em")
        .eq("uuid", id)
        .maybeSingle(),
      supabase.from("informacao").select("*").eq("cerveja_id", id).limit(1),
      supabase.from("ranking").select("*").eq("cerveja_id", id).limit(1),
    ])

    if (cervejaResponse.error) throw cervejaResponse.error
    if (!cervejaResponse.data) {
      notFound()
    }

    // Buscar usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    // Buscar interações do usuário se estiver logado
    let userVotes: string[] = []
    let userFavorites: string[] = []
    let userRating = 0

    if (user?.email) {
      const [usuarioData, ratingData, votosData, favoritosData] = await Promise.all([
        supabase.from("usuario").select("uuid").eq("email", user.email).single(),
        supabase.from("avaliacao").select("quantidade_estrela").eq("usuario_id", user.id).eq("cerveja_id", id).maybeSingle(),
        supabase.from("voto").select("cerveja_id").eq("usuario_id", user.id).eq("cerveja_id", id).eq("deletado", false).maybeSingle(),
        supabase.from("favorito").select("cerveja_id").eq("usuario_id", user.id).eq("cerveja_id", id).eq("deletado", false).maybeSingle(),
      ])

      userRating = ratingData.data?.quantidade_estrela || 0
      userVotes = votosData.data ? [votosData.data.cerveja_id] : []
      userFavorites = favoritosData.data ? [favoritosData.data.cerveja_id] : []
    }

    // Processar selos
    const ranking = rankingResponse.data?.[0]
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let selo = undefined

    if (ranking?.posicao === 1) {
      selo = { tipo: "ouro", imagem_url: `${baseUrl}/storage/v1/object/public/selos/ouro.png` }
    } else if (ranking?.posicao === 2) {
      selo = { tipo: "prata", imagem_url: `${baseUrl}/storage/v1/object/public/selos/prata.png` }
    } else if (ranking?.posicao === 3) {
      selo = { tipo: "bronze", imagem_url: `${baseUrl}/storage/v1/object/public/selos/bronze.png` }
    }

    const beerData = {
      ...cervejaResponse.data,
      informacao: infoResponse.data || [],
      ranking: rankingResponse.data || [],
      selo: selo ? [selo] : [],
      user_voto: userVotes.length > 0,
      user_favorito: userFavorites.length > 0,
      user_avaliacao: userRating
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {/* ✅ REMOVIDO userId e userEmail - já são gerenciados pelo useAuth() */}
        <BeerDetailClient initialBeer={beerData} />
      </Suspense>
    )

  } catch (error) {
    console.error("Error loading beer:", error)
    notFound()
  }
}

// Componente de loading
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Carregando cerveja...</p>
      </div>
    </div>
  )
}

// Gerar metadata
export async function generateMetadata({ params }: BeerPageProps) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  
  const { data: cerveja } = await supabase
    .from("cerveja")
    .select("nome, marca")
    .eq("uuid", id)
    .single()

  return {
    title: cerveja ? `${cerveja.nome} - ${cerveja.marca}` : "Cerveja não encontrada",
    description: cerveja ? `Detalhes da cerveja ${cerveja.nome} da ${cerveja.marca}` : "Página da cerveja",
  }
}