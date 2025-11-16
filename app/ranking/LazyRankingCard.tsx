"use client"

import React, { useState, useCallback } from "react"
import { Crown, Award, Medal, Star, TrendingUp, Heart, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

interface Beer {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  ativo: boolean
  criado_em: string
}

interface Ranking {
  uuid: string
  cerveja_id: string
  posicao?: number | null
  media_avaliacao?: number | null
  total_votos?: number | null
  total_favoritos?: number | null
  total_comentarios?: number | null
  criado_em: string
  cerveja: Beer
  selo?: any[]
}

interface LazyRankingCardProps {
  ranking: Ranking
  index: number
}

const LazyRankingCard = React.memo(({ ranking, index }: LazyRankingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const isTopThree = ranking.posicao && ranking.posicao <= 3
  
  const getBeerImageUrl = useCallback((imageName: string | null | undefined): string => {
    if (!imageName) return "/placeholder.svg"
    if (imageName.startsWith("http")) return imageName
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/beer-images/${imageName}`
  }, [])

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }, [])

  const getSeloImageUrl = useCallback((posicao: number): string => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) return ''
    
    if (posicao === 1) return `${baseUrl}/storage/v1/object/public/selos/ouro.png`
    if (posicao === 2) return `${baseUrl}/storage/v1/object/public/selos/prata.png`
    if (posicao === 3) return `${baseUrl}/storage/v1/object/public/selos/bronze.png`
    return ''
  }, [])

  const seloImageUrl = ranking.posicao && ranking.posicao <= 3 ? getSeloImageUrl(ranking.posicao) : null

  return (
    <Link href={`/cerveja/${ranking.cerveja.uuid}`} className="block">
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            {/* Posição */}
            <div className="relative shrink-0">
              <div className={`
                flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl font-bebas text-xl sm:text-2xl font-bold
                shadow-md border-2 transition-transform duration-200 group-hover:scale-105
                ${isTopThree 
                  ? ranking.posicao === 1 
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-300" 
                    : ranking.posicao === 2
                    ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white border-gray-300"
                    : "bg-gradient-to-br from-amber-600 to-amber-800 text-white border-amber-400"
                  : "bg-muted text-muted-foreground border-border"
                }
              `}>
                {ranking.posicao || index + 1}
              </div>
              
              {/* Selo para Top 3 */}
              {seloImageUrl && (
                <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 z-10">
                  <div className="relative h-8 w-8 sm:h-10 sm:w-10">
                    <Image
                      src={seloImageUrl}
                      alt={`Top ${ranking.posicao}`}
                      fill
                      className="object-contain drop-shadow-lg"
                      sizes="40px"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {isTopThree && (
                <div className="absolute -left-1 -bottom-1">
                  {ranking.posicao === 1 && <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />}
                  {ranking.posicao === 2 && <Award className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />}
                  {ranking.posicao === 3 && <Medal className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />}
                </div>
              )}
            </div>

            {/* Imagem da Cerveja com Lazy Loading */}
            <div className="relative h-16 w-12 sm:h-20 sm:w-16 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-muted shadow-sm">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
              )}
              <Image
                src={getBeerImageUrl(ranking.cerveja.imagem_main)}
                alt={ranking.cerveja.nome}
                fill
                className={`object-cover transition-all duration-200 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                sizes="64px"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>

            {/* Informações da Cerveja */}
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg sm:text-xl text-foreground truncate">
                  {ranking.cerveja.nome}
                </h3>
                {isTopThree && (
                  <Badge className={`
                    text-xs font-bold px-2 py-0.5 border
                    ${ranking.posicao === 1 ? "bg-yellow-500 text-white border-yellow-600" :
                      ranking.posicao === 2 ? "bg-gray-500 text-white border-gray-600" :
                      "bg-amber-600 text-white border-amber-700"}
                  `}>
                    TOP {ranking.posicao}
                  </Badge>
                )}
              </div>
              <p className="mb-2 text-sm sm:text-base text-muted-foreground truncate font-medium">
                {ranking.cerveja.marca}
              </p>

              {/* Estatísticas Compactas */}
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{Number(ranking.media_avaliacao ?? 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="font-semibold">{formatNumber(Number(ranking.total_votos ?? 0))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  <span className="font-semibold">{formatNumber(Number(ranking.total_favoritos ?? 0))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="font-semibold">{formatNumber(Number(ranking.total_comentarios ?? 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

LazyRankingCard.displayName = 'LazyRankingCard'

export default LazyRankingCard