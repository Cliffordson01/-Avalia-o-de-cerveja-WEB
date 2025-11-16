// components/contexts/AuthContext.tsx - VERSÃO OTIMIZADA COM CACHE
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Session } from '@supabase/supabase-js'

interface User {
  uuid: string
  email: string
  nome: string
  foto_url: string | null
  role?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const { toast } = useToast()

  // ✅ FUNÇÃO OTIMIZADA COM CACHE
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // ✅ Cache em memória para evitar múltiplas requisições
      const cacheKey = 'auth_check'
      const cachedAuth = sessionStorage.getItem(cacheKey)
      
      if (cachedAuth) {
        const { user: cachedUser, isAdmin: cachedAdmin, timestamp } = JSON.parse(cachedAuth)
        // ✅ Cache válido por 30 segundos
        if (Date.now() - timestamp < 30000) {
          setUser(cachedUser)
          setIsAdmin(cachedAdmin)
          setIsLoading(false)
          return
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError

      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('usuario')
          .select('uuid, email, nome, foto_url, role')
          .eq('uuid', session.user.id)
          .single()

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError)
          setUser(null)
          setIsAdmin(false)
          return
        }

        if (userData) {
          setUser(userData)
          setIsAdmin(userData.role === 'admin')
          // ✅ Salva no cache
          sessionStorage.setItem(cacheKey, JSON.stringify({
            user: userData,
            isAdmin: userData.role === 'admin',
            timestamp: Date.now()
          }))
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        sessionStorage.removeItem(cacheKey) // ✅ Limpa cache se não há sessão
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // ✅ ATUALIZAR AUTENTICAÇÃO
  const refreshAuth = async () => {
    sessionStorage.removeItem('auth_check') // ✅ Limpa cache para forçar refresh
    await checkAuth()
  }

  // ✅ LOGOUT OTIMIZADO
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setIsAdmin(false)
      // ✅ Limpa todos os caches
      sessionStorage.removeItem('auth_check')
      localStorage.removeItem(`user_data_${user?.uuid}`)
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta",
      })
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      })
    }
  }, [supabase, router, toast, user])

  // ✅ EFFECT OTIMIZADO
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (mounted) {
        await checkAuth()
      }
    }

    initializeAuth()

    // ✅ EVENT LISTENER OTIMIZADO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (!mounted) return

        // ✅ Debounce para evitar múltiplas execuções rápidas
        const timeoutId = setTimeout(async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            await checkAuth()
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setIsAdmin(false)
            sessionStorage.removeItem('auth_check')
          } else if (event === 'TOKEN_REFRESHED') {
            await checkAuth()
          }
        }, 100)

        return () => clearTimeout(timeoutId)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, checkAuth])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

// ✅ HOOK PERSONALIZADO
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}