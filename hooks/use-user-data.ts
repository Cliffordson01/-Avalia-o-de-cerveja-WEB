// hooks/use-user-data.ts
"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function useUserData() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUserData(null)
        return
      }

      const { data: usuario, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("uuid", user.id)
        .single()

      if (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        return
      }

      setUserData(usuario)
    } catch (error) {
      console.error("Erro no hook useUserData:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const refreshUserData = () => {
    fetchUserData()
  }

  return { userData, loading, refreshUserData }
}