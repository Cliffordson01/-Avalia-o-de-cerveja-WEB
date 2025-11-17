// lib/supabase/session-utils.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function ensureAuthSession() {
  const supabase = createClientComponentClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    console.error("❌ Sessão de autenticação não encontrada:", error)
    throw new Error("Sessão de autenticação não encontrada. Faça login novamente.")
  }
  
  return session
}

export async function getCurrentUser() {
  const supabase = createClientComponentClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error("❌ Erro ao buscar usuário:", error)
    throw error
  }
  
  if (!user) {
    throw new Error("Usuário não autenticado")
  }
  
  return user
}