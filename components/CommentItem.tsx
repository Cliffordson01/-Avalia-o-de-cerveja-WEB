// components/CommentItem.tsx - ATUALIZADO COM REDIRECIONAMENTO
"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { MoreHorizontal, Edit, Trash2, Reply, Send, ThumbsUp as LikeIcon, ThumbsDown as DislikeIcon, Beer, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface CommentUser {
  uuid: string
  nome: string
  foto_url: string | null
}

interface CommentInteraction {
  tipo: 'curtida' | 'descurtida' | null
}

interface Comment {
  uuid: string
  usuario_id: string
  cerveja_id: string
  descricao: string
  reply_to_comment_id: string | null
  curtidas: number
  descurtidas: number
  criado_em: string
  editado_em: string | null
  deletado: boolean
  usuario: CommentUser
  replies?: Comment[]
  user_interaction?: CommentInteraction
}

interface CommentItemProps {
  comment: Comment
  currentUserUuid: string | null
  cervejaId: string
  onRefetch: () => void
  onUpdateBeer: () => void
  currentTheme: 'light' | 'dark' | 'fresh'
  depth?: number
}

export default function CommentItem({ 
  comment, 
  currentUserUuid, 
  cervejaId,
  onRefetch, 
  onUpdateBeer,
  currentTheme,
  depth = 0 
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [localReplyText, setLocalReplyText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.descricao)
  const [showReplies, setShowReplies] = useState(depth === 0)
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const { requireAuth } = useAuthRedirect()

  const isOwner = currentUserUuid === comment.usuario_id
  const userReaction = comment.user_interaction
  const hasReplies = comment.replies && comment.replies.length > 0
  const totalReplies = comment.replies?.length || 0

  // Funções para obter cores baseadas no tema
  const getPrimaryColor = () => {
    switch (currentTheme) {
      case 'light': return 'amber'
      case 'fresh': return 'sky'
      case 'dark': return 'amber'
      default: return 'amber'
    }
  }

  // ✅ FUNÇÃO CORRIGIDA - Usa classes CSS diretas em vez de template strings dinâmicas
  const getContainerStyle = () => {
    if (depth === 0) {
      switch (currentTheme) {
        case 'light': return "bg-white border-l-4 border-l-amber-500 shadow-md hover:shadow-lg"
        case 'fresh': return "bg-white border-l-4 border-l-sky-500 shadow-md hover:shadow-lg"
        case 'dark': return "bg-amber-950/50 border-l-4 border-l-amber-500 shadow-md hover:shadow-lg"
        default: return "bg-white border-l-4 border-l-amber-500 shadow-md hover:shadow-lg"
      }
    }
    
    // Para replies
    switch (currentTheme) {
      case 'light':
        const lightBorders = ['border-l-amber-400', 'border-l-amber-300', 'border-l-amber-200', 'border-l-amber-100']
        const lightBgs = ['bg-amber-50/30', 'bg-amber-50/20', 'bg-amber-50/10', 'bg-amber-50/5']
        return `${lightBorders[Math.min(depth - 1, 3)]} ${lightBgs[Math.min(depth - 1, 3)]} shadow-sm hover:shadow-md`
      
      case 'fresh':
        const freshBorders = ['border-l-sky-400', 'border-l-sky-300', 'border-l-sky-200', 'border-l-sky-100']
        const freshBgs = ['bg-sky-50/30', 'bg-sky-50/20', 'bg-sky-50/10', 'bg-sky-50/5']
        return `${freshBorders[Math.min(depth - 1, 3)]} ${freshBgs[Math.min(depth - 1, 3)]} shadow-sm hover:shadow-md`
      
      case 'dark':
        const darkBorders = ['border-l-amber-600', 'border-l-amber-500', 'border-l-amber-400', 'border-l-amber-300']
        const darkBgs = ['bg-amber-900/30', 'bg-amber-900/20', 'bg-amber-900/10', 'bg-amber-900/5']
        return `${darkBorders[Math.min(depth - 1, 3)]} ${darkBgs[Math.min(depth - 1, 3)]} shadow-sm hover:shadow-md`
      
      default:
        return "shadow-sm hover:shadow-md"
    }
  }

  const getNestingStyle = () => {
    if (depth === 0) return ''
    const baseMargin = depth === 1 ? 'ml-3 sm:ml-6' : 'ml-3 sm:ml-8'
    return `${baseMargin} relative`
  }

  const getBorderColor = () => {
    switch (currentTheme) {
      case 'light': return "border-amber-300"
      case 'fresh': return "border-sky-300"
      case 'dark': return "border-amber-600"
      default: return "border-amber-300"
    }
  }

  const getTextColor = () => {
    switch (currentTheme) {
      case 'light': return 'text-gray-800'
      case 'fresh': return 'text-gray-800'
      case 'dark': return 'text-gray-200'
      default: return 'text-gray-800'
    }
  }

  const getMutedTextColor = () => {
    switch (currentTheme) {
      case 'light': return 'text-gray-500'
      case 'fresh': return 'text-gray-500'
      case 'dark': return 'text-gray-400'
      default: return 'text-gray-500'
    }
  }

  // ✅ FUNÇÃO CORRIGIDA - Classes CSS diretas
  const getButtonStyles = (variant: 'primary' | 'outline' | 'ghost' = 'primary') => {
    switch (currentTheme) {
      case 'light':
        switch (variant) {
          case 'primary': return "bg-amber-600 hover:bg-amber-700 text-white"
          case 'outline': return "border-amber-300 text-amber-700 hover:bg-amber-50"
          case 'ghost': return "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          default: return ""
        }
      
      case 'fresh':
        switch (variant) {
          case 'primary': return "bg-sky-600 hover:bg-sky-700 text-white"
          case 'outline': return "border-sky-300 text-sky-700 hover:bg-sky-50"
          case 'ghost': return "text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          default: return ""
        }
      
      case 'dark':
        switch (variant) {
          case 'primary': return "bg-amber-600 hover:bg-amber-700 text-white" // ✅ SEMPRE texto branco
          case 'outline': return "border-amber-600 text-amber-300 hover:bg-amber-800"
          case 'ghost': return "text-amber-400 hover:text-amber-300 hover:bg-amber-800"
          default: return ""
        }
      
      default:
        return ""
    }
  }

  const getInputStyles = () => {
    switch (currentTheme) {
      case 'light': return "border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-white text-gray-900"
      case 'fresh': return "border-sky-300 focus:border-sky-500 focus:ring-sky-500 bg-white text-gray-900"
      case 'dark': return "border-amber-700 focus:border-amber-500 focus:ring-amber-500 bg-gray-800 text-gray-100"
      default: return "border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-white text-gray-900"
    }
  }

  const getReplyInputStyles = () => {
    switch (currentTheme) {
      case 'light': return "bg-amber-50 border-amber-200"
      case 'fresh': return "bg-sky-50 border-sky-200"
      case 'dark': return "bg-amber-900/30 border-amber-700"
      default: return "bg-amber-50 border-amber-200"
    }
  }

  const getAvatarGradient = () => {
    switch (currentTheme) {
      case 'light': return "bg-gradient-to-br from-amber-400 to-amber-600"
      case 'fresh': return "bg-gradient-to-br from-sky-400 to-sky-600"
      case 'dark': return "bg-gradient-to-br from-amber-400 to-amber-600"
      default: return "bg-gradient-to-br from-amber-400 to-amber-600"
    }
  }

  // Resto das funções permanecem as mesmas...
  const handleCommentReaction = async (tipo: 'curtida' | 'descurtida') => {
    if (!requireAuth("curtir comentários")) return

    try {
      const { data: existingReaction } = await supabase
        .from("comentario_curtida")
        .select("tipo")
        .eq("usuario_id", currentUserUuid)
        .eq("comentario_id", comment.uuid)
        .maybeSingle()

      if (existingReaction) {
        if (existingReaction.tipo === tipo) {
          await supabase
            .from("comentario_curtida")
            .delete()
            .eq("usuario_id", currentUserUuid)
            .eq("comentario_id", comment.uuid)
        } else {
          await supabase
            .from("comentario_curtida")
            .update({ tipo })
            .eq("usuario_id", currentUserUuid)
            .eq("comentario_id", comment.uuid)
        }
      } else {
        await supabase
          .from("comentario_curtida")
          .insert({
            usuario_id: currentUserUuid,
            comentario_id: comment.uuid,
            tipo,
          })
      }

      onRefetch()
    } catch (error) {
      console.error("Error reacting to comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar reação",
        variant: "destructive",
      })
    }
  }

  const handleEditComment = async () => {
    if (!editText.trim()) return

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("comentario")
        .update({
          descricao: editText.trim(),
          editado_em: new Date().toISOString(),
        })
        .eq("uuid", comment.uuid)

      if (error) throw error

      toast({
        title: "Comentário editado!",
        description: "Sua opinião foi atualizada com sucesso.",
      })
      setIsEditing(false)
      onRefetch()
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao editar comentário",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return
    
    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("comentario")
        .update({ deletado: true })
        .eq("uuid", comment.uuid)

      if (error) throw error

      toast({
        title: "Comentário excluído",
        description: "Sua opinião foi removida.",
      })
      onRefetch()
      onUpdateBeer()
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir comentário",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!requireAuth("responder comentários")) return

    if (!localReplyText.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma resposta",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("comentario")
        .insert({
          usuario_id: currentUserUuid!,
          cerveja_id: cervejaId,
          descricao: localReplyText.trim(),
          reply_to_comment_id: comment.uuid,
        })

      if (error) throw error

      setLocalReplyText("")
      setShowReplyInput(false)
      if (!showReplies) {
        setShowReplies(true)
      }
      toast({
        title: "Resposta publicada!",
        description: "Sua resposta foi compartilhada.",
      })
      onRefetch()
      onUpdateBeer()
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast({
        title: "Erro",
        description: "Erro ao publicar resposta",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(comment.descricao)
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`${getNestingStyle()} transition-all duration-200 max-w-full`}>
      {/* Linha de conexão para replies */}
      {depth > 0 && (
        <div className={`absolute -left-3 sm:-left-6 top-0 bottom-0 w-3 sm:w-6 border-l-2 border-b-2 ${getBorderColor()} rounded-bl-2xl -z-10`}></div>
      )}
      
      {/* CARD DO COMENTÁRIO */}
      <div className={`${getContainerStyle()} rounded-lg p-4 mb-3 max-w-full overflow-hidden transition-all duration-500`}>
        
        {/* Header - Layout responsivo */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-full">
            {/* Avatar do Usuário */}
            <div className="shrink-0">
              <div className={`w-10 h-10 ${getAvatarGradient()} rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden`}>
                {comment.usuario?.foto_url ? (
                  <Image
                    src={comment.usuario.foto_url}
                    alt={comment.usuario.nome}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Beer className="h-5 w-5 text-white" />
                )}
              </div>
            </div>

            {/* Informações do Usuário */}
            <div className="flex-1 min-w-0 max-w-full">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 flex-wrap">
                <span className={`font-bold text-sm ${getTextColor()} truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]`}>
                  {comment.usuario?.nome}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs ${getMutedTextColor()} whitespace-nowrap`}>
                    {formatDate(comment.criado_em)}
                  </span>
                  {comment.editado_em && (
                    <Badge variant="outline" className={`text-xs ${
                      currentTheme === 'light' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      currentTheme === 'fresh' ? 'bg-sky-50 text-sky-700 border-sky-300' :
                      'bg-amber-900/30 text-amber-300 border-amber-600'
                    } px-2 py-0 h-5`}>
                      editado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu de Ações */}
          {isOwner && !isEditing && (
            <div className="shrink-0 self-start sm:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 rounded-full ${
                    currentTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                  } border`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-48 border ${
                  currentTheme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                } shadow-lg`}>
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsEditing(true)
                      setEditText(comment.descricao)
                    }}
                    className="text-sm cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteComment}
                    className="text-red-600 text-sm cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {/* Conteúdo do Comentário */}
        {isEditing ? (
          <div className="space-y-3 mb-3 max-w-full">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className={`text-sm resize-none max-w-full ${getInputStyles()}`}
              placeholder="Edite seu comentário..."
            />
            <div className="flex gap-2 flex-wrap">
              {/* ✅ BOTÃO "SALVAR" CORRIGIDO - SEMPRE TEXTO VISÍVEL */}
              <Button 
                onClick={handleEditComment}
                disabled={submitting || !editText.trim() || editText === comment.descricao}
                className={`text-sm ${getButtonStyles('primary')}`}
              >
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                className={`text-sm ${getButtonStyles('outline')}`}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-3 max-w-full">
            <p className={`text-sm whitespace-pre-wrap leading-relaxed break-words max-w-full ${getTextColor()}`}>
              {comment.descricao}
            </p>
          </div>
        )}

        {/* AÇÕES - Like/Dislike e Responder */}
        <div className={`flex items-center justify-between gap-2 pt-3 border-t ${
          currentTheme === 'dark' ? 'border-amber-700' : 
          currentTheme === 'fresh' ? 'border-sky-200' : 'border-amber-200'
        }`}>
          {/* Like/Dislike */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 h-8 ${
                userReaction?.tipo === 'curtida' 
                  ? 'text-green-600 bg-green-50 border border-green-200' 
                  : `${getMutedTextColor()} hover:text-green-600 hover:bg-green-50`
              }`}
              onClick={() => handleCommentReaction('curtida')}
            >
              <LikeIcon className="h-4 w-4" />
              <span className="text-xs font-medium">{comment.curtidas || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 h-8 ${
                userReaction?.tipo === 'descurtida' 
                  ? 'text-red-600 bg-red-50 border border-red-200' 
                  : `${getMutedTextColor()} hover:text-red-600 hover:bg-red-50`
              }`}
              onClick={() => handleCommentReaction('descurtida')}
            >
              <DislikeIcon className="h-4 w-4" />
              <span className="text-xs font-medium">{comment.descurtidas || 0}</span>
            </Button>
          </div>

          {/* Botão Responder */}
          <div className="flex items-center gap-2">
            {!showReplyInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyInput(true)}
                className={`${getButtonStyles('outline')} gap-1 h-8 text-sm whitespace-nowrap`}
              >
                <Reply className="h-4 w-4" />
                <span className="hidden sm:inline">Responder</span>
              </Button>
            )}
          </div>
        </div>

        {/* Formulário de Resposta */}
        {showReplyInput && (
          <div className={`mt-4 p-3 rounded-lg border max-w-full transition-all duration-500 ${getReplyInputStyles()}`}>
            <Textarea
              placeholder="Escreva sua resposta..."
              value={localReplyText}
              onChange={(e) => setLocalReplyText(e.target.value)}
              rows={2}
              className={`text-sm resize-none mb-2 max-w-full ${getInputStyles()}`}
            />
            <div className="flex gap-2 flex-wrap">
              {/* ✅ BOTÃO "ENVIAR RESPOSTA" TAMBÉM CORRIGIDO */}
              <Button 
                onClick={handleSubmitReply}
                disabled={submitting || !localReplyText.trim()}
                className={`text-sm ${getButtonStyles('primary')}`}
              >
                {submitting ? "Enviando..." : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Enviar Resposta
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReplyInput(false)}
                className={`text-sm ${getButtonStyles('outline')}`}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO DE RESPOSTAS */}
      {hasReplies && (
        <div className="mt-2 max-w-full">
          {/* Botão para mostrar/ocultar respostas */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className={`${getButtonStyles('outline')} gap-2 text-sm font-medium rounded-full px-3 py-1 whitespace-nowrap`}
            >
              {showReplies ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar Respostas
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver {totalReplies} {totalReplies === 1 ? 'Resposta' : 'Respostas'}
                </>
              )}
            </Button>
          </div>

          {/* Lista de Respostas */}
          {showReplies && (
            <div className="mt-3 space-y-3 max-w-full">
              {comment.replies?.map((reply) => (
                <CommentItem
                  key={reply.uuid}
                  comment={reply}
                  currentUserUuid={currentUserUuid}
                  cervejaId={cervejaId}
                  onRefetch={onRefetch}
                  onUpdateBeer={onUpdateBeer}
                  currentTheme={currentTheme}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}