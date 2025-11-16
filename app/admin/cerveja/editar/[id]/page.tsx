// app/admin/cerveja/editar/[id]/page.tsx - VERSÃO COM DEBUG
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BeerForm } from "@/components/admin/beer-form"
import { redirect } from "next/navigation"

interface EditBeerPageProps {
  params: {
    id: string
  }
}

export default async function EditBeerPage({ params }: EditBeerPageProps) {
  console.log('🔍 DEBUG - EditBeerPage chamado com params:', params)
  
  const supabase = await getSupabaseServerClient()
  
  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('🔍 DEBUG - Usuário autenticado:', user?.id)

  if (!user) {
    console.log('🔍 DEBUG - Redirecionando para login (usuário não autenticado)')
    redirect("/login")
  }

  // Verificar se é admin
  const { data: usuario } = await supabase
    .from("usuario")
    .select("role")
    .eq("uuid", user.id)
    .single()

  console.log('🔍 DEBUG - Dados do usuário:', usuario)

  if (usuario?.role !== 'admin') {
    console.log('🔍 DEBUG - Redirecionando para home (não é admin)')
    redirect("/")
  }

  // Buscar dados da cerveja para edição
  const { data: cerveja, error } = await supabase
    .from("cerveja")
    .select(`
      *,
      informacao (*),
      ranking (*),
      proprietario (*)
    `)
    .eq("uuid", params.id)
    .single()

  console.log('🔍 DEBUG - Resultado da busca da cerveja:', { cerveja, error })

  if (error || !cerveja) {
    console.error('❌ Erro ao buscar cerveja:', error)
    redirect("/admin")
  }

  // Preparar dados para o formulário
  const cervejaParaEdicao = {
    ...cerveja,
    // Garantir que informacao seja um array
    informacao: cerveja.informacao && Array.isArray(cerveja.informacao) 
      ? cerveja.informacao 
      : cerveja.informacao ? [cerveja.informacao] : [],
    // Garantir que ranking seja um array  
    ranking: cerveja.ranking && Array.isArray(cerveja.ranking)
      ? cerveja.ranking
      : cerveja.ranking ? [cerveja.ranking] : []
  }

  console.log('🔍 DEBUG - Cerveja preparada para edição:', cervejaParaEdicao)

  return (
    <div className="container mx-auto px-4 py-8">
      <BeerForm cerveja={cervejaParaEdicao} />
    </div>
  )
}