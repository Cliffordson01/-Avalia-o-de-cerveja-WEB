// components/custom-image.tsx - CARREGAMENTO IMEDIATO
"use client"

import { useState, useEffect } from 'react'

interface CustomImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  priority?: boolean
}

export function CustomImage({ src, alt, className = '', fill = false, priority = false }: CustomImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    if (!src) {
      setError(true)
      setLoading(false)
      return
    }

    // ✅ CARREGAMENTO IMEDIATO - sem lazy loading
    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setImageSrc(src)
      setLoading(false)
    }
    
    img.onerror = () => {
      setError(true)
      setLoading(false)
      console.error('❌ Erro ao carregar imagem:', src)
    }

    // ✅ Timeout mais curto para prioridade
    if (priority) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⏰ Timeout carregando imagem prioritária:', src)
          setLoading(false) // Para de mostrar loading mesmo se não carregou
        }
      }, 3000) // 3 segundos para imagens prioritárias
      return () => clearTimeout(timeout)
    }

  }, [src, loading, priority])

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      {/* Loading State - Mais sutil */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-700/50 to-amber-800/50 animate-pulse rounded-lg z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Imagem Real - SEMPRE tenta mostrar */}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loading ? 'opacity-30' : 'opacity-100'
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
      />
      
      {/* Error State - Só mostra se realmente deu erro */}
      {error && (
        <div className="absolute inset-0 bg-amber-800/80 flex items-center justify-center rounded-lg z-20">
          <div className="text-amber-200 text-xs text-center p-2">
            <div className="text-lg mb-1">🍺</div>
            <div>Imagem não carregada</div>
          </div>
        </div>
      )}
    </div>
  )
}