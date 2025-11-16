// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Silence error em produção
            if (process.env.NODE_ENV === 'development') {
              console.error('Error setting cookies:', error)
            }
          }
        },
      },
    }
  )
}

// Função específica para buscar usuário com tratamento de erro
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erro inesperado ao buscar usuário:', error)
    return null
  }
}