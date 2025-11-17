// components/profile-image-uploader.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ProfileImageUploaderProps {
  initialUser: {
    uuid: string
    nome?: string
    foto_url?: string
  }
  userId: string
}

export function ProfileImageUploader({ initialUser, userId }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialUser.foto_url || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // ✅ ATUALIZAR o estado local quando a foto_url mudar
  useEffect(() => {
    setImageUrl(initialUser.foto_url || "")
  }, [initialUser.foto_url])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      const file = event.target.files?.[0]
      if (!file) return

      // Validar tamanho do arquivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB")
        return
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem válida")
        return
      }

      // Otimizar imagem
      const optimizedFile = await optimizeImage(file)

      const fileExt = optimizedFile.name.split('.').pop() || 'jpg'
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // ✅ 1. Fazer upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("❌ Erro no upload:", uploadError)
        toast.error("Erro no upload da imagem")
        return
      }

      // ✅ 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // ✅ 3. ATUALIZAR perfil do usuário na tabela usuario
      const { error: updateError } = await supabase
        .from("usuario")
        .update({ 
          foto_url: publicUrl,
          atualizado_em: new Date().toISOString()
        })
        .eq("uuid", initialUser.uuid)

      if (updateError) {
        console.error("❌ Erro ao atualizar perfil:", updateError)
        toast.error("Erro ao salvar no banco de dados")
        return
      }

      // ✅ 4. Atualizar estado local
      setImageUrl(publicUrl + '?t=' + Date.now())
      
      toast.success("Foto de perfil atualizada com sucesso!")

      // ✅ 5. Forçar atualização completa da página
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      console.error("💥 Erro inesperado:", error)
      toast.error("Erro ao fazer upload da imagem")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Função para otimizar imagem
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size < 1024 * 1024) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          const maxSize = 500
          let width = img.width
          let height = img.height
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(optimizedFile)
            } else {
              resolve(file)
            }
          }, 'image/jpeg', 0.8)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
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
        {/* Avatar Image ou Placeholder */}
        {imageUrl ? (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            <img
              src={imageUrl}
              alt={`Foto de ${initialUser.nome || 'Usuário'}`}
              className="w-full h-full rounded-full object-cover border-4 border-primary/20 shadow-lg theme-transition group-hover:border-primary/40"
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

        {/* Overlay de Upload */}
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

      {/* Botão de Upload para Mobile */}
      <div className="mt-3 flex justify-center md:hidden">
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
      </div>
    </div>
  )
}