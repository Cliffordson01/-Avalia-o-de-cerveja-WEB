// components/beer-actions.tsx - VERSÃO SIMPLES
"use client"

import { Button } from "@/components/ui/button"
import { TrendingUp, Heart } from "lucide-react"

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
  const isVoted = cerveja.user_voto || false
  const isFavorited = cerveja.user_favorito || false

  return (
    <div className="flex gap-2">
      <Button
        size="sm" 
        variant={isVoted ? "default" : "outline"}
        className="flex-1"
      >
        <TrendingUp className="h-4 w-4 mr-1" />
        {isVoted ? "Votado" : "Votar"}
      </Button>
      
      <Button
        size="sm" 
        variant={isFavorited ? "default" : "outline"}
        className="px-3"
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      </Button>
    </div>
  )
}