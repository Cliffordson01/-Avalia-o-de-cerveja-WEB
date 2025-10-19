import { Beer, Github, Twitter } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Beer className="h-6 w-6 text-primary" />
              <span className="font-bebas text-2xl tracking-wide">TopBreja</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A comunidade brasileira de cervejas artesanais. Vote, avalie e descubra as melhores brejas do Brasil.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold">Explorar</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cervejas" className="text-muted-foreground transition-colors hover:text-foreground">
                  Todas as Cervejas
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="text-muted-foreground transition-colors hover:text-foreground">
                  Ranking
                </Link>
              </li>
              <li>
                <Link href="/batalha" className="text-muted-foreground transition-colors hover:text-foreground">
                  Batalha VS
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 font-semibold">Conta</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/perfil" className="text-muted-foreground transition-colors hover:text-foreground">
                  Meu Perfil
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="text-muted-foreground transition-colors hover:text-foreground">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
                  Entrar
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 font-semibold">Comunidade</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TopBreja. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
