// app/layout.tsx - CORRIGIDO
import type React from "react"
import type { Metadata } from "next"
import { Inter, Bebas_Neue, Cinzel } from "next/font/google" 
import "./globals.css"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/contexts/AuthContext"
import { ThemeProvider } from "@/components/providers/theme-provider"

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap'
})

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: 'swap'
})

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: 'swap'
})

export const metadata: Metadata = {
  title: "TopBreja - Vote nas Melhores Cervejas Artesanais",
  description: "Descubra, vote e avalie as melhores cervejas artesanais do Brasil. Participe da comunidade TopBreja!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/cerveja.png" type="image/x-icon" />
        {/* ✅ REMOVIDO preload da imagem que não existe */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f5c044" />
      </head>
      <body className={`font-sans antialiased theme-transition ${inter.variable} ${bebasNeue.variable} ${cinzel.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}