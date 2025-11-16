// components/beer-card-client.tsx
"use client"

import { BeerCardSafe } from "./beer-card-safe"
import type { CervejaComDetalhes } from "@/lib/types"

interface BeerCardClientProps {
  cerveja: CervejaComDetalhes
  userId?: string 
  showActions?: boolean
  priority?: boolean
}

export function BeerCardClient({ 
  cerveja, 
  userId, 
  showActions = true, 
  priority = false 
}: BeerCardClientProps) {
  return (
    <BeerCardSafe 
      cerveja={cerveja}
      userId={userId}
      showActions={showActions}
      priority={priority}
    />
  )
}