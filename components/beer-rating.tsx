// components/beer-rating.tsx - CORRIGIDO PARA REMOVER COMPLETAMENTE
"use client"

import { useState, useEffect } from "react"
import { Star, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { cn } from "@/lib/utils"

interface BeerRatingProps {
  cervejaId: string
  userId?: string
  currentRating: number | null
}

export function BeerRating({ cervejaId, userId, currentRating }: BeerRatingProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { requireAuth } = useAuthRedirect()
  const supabase = getSupabaseBrowserClient()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)

  // Sincronizar o rating com currentRating quando mudar
  useEffect(() => {
    setRating(currentRating || 0)
  }, [currentRating])

  const handleRating = async (stars: number) => {
    if (!requireAuth("avaliar")) return

    setLoading(true)

    try {
      // Se clicar na mesma estrela que já está selecionada, remove COMPLETAMENTE a avaliação
      const isRemovingRating = rating === stars

      if (isRemovingRating) {
        // REMOVER AVALIAÇÃO COMPLETAMENTE
        const { error } = await supabase
          .from("avaliacao")
          .delete()
          .eq("usuario_id", userId)
          .eq("cerveja_id", cervejaId)

        if (error) throw error

        // IMPORTANTE: Resetar para 0 para garantir que todas as estrelas fiquem vazias
        setRating(0)
        setHoverRating(0) // Também resetar o hover
        
        toast({
          title: "Avaliação removida!",
          description: "Sua avaliação foi removida com sucesso.",
        })
      } else {
        // MUDAR/ADICIONAR AVALIAÇÃO
        if (currentRating) {
          // Já existe uma avaliação - atualizar
          const { error } = await supabase
            .from("avaliacao")
            .update({ estrelas: stars })
            .eq("usuario_id", userId)
            .eq("cerveja_id", cervejaId)

          if (error) throw error
        } else {
          // Nova avaliação - inserir
          const { error } = await supabase.from("avaliacao").insert({
            usuario_id: userId,
            cerveja_id: cervejaId,
            estrelas: stars,
          })

          if (error) throw error
        }

        setRating(stars)
        toast({
          title: "Avaliação registrada!",
          description: `Você avaliou com ${stars} estrela${stars > 1 ? "s" : ""}.`,
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRating = async () => {
    if (!requireAuth("remover avaliação")) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from("avaliacao")
        .delete()
        .eq("usuario_id", userId)
        .eq("cerveja_id", cervejaId)

      if (error) throw error

      // IMPORTANTE: Resetar COMPLETAMENTE para garantir que todas as estrelas fiquem vazias
      setRating(0)
      setHoverRating(0)
      
      toast({
        title: "Avaliação removida!",
        description: "Sua avaliação foi removida com sucesso.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para determinar se uma estrela deve estar preenchida
  const isStarFilled = (star: number): boolean => {
    // Se não há rating e não há hover, estrela vazia
    if (rating === 0 && hoverRating === 0) return false
    
    // Se há hover, mostrar baseado no hover
    if (hoverRating > 0) return star <= hoverRating
    
    // Se não há hover, mostrar baseado no rating atual
    return star <= rating
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Sua Avaliação</h3>
          {rating > 0 && (
            <button
              onClick={handleRemoveRating}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
              Remover
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={loading}
              className="transition-transform hover:scale-110 disabled:cursor-not-allowed relative group"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  isStarFilled(star)
                    ? "fill-primary text-primary" 
                    : "text-muted-foreground",
                )}
              />
              
              {/* Tooltip para indicar que pode remover */}
              {rating === star && rating > 0 && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Clique para remover
                </div>
              )}
            </button>
          ))}
          
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} estrela{rating > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Instrução para usuários não logados */}
        {!userId && (
          <p className="mt-3 text-sm text-muted-foreground">
            Faça login para avaliar esta cerveja
          </p>
        )}

        {/* Instrução de uso */}
        {userId && rating === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Clique em uma estrela para avaliar
          </p>
        )}
        {userId && rating > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Clique na mesma estrela para remover sua avaliação
          </p>
        )}

        {/* DEBUG: Mostrar estado atual (pode remover depois) */}
        {/* <div className="mt-2 text-xs text-gray-500">
          Rating: {rating} | Hover: {hoverRating} | Current: {currentRating}
        </div> */}
      </CardContent>
    </Card>
  )
}