import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StarRating from '../ui/star-rating'
import CommentForm from './CommentForm'
import { Heart, MessageCircle, MoreHorizontal, Flag, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CommentItem = ({ 
  comment, 
  onUpdate, 
  onDelete,
  level = 0,
  maxLevel = 2 
}) => {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.curtidas?.length || 0)
  const [loading, setLoading] = useState(false)

  const isOwner = user && user.id === comment.usuario_id
  const canReply = level < maxLevel
  const hasReplies = comment.replies && comment.replies.length > 0

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora há pouco'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const handleLike = async () => {
    if (!user) {
      alert('Você precisa estar logado para curtir comentários.')
      return
    }

    setLoading(true)
    try {
      if (liked) {
        // Remover curtida
        await supabase
          .from('comentario_curtida')
          .delete()
          .eq('comentario_id', comment.uuid)
          .eq('usuario_id', user.id)
        
        setLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        // Adicionar curtida
        await supabase
          .from('comentario_curtida')
          .insert({
            comentario_id: comment.uuid,
            usuario_id: user.id
          })
        
        setLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Erro ao curtir comentário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReplySuccess = (newReply) => {
    setShowReplyForm(false)
    setShowReplies(true)
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleDelete = async () => {
    if (!isOwner) return
    
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await supabase
          .from('comentario')
          .delete()
          .eq('uuid', comment.uuid)
        
        if (onDelete) {
          onDelete(comment.uuid)
        }
      } catch (error) {
        console.error('Erro ao excluir comentário:', error)
        alert('Erro ao excluir comentário.')
      }
    }
  }

  return (
    <div className={`space-y-4 ${level > 0 ? 'ml-8 border-l-2 border-amber-200 pl-4' : ''}`}>
      <Card className="bg-white/80 backdrop-blur-sm border-amber-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          {/* Header do comentário */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                <span className="text-amber-800 font-semibold">
                  {comment.usuario?.nome?.charAt(0) || comment.usuario?.email?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-amber-900">
                    {comment.usuario?.nome || 'Usuário'}
                  </p>
                  {comment.nota && (
                    <StarRating
                      rating={comment.nota}
                      readonly
                      size="sm"
                      showValue={false}
                    />
                  )}
                </div>
                <p className="text-sm text-amber-600">
                  {formatDate(comment.criado_em)}
                </p>
              </div>
            </div>

            {/* Menu de ações */}
            <div className="flex items-center space-x-2">
              {comment.nota && (
                <div className="bg-amber-100 px-2 py-1 rounded-full">
                  <span className="text-sm font-medium text-amber-800">
                    {comment.nota}.0
                  </span>
                </div>
              )}
              
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-800">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo do comentário */}
          <div className="mb-4">
            <p className="text-amber-900 leading-relaxed whitespace-pre-wrap">
              {comment.comentario}
            </p>
          </div>

          {/* Ações do comentário */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center space-x-2 ${
                  liked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-amber-600 hover:text-amber-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>

              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center space-x-2 text-amber-600 hover:text-amber-800"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Responder</span>
                </Button>
              )}

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  {showReplies ? 'Ocultar' : 'Ver'} {comment.replies.length} resposta{comment.replies.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-700">
                <Flag className="w-4 h-4" />
              </Button>
              
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de resposta */}
      {showReplyForm && (
        <div className="ml-8">
          <CommentForm
            cervejaId={comment.cerveja_id}
            parentCommentId={comment.uuid}
            onSuccess={handleReplySuccess}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Escreva sua resposta..."
          />
        </div>
      )}

      {/* Respostas */}
      {showReplies && hasReplies && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.uuid}
              comment={reply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentItem

