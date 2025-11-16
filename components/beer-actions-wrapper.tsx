// components/beer-actions-wrapper.tsx
"use client"

import { BeerActionsClient } from "./beer-actions-client"
import type { CervejaComDetalhes } from "@/lib/types"

interface BeerActionsWrapperProps {
  cerveja: CervejaComDetalhes
  userId?: string
  size?: "sm" | "default"
}

export function BeerActionsWrapper({ cerveja, userId, size = "default" }: BeerActionsWrapperProps) {
  return (
    <BeerActionsClient 
      cerveja={cerveja} 
      userId={userId} 
      size={size} 
    />
  )
}