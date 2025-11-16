// app/middleware.ts - SIMPLIFICADO SEM OAUTH
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Middleware mínimo - sem verificações de auth complexas
  const response = NextResponse.next()
  return response
}

export const config = {
  matcher: [
    // Protege apenas rotas específicas se necessário
    '/dashboard/:path*',
    '/perfil/:path*',
  ],
}