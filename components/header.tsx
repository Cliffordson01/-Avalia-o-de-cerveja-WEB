"use client"

import Link from "next/link"
import { Beer, User, LogOut, Settings, Shield, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function Header() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkUserAndAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Verificar se usuário é admin na tabela usuario
          const { data: userData } = await supabase
            .from("usuario")
            .select("role")
            .eq("uuid", user.id)
            .single()

          setIsAdmin(userData?.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndAdmin()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Verificar admin quando o auth state muda
        try {
          const { data: userData } = await supabase
            .from("usuario")
            .select("role")
            .eq("uuid", session.user.id)
            .single()

          setIsAdmin(userData?.role === 'admin')
        } catch (error) {
          console.error("Erro ao verificar admin:", error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMobileMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link 
        href="/" 
        className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        Início
      </Link>
      <Link
        href="/cervejas"
        className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        Cervejas
      </Link>
      <Link
        href="/ranking"
        className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        Ranking
      </Link>
      <Link
        href="/batalha"
        className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        Batalha VS
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 flex-shrink-0">
          <Beer className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="font-bebas text-2xl sm:text-3xl tracking-wide text-foreground">TopBreja</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4z lg:gap-6">
          <NavigationLinks />
        </nav>

        {/* User Menu / Auth */}
        <div className="flex items-center gap-2">
          {/* Desktop User Menu */}
          <div className="hidden md:block">
            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favoritos" className="cursor-pointer">
                      <Beer className="mr-2 h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Seção Admin */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-yellow-600 font-semibold">
                          <Shield className="mr-2 h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isLoading ? (
              <Button asChild size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[50vw] max-w-sm">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

              {/* Logo no Mobile Menu */}
              <div className="flex items-center gap-2 mb-8 pt-4">
                <Beer className="h-6 w-6 text-primary" />
                <span className="font-bebas text-2xl tracking-wide text-foreground">TopBreja</span>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-3 px-4 pt-4">
                <NavigationLinks mobile />
              </nav>

              {/* Mobile User Section */}
              <div className="mt-8 pt-6 border-t border-border">
                {!isLoading && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAdmin ? "Administrador" : "Usuário"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/perfil"
                        className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/favoritos"
                        className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Beer className="h-4 w-4" />
                        Favoritos
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-2 py-2 text-sm text-yellow-600 font-semibold hover:text-yellow-700 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                ) : !isLoading ? (
                  <div className="space-y-3">
                    <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/cadastro">Cadastrar</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 rounded-lg bg-muted animate-pulse"></div>
                    <div className="h-10 rounded-lg bg-muted animate-pulse"></div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile User Icon (outside sheet) */}
          {!isLoading && user && (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favoritos" className="cursor-pointer">
                      <Beer className="mr-2 h-4 w-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-yellow-600 font-semibold">
                          <Shield className="mr-2 h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Login Button */}
          {!isLoading && !user && (
            <div className="md:hidden">
              <Button asChild size="sm">
                <Link href="/login" className="text-xs px-3">
                  Entrar
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}