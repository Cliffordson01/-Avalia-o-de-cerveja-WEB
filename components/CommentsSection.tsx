// components/CommentsSection.tsx - VERSÃO OTIMIZADA COM CACHE AUMENTADO
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/contexts/AuthContext"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { MessageCircle, Send, ChevronDown, ChevronUp, Beer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import CommentItem from "./CommentItem"

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

interface CommentsSectionProps {
  cervejaId: string
  totalComments: number
  onUpdateBeer: () => void
}

// ✅ Hook de cache local COM TEMPO MAIOR
function useCommentsCache() {
  const cache = useRef<Map<string, { data: Comment[]; timestamp: number }>>(new Map())
  
  const getCachedComments = useCallback((cervejaId: string) => {
    const cached = cache.current.get(cervejaId)
    // ✅ AUMENTADO para 10 minutos (600000ms)
    if (cached && Date.now() - cached.timestamp < 600000) {
      return cached.data
    }
    return null
  }, [])

  const setCachedComments = useCallback((cervejaId: string, data: Comment[]) => {
    cache.current.set(cervejaId, { data, timestamp: Date.now() })
  }, [])

  const invalidateCache = useCallback((cervejaId: string) => {
    cache.current.delete(cervejaId)
  }, [])

  return { getCachedComments, setCachedComments, invalidateCache }
}

