// components/beer-card.tsx - ADAPTADO PARA TEMAS
"use client"

import Link from "next/link"
import { Star, MessageCircle, TrendingUp, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { CervejaComDetalhes } from "@/lib/types"
import { getBeerImageUrl } from "@/lib/utils"
import { BeerActions } from "@/components/beer-actions"
import { CustomImage } from "@/components/custom-image"

interface BeerCardProps {
  cerveja: CervejaComDetalhes
  userId?: string 
  showActions?: boolean
  priority?: boolean
}

export function BeerCard({ cerveja, userId, showActions = true, priority = false }: BeerCardProps) {
  const rankingData = cerveja.ranking && !Array.isArray(cerveja.ranking) 
    ? cerveja.ranking
    : (cerveja.ranking && Array.isArray(cerveja.ranking) && cerveja.ranking.length > 0 
        ? cerveja.ranking[0] 
        : null)

  const displayData = rankingData || {
    media_avaliacao: 0,
    total_votos: 0,
    total_favoritos: 0,
    total_comentarios: 0,
    posicao: null
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // URLs dos selos no Supabase Storage
  const getSeloImage = () => {
    const posicao = displayData.posicao
    if (!posicao || posicao > 3) return null

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) return null

    switch (posicao) {
      case 1:
        return `${baseUrl}/storage/v1/object/public/selos/ouro.png`
      case 2:
        return `${baseUrl}/storage/v1/object/public/selos/prata.png`
      case 3:
        return `${baseUrl}/storage/v1/object/public/selos/bronze.png`
      default:
        return null
    }
  }

  const seloImageUrl = getSeloImage()
  const beerImageUrl = getBeerImageUrl(cerveja.imagem_url || cerveja.imagem_main)

  return (
    <Card className="group relative overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]">
      {/* Efeito de brilho hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Selo de Ranking */}
      {seloImageUrl && (
        <div className="absolute top-2 right-2 z-10">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14">
            <CustomImage
              src={seloImageUrl}
              alt={`Selo ${displayData.posicao}º lugar`}
              className="object-contain drop-shadow-lg"
              priority={priority}
            />
          </div>
        </div>
      )}

      <Link href={`/cerveja/${cerveja.uuid}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted to-muted/80">
          <CustomImage
            src={beerImageUrl || "/placeholder-beer.png"}
            alt={cerveja.nome}
            className="transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
            fill
            priority={priority}
          />
          
          {/* Overlay gradiente adaptável ao tema */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        </div>
      </Link>

      <CardContent className="p-3 sm:p-4 relative z-10">
        <Link href={`/cerveja/${cerveja.uuid}`}>
          <h3 className="mb-1 sm:mb-2 font-bebas text-lg sm:text-xl leading-tight text-card-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 tracking-wide">
            {cerveja.nome}
          </h3>
        </Link>
        
        <p className="mb-2 sm:mb-3 text-muted-foreground text-xs sm:text-sm font-semibold line-clamp-1">
          {cerveja.marca}
        </p>

        {/* Rating com destaque */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3 p-1 sm:p-2 bg-accent/30 rounded-lg">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-bold text-accent-foreground text-xs sm:text-sm">
              {displayData.media_avaliacao.toFixed(1)}
            </span>
          </div>
          <div className="h-2 sm:h-3 w-px bg-border/50"></div>
          <span className="text-xs text-muted-foreground">
            {formatNumber(displayData.total_votos)} avaliações
          </span>
        </div>

        {/* Estatísticas em grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4">
          <div className="text-center p-1 sm:p-2 bg-accent/20 rounded-lg">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto mb-1" />
            <div className="text-xs text-accent-foreground font-semibold">
              {formatNumber(displayData.total_votos)}
            </div>
            <div className="text-[10px] sm:text-[10px] text-muted-foreground">Votos</div>
          </div>
          
          <div className="text-center p-1 sm:p-2 bg-accent/20 rounded-lg">
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-xs text-accent-foreground font-semibold">
              {formatNumber(displayData.total_comentarios)}
            </div>
            <div className="text-[10px] sm:text-[10px] text-muted-foreground">Coment.</div>
          </div>

          <div className="text-center p-1 sm:p-2 bg-accent/20 rounded-lg">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mx-auto mb-1" />
            <div className="text-xs text-accent-foreground font-semibold">
              {formatNumber(displayData.total_favoritos)}
            </div>
            <div className="text-[10px] sm:text-[10px] text-muted-foreground">Favoritos</div>
          </div>
        </div>

        {/* Ações do usuário */}
        {showActions && (
          <div className="border-t border-border/30 pt-2 sm:pt-3">
            <BeerActions 
              cerveja={cerveja} 
              userId={userId} 
              size="sm" 
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}