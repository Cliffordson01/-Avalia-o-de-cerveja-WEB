// app/admin/cerveja/editar/[id]/page.tsx - VERSÃO CORRIGIDA
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BeerForm } from "@/components/admin/beer-form"
import { redirect } from "next/navigation"

interface EditBeerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBeerPage({ params }: EditBeerPageProps) {
  // ✅ CORREÇÃO: Aguardar params
  const { id } = await params
  
  console.log('🔍 DEBUG - EditBeerPage chamado com ID:', id)
  
  const supabase = await getSupabaseServerClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()

  console.log('🔍 DEBUG - Usuário autenticado:', user?.id)

  if (!user) {
    console.log('🔍 DEBUG - Redirecionando para login')
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

  // ✅ CORREÇÃO: Buscar dados da cerveja usando o ID correto
  const { data: cerveja, error } = await supabase
    .from("cerveja")
    .select(`
      *,
      informacao (*),
      ranking (*),
      proprietario (*)
    `)
    .eq("uuid", id)  // ✅ Usando a variável id corretamente
    .single()

  console.log('🔍 DEBUG - Resultado da busca da cerveja:', { 
    cerveja: cerveja ? 'Encontrada' : 'Não encontrada', 
    error 
  })

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

  console.log('🔍 DEBUG - Cerveja preparada para edição:', {
    nome: cervejaParaEdicao.nome,
    marca: cervejaParaEdicao.marca,
    temInformacao: !!cervejaParaEdicao.informacao?.length,
    temRanking: !!cervejaParaEdicao.ranking?.length
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bebas text-4xl tracking-wide">Editar Cerveja</h1>
        <p className="text-muted-foreground">Atualize as informações de {cerveja.nome}</p>
      </div>
      
      <BeerForm cerveja={cervejaParaEdicao} />
    </div>
  )
}