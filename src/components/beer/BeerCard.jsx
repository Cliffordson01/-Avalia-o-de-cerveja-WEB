import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StarRating from '../ui/star-rating'
import { Heart, Eye, MessageCircle, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const BeerCard = ({ beer }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  const info = beer.informacao?.[0]
  const stats = beer.estatistica?.[0]
  const ranking = beer.ranking?.[0]

  const toggleFavorite = async (e) => {
    e.preventDefault() // Evitar navegação quando clicar no coração
    
    if (!user) {
      alert('Você precisa estar logado para favoritar cervejas.')
      return
    }

    setLoading(true)
    try {
      if (isFavorite) {
        await supabase
          .from('favorito')
          .delete()
          .eq('cerveja_id', beer.uuid)
          .eq('usuario_id', user.id)
        
        setIsFavorite(false)
      } else {
        await supabase
          .from('favorito')
          .insert({
            cerveja_id: beer.uuid,
            usuario_id: user.id
          })
        
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Erro ao favoritar cerveja:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={() => navigate(`/cerveja/${beer.uuid}`)} className="cursor-pointer">
      <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-amber-200 hover:border-amber-400 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
        <CardContent className="p-0">
          {/* Imagem */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={beer.imagem_main || '/placeholder-beer.jpg'}
              alt={`${beer.marca} ${beer.nome}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  className="bg-white/90 text-amber-800 hover:bg-white rounded-full shadow-lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              {ranking && (
                <Badge className="bg-amber-500 text-white shadow-lg">
                  <Award className="w-3 h-3 mr-1" />
                  #{ranking.posicao}
                </Badge>
              )}
            </div>

            {/* Botão de favorito */}
            <button
              onClick={toggleFavorite}
              disabled={loading}
              className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
            >
              <Heart 
                className={`w-4 h-4 ${
                  isFavorite 
                    ? 'text-red-500 fill-current' 
                    : 'text-amber-600'
                }`} 
              />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            {/* Título */}
            <div>
              <h3 className="font-bold text-lg text-amber-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                {beer.nome}
              </h3>
              <p className="text-amber-600 text-sm font-medium">
                {beer.marca}
              </p>
            </div>

            {/* Avaliação */}
            {stats && (
              <div className="flex items-center justify-between">
                <StarRating
                  rating={stats.media_notas || 0}
                  readonly
                  size="sm"
                />
                <span className="text-xs text-amber-600">
                  {stats.total_votos} voto{stats.total_votos !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Informações técnicas */}
            {info && (
              <div className="flex items-center justify-between text-xs text-amber-600">
                {info.teor_alcoolico && (
                  <span>ABV: {info.teor_alcoolico}%</span>
                )}
                {info.amargor && (
                  <span>IBU: {info.amargor}</span>
                )}
              </div>
            )}

            {/* Estatísticas */}
            {stats && (
              <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                <div className="flex items-center space-x-1 text-amber-600">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{stats.total_comentarios || 0}</span>
                </div>
                <div className="flex items-center space-x-1 text-amber-600">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">{stats.total_favoritos || 0}</span>
                </div>
              </div>
            )}

            {/* Descrição curta */}
            {info?.impressao_geral && (
              <p className="text-sm text-amber-700 line-clamp-2 leading-relaxed">
                {info.impressao_geral}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BeerCard