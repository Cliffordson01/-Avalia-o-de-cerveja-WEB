"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BeerRatingProps {
  cervejaId: string
  userId?: string
  currentRating: number | null
}

export function BeerRating({ cervejaId, userId, currentRating }: BeerRatingProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [rating, setRating] = useState(currentRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleRating = async (stars: number) => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para avaliar.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setLoading(true)

    try {
      if (currentRating) {
        // Update existing rating
        const { error } = await supabase
          .from("avaliacao")
          .update({ estrelas: stars })
          .eq("usuario_id", userId)
          .eq("cerveja_id", cervejaId)

        if (error) throw error
      } else {
        // Insert new rating
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

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold text-lg">Sua Avaliação</h3>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={loading}
              className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || rating) >= star ? "fill-primary text-primary" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} estrela{rating > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
