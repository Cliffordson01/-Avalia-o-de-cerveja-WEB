// components/home-page-error.tsx - CLIENT COMPONENT SEPARADO
"use client"

import { Button } from "@/components/ui/button"
import { Beer, RefreshCw } from "lucide-react"

export function HomePageError({ message = "Erro ao carregar a página" }: { message?: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Beer className="h-16 w-16 mx-auto mb-4 text-amber-500" />
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
      <p className="text-gray-600 mb-8">
        Tente recarregar a página ou verificar sua conexão.
      </p>
      <Button onClick={() => window.location.reload()} className="flex items-center gap-2 mx-auto">
        <RefreshCw className="h-4 w-4" />
        Recarregar Página
      </Button>
    </div>
  )
}