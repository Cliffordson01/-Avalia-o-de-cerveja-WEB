export interface Usuario {
  uuid: string
  auth_id: string
  nome: string
  email: string
  foto_perfil?: string
  data_criacao: string
  ultima_atualizacao: string
}

export interface Cerveja {
  uuid: string
  nome: string
  marca: string
  cervejaria?: string
  estilo?: string
  teor_alcoolico?: number
  ibu?: number
  descricao?: string
  imagem_url?: string
  imagem_main?: string
  lista_de_imagem?: string[]
  ativo: boolean
  data_criacao: string
  ultima_atualizacao: string
}

export interface Ranking {
  uuid: string
  cerveja_id: string
  total_votos: number
  media_estrelas: number
  media_avaliacao: number
  total_favoritos: number
  total_comentarios: number
  pontuacao_total: number
  posicao: number
  status: boolean
  ultima_atualizacao: string
  cerveja?: Cerveja
  selo?: Selo[]
}

export interface Selo {
  uuid: string
  cerveja_id: string
  tipo: "ouro" | "prata" | "bronze"
  data_atribuicao: string
}

export interface Voto {
  uuid: string
  usuario_id: string
  cerveja_id: string
  quantidade: number
  data_voto: string
}

export interface Avaliacao {
  uuid: string
  usuario_id: string
  cerveja_id: string
  quantidade_estrela: number
  data_avaliacao: string
}

export interface Comentario {
  uuid: string
  usuario_id: string
  cerveja_id: string
  texto: string
  data_comentario: string
  ultima_atualizacao: string
  usuario?: Usuario
  curtidas?: number
}

export interface Favorito {
  uuid: string
  usuario_id: string
  cerveja_id: string
  data_favorito: string
}

export interface CervejaComDetalhes extends Cerveja {
  ranking?: Ranking[]
  selo?: Selo[]
  user_voto?: boolean
  user_avaliacao?: number
  user_favorito?: boolean
}
