"use client"

import { useState, useEffect, useCallback } from "react"
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

// 🔥 HOOK PARA DEBOUNCE (evita múltiplas renderizações)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

export default function ProfileNameEditorOptimized({ initialName, userId, userEmail }: ProfileNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const supabase = useSupabase()
  const debouncedName = useDebounce(name, 300) // 🔥 Debounce de 300ms

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  useEffect(() => {
    // 🔥 Verifica se houve mudanças reais
    setHasChanges(name.trim() !== initialName && name.trim().length > 0)
  }, [name, initialName])

  // 🔥 FUNÇÃO OTIMIZADA COM USE_CALLBACK
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      setIsEditing(false)
      return
    }

    setLoading(true)

    try {
      // 🔥 VERIFICAÇÃO DIRETA DE AUTENTICAÇÃO
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      // 🔥 ESTRATÉGIA OTIMIZADA: tenta primeiro com user.id (mais comum)
      let updateSuccess = false
      
      // Tentativa 1: UUID do Auth (mais rápido)
      const { error: authUpdateError } = await supabase
        .from("usuario")
        .update({ 
          nome: debouncedName.trim(),
          atualizado_em: new Date().toISOString()
        })
        .eq("uuid", user.id)

      if (!authUpdateError) {
        updateSuccess = true
      } else {
        // Tentativa 2: UUID do perfil
        const { error: profileUpdateError } = await supabase
          .from("usuario")
          .update({ nome: debouncedName.trim() })
          .eq("uuid", userId)

        if (!profileUpdateError) {
          updateSuccess = true
        } else {
          // Tentativa 3: Fallback por email
          const { error: emailUpdateError } = await supabase
            .from("usuario")
            .update({ nome: debouncedName.trim() })
            .eq("email", user.email)

          updateSuccess = !emailUpdateError
        }
      }

      if (!updateSuccess) {
        toast.error("Erro ao atualizar nome")
        return
      }

      toast.success("Nome atualizado!")
      setIsEditing(false)
      
      // 🔥 RELOAD INTELIGENTE (só se necessário)
      if (window.location.pathname.includes('/perfil')) {
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }

    } catch (error: any) {
      console.error("Update error:", error)
      toast.error("Erro inesperado")
    } finally {
      setLoading(false)
    }
  }, [debouncedName, hasChanges, supabase, userId])

  // 🔥 CANCELAR OTIMIZADO
  const handleCancel = useCallback(() => {
    setName(initialName)
    setIsEditing(false)
  }, [initialName])

  // 🔥 HANDLE KEYDOWN OTIMIZADO
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  return (
    <div className="space-y-3">
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="text-center text-lg sm:text-xl font-bebas tracking-wide bg-background border-primary/40 focus:border-primary"
            autoFocus
            onKeyDown={handleKeyDown}
            maxLength={50} // 🔥 LIMITE DE CARACTERES
            disabled={loading}
          />

          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="bg-green-600 hover:bg-green-700 text-white min-w-20"
            >
              {loading ? (
                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              )}
              {loading ? '' : 'Salvar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="min-w-20"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Cancelar
            </Button>
          </div>

          {/* 🔥 FEEDBACK VISUAL DE CARACTERES */}
          <div className="text-xs text-center text-muted-foreground">
            {name.length}/50 caracteres
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="font-bebas text-2xl sm:text-3xl lg:text-4xl tracking-wide text-foreground break-word">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground break-word">
            {userEmail}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Editar nome
          </Button>
        </div>
      )}
    </div>
  )
}