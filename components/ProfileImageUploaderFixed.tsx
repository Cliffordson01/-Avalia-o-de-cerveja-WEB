"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Upload, Loader2, Image } from "lucide-react"
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

  const compressImageForMobile = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const maxSize = 400
      const quality = 0.7
      
      if (file.size < 300 * 1024) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        // CORREÇÃO: Removido o 'new' problemático
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }
          
          let { width, height } = img
          
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

    if (file.size > 3 * 1024 * 1024) {
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

      const compressedBlob = await compressImageForMobile(file)
      const fileExt = 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          const { error: upsertError } = await supabase.storage
            .from('avatars')
            .upload(filePath, compressedBlob, { upsert: true })
          
          if (upsertError) throw upsertError
        } else {
          throw uploadError
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from("usuario")
        .update({ 
          foto_url: publicUrl,
          atualizado_em: new Date().toISOString()
        })
        .eq("uuid", user.id)

      if (updateError) {
        const { error: fallbackError } = await supabase
          .from("usuario")
          .update({ foto_url: publicUrl })
          .eq("uuid", initialUser.uuid)

        if (fallbackError) throw fallbackError
      }

      const newImageUrl = `${publicUrl}?t=${Date.now()}&v=2`
      setImageUrl(newImageUrl)
      
      toast.success("Foto atualizada!")
      
      setTimeout(() => {
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

  const openCamera = () => {
    const cameraInput = document.createElement('input')
    cameraInput.type = 'file'
    cameraInput.accept = 'image/*'
    cameraInput.capture = 'environment'
    cameraInput.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files?.[0]) {
        const fakeEvent = {
          target: {
            files: target.files
          }
        } as React.ChangeEvent<HTMLInputElement>
        handleImageUpload(fakeEvent)
      }
    }
    cameraInput.click()
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
      />
      
      <div className="relative">
        {imageUrl ? (
          <div className="relative w-20 h-20 sm:w-32 sm:h-32 mx-auto">
            <img
              src={imageUrl}
              alt={`Foto de ${initialUser.nome || 'Usuário'}`}
              className="w-full h-full rounded-full object-cover border-2 border-primary/20"
              loading="lazy"
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
              <Image className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2">
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
          {uploading ? 'Enviando...' : 'Galeria'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openCamera}
          disabled={uploading}
          className="text-xs h-8"
        >
          <Camera className="h-3 w-3 mr-1" />
          Câmera
        </Button>
      </div>
    </div>
  )
}