// lib/types.ts - TIPAGEM COMPLETA E ORGANIZADA

// =============================================
// TIPOS BASE DO SUPABASE
// =============================================

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
  taças_breja?: number
}

export interface Selo {
  uuid: string
  cerveja_id: string
  tipo_selo: "ouro" | "prata" | "bronze" | "posicao" | "empatado"
  imagem_url?: string
  criado_em: string
  status: boolean
}

export interface Voto {
  uuid: string
  usuario_id: string
  cerveja_id: string
  quantidade: number
  status: boolean
  criado_em: string
  deletado: boolean
}

export interface Avaliacao {
  uuid: string
  usuario_id: string
  cerveja_id: string
  quantidade_estrela: number
  status: boolean
  criado_em: string
  deletado: boolean
}

export interface Comentario {
  uuid: string
  usuario_id: string
  cerveja_id: string
  descricao: string
  reply_to_comment_id: string | null
  curtidas: number
  descurtidas: number
  criado_em: string
  editado_em: string | null
  deletado: boolean
}

export interface Favorito {
  uuid: string
  usuario_id: string
  cerveja_id: string
  status: boolean
  criado_em: string
  deletado: boolean
}

// =============================================
// TIPOS COMPOSTOS E EXTENSÕES
// =============================================

export interface CervejaComDetalhes extends Cerveja {
  ranking?: Ranking[]
  selo?: Selo[]
  user_voto: boolean
  user_favorito: boolean
  user_avaliacao?: number
}

export interface RankingComCerveja extends Omit<Ranking, 'cerveja_id'> {
  cerveja: Cerveja
  selo?: Selo[]
}

export interface RankingItemFromDB {
  uuid: string
  cerveja_id: string
  media_avaliacao: number
  total_votos: number
  total_favoritos: number
  total_comentarios: number
  posicao: number
  criado_em: string
  status: boolean
  taças_breja: number
  cerveja: Cerveja
  selo?: Array<{ tipo_selo: string; imagem_url?: string }>
}

// =============================================
// TIPOS PARA COMPONENTES
// =============================================

export interface BeerImageProps {
  cerveja: Cerveja
  priority?: boolean
}

export interface BeerActionsProps {
  cerveja: CervejaComDetalhes
  userId?: string
  size?: "sm" | "md" | "lg" | "default" | "icon"
}

export interface OptimizedBeerCardProps {
  cerveja: CervejaComDetalhes
  userId?: string
  showActions?: boolean
  priority?: boolean
}

export interface BeerCardProps {
  cerveja: CervejaComDetalhes
  userId?: string
  showActions?: boolean
  priority?: boolean
}

// =============================================
// TIPOS PARA FORMULÁRIOS E ESTADOS
// =============================================

export interface BeerFormData {
  nome: string
  marca: string
  cervejaria?: string
  estilo?: string
  teor_alcoolico?: number
  ibu?: number
  descricao?: string
  imagem_url?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  language: string
}

// =============================================
// TIPOS PARA PÁGINAS E ROTAS
// =============================================

export interface HomePageData {
  top3: RankingItemFromDB[]
  top5: RankingItemFromDB[]
  recentBeers: CervejaComDetalhes[]
  user: any | null
}

export interface BeerPageProps {
  params: {
    uuid: string
  }
}

export interface SearchPageProps {
  searchParams: {
    query?: string
    page?: string
    style?: string
    brewery?: string
  }
}

// =============================================
// TIPOS PARA API RESPONSES
// =============================================

export interface ApiResponse<T> {
  data: T
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =============================================
// TIPOS UTILITÁRIOS
// =============================================

export type SortOption = 'name' | 'rating' | 'votes' | 'recent' | 'alcohol'

export type FilterOption = {
  label: string
  value: string
  field: keyof Cerveja
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

// =============================================
// TIPOS PARA BATE-BATE (BATALHA)
// =============================================

export interface BatalhaDiaria {
  uuid: string
  cerveja1_id: string
  cerveja2_id: string
  data_batalha: string
  dia_da_semana: number
  votos_cerveja1: number
  votos_cerveja2: number
  vencedor_id?: string
  status: 'active' | 'completed'
  criado_em: string
}

export interface BatalhaComCervejas extends BatalhaDiaria {
  cerveja1: Cerveja
  cerveja2: Cerveja
  vencedor?: Cerveja
}

export interface VotoDiario {
  uuid: string
  usuario_id: string
  cerveja_id: string
  data_voto: string
  batalha_diaria_id: string
  criado_em: string
}

// =============================================
// HELPER TYPES
// =============================================

// Para transform function no page.tsx
export type BeerTransformer = (
  beer: any, 
  rankingData?: RankingItemFromDB, 
  selo?: Array<{ tipo_selo: string; imagem_url?: string }>
) => CervejaComDetalhes

// Para queries do Supabase
export type BeerWithRelations = Cerveja & {
  ranking: Ranking[]
  selo: Selo[]
}

export type RankingWithBeer = Ranking & {
  cerveja: Cerveja
  selo: Selo[]
}