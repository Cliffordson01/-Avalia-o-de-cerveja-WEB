import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StarRating from '../components/ui/star-rating'
import CommentsList from '../components/comments/CommentsList'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Thermometer, 
  Droplets,
  Award,
  Eye,
  UtensilsCrossed,
  Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const BeerDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [beer, setBeer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchBeerDetails()
      if (user) {
        checkIfFavorite()
      }
    }
  }, [id, user])

  const fetchBeerDetails = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cerveja')
        .select(`
          *,
          proprietario:proprietario_id(*),
          informacao(*),
          estatistica(*),
          ranking(*),
          selo(*)
        `)
        .eq('uuid', id)
        .eq('ativo', true)
        .single()

      if (error) throw error
      setBeer(data)
    } catch (error) {
      console.error('Erro ao buscar detalhes da cerveja:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = async () => {
    try {
      const { data } = await supabase
        .from('favorito')
        .select('uuid')
        .eq('cerveja_id', id)
        .eq('usuario_id', user.id)
        .single()

      setIsFavorite(!!data)
    } catch (error) {
      // Não é favorito
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user) {
      alert('Você precisa estar logado para favoritar cervejas.')
      return
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorito')
          .delete()
          .eq('cerveja_id', id)
          .eq('usuario_id', user.id)
        
        setIsFavorite(false)
      } else {
        await supabase
          .from('favorito')
          .insert({
            cerveja_id: id,
            usuario_id: user.id
          })
        
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Erro ao favoritar cerveja:', error)
      alert('Erro ao favoritar cerveja.')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${beer.marca} ${beer.nome} - TopBreja`,
          text: `Confira esta cerveja incrível no TopBreja!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Erro ao compartilhar:', error)
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-amber-800 text-lg font-semibold">Carregando detalhes...</div>
      </div>
    )
  }

  if (!beer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">
          Cerveja não encontrada
        </h2>
        <Link to="/">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    )
  }

  const info = beer.informacao?.[0]
  const stats = beer.estatistica?.[0]
  const ranking = beer.ranking?.[0]
  const images = beer.lista_de_imagem || []

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-amber-600">
        <Link to="/" className="hover:text-amber-800 transition-colors">
          Início
        </Link>
        <span>/</span>
        <span className="text-amber-800 font-medium">
          {beer.marca} {beer.nome}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={toggleFavorite}
            className={`border-amber-300 rounded-full ${
              isFavorite 
                ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100' 
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagens */}
        <div className="space-y-4">
          <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-amber-200">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={images[currentImageIndex] || beer.imagem_main || '/placeholder-beer.jpg'}
                  alt={`${beer.marca} ${beer.nome}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Ranking Badge */}
                {ranking && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-amber-500 text-white text-lg px-3 py-1">
                      <Award className="w-4 h-4 mr-1" />
                      #{ranking.posicao}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-amber-500 scale-105'
                      : 'border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${beer.marca} ${beer.nome} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="space-y-6">
          {/* Título e Avaliação */}
          <div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              {beer.nome}
            </h1>
            <p className="text-xl text-amber-700 mb-4">
              {beer.marca}
            </p>
            
            {stats && (
              <div className="flex items-center space-x-4 mb-4">
                <StarRating
                  rating={stats.media_notas || 0}
                  readonly
                  size="lg"
                />
                <span className="text-amber-600">
                  ({stats.total_votos} avaliação{stats.total_votos !== 1 ? 'ões' : ''})
                </span>
              </div>
            )}

            {/* Proprietário */}
            {beer.proprietario && (
              <div className="flex items-center space-x-2 text-amber-600">
                <MapPin className="w-4 h-4" />
                <span>{beer.proprietario.nome}</span>
              </div>
            )}
          </div>

          {/* Informações Técnicas */}
          {info && (
            <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-amber-900">
                  <Info className="w-5 h-5" />
                  <span>Informações Técnicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {info.teor_alcoolico && (
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        <strong>ABV:</strong> {info.teor_alcoolico}%
                      </span>
                    </div>
                  )}
                  
                  {info.amargor && (
                    <div className="flex items-center space-x-2">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        <strong>IBU:</strong> {info.amargor}
                      </span>
                    </div>
                  )}
                  
                  {info.temperatura_ideal && (
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        <strong>Temperatura:</strong> {info.temperatura_ideal}
                      </span>
                    </div>
                  )}
                  
                  {info.origem && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        <strong>Origem:</strong> {info.origem}
                      </span>
                    </div>
                  )}
                </div>

                {/* Descrições detalhadas */}
                {(info.aparencia || info.aroma || info.sabor || info.corpo_textura) && (
                  <div className="space-y-3 pt-4 border-t border-amber-200">
                    {info.aparencia && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Eye className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-amber-800">Aparência</span>
                        </div>
                        <p className="text-sm text-amber-700 ml-6">{info.aparencia}</p>
                      </div>
                    )}
                    
                    {info.aroma && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Eye className="w-4 h-4 text-amber-600" /> {/* Usando Eye como substituto para Nose */}
                          <span className="font-medium text-amber-800">Aroma</span>
                        </div>
                        <p className="text-sm text-amber-700 ml-6">{info.aroma}</p>
                      </div>
                    )}
                    
                    {info.sabor && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <UtensilsCrossed className="w-4 h-4 text-amber-600" /> {/* Usando UtensilsCrossed como substituto para Coffee */}
                          <span className="font-medium text-amber-800">Sabor</span>
                        </div>
                        <p className="text-sm text-amber-700 ml-6">{info.sabor}</p>
                      </div>
                    )}
                    
                    {info.harmonizacao && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-amber-800">Harmonização</span>
                        </div>
                        <p className="text-sm text-amber-700 ml-6">{info.harmonizacao}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Impressão Geral */}
          {info?.impressao_geral && (
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Impressão Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800 leading-relaxed">
                  {info.impressao_geral}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comentários e Avaliações */}
      <CommentsList cervejaId={id} />
    </div>
  )
}

export default BeerDetail
