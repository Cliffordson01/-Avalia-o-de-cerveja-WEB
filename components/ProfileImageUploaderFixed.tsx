"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSupabase } from "@/hooks/useSupabase"

interface ProfileImageUploaderProps {
  initialUser: {
    uuid: string
    nome?: string
    foto_url?: string
  }
  userId: string
}

export default function ProfileImageUploaderFixed({ initialUser, userId }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialUser.foto_url || "")
  const [syncLoading, setSyncLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = useSupabase()

  useEffect(() => {
    setImageUrl(initialUser.foto_url || "")
  }, [initialUser.foto_url])

  const syncUserWithAuth = async () => {
    setSyncLoading(true)
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error("Usuário não autenticado")
        return false
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("usuario")
        .select("uuid, nome, email")
        .eq("uuid", user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        toast.error("Erro ao verificar usuário")
        return false
      }

      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("usuario")
          .insert({
            uuid: user.id,
            email: user.email,
            nome: initialUser.nome || user.email?.split('@')[0] || 'Usuário',
            criado_em: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          const { error: updateError } = await supabase
            .from("usuario")
            .update({ uuid: user.id })
            .eq("email", user.email)

          if (updateError) {
            toast.error("Erro ao sincronizar usuário")
            return false
          }
        }

        toast.success("Perfil sincronizado!")
        return true
      }

      return true

    } catch (error) {
      toast.error("Erro ao sincronizar perfil")
      return false
    } finally {
      setSyncLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB")
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida")
      return
    }

    setUploading(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error("Usuário não autenticado")
        return
      }

      // Usar o user.id para o nome do arquivo
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // Fazer upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        toast.error(`Erro no upload: ${uploadError.message}`)
        return
      }

      // Obter a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Função para atualizar o banco
      const updateUserPhoto = async (userUuid: string): Promise<boolean> => {
        const { data, error } = await supabase
          .from("usuario")
          .update({ 
            foto_url: publicUrl
          })
          .eq("uuid", userUuid)
          .select()

        if (error) {
          return false
        }

        if (!data || data.length === 0) {
          return false
        }

        return true
      }

      // Tentativa 1 - UUID do Auth
      let success = await updateUserPhoto(user.id)

      // Tentativa 2 - UUID do perfil
      if (!success) {
        success = await updateUserPhoto(initialUser.uuid)
      }

      // Tentativa 3 - Sincronizar e tentar novamente
      if (!success) {
        const syncSuccess = await syncUserWithAuth()
        if (syncSuccess) {
          success = await updateUserPhoto(user.id)
        }
      }

      if (!success) {
        toast.error("Erro ao salvar a foto no perfil")
        return
      }

      // Atualizar o estado local com a NOVA URL + timestamp para evitar cache
      const newImageUrl = publicUrl + '?t=' + Date.now()
      setImageUrl(newImageUrl)
      
      toast.success("Foto de perfil atualizada com sucesso!")

      // Recarregar a página para garantir que todos os componentes vejam a nova imagem
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      toast.error("Erro inesperado ao fazer upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getUserInitials = (): string => {
    if (initialUser.nome) {
      return initialUser.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  const getUserColor = (): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-indigo-500'
    ]
    const identifier = initialUser.nome || initialUser.uuid || 'user'
    const index = identifier.length % colors.length
    return colors[index]
  }

  return (
    <div className="relative group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />
      
      <div className="relative">
        {imageUrl ? (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            <img
              src={imageUrl}
              alt={`Foto de ${initialUser.nome || 'Usuário'}`}
              className="w-full h-full rounded-full object-cover border-4 border-primary/20 shadow-lg theme-transition group-hover:border-primary/40"
              key={imageUrl}
            />
          </div>
        ) : (
          <div className={`
            w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full 
            ${getUserColor()} 
            flex items-center justify-center 
            text-white font-bold text-xl sm:text-2xl
            border-4 border-primary/20 shadow-lg
            theme-transition group-hover:border-primary/40
          `}>
            {getUserInitials()}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          {uploading ? 'Enviando...' : 'Alterar Foto'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={syncUserWithAuth}
          disabled={syncLoading}
          className="h-8 w-8 p-0"
          title="Sincronizar perfil"
        >
          <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}