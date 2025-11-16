// lib/utils.ts - COPIE E COLE ISSO
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBeerImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return "/placeholder-beer.png" // ✅ Use placeholder que existe
  }

  if (imagePath.startsWith("http")) {
    return imagePath
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.warn("Supabase URL não encontrada, usando imagem placeholder")
    return "/placeholder-beer.png" // ✅ Use placeholder que existe
  }

  return `${supabaseUrl}/storage/v1/object/public/beer-images/${imagePath}`
}