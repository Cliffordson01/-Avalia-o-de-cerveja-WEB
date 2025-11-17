// components/beer-actions.tsx - VERSÃO COMPLETA E FUNCIONAL
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TrendingUp, Heart } from "lucide-react"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface BeerActionsProps {
  cerveja: {
    uuid: string
    user_voto?: boolean
    user_favorito?: boolean
  }
  userId?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BeerActions({ cerveja, userId, size = "sm" }: BeerActionsProps) {
  const [isVoted, setIsVoted] = useState(cerveja.user_voto || false)
  const [isFavorited, setIsFavorited] = useState(cerveja.user_favorito || false)
  const [loading, setLoading] = useState<'vote' | 'favorite' | null>(null)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleVote = async () => {
    if (!userId) {
      router.push("/login")
      return
    }

    setLoading('vote')
    try {
      if (isVoted) {
        // Remover voto
        const { error } = await supabase
          .from("voto")
          .update({ deletado: true })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)

        if (error) throw error
        
        setIsVoted(false)
        toast.success("Voto removido!")
      } else {
        // Adicionar voto
        const { error } = await supabase
          .from("voto")
          .upsert({
            usuario_id: userId,
            cerveja_id: cerveja.uuid,
            quantidade: 1,
            status: true,
            deletado: false
          }, {
            onConflict: 'usuario_id,cerveja_id'
          })

        if (error) throw error
        
        setIsVoted(true)
        toast.success("Voto registrado!")
      }
    } catch (error) {
      console.error("Erro ao votar:", error)
      toast.error("Erro ao processar voto")
    } finally {
      setLoading(null)
    }
  }

  const handleFavorite = async () => {
    if (!userId) {
      router.push("/login")
      return
    }

    setLoading('favorite')
    try {
      if (isFavorited) {
        // Remover favorito
        const { error } = await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)

        if (error) throw error
        
        setIsFavorited(false)
        toast.success("Removido dos favoritos!")
      } else {
        // Adicionar favorito
        const { error } = await supabase
          .from("favorito")
          .upsert({
            usuario_id: userId,
            cerveja_id: cerveja.uuid,
            status: true,
            deletado: false
          }, {
            onConflict: 'usuario_id,cerveja_id'
          })

        if (error) throw error
        
        setIsFavorited(true)
        toast.success("Adicionado aos favoritos!")
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error)
      toast.error("Erro ao processar favorito")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Botão de Votar */}
      <Button
        size={size}
        variant={isVoted ? "default" : "outline"}
        className="flex-1 transition-all duration-300"
        onClick={handleVote}
        disabled={loading === 'vote'}
      >
        <TrendingUp className={`h-4 w-4 mr-1 ${loading === 'vote' ? 'animate-pulse' : ''}`} />
        {loading === 'vote' ? "Processando..." : (isVoted ? "Votado" : "Votar")}
      </Button>
      
      {/* Botão de Favoritar */}
      <Button
        size={size}
        variant={isFavorited ? "default" : "outline"}
        className={`px-3 transition-all duration-300 ${
          isFavorited ? 'bg-red-500 hover:bg-red-600 text-white' : ''
        }`}
        onClick={handleFavorite}
        disabled={loading === 'favorite'}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""} ${loading === 'favorite' ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  )
}