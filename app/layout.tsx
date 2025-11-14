// layout.tsx (CORRIGIDO)
import type React from "react"
import type { Metadata } from "next"
import { Inter, Bebas_Neue, Cinzel } from "next/font/google" 
import { Analytics } from "@vercel/analytics/next"
// @ts-ignore - allow importing global CSS without type declarations
import "./globals.css"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
})

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})

export const metadata: Metadata = {
  title: "TopBreja - Vote nas Melhores Cervejas Artesanais",
  description: "Descubra, vote e avalie as melhores cervejas artesanais do Brasil. Participe da comunidade TopBreja!",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="pt-BR" 
      className={`${inter.variable} ${bebasNeue.variable} ${cinzel.variable}`}
    >
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <link rel="shortcut icon" href="cerveja.png" type="image/x-icon" />
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}