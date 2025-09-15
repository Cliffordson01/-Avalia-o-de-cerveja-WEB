import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import StarRating from '../ui/star-rating'
import { MessageCircle, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CommentForm = ({ 
  cervejaId, 
  parentCommentId = null, 
  onSuccess, 
  onCancel,
  placeholder = "Escreva seu comentário sobre esta cerveja..."
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('Você precisa estar logado para comentar.')
      return
    }

    if (!comment.trim()) {
      alert('Por favor, escreva um comentário.')
      return
    }

    if (!parentCommentId && rating === 0) {
      alert('Por favor, dê uma nota para a cerveja.')
      return
    }

    setLoading(true)

    try {
      // Inserir comentário
      const { data: newComment, error: commentError } = await supabase
        .from('comentario')
        .insert({
          cerveja_id: cervejaId,
          usuario_id: user.id,
          comentario: comment.trim(),
          parent_id: parentCommentId,
          nota: parentCommentId ? null : rating // Só avaliações principais têm nota
        })
        .select(`
          *,
          usuario:usuario_id(nome, avatar_url),
          curtidas:comentario_curtida(count)
        `)
        .single()

      if (commentError) throw commentError

      // Se é uma avaliação principal (não reply), atualizar estatísticas
      if (!parentCommentId && rating > 0) {
        // Buscar estatísticas atuais
        const { data: stats } = await supabase
          .from('estatistica')
          .select('*')
          .eq('cerveja_id', cervejaId)
          .single()

        if (stats) {
          // Atualizar estatísticas existentes
          const newTotalVotos = stats.total_votos + 1
          const newSomaNotas = stats.soma_notas + rating
          const newMediaNotas = newSomaNotas / newTotalVotos

          await supabase
            .from('estatistica')
            .update({
              total_votos: newTotalVotos,
              soma_notas: newSomaNotas,
              media_notas: newMediaNotas
            })
            .eq('cerveja_id', cervejaId)
        } else {
          // Criar estatísticas iniciais
          await supabase
            .from('estatistica')
            .insert({
              cerveja_id: cervejaId,
              total_votos: 1,
              soma_notas: rating,
              media_notas: rating,
              total_comentarios: 1,
              total_favoritos: 0
            })
        }
      }

      // Resetar formulário
      setComment('')
      setRating(0)

      if (onSuccess) {
        onSuccess(newComment)
      }

    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      alert('Erro ao enviar comentário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="bg-amber-50/50 border-amber-200">
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Faça login para comentar
          </h3>
          <p className="text-amber-600 mb-4">
            Entre na sua conta para avaliar e comentar sobre esta cerveja
          </p>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6">
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
              <span className="text-amber-800 font-semibold">
                {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium text-amber-900">
                {user.user_metadata?.name || user.email}
              </p>
              <p className="text-sm text-amber-600">
                {parentCommentId ? 'Respondendo comentário' : 'Avaliando cerveja'}
              </p>
            </div>
          </div>

          {/* Rating - apenas para comentários principais */}
          {!parentCommentId && (
            <div className="space-y-2">
              <Label className="text-amber-800 font-medium">
                Sua avaliação *
              </Label>
              <div className="flex items-center space-x-4">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size="lg"
                  showValue={false}
                />
                <span className="text-amber-700 font-medium">
                  {rating > 0 ? `${rating}.0 estrelas` : 'Clique para avaliar'}
                </span>
              </div>
            </div>
          )}

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-amber-800 font-medium">
              {parentCommentId ? 'Sua resposta *' : 'Seu comentário *'}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="border-amber-200 focus:border-amber-500 resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-sm text-amber-600">
              <span>Máximo 1000 caracteres</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full px-6"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !comment.trim() || (!parentCommentId && rating === 0)}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-lg hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {parentCommentId ? 'Responder' : 'Avaliar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CommentForm

