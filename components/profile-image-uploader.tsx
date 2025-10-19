// components/profile-image-uploader.tsx
"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Camera, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Tipo simplificado para o componente
interface Usuario {
  uuid: string
  nome: string
  foto_url: string | null
}

interface ProfileImageUploaderProps {
  initialUser: Usuario
  userId: string // auth.id do Supabase
}

export function ProfileImageUploader({ initialUser, userId }: ProfileImageUploaderProps) {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(initialUser)
  const [isPending, startTransition] = useTransition()
  const defaultImageUrl = "/placeholder.svg" // Seu padrão/fallback

  // Função para extrair o caminho do arquivo no Storage de forma robusta.
  const getStorageFilePath = (url: string): string | null => {
    if (!url) return null
    
    // Assume que a URL contém '/storage/v1/object/public/avatars/'
    const urlParts = url.split('/storage/v1/object/public/avatars/')
    
    // Se a URL contém o padrão esperado, retorna o caminho restante.
    return urlParts.length > 1 ? urlParts[1] : null
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 5 * 1024 * 1024) { // Limite de 5MB
      toast({ description: "O arquivo deve ter no máximo 5MB.", variant: "destructive" })
      return
    }

    await handleUpload(selectedFile)
    e.target.value = '' // Limpa o input para permitir re-upload do mesmo arquivo
  }

  const handleUpload = async (fileToUpload: File) => {
    if (!userId) {
      toast({ description: "Você precisa estar logado para fazer o upload.", variant: "destructive" })
      return
    }
    
    startTransition(async () => {
      try {
        // 1. Apagar imagem antiga no Storage (se houver)
        if (user.foto_url) {
          const pathInStorage = getStorageFilePath(user.foto_url)
          if (pathInStorage) {
            await supabase.storage.from('avatars').remove([pathInStorage])
          }
        }

        // 2. Upload do novo arquivo
        const fileExtension = fileToUpload.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExtension}`
        const filePath = `${userId}/${fileName}` // Caminho: [auth_id]/[nome-arquivo]
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileToUpload, { upsert: true })

        if (uploadError) throw uploadError

        // 3. Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
          
        const newPhotoUrl = publicUrlData.publicUrl

        // 4. Atualizar 'foto_url' na tabela 'usuario'
        const { error: updateError } = await supabase
          .from('usuario')
          .update({ foto_url: newPhotoUrl })
          .eq('uuid', user.uuid) // Usa o UUID da tabela usuario

        if (updateError) throw updateError

        setUser(prev => ({ ...prev, foto_url: newPhotoUrl }))
        toast({ title: "Sucesso!", description: "Imagem de perfil atualizada." })
        router.refresh()
      } catch (error: any) {
        console.error("Erro no upload:", error);
        toast({ 
          title: "Erro", 
          description: error.message || "Falha ao atualizar a imagem. Verifique as políticas RLS do Storage.", 
          variant: "destructive" 
        })
      }
    })
  }

  const handleRemove = async () => {
    if (!userId) return // Não deve ser possível se o botão estiver desabilitado/oculto
    
    startTransition(async () => {
      try {
        // 1. Apagar imagem no Storage
        if (user.foto_url) {
          const pathInStorage = getStorageFilePath(user.foto_url)
          if (pathInStorage) {
            await supabase.storage.from('avatars').remove([pathInStorage])
          }
        }

        // 2. Definir 'foto_url' como NULL na tabela 'usuario'
        const { error: updateError } = await supabase
          .from('usuario')
          .update({ foto_url: null })
          .eq('uuid', user.uuid)

        if (updateError) throw updateError

        setUser(prev => ({ ...prev, foto_url: null }))
        toast({ title: "Sucesso!", description: "Imagem de perfil removida." })
        router.refresh()
      } catch (error: any) {
        toast({ 
          title: "Erro", 
          description: error.message || "Falha ao remover a imagem. Verifique as políticas RLS do Storage.", 
          variant: "destructive" 
        })
      }
    })
  }

  const currentImageUrl = user.foto_url || defaultImageUrl
  const hasImage = !!user.foto_url

  return (
    <div className="flex flex-col items-center">
      {/* Avatar e Imagem */}
      <Avatar className="h-32 w-32 border-4 border-primary/20">
        <AvatarImage 
          src={currentImageUrl} 
          alt={user.nome || "Perfil"} 
        />
        <AvatarFallback className="text-4xl">
          {user.nome?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {/* Botões de Ação */}
      <div className="mt-4 flex gap-2">
        {/* Botão de Adicionar/Mudar Imagem */}
        <input
          id="file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={isPending}
        />
        <Button 
          asChild 
          disabled={isPending || !userId} // Desabilita se não houver userId
          size="sm"
          className="bg-primary/90 hover:bg-primary"
        >
          <label htmlFor="file-input" className="cursor-pointer flex items-center">
            <Camera className="mr-2 h-4 w-4" />
            {hasImage ? "Mudar Foto" : "Adicionar Foto"}
          </label>
        </Button>

        {/* Botão de Remover (Apenas se houver imagem personalizada) */}
        {hasImage && (
          <Button 
            variant="destructive" 
            onClick={handleRemove} 
            disabled={isPending || !userId} // Desabilita se não houver userId
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Indicador de Status */}
      {isPending && (
        <p className="mt-2 text-sm text-primary">Processando...</p>
      )}
    </div>
  )
}