// components/beer-card-minimal.tsx
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { CervejaComDetalhes } from "@/lib/types"
import { getBeerImageUrl } from "@/lib/utils"
import Image from 'next/image'

interface BeerCardMinimalProps {
  cerveja: CervejaComDetalhes
  userId?: string 
  showActions?: boolean
  priority?: boolean
}

export function BeerCardMinimal({ cerveja, userId, showActions = true, priority = false }: BeerCardMinimalProps) {
  const beerImageUrl = getBeerImageUrl(cerveja.imagem_url || cerveja.imagem_main || '')

  return (
    <Card className="border-2 border-border/50">
      <Link href={`/cerveja/${cerveja.uuid}`}>
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={beerImageUrl || "/placeholder-beer.png"}
            alt={cerveja.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/cerveja/${cerveja.uuid}`}>
          <h3 className="font-bebas text-xl leading-tight mb-2">
            {cerveja.nome}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-sm">
          {cerveja.marca}
        </p>
      </CardContent>
    </Card>
  )
}