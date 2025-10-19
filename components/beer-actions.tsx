// components/beer-actions.tsx (CORRIGIDO)
"use client"

import { useState } from "react"
import { TrendingUp, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { CervejaComDetalhes } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BeerActionsProps {
  cerveja: CervejaComDetalhes
  userId?: string
  size?: 'default' | 'sm' | 'lg' | 'icon' | null | undefined
}

export function BeerActions({ cerveja, userId, size = "sm" }: BeerActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  // Usamos o valor inicial do lado do servidor
  const [isVoted, setIsVoted] = useState(cerveja.user_voto || false)
  const [isFavorited, setIsFavorited] = useState(cerveja.user_favorito || false)
  const [loading, setLoading] = useState(false)

  const showLoginError = (action: string) => {
    toast({
      title: "Login necessário",
      description: `Você precisa estar logado para ${action}.`,
      variant: "destructive",
    })
    router.push("/login")
  }

  const handleVote = async () => {
    if (!userId) {
      showLoginError("votar")
      return
    }

    setLoading(true)

    try {
      if (isVoted) {
        // Ação de Cancelar Voto: Mudar 'deletado' para TRUE na tabela 'voto'
        const { error } = await supabase
          .from("voto")
          .update({ deletado: true }) 
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)
          .eq("deletado", false)

        if (error) throw error

        setIsVoted(false)
        toast({
          title: "Voto removido",
          description: "Seu voto foi cancelado com sucesso.",
        })
      } else {
        // Ação de Votar: UPSERT na tabela 'voto', garantindo que 'deletado' seja FALSE
        const { error } = await supabase
          .from("voto")
          .upsert(
            {
              usuario_id: userId,
              cerveja_id: cerveja.uuid,
              quantidade: 1, // Cada voto conta como 1
              deletado: false, // Voto ativo
            },
            { 
              onConflict: 'usuario_id, cerveja_id',
              ignoreDuplicates: false
            } 
          )
          .select()

        if (error) throw error

        setIsVoted(true)
        toast({
          title: "Voto registrado!",
          description: "Seu voto foi contabilizado.",
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro de Ação",
        description: error.details || error.message || "Ocorreu um erro ao votar. Verifique suas políticas RLS.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!userId) {
      showLoginError("favoritar")
      return
    }

    setLoading(true)

    try {
      if (isFavorited) {
        // Remove favorite: Mudar 'deletado' para TRUE na tabela 'favorito'
        const { error } = await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)
          .eq("deletado", false)

        if (error) throw error

        setIsFavorited(false)
        toast({
          title: "Removido dos favoritos",
          description: "Cerveja removida dos seus favoritos.",
        })
      } else {
        // Add favorite: UPSERT na tabela 'favorito', garantindo que 'deletado' seja FALSE
        const { error } = await supabase
          .from("favorito")
          .upsert(
            {
              usuario_id: userId,
              cerveja_id: cerveja.uuid,
              deletado: false, // Favorito ativo
            },
            { 
              onConflict: 'usuario_id, cerveja_id',
              ignoreDuplicates: false
            } 
          )
          .select()

        if (error) throw error

        setIsFavorited(true)
        toast({
          title: "Adicionado aos favoritos!",
          description: "Cerveja adicionada aos seus favoritos.",
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro de Ação",
        description: error.details || error.message || "Ocorreu um erro ao favoritar. Verifique suas políticas RLS.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size={size} 
        variant={isVoted ? "default" : "outline"}
        className="flex-1"
        onClick={handleVote}
        disabled={loading || !userId}
      >
        <TrendingUp className={cn("mr-1", size === 'sm' ? "h-4 w-4" : "h-5 w-5 mr-2")} />
        {isVoted ? "Votado (Cancelar)" : "Votar"}
      </Button>
      <Button
        size={size} 
        variant={isFavorited ? "default" : "outline"}
        onClick={handleFavorite}
        disabled={loading || !userId}
        className={cn(size === 'lg' && "px-6")}
      >
        <Heart 
          className={cn(size === 'sm' ? "h-4 w-4" : "h-5 w-5", isFavorited && "fill-current")} 
        />
      </Button>
    </div>
  )
}