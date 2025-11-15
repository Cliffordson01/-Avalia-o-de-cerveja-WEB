"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft, Heart, ThumbsUp, Star, MapPin, Droplet, Wine, Thermometer, UtensilsCrossed, MessageCircle, ThumbsUp as LikeIcon, ThumbsDown as DislikeIcon, Send, MoreHorizontal, Edit, Trash2, Reply, Trophy, Award, Medal, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BeerInfo {
  origem?: string | null
  teor_alcoolico?: number | null
  amargor?: number | null
  aparencia?: string | null
  aroma?: string | null
  sabor?: string | null
  corpo_textura?: string | null
  harmonizacao?: string | null
  temperatura_ideal?: string | null
  impressao_geral?: string | null
}

interface BeerRanking {
  posicao?: number | null
  media_avaliacao?: number
  total_votos?: number
  total_favoritos?: number
  total_comentarios?: number
  taças_breja?: number
}

interface Selo {
  tipo: string
  imagem_url?: string
}

interface BeerDetail {
  uuid: string
  nome: string
  marca: string
  imagem_main?: string | null
  lista_de_imagem?: string[] | null
  informacao: BeerInfo[]
  ranking: BeerRanking[]
  selo?: Selo[]
}

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

interface AuthUser {
  id: string
  email?: string
}

interface CommentLike {
  comentario_id: string
  tipo: 'curtida' | 'descurtida'
}

interface SupabaseComment {
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
}

interface CommentId {
  uuid: string
  usuario_id: string
}

