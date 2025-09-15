import Header from './Header'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen beer-gradient">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-amber-900 text-amber-50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 TopBreja. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout

