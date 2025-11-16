// components/beer-actions-client.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Heart, Star } from "lucide-react"
import Link from "next/link" // ✅ Importação adicionada
import type { CervejaComDetalhes } from "@/lib/types"

interface BeerActionsClientProps {
  cerveja: CervejaComDetalhes
  userId?: string
  size?: "sm" | "default"
}

export function BeerActionsClient({ cerveja, userId, size = "default" }: BeerActionsClientProps) {
  const [isVoted, setIsVoted] = useState(cerveja.user_voto || false)
  const [isFavorited, setIsFavorited] = useState(cerveja.user_favorito || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async () => {
    if (!userId || isLoading) return
    
    setIsLoading(true)
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsVoted(!isVoted)
      // Aqui você faria a chamada real à API
      console.log('Votar/Desvotar:', cerveja.uuid)
    } catch (error) {
      console.error('Erro ao votar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!userId || isLoading) return
    
    setIsLoading(true)
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsFavorited(!isFavorited)
      // Aqui você faria a chamada real à API
      console.log('Favoritar/Desfavoritar:', cerveja.uuid)
    } catch (error) {
      console.error('Erro ao favoritar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSize = size === "sm" ? "sm" : "default"
  const iconSize = size === "sm" ? 16 : 20

  if (!userId) {
    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">
          Faça login para interagir
        </p>
        <Button size={buttonSize} asChild variant="outline" className="w-full">
          <Link href="/auth/login">Fazer Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size={buttonSize}
        variant={isVoted ? "default" : "outline"}
        onClick={handleVote}
        disabled={isLoading}
        className="flex-1"
      >
        <Star 
          className={`mr-2 ${isVoted ? 'fill-yellow-500 text-yellow-500' : ''}`} 
          size={iconSize} 
        />
        {isVoted ? 'Votado' : 'Votar'}
      </Button>
      
      <Button
        size={buttonSize}
        variant={isFavorited ? "default" : "outline"}
        onClick={handleFavorite}
        disabled={isLoading}
        className="flex-1"
      >
        <Heart 
          className={`mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
          size={iconSize} 
        />
        {isFavorited ? 'Favorito' : 'Favoritar'}
      </Button>
    </div>
  )
}