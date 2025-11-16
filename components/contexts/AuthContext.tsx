// components/contexts/AuthContext.tsx - VERSÃO COM TIPAGENS CORRETAS
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return

        if (session?.user) {
          const { data: userData } = await supabase
            .from('usuario')
            .select('*')
            .eq('uuid', session.user.id)
            .single()

          if (userData) {
            setUser(userData)
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin: user?.role === 'admin',
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}