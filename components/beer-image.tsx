// components/beer-image.tsx - CORRIGIDO
"use client"

import { useState } from 'react'
import { getBeerImageUrl } from "@/lib/utils"
import type { Cerveja } from "@/lib/types"

interface BeerImageProps {
  cerveja: Cerveja;
  priority?: boolean;
}

export default function BeerImage({ cerveja, priority = false }: BeerImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const imageUrl = getBeerImageUrl(cerveja.imagem_url || cerveja.imagem_main)

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-amber-800">
      {loading && (
        <div className="absolute inset-0 bg-amber-700 animate-pulse z-10" />
      )}
      
      <img
        src={imageUrl}
        alt={`Cerveja ${cerveja.nome}`}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
      />
      
      {error && (
        <div className="absolute inset-0 bg-amber-800 flex items-center justify-center">
          <span className="text-amber-200 text-sm">🍺</span>
        </div>
      )}
    </div>
  )
}