// app/auth/callback/route.ts - APENAS para confirmação de email
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  console.log('🔐 === CALLBACK CONFIRMAÇÃO DE EMAIL ===')
  
  const requestUrl = new URL(request.url)
  
  // Verifica se é uma confirmação de email (tem token)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('📧 Tipo de callback:', type)
  console.log('🔑 Token presente:', !!token_hash)

  // Se for confirmação de email
  if (type === 'email' && token_hash) {
    try {
      console.log('🔄 Processando confirmação de email...')
      
      // Cliente Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        }
      )
      
      // Verifica o token de confirmação
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      })

      if (error) {
        console.error('❌ Erro na verificação do email:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=email_verification_failed`)
      }

      console.log('✅ Email confirmado com sucesso:', data.user?.email)
      
      // Redireciona para login com mensagem de sucesso
      return NextResponse.redirect(`${requestUrl.origin}/login?message=email_verified`)

    } catch (error: any) {
      console.error('💥 Erro inesperado no callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=verification_error`)
    }
  }

  // Se não for um callback reconhecido, redireciona para login
  console.log('⚠️ Callback não reconhecido, redirecionando...')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}