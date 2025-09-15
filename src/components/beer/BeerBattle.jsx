import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const BeerBattle = ({ beers }) => {
  const { user } = useAuth()
  const [selectedBeer, setSelectedBeer] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)

  if (!beers || beers.length < 2) {
    return <div>Carregando batalha...</div>
  }

  const handleVote = async (beerUuid) => {
    if (!user || hasVoted) return

    try {
      await supabase
        .from('voto')
        .insert({
          usuario_id: user.id,
          cerveja_id: beerUuid,
          quantidade: 1,
          status: true
        })

      setSelectedBeer(beerUuid)
      setHasVoted(true)
    } catch (error) {
      console.error('Erro ao votar:', error)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-8">
      {/* Primeira Cerveja */}
      <Card className={`w-full max-w-sm transition-all duration-300 ${
        selectedBeer === beers[0].uuid ? 'ring-4 ring-yellow-400 scale-105' : ''
      } ${hasVoted && selectedBeer !== beers[0].uuid ? 'opacity-50' : ''}`}>
        <CardContent className="p-6 text-center">
          <div className="relative mb-4">
            <img
              src={beers[0].imagem_main || '/placeholder-beer.jpg'}
              alt={beers[0].nome}
              className="w-32 h-48 object-cover mx-auto rounded-lg"
            />
            {/* Selo de Ranking */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
          </div>
          
          <h3 className="font-bold text-lg text-amber-900 mb-2">{beers[0].nome}</h3>
          <p className="text-amber-700 text-sm mb-4">{beers[0].marca}</p>
          
          <div className="space-y-2 text-sm text-amber-600 mb-4">
            <div>Votos: {beers[0].ranking?.[0]?.total_votos || 0}</div>
            <div>Favoritos: 250 mil</div>
            <div>Comentários: 500 mil</div>
          </div>

          {user && !hasVoted && (
          <Link to={`/cerveja/${beers[0].uuid}`}>
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:scale-105 transition-all duration-200"
            >
              Ver mais
            </Button>
          </Link>
          )}
          
          {hasVoted && selectedBeer === beers[0].uuid && (
            <div className="text-green-600 font-bold">Você votou nesta!</div>
          )}
        </CardContent>
      </Card>

      {/* VS */}
      <div className="text-4xl font-bold text-amber-800 px-4">VS</div>

      {/* Segunda Cerveja */}
      <Card className={`w-full max-w-sm transition-all duration-300 ${
        selectedBeer === beers[1].uuid ? 'ring-4 ring-gray-400 scale-105' : ''
      } ${hasVoted && selectedBeer !== beers[1].uuid ? 'opacity-50' : ''}`}>
        <CardContent className="p-6 text-center">
          <div className="relative mb-4">
            <img
              src={beers[1].imagem_main || '/placeholder-beer.jpg'}
              alt={beers[1].nome}
              className="w-32 h-48 object-cover mx-auto rounded-lg"
            />
            {/* Selo de Ranking */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
          </div>
          
          <h3 className="font-bold text-lg text-amber-900 mb-2">{beers[1].nome}</h3>
          <p className="text-amber-700 text-sm mb-4">{beers[1].marca}</p>
          
          <div className="space-y-2 text-sm text-amber-600 mb-4">
            <div>Votos: {beers[1].ranking?.[0]?.total_votos || 0}</div>
            <div>Favoritos: 200 mil</div>
            <div>Comentários: 400 mil</div>
          </div>

          {user && !hasVoted && (
          <Link to={`/cerveja/${beers[1].uuid}`}>
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:scale-105 transition-all duration-200"
            >
              Ver mais
            </Button>
          </Link>
          )}
          
          {hasVoted && selectedBeer === beers[1].uuid && (
            <div className="text-green-600 font-bold">Você votou nesta!</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BeerBattle
