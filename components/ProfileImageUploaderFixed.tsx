"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, Loader2 } from "lucide-react"
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

export default function ProfileImageUploaderOptimized({ initialUser, userId }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialUser.foto_url || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = useSupabase()

  useEffect(() => {
    setImageUrl(initialUser.foto_url || "")
  }, [initialUser.foto_url])

  // 🔥 COMPRESSÃO OTIMIZADA PARA MOBILE
  const compressImageForMobile = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      // Para mobile, compressão mais agressiva
      const maxSize = 400 // pixels (otimizado para mobile)
      const quality = 0.7 // qualidade balanceada
      
      // Se for imagem muito pequena, não comprime
      if (file.size < 300 * 1024) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          let { width, height } = img
          
          // Redimensiona mantendo proporção
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
          
          // Converte para JPEG com qualidade reduzida
          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            quality
          )
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 🔥 VALIDAÇÃO MAIS RÁPIDA
    if (file.size > 3 * 1024 * 1024) { // Reduzido para 3MB
      toast.error("Imagem muito grande. Máximo: 3MB")
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Selecione uma imagem válida")
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      // 🔥 COMPRIME ANTES DO UPLOAD
      const compressedBlob = await compressImageForMobile(file)
      const fileExt = 'jpg' // Força JPEG para melhor compressão
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      // 🔥 UPLOAD DIRETO SEM MÚLTIPLAS TENTATIVAS
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false // Não tenta upsert (mais rápido)
        })

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          // Se já existe, faz upsert
          const { error: upsertError } = await supabase.storage
            .from('avatars')
            .upload(filePath, compressedBlob, { upsert: true })
          
          if (upsertError) throw upsertError
        } else {
          throw uploadError
        }
      }

      // 🔥 URL PÚBLICA
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 🔥 ATUALIZAÇÃO DIRETA
      const { error: updateError } = await supabase
        .from("usuario")
        .update({ 
          foto_url: publicUrl,
          atualizado_em: new Date().toISOString()
        })
        .eq("uuid", user.id) // Usa sempre o ID do auth

      if (updateError) {
        // Fallback: tenta com o UUID do perfil
        const { error: fallbackError } = await supabase
          .from("usuario")
          .update({ foto_url: publicUrl })
          .eq("uuid", initialUser.uuid)

        if (fallbackError) throw fallbackError
      }

      // 🔥 ATUALIZAÇÃO OTIMIZADA DA IMAGEM
      const newImageUrl = `${publicUrl}?t=${Date.now()}&v=2`
      setImageUrl(newImageUrl)
      
      toast.success("Foto atualizada!")
      
      // 🔥 RELOAD MAIS INTELIGENTE
      setTimeout(() => {
        // Só recarrega se necessário
        if (window.location.pathname === '/perfil') {
          window.location.reload()
        }
      }, 500)

    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Erro no upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getUserInitials = (): string => {
    return initialUser.nome?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  const getUserColor = (): string => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
    const identifier = initialUser.nome || initialUser.uuid || 'user'
    return colors[identifier.length % colors.length]
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
        capture="environment" // 🔥 MELHORA EXPERIÊNCIA MOBILE
      />
      
      <div className="relative">
        {imageUrl ? (
          <div className="relative w-20 h-20 sm:w-32 sm:h-32 mx-auto">
            <img
              src={imageUrl}
              alt={`Foto de ${initialUser.nome || 'Usuário'}`}
              className="w-full h-full rounded-full object-cover border-2 border-primary/20"
              loading="lazy" // 🔥 LAZY LOADING
            />
          </div>
        ) : (
          <div className={`
            w-20 h-20 sm:w-32 sm:h-32 mx-auto rounded-full 
            ${getUserColor()} 
            flex items-center justify-center 
            text-white font-bold text-lg sm:text-2xl
            border-2 border-primary/20
          `}>
            {getUserInitials()}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 w-10 rounded-full bg-white/20 text-white border-0"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs h-8"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3 w-3 mr-1" />
          )}
          {uploading ? 'Enviando...' : 'Alterar'}
        </Button>
      </div>
    </div>
  )
}