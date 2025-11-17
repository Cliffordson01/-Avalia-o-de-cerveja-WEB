// components/profile-name-editor.tsx
"use client"

import { useState } from "react"
import { Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ProfileNameEditorProps {
  initialName: string
  userId: string
  userEmail: string
}

export function ProfileNameEditor({ initialName, userId, userEmail }: ProfileNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio")
      return
    }

    if (name === initialName) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    try {
      // ✅ PRIMEIRO: Garantir que estamos autenticados
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      // ✅ SEGUNDO: Atualizar usando o UUID correto
      const { error } = await supabase
        .from("usuario")
        .update({ 
          nome: name.trim(),
          atualizado_em: new Date().toISOString() // Campo opcional para debug
        })
        .eq("uuid", userId)

      if (error) {
        console.error("Erro detalhado:", error)
        throw error
      }

      toast.success("Nome atualizado com sucesso!")
      setIsEditing(false)
      
      // ✅ FORÇAR ATUALIZAÇÃO VISUAL IMEDIATA
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error: any) {
      console.error("Erro ao atualizar nome:", error)
      
      // ✅ MENSAGENS DE ERRO ESPECÍFICAS
      if (error.message?.includes('row-level security')) {
        toast.error("Permissão negada. Contate o administrador.")
      } else {
        toast.error("Erro ao atualizar nome: " + (error.message || 'Erro desconhecido'))
      }
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
              disabled={loading || !name.trim()}
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