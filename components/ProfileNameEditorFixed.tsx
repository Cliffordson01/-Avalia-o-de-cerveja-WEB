"use client"

import { useState, useEffect } from "react"
import { Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSupabase } from "@/hooks/useSupabase"

interface ProfileNameEditorProps {
  initialName: string
  userId: string
  userEmail: string
}

export default function ProfileNameEditorFixed({ initialName, userId, userEmail }: ProfileNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  
  const supabase = useSupabase()

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  const handleSave = async () => {
    if (!name.trim() || name.trim() === initialName) {
      if (name.trim() === initialName) {
        setIsEditing(false)
      }
      return
    }

    setLoading(true)

    try {
      // 1. Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error("Usuário não autenticado")
        return
      }

      // 2. Primeiro verificar qual UUID usar
      const { data: userByAuthId } = await supabase
        .from("usuario")
        .select("uuid")
        .eq("uuid", user.id)
        .single()

      const { data: userByProfileId } = await supabase
        .from("usuario")
        .select("uuid")
        .eq("uuid", userId)
        .single()

      const targetUuid = userByAuthId?.uuid || userByProfileId?.uuid || user.id

      // 3. Atualizar nome
      const { data, error } = await supabase
        .from("usuario")
        .update({ 
          nome: name.trim()
        })
        .eq("uuid", targetUuid)
        .select()

      if (error) {
        // Tentar atualizar por email como fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("usuario")
          .update({ nome: name.trim() })
          .eq("email", user.email)
          .select()

        if (fallbackError) {
          toast.error(`Erro ao atualizar: ${fallbackError.message}`)
          return
        }

        if (!fallbackData || fallbackData.length === 0) {
          toast.error("Nenhum perfil encontrado para atualizar")
          return
        }
      } else {
        if (!data || data.length === 0) {
          toast.error("Nenhum perfil encontrado para atualizar")
          return
        }
      }

      toast.success("Nome atualizado com sucesso!")
      setIsEditing(false)
      
      // Recarregar para ver as mudanças
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error: any) {
      toast.error("Erro inesperado ao atualizar nome")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(initialName)
    setIsEditing(false)
  }

  return (
    <div className="space-y-3">
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="text-center text-lg sm:text-xl font-bebas tracking-wide bg-background/50 border-primary/30 focus:border-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />

          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || !name.trim() || name.trim() === initialName}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="font-bebas text-2xl sm:text-3xl lg:text-4xl tracking-wide text-foreground theme-transition break-words">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground theme-transition break-words">
            {userEmail}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Editar nome
          </Button>
        </div>
      )}
    </div>
  )
}