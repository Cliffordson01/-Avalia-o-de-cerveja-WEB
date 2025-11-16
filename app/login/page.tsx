"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Beer, Eye, EyeOff, ChevronRight, Award, Users, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome: ""
  })
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const createUserProfile = useCallback(async (userId: string, userEmail: string, userName: string) => {
    try {
      const userData = {
        uuid: userId,
        email: userEmail,
        nome: userName,
        role: "user",
        situacao: "ativo",
        status: true,
        criado_em: new Date().toISOString()
      }

      const { error } = await supabase
        .from("usuario")
        .upsert(userData, { onConflict: 'uuid' })

      if (error) {
        console.warn('Aviso ao criar perfil:', error.message)
      }
    } catch (error) {
      console.warn('Erro inesperado ao criar perfil:', error)
    }
  }, [supabase])

  // Verificar sessão
  useEffect(() => {
    if (!isClient) return

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.push('/')
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      }
    }
    
    checkSession()
  }, [isClient, router, supabase])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive",
      })
      return
    }

    if (isSignUp && formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              nome: formData.nome || formData.email.split("@")[0],
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          await createUserProfile(authData.user.id, formData.email, formData.nome || formData.email.split("@")[0])
        }

        if (authData.session) {
          toast({
            title: "🎉 Cadastro realizado!",
            description: "Bem-vindo à comunidade!",
          })
          router.push("/")
        } else {
          toast({
            title: "📧 Confirme seu email!",
            description: "Enviamos um link de confirmação para seu email. Verifique sua caixa de entrada.",
            duration: 10000,
          })
          setFormData({ email: "", password: "", nome: "" })
          setIsSignUp(false)
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError

        if (authData.user) {
          await createUserProfile(
            authData.user.id,
            authData.user.email!,
            authData.user.user_metadata?.nome || authData.user.email!.split("@")[0]
          )
        }

        toast({
          title: "🍻 Bem-vindo de volta!",
          description: "Login realizado com sucesso.",
        })

        router.push("/")
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error)
      
      let errorMessage = "Ocorreu um erro. Tente novamente."
      switch (error.message) {
        case "Invalid login credentials":
          errorMessage = "Email ou senha incorretos."
          break
        case "Email not confirmed":
          errorMessage = "Confirme seu email antes de fazer login."
          break
        default:
          errorMessage = error.message || "Erro desconhecido."
      }

      toast({
        title: "Erro na autenticação",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setFormData(prev => ({ ...prev, password: "" }))
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-beer-50 via-background to-sky-50 dark:from-gray-900 dark:via-background dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="h-96 bg-card/80 rounded-3xl shadow-2xl border border-border" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beer-50 via-background to-sky-50 dark:from-gray-900 dark:via-background dark:to-gray-800 flex items-center justify-center p-4">
      
      {/* BLOQUEADOR SUPABASE */}
      <style jsx global>{`
        [class*="oauth"],
        [class*="social"], 
        [class*="google"],
        [class*="gitlab"],
        [class*="provider"],
        [data-provider*="google"],
        [data-provider*="gitlab"],
        [data-provider*="oauth"],
        .supabase-auth-ui_ui-button,
        .auth-button,
        .social-login,
        .oauth-provider,
        div:contains('Google'),
        p:contains('Google'),
        span:contains('Google'),
        [class*="continue-with"],
        [class*="alternative"],
        .auth-ui__divider,
        button:not([type="submit"]):not([type="button"]):not([class*="input"]),
        div:contains('Após cadastrar com Google'),
        hr, .divider, [class*="separator"],
        a[href*="google"],
        a[href*="gitlab"],
        a[href*="oauth"]
        {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }

        body * {
          background-image: none !important;
        }
      `}</style>

      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {/* ÍCONE COM CORES DE ALTO CONTRASTE - VISÍVEL EM QUALQUER TEMA */}
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-orange-300">
              <Beer className="h-10 w-10 text-white drop-shadow-md" />
            </div>
          </div>
          
          {/* TÍTULO CORRIGIDO - CORES ESCURAS PARA ALTO CONTRASTE */}
          <h1 className="font-bebas text-5xl tracking-wider bg-gradient-to-r from-red-700 via-orange-600 to-red-800 bg-clip-text text-transparent mb-2 drop-shadow-sm">
            TOPBREJA
          </h1>
          <p className="text-foreground/80 font-light text-lg">
            {isSignUp ? "Junte-se à Elite Cervejeira" : "Sua Jornada Cervejeira"}
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            
            <div className="flex bg-muted rounded-2xl p-1 mb-8">
              <button 
                type="button"
                onClick={() => setIsSignUp(false)} 
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isSignUp 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Entrar
              </button>
              <button 
                type="button"
                onClick={() => setIsSignUp(true)} 
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isSignUp 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {isSignUp && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
                <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Enviaremos um email de confirmação para ativar sua conta
                </p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              
              {isSignUp && (
                <div className="space-y-3">
                  <Label htmlFor="nome" className="text-sm font-semibold text-foreground">Seu Nome</Label>
                  <Input 
                    id="nome" 
                    type="text" 
                    placeholder="Como quer ser chamado?" 
                    value={formData.nome} 
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} 
                    required={isSignUp} 
                    className="h-12 px-4 border-2 border-input bg-background rounded-xl focus:border-primary transition-all duration-300" 
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={formData.email} 
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  required 
                  className="h-12 px-4 border-2 border-input bg-background rounded-xl focus:border-primary transition-all duration-300" 
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Senha</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder={isSignUp ? "Mínimo 6 caracteres" : "Sua senha secreta"} 
                    value={formData.password} 
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} 
                    required 
                    minLength={6} 
                    className="h-12 px-4 pr-12 border-2 border-input bg-background rounded-xl focus:border-primary transition-all duration-300" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    {isSignUp ? "Criando conta..." : "Acessando..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isSignUp ? "Criar Conta" : "Entrar na Comunidade"}
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 grid grid-cols-2 gap-4 text-center">
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                <Award className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">Avaliações</p>
              </div>
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 border border-sky-200 dark:border-sky-800">
                <Users className="h-6 w-6 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Comunidade</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos{" "}
                <button type="button" className="text-orange-600 dark:text-orange-400 hover:underline font-semibold">
                  Termos
                </button>{" "}
                e{" "}
                <button type="button" className="text-orange-600 dark:text-orange-400 hover:underline font-semibold">
                  Privacidade
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={toggleAuthMode}
            className="text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 font-semibold"
          >
            {isSignUp ? "Já tem uma conta? Entre aqui" : "Novo por aqui? Cadastre-se gratuitamente"}
          </button>
        </div>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (message === 'email_verified') {
      toast({
        title: "🎉 Email confirmado!",
        description: "Seu email foi confirmado com sucesso. Agora você pode fazer login.",
        duration: 8000,
      })
      window.history.replaceState({}, '', '/login')
    }

    if (error) {
      let errorMessage = "Erro na autenticação. Tente novamente."
      
      switch (error) {
        case 'email_verification_failed':
          errorMessage = "Falha na confirmação do email. Tente novamente."
          break
        case 'verification_error':
          errorMessage = "Erro na verificação. Tente novamente."
          break
        case 'auth_failed':
          errorMessage = "Falha na autenticação. Tente novamente."
          break
        case 'missing_code':
          errorMessage = "Código de autenticação inválido."
          break
        case 'unexpected_error':
          errorMessage = "Erro inesperado. Tente novamente."
          break
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams, toast, router])

  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-beer-50 via-background to-sky-50 dark:from-gray-900 dark:via-background dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="h-96 bg-card/80 rounded-3xl shadow-2xl border border-border" />
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}