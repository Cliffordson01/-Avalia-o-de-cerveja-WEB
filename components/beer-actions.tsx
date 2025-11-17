// components/beer-actions.tsx - VERSÃO CORRIGIDA HYDRAÇÃO
"use client"

import { useState, useEffect } from "react"
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
  const [isVoted, setIsVoted] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState<'vote' | 'favorite' | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  // ✅ CORREÇÃO: Sincronizar estado apenas após montagem
  useEffect(() => {
    setIsMounted(true)
    setIsVoted(cerveja.user_voto || false)
    setIsFavorited(cerveja.user_favorito || false)
  }, [cerveja.user_voto, cerveja.user_favorito])

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
          .update({ 
            deletado: true,
            status: false 
          })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)
          .eq("deletado", false)

        if (error) {
          console.error("Erro ao remover voto:", error)
          if (error.code === '42501') {
            toast.error("Sem permissão para remover voto")
            return
          }
          throw error
        }
        
        setIsVoted(false)
        toast.success("Voto removido!")
      } else {
        // Adicionar voto
        const { data, error } = await supabase
          .from("voto")
          .insert({
            usuario_id: userId,
            cerveja_id: cerveja.uuid,
            quantidade: 1,
            status: true,
            deletado: false
          })
          .select()
          .single()

        if (error) {
          console.error("Erro ao adicionar voto:", error)
          
          if (error.code === '42501') {
            toast.error("Faça login para votar")
            router.push("/login")
            return
          }
          
          if (error.code === '23505') {
            const { error: updateError } = await supabase
              .from("voto")
              .update({ 
                deletado: false,
                status: true 
              })
              .eq("usuario_id", userId)
              .eq("cerveja_id", cerveja.uuid)

            if (updateError) {
              console.error("Erro ao reativar voto:", updateError)
              throw updateError
            }
          } else {
            throw error
          }
        }
        
        setIsVoted(true)
        toast.success("Voto registrado!")
      }
    } catch (error: any) {
      console.error("Erro completo ao votar:", error)
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
          .update({ 
            deletado: true,
            status: false 
          })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cerveja.uuid)
          .eq("deletado", false)

        if (error) {
          console.error("Erro ao remover favorito:", error)
          if (error.code === '42501') {
            toast.error("Sem permissão para remover favorito")
            return
          }
          throw error
        }
        
        setIsFavorited(false)
        toast.success("Removido dos favoritos!")
      } else {
        // Adicionar favorito
        const { data, error } = await supabase
          .from("favorito")
          .insert({
            usuario_id: userId,
            cerveja_id: cerveja.uuid,
            status: true,
            deletado: false
          })
          .select()
          .single()

        if (error) {
          console.error("Erro ao adicionar favorito:", error)
          
          if (error.code === '42501') {
            toast.error("Faça login para favoritar")
            router.push("/login")
            return
          }
          
          if (error.code === '23505') {
            const { error: updateError } = await supabase
              .from("favorito")
              .update({ 
                deletado: false,
                status: true 
              })
              .eq("usuario_id", userId)
              .eq("cerveja_id", cerveja.uuid)

            if (updateError) {
              console.error("Erro ao reativar favorito:", updateError)
              throw updateError
            }
          } else {
            throw error
          }
        }
        
        setIsFavorited(true)
        toast.success("Adicionado aos favoritos!")
      }
    } catch (error: any) {
      console.error("Erro completo ao favoritar:", error)
      toast.error("Erro ao processar favorito")
    } finally {
      setLoading(null)
    }
  }

  // ✅ CORREÇÃO: Renderizar estado neutro durante SSR
  if (!isMounted) {
    return (
      <div className="flex gap-2">
        <Button
          size={size}
          variant="outline"
          className="flex-1"
          disabled
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Votar
        </Button>
        
        <Button
          size={size}
          variant="outline"
          className="px-3"
          disabled
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {/* Botão de Votar */}
      <Button
        size={size}
        variant={isVoted ? "default" : "outline"}
        className={`flex-1 transition-all duration-300 ${
          isVoted ? 'bg-green-600 hover:bg-green-700' : ''
        }`}
        onClick={handleVote}
        disabled={loading === 'vote'}
      >
        <TrendingUp className={`h-4 w-4 mr-1 ${loading === 'vote' ? 'animate-pulse' : ''}`} />
        {loading === 'vote' ? "..." : (isVoted ? "Votado" : "Votar")}
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