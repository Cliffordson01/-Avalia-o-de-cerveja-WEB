// components/optimized-beer-card-wrapper.tsx
"use client"

import dynamic from 'next/dynamic'
import type { CervejaComDetalhes } from "@/lib/types"

// Carregamento dinâmico com fallback
const OptimizedBeerCard = dynamic(
  () => import('./optimized-beer-card').then(mod => mod.OptimizedBeerCard),
  {
    ssr: false,
    loading: () => <BeerCardSkeleton />
  }
)

// Skeleton para loading
function BeerCardSkeleton() {
  return (
    <div className="animate-pulse border-2 border-border/50 bg-card/50 rounded-lg overflow-hidden">
      <div className="aspect-[4/5] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface OptimizedBeerCardWrapperProps {
  cerveja: CervejaComDetalhes
  userId?: string 
  showActions?: boolean
  priority?: boolean
}

export function OptimizedBeerCardWrapper({
  cerveja,
  userId,
  showActions = true,
  priority = false
}: OptimizedBeerCardWrapperProps) {
  return (
    <OptimizedBeerCard 
      cerveja={cerveja}
      userId={userId}
      showActions={showActions}
      priority={priority}
    />
  )
}