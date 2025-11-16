// components/admin/beer-management-table.tsx - VERSÃO CORRIGIDA
"use client"

import { useState, useMemo } from "react"
import { 
  Edit, 
  Trash2, 
  Eye, 
  Beer, 
  Star, 
  MessageCircle, 
  Heart, 
  Search, 
  Filter, 
  X,
  Trophy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

interface BeerManagementTableProps {
  cervejas: any[]
}

type SortField = 'nome' | 'marca' | 'estilo' | 'votos' | 'avaliacao' | 'favoritos' | 'comentarios' | 'data'
type SortOrder = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'inactive'

export function BeerManagementTable({ cervejas }: BeerManagementTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [beerToDelete, setBeerToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const handleDeleteClick = (beerId: string) => {
    setBeerToDelete(beerId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!beerToDelete) return

    setDeleting(true)

    try {
      // Primeiro, verificar se existem dados relacionados
      const [votesResponse, commentsResponse, favoritesResponse] = await Promise.all([
        supabase.from("voto").select("uuid").eq("cerveja_id", beerToDelete).eq("deletado", false),
        supabase.from("comentario").select("uuid").eq("cerveja_id", beerToDelete).eq("deletado", false),
        supabase.from("favorito").select("uuid").eq("cerveja_id", beerToDelete).eq("deletado", false),
      ])

      const hasRelatedData = 
        (votesResponse.data?.length || 0) > 0 ||
        (commentsResponse.data?.length || 0) > 0 ||
        (favoritesResponse.data?.length || 0) > 0

      if (hasRelatedData) {
        // Marcar como inativo em vez de deletar
        const { error } = await supabase
          .from("cerveja")
          .update({ ativo: false })
          .eq("uuid", beerToDelete)

        if (error) throw error

        toast({
          title: "Cerveja desativada",
          description: "A cerveja foi desativada devido a dados relacionados.",
        })
      } else {
        // Deletar completamente (apenas se não houver dados relacionados)
        const { error } = await supabase
          .from("cerveja")
          .delete()
          .eq("uuid", beerToDelete)

        if (error) throw error

        toast({
          title: "Cerveja excluída",
          description: "A cerveja foi removida com sucesso.",
        })
      }

      router.refresh()
      setDeleteDialogOpen(false)
      setBeerToDelete(null)
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a cerveja.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getRankingData = (beer: any) => {
    if (!beer.ranking || beer.ranking.length === 0) return {
      media_avaliacao: 0,
      total_votos: 0,
      total_favoritos: 0,
      total_comentarios: 0
    }

    const ranking = Array.isArray(beer.ranking) ? beer.ranking[0] : beer.ranking
    return {
      media_avaliacao: Number(ranking?.media_avaliacao) || 0,
      total_votos: Number(ranking?.total_votos) || 0,
      total_favoritos: Number(ranking?.total_favoritos) || 0,
      total_comentarios: Number(ranking?.total_comentarios) || 0
    }
  }

  // Função de busca e filtro
  const filteredAndSortedBeers = useMemo(() => {
    let filtered = cervejas.filter(beer => {
      const matchesSearch = 
        beer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beer.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (beer.estilo && beer.estilo.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && beer.ativo !== false) ||
        (statusFilter === 'inactive' && beer.ativo === false)
      
      return matchesSearch && matchesStatus
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'nome':
          aValue = a.nome.toLowerCase()
          bValue = b.nome.toLowerCase()
          break
        case 'marca':
          aValue = a.marca.toLowerCase()
          bValue = b.marca.toLowerCase()
          break
        case 'estilo':
          aValue = a.estilo?.toLowerCase() || ''
          bValue = b.estilo?.toLowerCase() || ''
          break
        case 'votos':
          aValue = getRankingData(a).total_votos
          bValue = getRankingData(b).total_votos
          break
        case 'avaliacao':
          aValue = getRankingData(a).media_avaliacao
          bValue = getRankingData(b).media_avaliacao
          break
        case 'favoritos':
          aValue = getRankingData(a).total_favoritos
          bValue = getRankingData(b).total_favoritos
          break
        case 'comentarios':
          aValue = getRankingData(a).total_comentarios
          bValue = getRankingData(b).total_comentarios
          break
        case 'data':
          aValue = new Date(a.criado_em).getTime()
          bValue = new Date(b.criado_em).getTime()
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [cervejas, searchTerm, sortField, sortOrder, statusFilter])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSortField('data')
    setSortOrder('desc')
    setStatusFilter('all')
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <>
      {/* Barra de Busca e Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, marca ou estilo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro de Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter === 'active' ? 'Ativas' : 'Inativas'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Ativas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                  Inativas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ordenação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Ordenar: {sortField === 'nome' ? 'Nome' : 
                           sortField === 'marca' ? 'Marca' : 
                           sortField === 'estilo' ? 'Estilo' : 
                           sortField === 'votos' ? 'Votos' : 
                           sortField === 'avaliacao' ? 'Avaliação' : 
                           sortField === 'favoritos' ? 'Favoritos' : 
                           sortField === 'comentarios' ? 'Comentários' : 'Data'}
                  {getSortIcon(sortField)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => toggleSort('nome')}>
                  Nome {getSortIcon('nome')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('marca')}>
                  Marca {getSortIcon('marca')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('estilo')}>
                  Estilo {getSortIcon('estilo')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleSort('votos')}>
                  Votos {getSortIcon('votos')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('avaliacao')}>
                  Avaliação {getSortIcon('avaliacao')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('favoritos')}>
                  Favoritos {getSortIcon('favoritos')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('comentarios')}>
                  Comentários {getSortIcon('comentarios')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleSort('data')}>
                  Data {getSortIcon('data')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchTerm || statusFilter !== 'all' || sortField !== 'data') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Estatísticas da Busca */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Mostrando {filteredAndSortedBeers.length} de {cervejas.length} cervejas
          </span>
          {searchTerm && (
            <span>
              Buscando por: "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Imagem</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('nome')}>
                Nome {getSortIcon('nome')}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('marca')}>
                Marca {getSortIcon('marca')}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('estilo')}>
                Estilo {getSortIcon('estilo')}
              </TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('avaliacao')}>
                Avaliação {getSortIcon('avaliacao')}
              </TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('votos')}>
                Estatísticas {getSortIcon('votos')}
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedBeers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Search className="h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma cerveja encontrada</p>
                    <p className="text-sm">
                      {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhuma cerveja corresponde aos filtros'}
                    </p>
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedBeers.map((cerveja) => {
                const ranking = getRankingData(cerveja)
                const isActive = cerveja.ativo !== false

                return (
                  <TableRow key={cerveja.uuid} className={!isActive ? "opacity-50 bg-muted/50" : ""}>
                    {/* Imagem */}
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden border">
                        {cerveja.imagem_main ? (
                          <Image
                            src={cerveja.imagem_main}
                            alt={cerveja.nome}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Beer className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Informações Básicas */}
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{cerveja.nome}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(cerveja.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[120px] truncate" title={cerveja.marca}>
                        {cerveja.marca}
                      </div>
                    </TableCell>

                    <TableCell>
                      {cerveja.estilo ? (
                        <Badge variant="secondary" className="text-xs">
                          {cerveja.estilo}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Avaliação */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{ranking.media_avaliacao.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(ranking.total_votos)} votos
                      </div>
                    </TableCell>

                    {/* Estatísticas DETALHADAS */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex flex-col items-center gap-1" title="Votos">
                          <Trophy className="h-3 w-3" />
                          <span className="font-semibold">{formatNumber(ranking.total_votos)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1" title="Favoritos">
                          <Heart className="h-3 w-3" />
                          <span className="font-semibold">{formatNumber(ranking.total_favoritos)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1" title="Comentários">
                          <MessageCircle className="h-3 w-3" />
                          <span className="font-semibold">{formatNumber(ranking.total_comentarios)}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativa
                        </Badge>
                      )}
                    </TableCell>

                    {/* ✅ CORREÇÃO AQUI: Ações com link de edição correto */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Visualizar"
                        >
                          <Link href={`/cerveja/${cerveja.uuid}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                       <Button
  variant="ghost"
  size="sm"
  asChild
  title="Editar"
  onClick={(e) => {
    console.log('🔍 DEBUG - Botão Editar clicado:', {
      cervejaId: cerveja.uuid,
      cervejaNome: cerveja.nome,
      url: `/admin/cerveja/editar/${cerveja.uuid}`,
      event: e
    })
  }}
>
  <Link href={`/admin/cerveja/editar/${cerveja.uuid}`}>
    <Edit className="h-4 w-4" />
  </Link>
</Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(cerveja.uuid)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Excluir"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              {beerToDelete && (() => {
                const beer = cervejas.find(b => b.uuid === beerToDelete)
                const ranking = getRankingData(beer)
                const hasData = ranking.total_votos > 0 || ranking.total_comentarios > 0 || ranking.total_favoritos > 0
                
                return hasData ? (
                  <div className="space-y-3">
                    <p>Esta cerveja possui dados relacionados:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {ranking.total_votos > 0 && <li>{ranking.total_votos} votos</li>}
                      {ranking.total_comentarios > 0 && <li>{ranking.total_comentarios} comentários</li>}
                      {ranking.total_favoritos > 0 && <li>{ranking.total_favoritos} favoritos</li>}
                    </ul>
                    <p className="font-semibold text-amber-600">
                      A cerveja será marcada como inativa para preservar os dados históricos.
                    </p>
                  </div>
                ) : (
                  "Esta ação não pode ser desfeita. Isso irá excluir permanentemente a cerveja do sistema."
                )
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}