// components/header.tsx - VERSÃO MAIS OTIMIZADA
"use client"

import Link from "next/link"
import { Beer, User, LogOut, Shield, Menu, X, Sun, Moon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, memo } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "@/components/providers/theme-provider"
import { useAuth } from "@/components/contexts/AuthContext"

// ✅ COMPONENTE MEMORIZADO PARA NAVEGAÇÃO
const NavigationLinks = memo(({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => (
  <>
    <Link 
      href="/" 
      className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
      onClick={onLinkClick}
    >
      Início
    </Link>
    <Link
      href="/cervejas"
      className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
      onClick={onLinkClick}
    >
      Cervejas
    </Link>
    <Link
      href="/ranking"
      className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
      onClick={onLinkClick}
    >
      Ranking
    </Link>
    <Link
      href="/batalha"
      className={`${mobile ? "text-lg py-3 border-b border-border" : "text-sm"} font-medium text-muted-foreground transition-colors hover:text-foreground`}
      onClick={onLinkClick}
    >
      Batalha VS
    </Link>
  </>
))

NavigationLinks.displayName = 'NavigationLinks'

// ✅ COMPONENTE MEMORIZADO PARA TOGGLE DE TEMA
const ThemeToggle = memo(({ mobile = false }: { mobile?: boolean }) => {
  const { theme, setTheme } = useTheme()
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'fresh') => {
    setTheme(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={mobile ? "ghost" : "outline"} 
          size={mobile ? "sm" : "icon"}
          className={mobile ? "w-full justify-start" : "h-9 w-9"}
        >
          {theme === 'light' && <Sun className="h-4 w-4" />}
          {theme === 'dark' && <Moon className="h-4 w-4" />}
          {theme === 'fresh' && <Palette className="h-4 w-4" />}
          {mobile && <span className="ml-2">Tema</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')} className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')} className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('fresh')} className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Fresh</span>
          {theme === 'fresh' && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

ThemeToggle.displayName = 'ThemeToggle'

export function Header() {
  const { user, isAdmin, isLoading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
  }

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 theme-transition">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80 flex-shrink-0">
          <Beer className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <span className="font-bebas text-2xl sm:text-3xl tracking-wide text-foreground">TopBreja</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <NavigationLinks />
        </nav>

        {/* User Menu / Auth */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle - Desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

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

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm theme-transition">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

              <div className="flex items-center gap-2 mb-8 pt-4">
                <Beer className="h-6 w-6 text-primary" />
                <span className="font-bebas text-2xl tracking-wide text-foreground">TopBreja</span>
              </div>

              <div className="mb-6 px-2">
                <ThemeToggle mobile />
              </div>

              <nav className="flex flex-col space-y-3 px-4 pt-4">
                <NavigationLinks mobile onLinkClick={handleMobileLinkClick} />
              </nav>

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
                        onClick={handleMobileLinkClick}
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/favoritos"
                        className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={handleMobileLinkClick}
                      >
                        <Beer className="h-4 w-4" />
                        Favoritos
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-2 py-2 text-sm text-yellow-600 font-semibold hover:text-yellow-700 transition-colors"
                          onClick={handleMobileLinkClick}
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
                    <Button asChild className="w-full" onClick={handleMobileLinkClick}>
                      <Link href="/login">Entrar</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" onClick={handleMobileLinkClick}>
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

          {/* Mobile User Icon */}
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