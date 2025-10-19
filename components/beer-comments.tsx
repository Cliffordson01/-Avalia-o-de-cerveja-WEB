"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MessageCircle, ThumbsUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Comment {
  uuid: string
  usuario_id: string
  cerveja_id: string
  descricao: string
  curtidas: number
  descurtidas: number
  criado_em: string
  editado_em: string | null
  deletado: boolean
  usuario: {
    uuid: string
    nome: string
    foto_url: string | null
  }
}

interface BeerCommentsProps {
  cervejaId: string
  userId?: string
}

export function BeerComments({ cervejaId, userId }: BeerCommentsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)

  useEffect(() => {
    loadComments()
  }, [cervejaId])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from("comentario")
        .select(`
          *,
          usuario:usuario_id (uuid, nome, foto_url)
        `)
        .eq("cerveja_id", cervejaId)
        .eq("deletado", false)
        .order("criado_em", { ascending: false })

      if (error) throw error

      // Get like counts for each comment
      const commentsWithLikes = await Promise.all(
        (data || []).map(async (comment: Comment) => {
          const { count: likesCount } = await supabase
            .from("comentario_curtida")
            .select("*", { count: "exact", head: true })
            .eq("comentario_id", comment.uuid)
            .eq("tipo", "curtida")

          const { count: dislikesCount } = await supabase
            .from("comentario_curtida")
            .select("*", { count: "exact", head: true })
            .eq("comentario_id", comment.uuid)
            .eq("tipo", "descurtida")

          return {
            ...comment,
            curtidas: likesCount || 0,
            descurtidas: dislikesCount || 0,
          }
        }),
      )

      setComments(commentsWithLikes)
    } catch (error: any) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Digite algo antes de enviar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("comentario").insert({
        usuario_id: userId,
        cerveja_id: cervejaId,
        descricao: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      toast({
        title: "Comentário enviado!",
        description: "Seu comentário foi publicado.",
      })

      loadComments()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("comentario")
        .update({ deletado: true })
        .eq("uuid", commentId)
        .eq("usuario_id", userId)

      if (error) throw error

      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi removido.",
      })

      loadComments()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleLikeComment = async (commentId: string, tipo: 'curtida' | 'descurtida') => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      // Check if already reacted
      const { data: existingReaction } = await supabase
        .from("comentario_curtida")
        .select("tipo")
        .eq("usuario_id", userId)
        .eq("comentario_id", commentId)
        .maybeSingle()

      if (existingReaction) {
        if (existingReaction.tipo === tipo) {
          // Remove reaction
          await supabase
            .from("comentario_curtida")
            .delete()
            .eq("usuario_id", userId)
            .eq("comentario_id", commentId)
        } else {
          // Update reaction
          await supabase
            .from("comentario_curtida")
            .update({ tipo })
            .eq("usuario_id", userId)
            .eq("comentario_id", commentId)
        }
      } else {
        // Add reaction
        await supabase.from("comentario_curtida").insert({
          usuario_id: userId,
          comentario_id: commentId,
          tipo,
        })
      }

      loadComments()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="font-bebas text-3xl tracking-wide">Comentários</h2>
      </div>

      {/* Comment Form */}
      {userId && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Compartilhe sua opinião sobre esta cerveja..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button type="submit" disabled={loading || !newComment.trim()}>
                {loading ? "Enviando..." : "Enviar Comentário"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loadingComments ? (
          <p className="text-center text-muted-foreground">Carregando comentários...</p>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.uuid}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={comment.usuario?.foto_url || "/placeholder.svg"} />
                    <AvatarFallback>{comment.usuario?.nome?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{comment.usuario?.nome || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(comment.criado_em).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {comment.editado_em && " (editado)"}
                        </p>
                      </div>

                      {userId === comment.usuario_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.uuid)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="mb-3 text-foreground leading-relaxed">{comment.descricao}</p>

                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLikeComment(comment.uuid, 'curtida')}
                      >
                        <ThumbsUp className="mr-1 h-4 w-4" />
                        {comment.curtidas || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLikeComment(comment.uuid, 'descurtida')}
                      >
                        <ThumbsUp className="mr-1 h-4 w-4 rotate-180" />
                        {comment.descurtidas || 0}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}