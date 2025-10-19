import { updateSession } from "./lib/supabase/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Primeiro, atualiza a sessão como você já tem
  let response = await updateSession(request)
  
  // Agora adicionamos a verificação de admin
  const url = request.nextUrl.clone()
  
  // Se está tentando acessar rota admin
  if (url.pathname.startsWith('/admin')) {
    // Criar cliente Supabase para o middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Redirecionar para login se não tem sessão
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    try {
      // Verificar se é admin
      const { data: userData } = await supabase
        .from('usuario')
        .select('role')
        .eq('uuid', session.user.id)
        .single()

      if (userData?.role !== 'admin') {
        // Redirecionar se não é admin
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error)
      // Em caso de erro, redirecionar para não autorizado
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}