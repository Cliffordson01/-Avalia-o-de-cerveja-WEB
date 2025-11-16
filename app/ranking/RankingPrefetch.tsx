// components/ranking/RankingPrefetch.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RankingPrefetch() {
  const router = useRouter()

  useEffect(() => {
    // Prefetch das top 3 cervejas quando o usuário estiver no ranking
    const topBeers = ['uuid-1', 'uuid-2', 'uuid-3'] // Substitua pelos IDs reais
    
    topBeers.forEach(beerId => {
      router.prefetch(`/cerveja/${beerId}`)
    })
  }, [router])

  return null
}