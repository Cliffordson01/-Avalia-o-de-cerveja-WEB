// hooks/use-auth-redirect.ts
"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/contexts/AuthContext"

export function useAuthRedirect() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const requireAuth = (action: string): boolean => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: `Você precisa estar logado para ${action}.`,
        variant: "destructive",
      })
      router.push("/login")
      return false
    }
    return true
  }

  return { requireAuth }
}