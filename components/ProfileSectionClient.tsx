// components/ProfileSectionClient.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ProfileImageUploaderFixed from "./ProfileImageUploaderFixed"
import ProfileNameEditorFixed from "./ProfileNameEditorFixed"

interface ProfileSectionClientProps {
  usuario: {
    uuid: string
    nome?: string
    email: string
    foto_url?: string
    criado_em: string
  }
  user: {
    id: string
  }
}

export default function ProfileSectionClient({ usuario, user }: ProfileSectionClientProps) {
  return (
    <Card className="theme-transition hover:shadow-lg border-2 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="pt-6 text-center">
        <div className="mb-4">
          <ProfileImageUploaderFixed 
            initialUser={{ 
              uuid: usuario.uuid, 
              nome: usuario.nome, 
              foto_url: usuario.foto_url 
            }} 
            userId={user.id}
          />
        </div>

        <div className="mb-4">
          <ProfileNameEditorFixed 
            initialName={usuario.nome || "Usuário"}
            userId={usuario.uuid}
            userEmail={usuario.email}
          />
        </div>

        <Badge 
          variant="secondary" 
          className="bg-accent/50 text-accent-foreground border-accent/30 theme-transition"
        >
          Membro desde{" "}
          {new Date(usuario.criado_em).toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </Badge>
      </CardContent>
    </Card>
  )
}