import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsAdmin(false)
          setIsLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('usuario')
          .select('role')
          .eq('uuid', session.user.id)
          .single()

        setIsAdmin(userData?.role === 'admin')
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [supabase])

  return { isAdmin, isLoading }
}