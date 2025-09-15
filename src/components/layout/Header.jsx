import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-amber-900/90 backdrop-blur-sm border-b border-amber-700 px-4 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-amber-900 font-bold text-xl">🍺</span>
          </div>
          <div className="text-3xl font-bold text-amber-100 tracking-tight">
            TopBreja
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="text-amber-200 hover:text-amber-100 font-medium transition-colors duration-200 hover:scale-105"
          >
            Início
          </Link>
          <Link 
            to="/ranking" 
            className="text-amber-200 hover:text-amber-100 font-medium transition-colors duration-200 hover:scale-105"
          >
            Ranking
          </Link>
          <Link 
            to="/cartaz" 
            className="text-amber-200 hover:text-amber-100 font-medium transition-colors duration-200 hover:scale-105"
          >
            Cartaz
          </Link>
          <Link 
            to="/contatos" 
            className="text-amber-200 hover:text-amber-100 font-medium transition-colors duration-200 hover:scale-105"
          >
            Contatos
          </Link>
          <Link 
            to="/admin" 
            className="text-amber-200 hover:text-amber-100 font-medium transition-colors duration-200 hover:scale-105"
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Admin
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-800/50">
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-amber-200 hover:text-amber-100 hover:bg-amber-800/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button className="bg-amber-500 hover:bg-amber-400 text-amber-900 font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg">
                Entrar/Cadastrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

