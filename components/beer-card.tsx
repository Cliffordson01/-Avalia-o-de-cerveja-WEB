// components/beer-card.tsx (CORRIGIDO)
"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MessageCircle, TrendingUp, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CervejaComDetalhes, Selo, Ranking } from "@/lib/types"
import { cn, getBeerImageUrl } from "@/lib/utils"
import { BeerActions } from "@/components/beer-actions" 

interface BeerCardProps {
  cerveja: CervejaComDetalhes
  userId?: string 
  showActions?: boolean
}

// Interface extendida para o selo
interface SeloComImagem extends Selo {
  tipo_selo?: string
  imagem_url?: string
}

// Interface para os dados de ranking
interface RankingData {
  media_avaliacao: number
  total_votos: number
  total_comentarios: number
  total_favoritos: number
  posicao?: number | null
}

export function BeerCard({ cerveja, userId, showActions = true }: BeerCardProps) {
  // CORREÇÃO: Garantir que rankingData seja um objeto, não array
  const rankingData = cerveja.ranking && !Array.isArray(cerveja.ranking) 
    ? cerveja.ranking as RankingData
    : (cerveja.ranking && Array.isArray(cerveja.ranking) && cerveja.ranking.length > 0 
        ? cerveja.ranking[0] as RankingData 
        : null)

  // CORREÇÃO: Garantir que selo seja um objeto, não array
  const selo = cerveja.selo && !Array.isArray(cerveja.selo) 
    ? cerveja.selo as SeloComImagem 
    : (cerveja.selo && Array.isArray(cerveja.selo) && cerveja.selo.length > 0 
        ? cerveja.selo[0] as SeloComImagem 
        : undefined)

  // Dados padrão para quando não há ranking
  const defaultRankingData: RankingData = {
    media_avaliacao: 0,
    total_votos: 0,
    total_comentarios: 0,
    total_favoritos: 0,
    posicao: null
  }

  // Usar dados reais se existirem, senão usar os padrões
  const displayData = rankingData || defaultRankingData

  // URLs dos selos no Supabase Storage
  const getSeloImageUrl = (posicao: number) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) return '';
    
    if (posicao === 1) return `${baseUrl}/storage/v1/object/public/selos/ouro.png`;
    if (posicao === 2) return `${baseUrl}/storage/v1/object/public/selos/prata.png`;
    if (posicao === 3) return `${baseUrl}/storage/v1/object/public/selos/bronze.png`;
    return '';
  }

  // Função para renderizar o selo baseado na posição ou tipo
  const renderSelo = () => {
    const posicao = displayData.posicao;
    const seloImageUrl = posicao && posicao <= 3 ? getSeloImageUrl(posicao) : null;
    
    // Selo por posição (Top 1, Top 2, Top 3) - USANDO IMAGENS DO STORAGE
    if (posicao && posicao <= 3 && seloImageUrl) {
      return (
        <div className="absolute left-3 top-3 z-10">
          <div className="relative h-16 w-16">
            <Image
              src={seloImageUrl}
              alt={`Top ${posicao}`}
              fill
              className="object-contain drop-shadow-lg"
              onError={(e) => {
                // Fallback para badge se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      );
    }

    // Fallback: Selo por tipo (Ouro, Prata, Bronze, Empatado) como badge
    const tipoSelo = selo?.tipo_selo || '';
    if (tipoSelo) {
      return (
        <Badge 
          className={cn("absolute left-3 top-3 z-10 font-semibold", 
            tipoSelo === "ouro" && "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg",
            tipoSelo === "prata" && "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg", 
            tipoSelo === "bronze" && "bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-lg",
            tipoSelo === "empatado" && "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
            !["ouro", "prata", "bronze", "empatado"].includes(tipoSelo) && "bg-gradient-to-r from-red-500 to-blue-600 text-white shadow-lg"
          )}
        >
          {tipoSelo === "ouro" && "🥇 Ouro"}
          {tipoSelo === "prata" && "🥈 Prata"}
          {tipoSelo === "bronze" && "🥉 Bronze"}
          {tipoSelo === "empatado" && "🤝 Empatado"}
          {!["ouro", "prata", "bronze", "empatado"].includes(tipoSelo) && `🏆 ${tipoSelo}`}
        </Badge>
      );
    }

    return null;
  }

  // Formatar números para exibição (1K, 1M, etc)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  return (
    <Card className="beer-card group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* SELO */}
      {renderSelo()}

      <Link href={`/cerveja/${cerveja.uuid}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={getBeerImageUrl(cerveja.imagem_url || cerveja.imagem_main) || "/placeholder.svg"}
            alt={cerveja.nome}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/cerveja/${cerveja.uuid}`}>
          <h3 className="mb-1 font-semibold text-lg leading-tight text-balance transition-colors group-hover:text-primary line-clamp-2">
            {cerveja.nome}
          </h3>
        </Link>
        <p className="mb-2 text-sm text-muted-foreground line-clamp-1">{cerveja.marca}</p>

        {/* INFORMAÇÕES SEMPRE VISÍVEIS - COM NÚMEROS REAIS */}
        <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
            <span className="font-medium">{displayData.media_avaliacao.toFixed(1)}</span>
            <span className="text-xs">avaliação</span>
          </div>
          
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="font-medium">{formatNumber(displayData.total_votos)}</span>
            <span className="text-xs">votos</span> 
          </div>
          
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{formatNumber(displayData.total_comentarios)}</span>
            <span className="text-xs">comentários</span>
          </div>

          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 shrink-0" />
            <span className="font-medium">{formatNumber(displayData.total_favoritos)}</span>
            <span className="text-xs">favoritos</span>
          </div>
        </div>

        {showActions && (
          <BeerActions cerveja={cerveja} userId={userId} size="sm" />
        )}
      </CardContent>
    </Card>
  )
}