// components/optimized/BeerImage.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

interface BeerImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export default function BeerImage({ src, alt, width = 128, height = 128, className = '' }: BeerImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const optimizedSrc = src?.includes('supabase.co') 
    ? `${src}?width=${width}&height=${height}&quality=75&format=webp`
    : src

  return (
    <div className={`relative bg-gray-200 rounded-lg overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse" />
      )}
      <Image
        src={error ? '/beer-placeholder.jpg' : optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        quality={75}
      />
    </div>
  )
}