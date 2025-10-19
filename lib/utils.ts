import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBeerImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return "/amber-beer-bottle.png"
  }

  // If it's already a full URL, return it
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }

  // Get Supabase URL - works on both client and server
  // On the client, we need to use the NEXT_PUBLIC_ prefixed variable
  const supabaseUrl =
    typeof window !== "undefined"
      ? process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || ""
      : process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""

  if (!supabaseUrl) {
    console.warn("[v0] Supabase URL not found, using placeholder image")
    return "/amber-beer-bottle.png"
  }

  // Construct the public URL for the beer-images bucket
  return `${supabaseUrl}/storage/v1/object/public/beer-images/${imagePath}`
}
