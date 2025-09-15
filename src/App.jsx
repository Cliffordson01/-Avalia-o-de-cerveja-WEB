import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Admin from './pages/Admin'
import BeerDetail from './pages/BeerDetail'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cerveja/:id" element={<BeerDetail />} />
            <Route path="/ranking" element={<div className="text-center py-12 text-amber-700">Página de Ranking em desenvolvimento</div>} />
            <Route path="/cartaz" element={<div className="text-center py-12 text-amber-700">Página de Cartaz em desenvolvimento</div>} />
            <Route path="/contatos" element={<div className="text-center py-12 text-amber-700">Página de Contatos em desenvolvimento</div>} />
            <Route path="/perfil" element={<div className="text-center py-12 text-amber-700">Página de Perfil em desenvolvimento</div>} />
            <Route path="/login" element={<div className="text-center py-12 text-amber-700">Página de Login em desenvolvimento</div>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App

