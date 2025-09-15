import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ThumbsUp, Heart, MessageCircle } from 'lucide-react'

const FeaturedBeer = ({ beer }) => {
  const rating = beer.ranking?.[0]?.media_avaliacao || 0
  const voteCount = beer.ranking?.[0]?.total_votos || 0

  return (
    <div className="relative bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* Imagem da Cerveja */}
        <div className="flex justify-center items-center">
          <div className="relative">
            <img
              src={beer.imagem_main || '/placeholder-beer.jpg'}
              alt={beer.nome}
              className="w-64 h-96 object-cover rounded-lg shadow-lg"
            />
            {/* Selo de Primeiro Lugar */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">1°</span>
            </div>
          </div>
        </div>

        {/* Informações da Cerveja */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              {beer.nome}
            </h1>
            <p className="text-xl text-amber-700">{beer.marca}</p>
          </div>

          <p className="text-amber-800 leading-relaxed">
            {beer.informacao?.[0]?.impressao_geral || 
             'Uma cerveja excepcional que conquistou o primeiro lugar no ranking. Experimente e descubra por que é a favorita dos nossos usuários.'}
          </p>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-amber-900">{rating.toFixed(1)}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-amber-700">
              <ThumbsUp className="w-5 h-5" />
              <span className="font-medium">Votos: {voteCount}</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Favoritos: 250</span>
            </div>
            <div className="flex items-center space-x-2 text-amber-700">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Comentários: 500</span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <Link to={`/cerveja/${beer.uuid}`}>
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
                Votar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturedBeer

