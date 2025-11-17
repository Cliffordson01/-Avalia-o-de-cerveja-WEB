// lib/supabase/server.ts - VERSÃO ATUALIZADA
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ NOVA SINTAXE - get instead of getAll
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // ✅ NOVA SINTAXE - set instead of setAll  
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle error if needed
          }
        },
        // ✅ NOVA SINTAXE - remove instead of delete
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Handle error if needed
          }
        },
      },
    }
  )
}

// Alias para compatibilidade
export async function getSupabaseServerClient() {
  return createClient()
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar usuário:', error)
      }
      return null
    }
    
    return user
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro inesperado ao buscar usuário:', error)
    }
    return null
  }
}