function CommentsSection({ 
  cervejaId, 
  totalComments,
  onUpdateBeer 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'fresh'>('light')
  const [loading, setLoading] = useState(true)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const { user } = useAuth()
  const { requireAuth } = useAuthRedirect()
  const { getCachedComments, setCachedComments, invalidateCache } = useCommentsCache()

  // Detectar tema atual
  useEffect(() => {
    const getCurrentTheme = (): 'light' | 'dark' | 'fresh' => {
      if (document.documentElement.classList.contains('dark')) return 'dark'
      if (document.documentElement.classList.contains('fresh')) return 'fresh'
      return 'light'
    }

    setCurrentTheme(getCurrentTheme())

    const observer = new MutationObserver(() => {
      setCurrentTheme(getCurrentTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Funções para obter cores baseadas no tema
  const getHeaderGradient = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-gradient-to-r from-amber-500 to-amber-600"
      case 'fresh':
        return "bg-gradient-to-r from-sky-500 to-sky-600"
      case 'dark':
      default:
        return "bg-gradient-to-r from-amber-600 to-amber-700"
    }
  }

  const getTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-700"
      case 'fresh':
        return "text-sky-700"
      case 'dark':
      default:
        return "text-amber-200"
    }
  }

  const getCardStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-white border-l-4 border-l-amber-500"
      case 'fresh':
        return "bg-white border-l-4 border-l-sky-500"
      case 'dark':
      default:
        return "bg-amber-950/50 border-l-4 border-l-amber-500"
    }
  }

  const getInputStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "border-amber-200 focus:border-amber-500 focus:ring-amber-500 text-amber-900 placeholder:text-amber-600/60"
      case 'fresh':
        return "border-sky-200 focus:border-sky-500 focus:ring-sky-500 text-sky-900 placeholder:text-sky-600/60"
      case 'dark':
      default:
        return "border-amber-700 focus:border-amber-500 focus:ring-amber-500 text-amber-100 placeholder:text-amber-400/60 bg-amber-900/30"
    }
  }

  const getButtonStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
      case 'fresh':
        return "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
      case 'dark':
      default:
        return "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
    }
  }

  const getEmptyStateStyles = () => {
    switch (currentTheme) {
      case 'light':
        return "border-amber-200 bg-amber-50/50 text-amber-800"
      case 'fresh':
        return "border-sky-200 bg-sky-50/50 text-sky-800"
      case 'dark':
      default:
        return "border-amber-800 bg-amber-900/30 text-amber-200"
    }
  }

  const getIconColor = () => {
    switch (currentTheme) {
      case 'light':
        return "text-amber-500"
      case 'fresh':
        return "text-sky-500"
      case 'dark':
      default:
        return "text-amber-400"
    }
  }

  // ✅ BUSCAR COMENTÁRIOS OTIMIZADO
  const fetchComments = useCallback(async (forceRefresh = false) => {
    if (!cervejaId) return

    // ✅ SE NÃO FOR FORCE REFRESH, VERIFICA CACHE PRIMEIRO
    if (!forceRefresh) {
      const cachedComments = getCachedComments(cervejaId)
      if (cachedComments) {
        setComments(cachedComments)
        setLoading(false)
        setHasInitialLoad(true)
        return
      }
    }

    try {
      setLoading(true)
      
      const { data: allComments, error: commentsError } = await supabase
        .from("comentario")
        .select("*")
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false)
        .order("criado_em", { ascending: true })

      if (commentsError) throw commentsError

      if (!allComments || allComments.length === 0) {
        setComments([])
        setCachedComments(cervejaId, [])
        setHasInitialLoad(true)
        return
      }

      // Buscar dados dos usuários
      const userIds = [...new Set(allComments.map((comment: any) => comment.usuario_id))]
      
      const { data: usersData, error: usersError } = await supabase
        .from("usuario")
        .select("uuid, nome, foto_url")
        .in("uuid", userIds)

      if (usersError) throw usersError

      // Criar mapa de usuários
      const usersMap = new Map<string, CommentUser>()
      usersData?.forEach((userData: CommentUser) => {
        usersMap.set(userData.uuid, {
          uuid: userData.uuid,
          nome: userData.nome || "Cervejeiro Anônimo",
          foto_url: userData.foto_url
        })
      })

      // Buscar interações
      let userInteractions: Record<string, CommentInteraction> = {}
      
      if (user) {
        const { data: userLikes } = await supabase
          .from("comentario_curtida")
          .select("comentario_id, tipo")
          .eq("usuario_id", user.uuid)

        if (userLikes) {
          userLikes.forEach((like: any) => {
            userInteractions[like.comentario_id] = { tipo: like.tipo }
          })
        }
      }

      // Buscar contadores de curtidas/descurtidas
      const commentIds = allComments.map((c: any) => c.uuid)
      const { data: likesCount } = await supabase
        .from("comentario_curtida")
        .select("comentario_id, tipo")
        .in("comentario_id", commentIds)

      // Criar contadores
      const likesMap: Record<string, { curtidas: number, descurtidas: number }> = {}
      
      allComments.forEach((comment: any) => {
        likesMap[comment.uuid] = { curtidas: 0, descurtidas: 0 }
      })

      if (likesCount) {
        likesCount.forEach((like: any) => {
          if (likesMap[like.comentario_id]) {
            if (like.tipo === 'curtida') {
              likesMap[like.comentario_id].curtidas++
            } else if (like.tipo === 'descurtida') {
              likesMap[like.comentario_id].descurtidas++
            }
          }
        })
      }

      // Processar hierarquia de comentários
      const commentsMap = new Map<string, Comment>()
      const mainComments: Comment[] = []

      allComments.forEach((comment: any) => {
        const userData = usersMap.get(comment.usuario_id)
        
        const commentWithUser: Comment = {
          ...comment,
          usuario: userData || {
            uuid: comment.usuario_id,
            nome: "Cervejeiro Anônimo",
            foto_url: null
          },
          curtidas: likesMap[comment.uuid]?.curtidas || 0,
          descurtidas: likesMap[comment.uuid]?.descurtidas || 0,
          user_interaction: userInteractions[comment.uuid],
          replies: []
        }
        commentsMap.set(comment.uuid, commentWithUser)
      })

      // Organizar hierarquicamente
      allComments.forEach((comment: any) => {
        const currentComment = commentsMap.get(comment.uuid)!
        
        if (comment.reply_to_comment_id) {
          const parentComment = commentsMap.get(comment.reply_to_comment_id)
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = []
            }
            parentComment.replies.push(currentComment)
          }
        } else {
          mainComments.push(currentComment)
        }
      })

      // Ordenar por data (mais recentes primeiro)
      mainComments.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      
      // ✅ SALVA NO CACHE
      setCachedComments(cervejaId, mainComments)
      setComments(mainComments)
      setHasInitialLoad(true)

    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar comentários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [cervejaId, supabase, toast, user, getCachedComments, setCachedComments])

  // ✅ EFFECT OTIMIZADO - SÓ FETCHA SE PRECISAR
  useEffect(() => {
    const cachedComments = getCachedComments(cervejaId)
    if (cachedComments && !hasInitialLoad) {
      setComments(cachedComments)
      setLoading(false)
      setHasInitialLoad(true)
    } else if (!hasInitialLoad) {
      fetchComments()
    }
  }, [fetchComments, cervejaId, getCachedComments, hasInitialLoad])

  // Handle submit comment - ATUALIZADO COM INVALIDAÇÃO DE CACHE
  const handleSubmitComment = async () => {
    if (!requireAuth("comentar")) return

    if (!newComment.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comentário",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("comentario")
        .insert({
          usuario_id: user!.uuid,
          cerveja_id: cervejaId,
          descricao: newComment.trim(),
          reply_to_comment_id: null,
        })

      if (error) throw error

      setNewComment("")
      // ✅ INVALIDA CACHE para forçar refresh
      invalidateCache(cervejaId)
      toast({
        title: "🍻 Comentário publicado!",
        description: "Sua opinião foi compartilhada com a comunidade!",
      })
      fetchComments(true) // Force refresh
      onUpdateBeer()
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao publicar comentário",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Comentários visíveis (com limite inicial)
  const visibleComments = showAllComments ? comments : comments.slice(0, 3)
  const hasMoreComments = comments.length > 3

  return (
    <div className="mt-12 transition-all duration-500">
      {/* Header com Badge */}
      <div className="mb-8 text-center">
        <div className={`inline-flex items-center gap-3 ${getHeaderGradient()} text-white px-6 py-3 rounded-full shadow-lg transition-all duration-500`}>
          <MessageCircle className="h-6 w-6" />
          <h2 className="font-bebas text-3xl tracking-wide">
            Opiniões dos Cervejeiros ({totalComments})
          </h2>
          <Beer className="h-6 w-6" />
        </div>
        <p className={`${getTextColor()} mt-2 text-sm transition-colors duration-500`}>
          Compartilhe sua experiência com esta cerveja
        </p>
      </div>

      {/* Card de Comentário */}
      <Card className={`mb-8 shadow-lg hover:shadow-xl transition-all duration-500 ${getCardStyles()}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Ícone de Cerveja */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 ${getHeaderGradient()} rounded-full flex items-center justify-center shadow-md transition-all duration-500`}>
                <Beer className="h-6 w-6 text-white" />
              </div>
            </div>
            
            {/* Área de Texto */}
            <div className="flex-1">
              <Textarea
                placeholder={
                  user
                    ? "Compartilhe sua opinião sobre o sabor, aroma, aparência... O que achou desta cerveja? 🍻" 
                    : "Faça login para compartilhar sua opinião sobre esta cerveja"
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className={`min-h-[120px] resize-none text-base transition-all duration-500 ${getInputStyles()}`}
                disabled={!user}
              />
              
              {/* Contador de Caracteres e Botão */}
              <div className="flex items-center justify-between mt-4">
                <span className={`text-sm transition-colors duration-500 ${
                  newComment.length > 500 ? 'text-red-500' : getTextColor()
                }`}>
                  {newComment.length}/500
                </span>
                
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || !user || submitting || newComment.length > 500}
                  className={`${getButtonStyles()} text-white shadow-md transition-all duration-200 px-6`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Compartilhar Opinião
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Comentários */}
      <div className="space-y-6">
        {loading ? (
          // Loading Skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 ${getIconColor()} bg-opacity-20 rounded-full`}></div>
                    <div className="flex-1 space-y-3">
                      <div className={`h-4 ${getIconColor()} bg-opacity-20 rounded w-1/4`}></div>
                      <div className={`h-3 ${getIconColor()} bg-opacity-20 rounded w-3/4`}></div>
                      <div className={`h-3 ${getIconColor()} bg-opacity-20 rounded w-1/2`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          // Estado Vazio
          <Card className={`text-center py-12 transition-all duration-500 ${getEmptyStateStyles()}`}>
            <CardContent>
              <Beer className={`h-16 w-16 mx-auto mb-4 transition-colors duration-500 ${getIconColor()}`} />
              <h3 className="text-xl font-bold mb-2">
                Nenhuma opinião ainda
              </h3>
              <p className="mb-4">
                Seja o primeiro a compartilhar sua experiência com esta cerveja!
              </p>
              {!user && (
                <Button className={getButtonStyles()}>
                  Fazer Login para Comentar
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Comentários Visíveis */}
            <div className="space-y-6">
              {visibleComments.map((comment) => (
                <CommentItem
                  key={comment.uuid}
                  comment={comment}
                  currentUserUuid={user?.uuid || null}
                  cervejaId={cervejaId}
                  onRefetch={() => {
                    invalidateCache(cervejaId)
                    fetchComments(true)
                  }}
                  onUpdateBeer={onUpdateBeer}
                  currentTheme={currentTheme}
                />
              ))}
            </div>

            {/* Botão Ver Mais/Menos Comentários */}
            {hasMoreComments && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllComments(!showAllComments)}
                  className={`border transition-all duration-500 ${
                    currentTheme === 'light' 
                      ? 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                      : currentTheme === 'fresh'
                      ? 'border-sky-300 text-sky-700 hover:bg-sky-50 hover:text-sky-800'
                      : 'border-amber-600 text-amber-300 hover:bg-amber-800 hover:text-amber-100'
                  } gap-2`}
                >
                  {showAllComments ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ver Menos Comentários
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Ver Todos os {comments.length} Comentários
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ✅ EXPORT DEFAULT CORRETO NO FINAL DO ARQUIVO
export default CommentsSection