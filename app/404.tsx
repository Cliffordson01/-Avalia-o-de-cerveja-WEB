// app/404.tsx - SE EXISTIR, VERIFIQUE SE ESTÁ ASSIM
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Beer, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-orange-800">
      <div className="text-center text-white">
        <Beer className="h-16 w-16 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">404 - Página Não Encontrada</h1>
        <p className="text-xl mb-8">A cerveja que você procura não está no barril!</p>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar para Home
          </Link>
        </Button>
      </div>
    </div>
  )
}