import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BeerCard from '../components/beer/BeerCard'
import FeaturedBeer from '../components/beer/FeaturedBeer'
import BeerBattle from '../components/beer/BeerBattle'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, Beer } from 'lucide-react'

const Home = () => {
  const [featuredBeer, setFeaturedBeer] = useState(null)
  const [topBeers, setTopBeers] = useState([])
  const [allBeers, setAllBeers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBeers()
  }, [])

  const fetchBeers = async () => {
    try {
      // Buscar cervejas com ranking
      const { data: beers, error } = await supabase
        .from('cerveja')
        .select(`
          *,
          informacao(*),
          ranking(*),
          selo(*)
        `)
        .eq('ativo', true)
        .order('criado_em', { ascending: false })

      if (error) throw error

      if (beers && beers.length > 0) {
        // Separar cerveja em destaque (primeira do ranking)
        const sortedByRanking = beers.sort((a, b) => {
          const aRanking = a.ranking?.[0]?.posicao || 999
          const bRanking = b.ranking?.[0]?.posicao || 999
          return aRanking - bRanking
        })

        setFeaturedBeer(sortedByRanking[0])
        setTopBeers(sortedByRanking.slice(0, 3))
        setAllBeers(sortedByRanking)
      }
    } catch (error) {
      console.error('Erro ao buscar cervejas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-amber-800 text-lg font-semibold">Carregando cervejas...</div>
      </div>
    )
  }

  // Se não há cervejas cadastradas
  if (!allBeers || allBeers.length === 0) {
    return (
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-amber-900 mb-6 tracking-tight">
              Bem-vindo ao TopBreja
            </h1>
            <p className="text-xl text-amber-700 mb-8 leading-relaxed">
              A plataforma definitiva para descobrir, avaliar e compartilhar as melhores cervejas do Brasil
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/admin">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:scale-105 transition-all duration-200">
                  <Plus className="w-5 h-5 mr-2" />
                  Cadastrar Primeira Cerveja
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Empty State */}
        <section>
          <Card className="max-w-2xl mx-auto bg-amber-50/80 backdrop-blur-sm border-amber-200">
            <CardContent className="p-12 text-center">
              <Beer className="w-16 h-16 text-amber-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-amber-900 mb-4">
                Nenhuma cerveja cadastrada ainda
              </h3>
              <p className="text-amber-700 mb-6">
                Seja o primeiro a adicionar cervejas incríveis à nossa plataforma!
              </p>
              <Link to="/admin">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full">
                  Começar agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {/* Cerveja em Destaque */}
      {featuredBeer && (
        <section className="animate-fade-in">
          <FeaturedBeer beer={featuredBeer} />
        </section>
      )}

      {/* Batalha de Cervejas */}
      {topBeers.length >= 2 && (
        <section className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-900 mb-4 tracking-tight">
              DOIS SABORES, UMA COROA
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-6"></div>
            <span className="text-amber-700 text-xl font-medium">DECIDA O VENCEDOR</span>
          </div>
          <BeerBattle beers={topBeers.slice(0, 2)} />
        </section>
      )}

      {/* No Jogo pelo Melhor Sabor */}
      {allBeers.length > 2 && (
        <section className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-900 mb-4 tracking-tight">
              NO JOGO PELO MELHOR SABOR
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allBeers.slice(2, 5).map((beer) => (
              <div key={beer.uuid} className="beer-card-hover">
                <BeerCard beer={beer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Em Cartaz */}
      {allBeers.length > 5 && (
        <section className="animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-amber-900 mb-4 tracking-tight">
              EM CARTAZ
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allBeers.slice(5).map((beer) => (
              <div key={beer.uuid} className="beer-card-hover">
                <BeerCard beer={beer} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="text-center py-16">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-amber-900 mb-4">
            Quer adicionar sua cerveja favorita?
          </h3>
          <p className="text-amber-700 mb-8">
            Contribua com nossa comunidade adicionando novas cervejas para avaliação
          </p>
          <Link to="/admin">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Cerveja
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home

