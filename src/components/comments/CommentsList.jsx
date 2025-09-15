import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import StarRating from '../ui/star-rating'
import { MessageCircle, Star, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const CommentsList = ({ cervejaId }) => {
  const [comments, setComments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent') // recent, rating, likes

  useEffect(() => {
    if (cervejaId) {
      fetchComments()
      fetchStats()
    }
  }, [cervejaId, sortBy])

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('estatistica')
        .select('*')
        .eq('cerveja_id', cervejaId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const fetchComments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('comentario')
        .select(`
          *,
          usuario:usuario_id(nome, avatar_url),
          curtidas:comentario_curtida(count),
          replies:comentario!parent_id(
            *,
            usuario:usuario_id(nome, avatar_url),
            curtidas:comentario_curtida(count)
          )
        `)
        .eq('cerveja_id', cervejaId)
        .is('parent_id', null) // Apenas comentários principais

      // Aplicar ordenação
      switch (sortBy) {
        case 'rating':
          query = query.order('nota', { ascending: false })
          break
        case 'likes':
          // Ordenar por curtidas seria mais complexo, por enquanto usar data
          query = query.order('criado_em', { ascending: false })
          break
        default: // recent
          query = query.order('criado_em', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSuccess = () => {
    fetchComments()
    fetchStats()
  }

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.uuid !== commentId))
    fetchStats()
  }

  const getSortLabel = (sort) => {
    switch (sort) {
      case 'rating': return 'Melhor avaliados'
      case 'likes': return 'Mais curtidos'
      default: return 'Mais recentes'
    }
  }

  const getSortIcon = (sort) => {
    switch (sort) {
      case 'rating': return <Star className="w-4 h-4" />
      case 'likes': return <TrendingUp className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Estatísticas */}
      {stats && (
        <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <StarRating
                    rating={stats.media_notas || 0}
                    readonly
                    size="lg"
                  />
                </div>
                <p className="text-sm text-amber-600">
                  {stats.total_votos} avaliação{stats.total_votos !== 1 ? 'ões' : ''}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {stats.total_comentarios || 0}
                </div>
                <p className="text-sm text-amber-600">
                  Comentário{stats.total_comentarios !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {stats.total_favoritos || 0}
                </div>
                <p className="text-sm text-amber-600">
                  Favorito{stats.total_favoritos !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de novo comentário */}
      <CommentForm
        cervejaId={cervejaId}
        onSuccess={handleCommentSuccess}
      />

      {/* Lista de comentários */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-amber-900">
              <MessageCircle className="w-5 h-5" />
              <span>
                Avaliações e Comentários ({comments.length})
              </span>
            </CardTitle>

            {/* Filtros de ordenação */}
            <div className="flex items-center space-x-2">
              {['recent', 'rating', 'likes'].map((sort) => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                  className={`flex items-center space-x-2 ${
                    sortBy === sort
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'border-amber-300 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {getSortIcon(sort)}
                  <span className="hidden sm:inline">
                    {getSortLabel(sort)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-amber-600">Carregando comentários...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">
                Nenhuma avaliação ainda
              </h3>
              <p className="text-amber-600">
                Seja o primeiro a avaliar e comentar sobre esta cerveja!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.uuid}
                  comment={comment}
                  onUpdate={fetchComments}
                  onDelete={handleCommentDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CommentsList