export default function BeerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [beer, setBeer] = useState<BeerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currentUserUuid, setCurrentUserUuid] = useState<string | null>(null)
  const [userRating, setUserRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState("")

  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id

  const seloOuro = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/ouro.png`
  const seloPrata = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/prata.png`
  const seloBronze = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/selos/bronze.png`

  // Verificar usuário
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      // Buscar o UUID do usuário na tabela usuario
      if (currentUser?.email) {
        const { data: usuarioData } = await supabase
          .from("usuario")
          .select("uuid")
          .eq("email", currentUser.email)
          .single()
        
        if (usuarioData) {
          setCurrentUserUuid(usuarioData.uuid)
        }
      }
    }
    checkUser()
  }, [supabase.auth])

  // Buscar dados da cerveja
  useEffect(() => {
    if (id && id !== "undefined" && id !== "null") {
      fetchBeer()
      fetchComments()
    }
  }, [id])

  // Verificar interações do usuário quando currentUserUuid mudar
  useEffect(() => {
    if (currentUserUuid && id) {
      checkUserInteractions()
    }
  }, [currentUserUuid, id])

  const fetchBeer = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      
      const { data: cervejaData, error: cervejaError } = await supabase
        .from("cerveja")
        .select("uuid, marca, nome, imagem_main, lista_de_imagem, ativo")
        .eq("uuid", id)
        .maybeSingle()

      if (cervejaError) throw cervejaError
      if (!cervejaData) {
        setBeer(null)
        setLoading(false)
        return
      }

      const [infoResponse, rankingResponse] = await Promise.all([
        supabase.from("informacao").select("*").eq("cerveja_id", id).limit(1),
        supabase.from("ranking").select("*").eq("cerveja_id", id).limit(1),
      ])

      const selo: Selo[] = []
      if (rankingResponse.data && rankingResponse.data[0]?.posicao) {
        const posicao = rankingResponse.data[0].posicao
        if (posicao === 1) {
          selo.push({ tipo: "ouro", imagem_url: seloOuro })
        } else if (posicao === 2) {
          selo.push({ tipo: "prata", imagem_url: seloPrata })
        } else if (posicao === 3) {
          selo.push({ tipo: "bronze", imagem_url: seloBronze })
        }
      }

      const beerWithDetails: BeerDetail = {
        ...cervejaData,
        informacao: infoResponse.data || [],
        ranking: rankingResponse.data || [],
        selo: selo
      }

      setBeer(beerWithDetails)
    } catch (error) {
      console.error("Error fetching beer:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar cerveja",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, supabase, toast, seloOuro, seloPrata, seloBronze])

  const fetchComments = useCallback(async () => {
    if (!id) return

    try {
      setCommentsLoading(true)
      
      console.log("🔍 Buscando comentários para cerveja:", id)
      
      // Buscar todos os comentários de uma vez
      const { data: allComments, error: commentsError } = await supabase
        .from("comentario")
        .select("*")
        .eq("cerveja_id", id)
        .eq("deletado", false)
        .order("criado_em", { ascending: true })

      if (commentsError) {
        console.error("❌ Erro ao buscar comentários:", commentsError)
        throw commentsError
      }

      console.log("📝 Comentários encontrados:", allComments?.length || 0)

      if (!allComments || allComments.length === 0) {
        setComments([])
        return
      }

      // Buscar dados dos usuários separadamente
      const userIds = [...new Set(allComments.map((comment: SupabaseComment) => comment.usuario_id))]
      console.log("👥 IDs de usuários para buscar:", userIds)

      const { data: usersData, error: usersError } = await supabase
        .from("usuario")
        .select("uuid, nome, foto_url")
        .in("uuid", userIds)

      if (usersError) {
        console.error("❌ Erro ao buscar usuários:", usersError)
        throw usersError
      }

      console.log("👤 Dados dos usuários encontrados:", usersData)

      // Criar mapa de usuários para acesso rápido
      const usersMap = new Map<string, CommentUser>()
      usersData?.forEach((userData: CommentUser) => {
        usersMap.set(userData.uuid, {
          uuid: userData.uuid,
          nome: userData.nome || "Usuário Anônimo",
          foto_url: userData.foto_url
        })
      })

      console.log("🗺️ Mapa de usuários criado:", usersMap)

      // Buscar interações do usuário atual
      let userInteractions: { [key: string]: CommentInteraction } = {}
      
      if (currentUserUuid) {
        const { data: userLikes } = await supabase
          .from("comentario_curtida")
          .select("comentario_id, tipo")
          .eq("usuario_id", currentUserUuid)

        if (userLikes) {
          userLikes.forEach((like: CommentLike) => {
            userInteractions[like.comentario_id] = { tipo: like.tipo }
          })
        }
      }

      // Buscar contadores de curtidas/descurtidas
      const commentIds = allComments.map((c: SupabaseComment) => c.uuid)
      const { data: likesCount } = await supabase
        .from("comentario_curtida")
        .select("comentario_id, tipo")
        .in("comentario_id", commentIds)

      // Criar contadores
      const likesMap: { [key: string]: { curtidas: number, descurtidas: number } } = {}
      
      allComments.forEach((comment: SupabaseComment) => {
        likesMap[comment.uuid] = { curtidas: 0, descurtidas: 0 }
      })

      if (likesCount) {
        likesCount.forEach((like: CommentLike) => {
          if (likesMap[like.comentario_id]) {
            if (like.tipo === 'curtida') {
              likesMap[like.comentario_id].curtidas++
            } else if (like.tipo === 'descurtida') {
              likesMap[like.comentario_id].descurtidas++
            }
          }
        })
      }

      // Processar comentários para estrutura hierárquica
      const commentsMap = new Map<string, Comment>()
      const mainComments: Comment[] = []

      // Primeiro, criar mapa de todos os comentários
      allComments.forEach((comment: SupabaseComment) => {
        const userData = usersMap.get(comment.usuario_id)
        
        if (!userData) {
          console.warn(`❌ Usuário não encontrado para ID: ${comment.usuario_id}`)
        }

        const commentWithUser: Comment = {
          ...comment,
          usuario: userData || {
            uuid: comment.usuario_id,
            nome: "Usuário Anônimo",
            foto_url: null
          },
          curtidas: likesMap[comment.uuid]?.curtidas || 0,
          descurtidas: likesMap[comment.uuid]?.descurtidas || 0,
          user_interaction: userInteractions[comment.uuid],
          replies: []
        }
        commentsMap.set(comment.uuid, commentWithUser)
        
        console.log(`💬 Comentário ${comment.uuid} - Usuário:`, commentWithUser.usuario)
      })

      // Agora organizar hierarquicamente
      allComments.forEach((comment: SupabaseComment) => {
        const currentComment = commentsMap.get(comment.uuid)!
        
        if (comment.reply_to_comment_id) {
          // É uma reply, adicionar ao comentário pai
          const parentComment = commentsMap.get(comment.reply_to_comment_id)
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = []
            }
            parentComment.replies.push(currentComment)
          }
        } else {
          // É um comentário principal
          mainComments.push(currentComment)
        }
      })

      // Ordenar comentários principais por data (mais recentes primeiro)
      mainComments.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

      console.log("🔄 Comentários processados:", mainComments.length)
      if (mainComments.length > 0) {
        console.log("👤 Exemplo de dados do primeiro comentário:", mainComments[0]?.usuario)
      }
      setComments(mainComments)

    } catch (error) {
      console.error("❌ Error fetching comments:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar comentários",
        variant: "destructive",
      })
    } finally {
      setCommentsLoading(false)
    }
  }, [id, supabase, toast, currentUserUuid])

  const checkUserInteractions = useCallback(async () => {
    if (!currentUserUuid || !id) return

    try {
      console.log("🔍 Verificando interações do usuário:", currentUserUuid, "para cerveja:", id)
      
      const [
        { data: rating },
        { data: favorite },
        { data: vote }
      ] = await Promise.all([
        supabase
          .from("avaliacao")
          .select("quantidade_estrela")
          .eq("usuario_id", currentUserUuid)
          .eq("cerveja_id", id)
          .eq("deletado", false)
          .maybeSingle(),
        supabase
          .from("favorito")
          .select("uuid")
          .eq("usuario_id", currentUserUuid)
          .eq("cerveja_id", id)
          .eq("deletado", false)
          .maybeSingle(),
        supabase
          .from("voto")
          .select("uuid")
          .eq("usuario_id", currentUserUuid)
          .eq("cerveja_id", id)
          .eq("deletado", false)
          .maybeSingle(),
      ])

      console.log("⭐ Avaliação encontrada:", rating)
      console.log("❤️ Favorito encontrado:", favorite)
      console.log("👍 Voto encontrado:", vote)

      if (rating) {
        setUserRating(rating.quantidade_estrela)
      } else {
        setUserRating(0)
      }
      setIsFavorited(!!favorite)
      setHasVoted(!!vote)
    } catch (error) {
      console.error("Error checking interactions:", error)
    }
  }, [currentUserUuid, id, supabase])

  const handleRating = async (rating: number) => {
    if (!currentUserUuid) {
      showLoginError("avaliar")
      return
    }

    try {
      const { error } = await supabase
        .from("avaliacao")
        .upsert(
          {
            usuario_id: currentUserUuid,
            cerveja_id: id,
            quantidade_estrela: rating,
            deletado: false,
          },
          {
            onConflict: "usuario_id,cerveja_id",
          }
        )

      if (error) throw error

      setUserRating(rating)
      toast({
        title: "Sucesso!",
        description: "Avaliação registrada!",
      })
      fetchBeer()
    } catch (error) {
      console.error("Error rating:", error)
      toast({
        title: "Erro",
        description: "Erro ao avaliar",
        variant: "destructive",
      })
    }
  }

  const handleVote = async () => {
    if (!currentUserUuid) {
      showLoginError("votar")
      return
    }

    try {
      if (hasVoted) {
        const { error } = await supabase
          .from("voto")
          .update({ deletado: true })
          .eq("usuario_id", currentUserUuid)
          .eq("cerveja_id", id)

        if (error) throw error

        setHasVoted(false)
        toast({
          title: "Voto removido",
          description: "Seu voto foi cancelado",
        })
      } else {
        const { error } = await supabase
          .from("voto")
          .upsert(
            {
              usuario_id: currentUserUuid,
              cerveja_id: id,
              quantidade: 1,
              deletado: false,
            },
            {
              onConflict: "usuario_id,cerveja_id",
            }
          )

        if (error) throw error

        setHasVoted(true)
        toast({
          title: "Sucesso!",
          description: "Voto registrado!",
        })
      }
      fetchBeer()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Erro",
        description: "Erro ao votar",
        variant: "destructive",
      })
    }
  }

  const handleFavorite = async () => {
    if (!currentUserUuid) {
      showLoginError("favoritar")
      return
    }

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", currentUserUuid)
          .eq("cerveja_id", id)

        if (error) throw error

        setIsFavorited(false)
        toast({
          title: "Removido",
          description: "Removido dos favoritos",
        })
      } else {
        const { error } = await supabase
          .from("favorito")
          .upsert(
            {
              usuario_id: currentUserUuid,
              cerveja_id: id,
              deletado: false,
            },
            {
              onConflict: "usuario_id,cerveja_id",
            }
          )

        if (error) throw error

        setIsFavorited(true)
        toast({
          title: "Sucesso!",
          description: "Adicionado aos favoritos!",
        })
      }
      fetchBeer()
    } catch (error) {
      console.error("Error favoriting:", error)
      toast({
        title: "Erro",
        description: "Erro ao favoritar",
        variant: "destructive",
      })
    }
  }

  const showLoginError = (action: string) => {
    toast({
      title: "Login necessário",
      description: `Você precisa estar logado para ${action}.`,
      variant: "destructive",
    })
    router.push("/login")
  }

  const handleSubmitComment = async () => {
    if (!currentUserUuid) {
      showLoginError("comentar")
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comentário",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("comentario")
        .insert({
          usuario_id: currentUserUuid,
          cerveja_id: id,
          descricao: newComment.trim(),
          reply_to_comment_id: null,
        })

      if (error) throw error

      setNewComment("")
      toast({
        title: "Sucesso!",
        description: "Comentário publicado!",
      })
      fetchComments()
      fetchBeer()
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao publicar comentário",
        variant: "destructive",
      })
    }
  }

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return

    try {
      const { error } = await supabase
        .from("comentario")
        .update({
          descricao: newText.trim(),
          editado_em: new Date().toISOString(),
        })
        .eq("uuid", commentId)

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: "Comentário editado!",
      })
      fetchComments()
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao editar comentário",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comentario")
        .update({ deletado: true })
        .eq("uuid", commentId)

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: "Comentário excluído!",
      })
      fetchComments()
      fetchBeer()
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir comentário",
        variant: "destructive",
      })
    }
  }

  const handleCommentReaction = async (commentId: string, tipo: 'curtida' | 'descurtida') => {
    if (!currentUserUuid) {
      showLoginError("curtir comentários")
      return
    }

    try {
      // Verificar se já existe uma reação do usuário
      const { data: existingReaction } = await supabase
        .from("comentario_curtida")
        .select("tipo")
        .eq("usuario_id", currentUserUuid)
        .eq("comentario_id", commentId)
        .maybeSingle()

      if (existingReaction) {
        if (existingReaction.tipo === tipo) {
          // Remover reação se for a mesma
          const { error } = await supabase
            .from("comentario_curtida")
            .delete()
            .eq("usuario_id", currentUserUuid)
            .eq("comentario_id", commentId)

          if (error) throw error
        } else {
          // Atualizar reação se for diferente
          const { error } = await supabase
            .from("comentario_curtida")
            .update({ tipo })
            .eq("usuario_id", currentUserUuid)
            .eq("comentario_id", commentId)

          if (error) throw error
        }
      } else {
        // Adicionar nova reação
        const { error } = await supabase
          .from("comentario_curtida")
          .insert({
            usuario_id: currentUserUuid,
            comentario_id: commentId,
            tipo,
          })

        if (error) throw error
      }

      // Recarregar comentários para atualizar contadores
      fetchComments()
    } catch (error) {
      console.error("Error reacting to comment:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar reação",
        variant: "destructive",
      })
    }
  }

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isOwner = currentUserUuid === comment.usuario_id
    const userReaction = comment.user_interaction
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [localReplyText, setLocalReplyText] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(comment.descricao)

    const handleLocalSubmitReply = async () => {
      if (!localReplyText.trim()) return
      
      try {
        const { error } = await supabase
          .from("comentario")
          .insert({
            usuario_id: currentUserUuid!,
            cerveja_id: id!,
            descricao: localReplyText.trim(),
            reply_to_comment_id: comment.uuid,
          })

        if (error) throw error

        setLocalReplyText("")
        setShowReplyInput(false)
        toast({
          title: "Sucesso!",
          description: "Resposta publicada!",
        })
        fetchComments()
        fetchBeer()
      } catch (error) {
        console.error("Error submitting reply:", error)
        toast({
          title: "Erro",
          description: "Erro ao publicar resposta",
          variant: "destructive",
        })
      }
    }

    const handleSaveEdit = async () => {
      if (!editText.trim()) return
      await handleEditComment(comment.uuid, editText)
      setIsEditing(false)
    }

    const handleCancelEdit = () => {
      setEditText(comment.descricao)
      setIsEditing(false)
    }

    return (
      <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4 mt-4' : 'mt-6'}`}>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {comment.usuario?.foto_url ? (
                    <Image
                      src={comment.usuario.foto_url}
                      alt={comment.usuario.nome}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      {comment.usuario?.nome?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {comment.usuario?.nome || "Usuário Anônimo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.criado_em).toLocaleDateString('pt-BR')}
                    {comment.editado_em && " (editado)"}
                  </p>
                </div>
              </div>

              {isOwner && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setIsEditing(true)
                      setEditText(comment.descricao)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteComment(comment.uuid)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Edite seu comentário..."
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSaveEdit}
                    disabled={!editText.trim() || editText === comment.descricao}
                  >
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mb-3 whitespace-pre-wrap text-foreground">{comment.descricao}</p>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 ${
                      userReaction?.tipo === 'curtida' ? 'text-green-600 bg-green-50' : 'text-muted-foreground'
                    }`}
                    onClick={() => handleCommentReaction(comment.uuid, 'curtida')}
                    disabled={!currentUserUuid}
                  >
                    <LikeIcon className="h-4 w-4" />
                    <span>{comment.curtidas || 0}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 ${
                      userReaction?.tipo === 'descurtida' ? 'text-red-600 bg-red-50' : 'text-muted-foreground'
                    }`}
                    onClick={() => handleCommentReaction(comment.uuid, 'descurtida')}
                    disabled={!currentUserUuid}
                  >
                    <DislikeIcon className="h-4 w-4" />
                    <span>{comment.descurtidas || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-muted-foreground"
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    disabled={!currentUserUuid}
                  >
                    <Reply className="h-4 w-4" />
                    Responder
                  </Button>
                </div>

                {showReplyInput && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={localReplyText}
                      onChange={(e) => setLocalReplyText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleLocalSubmitReply}
                        disabled={!localReplyText.trim() || !currentUserUuid}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publicar Resposta
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setShowReplyInput(false)
                          setLocalReplyText("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Replies */}
        {comment.replies?.map((reply) => (
          <CommentItem key={reply.uuid} comment={reply} depth={depth + 1} />
        ))}
      </div>
    )
  }

  const renderRankingBadge = () => {
    const ranking = beer?.ranking?.[0]
    const selo = beer?.selo?.[0]

    if (selo?.imagem_url) {
      return (
        <div className="absolute right-4 top-4 z-10">
          <div className="relative h-20 w-20">
            <Image
              src={selo.imagem_url}
              alt={`Selo de ${selo.tipo}`}
              fill
              className="object-contain drop-shadow-2xl animate-pulse"
            />
          </div>
        </div>
      )
    } else if (selo?.tipo) {
      return (
        <div className="absolute right-4 top-4 z-10">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl ${
            selo.tipo === "ouro" ? "bg-yellow-500 text-white" :
            selo.tipo === "prata" ? "bg-gray-400 text-white" :
            "bg-amber-700 text-white"
          }`}>
            {selo.tipo === "ouro" && <Trophy className="h-8 w-8" />}
            {selo.tipo === "prata" && <Award className="h-8 w-8" />}
            {selo.tipo === "bronze" && <Medal className="h-8 w-8" />}
          </div>
        </div>
      )
    } else if (ranking?.posicao && ranking.posicao <= 10) {
      return (
        <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-white shadow-2xl">
          #{ranking.posicao}
        </div>
      )
    } else if (ranking?.posicao) {
      return (
        <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground shadow-lg">
          #{ranking.posicao}
        </div>
      )
    }

    return null
  }

  if (!id || id === "undefined" || id === "null") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl text-muted-foreground">ID da cerveja ausente ou inválido na URL.</p>
        <Button asChild>
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando cerveja...</p>
        </div>
      </div>
    )
  }

  if (!beer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl text-muted-foreground">Cerveja não encontrada</p>
        <Button asChild>
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    )
  }

  const info = beer.informacao[0]
  const ranking = beer.ranking[0]
  const selo = beer.selo?.[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-amber-50/30 pb-12">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Button asChild variant="outline" className="mb-6 bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Image */}
          <div className="relative">
            <div className="sticky top-6">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl relative">
                <Image
                  src={beer.imagem_main || "/placeholder.svg"}
                  alt={beer.nome}
                  width={600}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                />
                
                {/* Selo ou posição no ranking */}
                {renderRankingBadge()}

                {/* Badge de destaque se estiver no top 3 */}
                {selo && (
                  <div className="absolute left-4 top-4 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm px-3 py-1 shadow-lg">
                      {selo.tipo === "ouro" && "🥇 TOP 1"}
                      {selo.tipo === "prata" && "🥈 TOP 2"}
                      {selo.tipo === "bronze" && "🥉 TOP 3"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-amber-600 sm:text-base">{beer.marca}</p>
              <h1 className="mb-4 font-bebas text-3xl font-bold text-gray-800 sm:text-4xl lg:text-5xl text-balance">
                {beer.nome}
              </h1>
              
              {/* Status do ranking */}
              {ranking?.posicao && (
                <div className="mb-4">
                  {selo ? (
                    <Badge variant="secondary" className="text-base bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300">
                      <Trophy className="h-4 w-4 mr-1" />
                      {selo.tipo === "ouro" && "Ranking: 🥇 1º Lugar (Ouro)"}
                      {selo.tipo === "prata" && "Ranking: 🥈 2º Lugar (Prata)"}
                      {selo.tipo === "bronze" && "Ranking: 🥉 3º Lugar (Bronze)"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-base">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Ranking: #{ranking.posicao}º Lugar
                    </Badge>
                  )}
                </div>
              )}

              <div className="mb-6 flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-base">
                  ★ {(ranking?.media_avaliacao || 0).toFixed(1)}
                </Badge>
                <Badge variant="outline" className="text-base">
                  {ranking?.total_votos || 0} votos
                </Badge>
                <Badge variant="outline" className="text-base">
                  <Heart className="mr-1 h-4 w-4" />
                  {ranking?.total_favoritos || 0}
                </Badge>
                <Badge variant="outline" className="text-base">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {ranking?.total_comentarios || 0}
                </Badge>
                <Badge variant="outline" className="text-base">
                    <Trophy className="mr-1 h-4 w-4" />
                    {ranking.taças_breja}
                </Badge>
              
                


              </div>
            </div>

            {/* Rating Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-bold">Avalie esta cerveja</h3>
                <div className="mb-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                      disabled={!currentUserUuid}
                    >
                      <Star
                        className={`h-8 w-8 sm:h-10 sm:w-10 ${
                          star <= (hoveredRating || userRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                        } ${!currentUserUuid ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  {userRating > 0
                    ? `Sua avaliação: ${userRating} estrela${userRating > 1 ? "s" : ""}`
                    : currentUserUuid ? "Clique nas estrelas para avaliar" : "Faça login para avaliar"}
                </p>
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" onClick={handleVote} disabled={!currentUserUuid}>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {hasVoted ? "Votado (Cancelar)" : "Votar"}
                  </Button>
                  <Button size="lg" variant={isFavorited ? "default" : "outline"} onClick={handleFavorite} disabled={!currentUserUuid}>
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            {info && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <h3 className="mb-4 text-xl font-bold">Informações</h3>

                  {info.origem && (
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Origem</p>
                        <p className="text-foreground">{info.origem}</p>
                      </div>
                    </div>
                  )}

                  {info.teor_alcoolico && (
                    <div className="flex gap-3">
                      <Droplet className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Teor Alcoólico</p>
                        <p className="text-foreground">{info.teor_alcoolico}%</p>
                      </div>
                    </div>
                  )}

                  {info.amargor && (
                    <div className="flex gap-3">
                      <Wine className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Amargor (IBU)</p>
                        <p className="text-foreground">{info.amargor}</p>
                      </div>
                    </div>
                  )}

                  {info.temperatura_ideal && (
                    <div className="flex gap-3">
                      <Thermometer className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Temperatura Ideal</p>
                        <p className="text-foreground">{info.temperatura_ideal}</p>
                      </div>
                    </div>
                  )}

                  {info.harmonizacao && (
                    <div className="flex gap-3">
                      <UtensilsCrossed className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Harmonização</p>
                        <p className="text-foreground">{info.harmonizacao}</p>
                      </div>
                    </div>
                  )}

                  {(info.aparencia || info.aroma || info.sabor || info.corpo_textura) && (
                    <>
                      <div className="border-t pt-4" />

                      {info.aparencia && (
                        <div>
                          <p className="mb-1 text-sm font-semibold text-muted-foreground">Aparência</p>
                          <p className="text-sm text-foreground">{info.aparencia}</p>
                        </div>
                      )}

                      {info.aroma && (
                        <div>
                          <p className="mb-1 text-sm font-semibold text-muted-foreground">Aroma</p>
                          <p className="text-sm text-foreground">{info.aroma}</p>
                        </div>
                      )}

                      {info.sabor && (
                        <div>
                          <p className="mb-1 text-sm font-semibold text-muted-foreground">Sabor</p>
                          <p className="text-sm text-foreground">{info.sabor}</p>
                        </div>
                      )}

                      {info.corpo_textura && (
                        <div>
                          <p className="mb-1 text-sm font-semibold text-muted-foreground">Corpo e Textura</p>
                          <p className="text-sm text-foreground">{info.corpo_textura}</p>
                        </div>
                      )}
                    </>
                  )}

                  {info.impressao_geral && (
                    <>
                      <div className="border-t pt-4" />
                      <div>
                        <p className="mb-2 text-sm font-semibold text-muted-foreground">Impressão Geral</p>
                        <p className="text-sm italic text-foreground">{info.impressao_geral}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <h2 className="mb-6 font-bebas text-3xl tracking-wide">
            Comentários ({ranking?.total_comentarios || 0})
          </h2>

          {/* Add Comment */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <Textarea
                placeholder={currentUserUuid ? "Deixe seu comentário..." : "Faça login para comentar"}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-4 min-h-[100px]"
                disabled={!currentUserUuid}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || !currentUserUuid}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Comentário
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {commentsLoading ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Carregando comentários...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem key={comment.uuid} comment={comment} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}