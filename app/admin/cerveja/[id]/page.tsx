// app/admin/cerveja/[id]/page.tsx - CORRIGIDO PARA NEXT.JS 15
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { BeerForm } from "@/components/admin/beer-form"

interface EditBeerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBeerPage({ params }: EditBeerPageProps) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: usuario } = await supabase
    .from("usuario")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  if (usuario?.role !== 'admin') {
    redirect("/")
  }

  // Get beer data
  const { data: cerveja, error } = await supabase
    .from("cerveja")
    .select(`
      *,
      informacao (*)
    `)
    .eq("uuid", id)
    .single()

  if (error || !cerveja) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bebas text-4xl tracking-wide">Editar Cerveja</h1>
        <p className="text-muted-foreground">Atualize as informações de {cerveja.nome}</p>
      </div>

      <BeerForm cerveja={cerveja} />
    </div>
  )
}