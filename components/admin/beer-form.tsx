// components/admin/beer-form.tsx - VERSÃO CORRIGIDA
"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Image as ImageIcon, Beer, Factory, Globe, Gauge, Thermometer, Utensils, Eye, Sparkles, User, Building, Phone, Mail, MapPin, Droplet, Wine } from "lucide-react"
import Image from "next/image"

interface BeerFormProps {
  cerveja?: any
}

interface Proprietario {
  uuid: string
  nome: string
  cnpj?: string
  endereco?: string
  email?: string
  telefone?: string
}

export function BeerForm({ cerveja }: BeerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(cerveja?.imagem_main || null)
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([])
  const [selectedProprietario, setSelectedProprietario] = useState<string>(cerveja?.proprietario_id || "")
  const [showNewProprietario, setShowNewProprietario] = useState(false)
  
  // ✅ CORREÇÃO: Garantir que informacao seja um objeto
  const informacao = cerveja?.informacao?.[0] || cerveja?.informacao || {}

  const [formData, setFormData] = useState({
    // Informações básicas da cerveja
    nome: cerveja?.nome || "",
    marca: cerveja?.marca || "",
    
    // Informações técnicas (tabela informacao) - USANDO A CORREÇÃO
    teor_alcoolico: informacao?.teor_alcoolico?.toString() || "",
    amargor: informacao?.amargor?.toString() || "",
    origem: informacao?.origem || "",
    aparencia: informacao?.aparencia || "",
    aroma: informacao?.aroma || "",
    sabor: informacao?.sabor || "",
    corpo_textura: informacao?.corpo_textura || "",
    harmonizacao: informacao?.harmonizacao || "",
    temperatura_ideal: informacao?.temperatura_ideal || "",
    impressao_geral: informacao?.impressao_geral || "",
    
    // Campos para novo proprietário
    proprietario_nome: "",
    proprietario_cnpj: "",
    proprietario_endereco: "",
    proprietario_email: "",
    proprietario_telefone: "",
  })

  // Buscar proprietários existentes
 // ✅ CORREÇÃO: No useEffect que busca proprietários
useEffect(() => {
  const fetchProprietarios = async () => {
    try {
      const { data, error } = await supabase
        .from("proprietario")
        .select("uuid, nome, cnpj, endereco, email, telefone")
        .eq("deletado", false)
        .eq("status", true)
        .order("nome")

      if (error) throw error
      setProprietarios(data || [])
      
      // ✅ CORREÇÃO: Definir proprietário selecionado se houver cerveja
      if (cerveja?.proprietario_id) {
        setSelectedProprietario(cerveja.proprietario_id)
      }
    } catch (error) {
      console.error("Erro ao buscar proprietários:", error)
    }
  }

  fetchProprietarios()
}, [supabase, cerveja?.proprietario_id]) // ✅ Adicionar dependência

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        })
        return
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        })
        return
      }

      setUploading(true)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Fazer upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `cervejas/${fileName}`

      console.log('📤 Fazendo upload para o bucket:', 'beer-images')
      console.log('📁 Caminho do arquivo:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('beer-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError)
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('beer-images')
        .getPublicUrl(filePath)

      console.log('✅ Upload concluído. URL pública:', publicUrl)

      setPreviewUrl(publicUrl)

      toast({
        title: "Imagem carregada!",
        description: "A imagem foi enviada com sucesso.",
      })

    } catch (error: any) {
      console.error('❌ Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let proprietarioId = selectedProprietario

      // Se estiver criando um novo proprietário
      if (showNewProprietario && formData.proprietario_nome) {
        const { data: novoProprietario, error: proprietarioError } = await supabase
          .from("proprietario")
          .insert({
            nome: formData.proprietario_nome,
            cnpj: formData.proprietario_cnpj || null,
            endereco: formData.proprietario_endereco || null,
            email: formData.proprietario_email || null,
            telefone: formData.proprietario_telefone || null,
            situacao: 'ativo',
            status: true,
            deletado: false,
          })
          .select()
          .single()

        if (proprietarioError) throw proprietarioError
        proprietarioId = novoProprietario.uuid
      }

      // Preparar dados da cerveja (tabela cerveja)
      const cervejaData = {
        nome: formData.nome,
        marca: formData.marca,
        imagem_main: previewUrl || null,
        proprietario_id: proprietarioId || null,
        ativo: true,
      }

      let cervejaId = cerveja?.uuid

      if (cerveja) {
        // Update existing beer
        const { error } = await supabase
          .from("cerveja")
          .update(cervejaData)
          .eq("uuid", cerveja.uuid)

        if (error) throw error
        cervejaId = cerveja.uuid
      } else {
        // Create new beer
        const { data, error } = await supabase
          .from("cerveja")
          .insert(cervejaData)
          .select()
          .single()

        if (error) throw error
        cervejaId = data.uuid
      }

      // Preparar dados de informação (tabela informacao)
      const informacaoData = {
        cerveja_id: cervejaId,
        origem: formData.origem || null,
        teor_alcoolico: formData.teor_alcoolico ? Number.parseFloat(formData.teor_alcoolico) : null,
        amargor: formData.amargor ? Number.parseInt(formData.amargor) : null,
        aparencia: formData.aparencia || null,
        aroma: formData.aroma || null,
        sabor: formData.sabor || null,
        corpo_textura: formData.corpo_textura || null,
        harmonizacao: formData.harmonizacao || null,
        temperatura_ideal: formData.temperatura_ideal || null,
        impressao_geral: formData.impressao_geral || null,
      }

      // ✅ CORREÇÃO: Usar a variável informacao corrigida
      const informacaoExistente = cerveja?.informacao?.[0]?.uuid || cerveja?.informacao?.uuid

      // Verificar se já existe informação para esta cerveja
      if (informacaoExistente) {
        // Atualizar informação existente
        const { error } = await supabase
          .from("informacao")
          .update(informacaoData)
          .eq("uuid", informacaoExistente)

        if (error) throw error
      } else {
        // Criar nova informação
        const { error } = await supabase
          .from("informacao")
          .insert(informacaoData)

        if (error) throw error
      }

      toast({
        title: cerveja ? "Cerveja atualizada!" : "Cerveja criada!",
        description: cerveja 
          ? "As informações foram atualizadas com sucesso." 
          : "A nova cerveja foi adicionada ao catálogo.",
      })

      router.push("/admin")
      router.refresh()
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {cerveja ? "Editar Cerveja" : "Adicionar Nova Cerveja"}
        </h1>
        <p className="text-muted-foreground">
          {cerveja ? "Atualize as informações da cerveja" : "Preencha os detalhes para adicionar uma nova cerveja ao catálogo"}
        </p>
      </div>

      <Card className="border-2 shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção de Imagem */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">Imagem da Cerveja</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma imagem de alta qualidade da cerveja
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Preview da Imagem */}
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <div className="relative group">
                      <div className="w-64 h-64 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={256}
                          height={256}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-2xl border-4 border-dashed border-amber-200 bg-white flex flex-col items-center justify-center gap-3">
                      <ImageIcon className="h-12 w-12 text-amber-300" />
                      <p className="text-sm text-amber-600 text-center px-4">
                        Nenhuma imagem selecionada
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-4 p-6 border-2 border-dashed border-amber-200 rounded-xl bg-white hover:border-amber-400 transition-all duration-300 group">
                        <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                          <Upload className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-amber-900">Clique para fazer upload</div>
                          <div className="text-sm text-amber-600 mt-1">
                            PNG, JPG, JPEG até 5MB
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  {uploading && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent" />
                      Fazendo upload da imagem...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Beer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">Informações Básicas</Label>
                  <p className="text-sm text-muted-foreground">
                    Dados essenciais da cerveja
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Nome da Cerveja <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Colorado Indica"
                    required
                    className="h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="marca" className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-blue-500" />
                    Marca/Cervejaria <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    placeholder="Ex: Cervejaria Colorado"
                    required
                    className="h-12 text-lg border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Seção do Proprietário */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">Proprietário/Cervejaria</Label>
                  <p className="text-sm text-muted-foreground">
                    Informações da empresa proprietária da marca
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Seletor de proprietário existente */}
                {!showNewProprietario && (
                  <div className="space-y-3">
                    <Label htmlFor="proprietario" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Selecionar Proprietário Existente
                    </Label>
                    <select
                      id="proprietario"
                      value={selectedProprietario}
                      onChange={(e) => setSelectedProprietario(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Selecione um proprietário...</option>
                      {proprietarios.map((prop) => (
                        <option key={prop.uuid} value={prop.uuid}>
                          {prop.nome} {prop.cnpj ? `- ${prop.cnpj}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Botão para alternar entre selecionar e criar novo */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={showNewProprietario ? "outline" : "default"}
                    onClick={() => setShowNewProprietario(false)}
                    className="flex-1"
                  >
                    Selecionar Existente
                  </Button>
                  <Button
                    type="button"
                    variant={showNewProprietario ? "default" : "outline"}
                    onClick={() => setShowNewProprietario(true)}
                    className="flex-1"
                  >
                    Cadastrar Novo
                  </Button>
                </div>

                {/* Formulário para novo proprietário */}
                {showNewProprietario && (
                  <div className="space-y-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Novo Proprietário
                    </h4>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="proprietario_nome" className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500" />
                          Nome/Razão Social <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="proprietario_nome"
                          name="proprietario_nome"
                          value={formData.proprietario_nome}
                          onChange={handleChange}
                          placeholder="Ex: Ambev S.A."
                          required={showNewProprietario}
                          className="border-2 focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="proprietario_cnpj" className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500" />
                          CNPJ
                        </Label>
                        <Input
                          id="proprietario_cnpj"
                          name="proprietario_cnpj"
                          value={formData.proprietario_cnpj}
                          onChange={handleChange}
                          placeholder="Ex: 00.000.000/0001-00"
                          className="border-2 focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="proprietario_email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-indigo-500" />
                          E-mail
                        </Label>
                        <Input
                          id="proprietario_email"
                          name="proprietario_email"
                          type="email"
                          value={formData.proprietario_email}
                          onChange={handleChange}
                          placeholder="Ex: contato@empresa.com"
                          className="border-2 focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="proprietario_telefone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-indigo-500" />
                          Telefone
                        </Label>
                        <Input
                          id="proprietario_telefone"
                          name="proprietario_telefone"
                          value={formData.proprietario_telefone}
                          onChange={handleChange}
                          placeholder="Ex: (11) 99999-9999"
                          className="border-2 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="proprietario_endereco" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        Endereço
                      </Label>
                      <Textarea
                        id="proprietario_endereco"
                        name="proprietario_endereco"
                        value={formData.proprietario_endereco}
                        onChange={handleChange}
                        placeholder="Endereço completo da empresa..."
                        rows={2}
                        className="border-2 focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Gauge className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">Informações Técnicas</Label>
                  <p className="text-sm text-muted-foreground">
                    Especificações e características técnicas
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Label htmlFor="teor_alcoolico" className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-green-500" />
                    Teor Alcoólico (%)
                  </Label>
                  <Input
                    id="teor_alcoolico"
                    name="teor_alcoolico"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.teor_alcoolico}
                    onChange={handleChange}
                    placeholder="Ex: 7.0"
                    className="border-2 focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="amargor" className="flex items-center gap-2">
                    <Wine className="h-4 w-4 text-green-500" />
                    Amargor (IBU)
                  </Label>
                  <Input
                    id="amargor"
                    name="amargor"
                    type="number"
                    min="0"
                    max="200"
                    value={formData.amargor}
                    onChange={handleChange}
                    placeholder="Ex: 65"
                    className="border-2 focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="origem" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    Origem
                  </Label>
                  <Input
                    id="origem"
                    name="origem"
                    value={formData.origem}
                    onChange={handleChange}
                    placeholder="Ex: Brasil, RS"
                    className="border-2 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="temperatura_ideal" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-green-500" />
                  Temperatura Ideal
                </Label>
                <Input
                  id="temperatura_ideal"
                  name="temperatura_ideal"
                  value={formData.temperatura_ideal}
                  onChange={handleChange}
                  placeholder="Ex: 4-6°C"
                  className="border-2 focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            {/* Análise Sensorial */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold">Análise Sensorial</Label>
                  <p className="text-sm text-muted-foreground">
                    Descrições detalhadas das características da cerveja
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="aparencia" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Aparência
                  </Label>
                  <Textarea
                    id="aparencia"
                    name="aparencia"
                    value={formData.aparencia}
                    onChange={handleChange}
                    placeholder="Descreva a aparência da cerveja (cor, turbidez, espuma...)"
                    rows={3}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="aroma" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Aroma
                  </Label>
                  <Textarea
                    id="aroma"
                    name="aroma"
                    value={formData.aroma}
                    onChange={handleChange}
                    placeholder="Descreva o aroma da cerveja..."
                    rows={3}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="sabor" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Sabor
                  </Label>
                  <Textarea
                    id="sabor"
                    name="sabor"
                    value={formData.sabor}
                    onChange={handleChange}
                    placeholder="Descreva o sabor da cerveja..."
                    rows={3}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="corpo_textura" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Corpo e Textura
                  </Label>
                  <Textarea
                    id="corpo_textura"
                    name="corpo_textura"
                    value={formData.corpo_textura}
                    onChange={handleChange}
                    placeholder="Descreva o corpo e textura..."
                    rows={3}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="harmonizacao" className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-purple-500" />
                    Harmonização
                  </Label>
                  <Textarea
                    id="harmonizacao"
                    name="harmonizacao"
                    value={formData.harmonizacao}
                    onChange={handleChange}
                    placeholder="Sugestões de harmonização com comida..."
                    rows={3}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="impressao_geral" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Impressão Geral
                  </Label>
                  <Textarea
                    id="impressao_geral"
                    name="impressao_geral"
                    value={formData.impressao_geral}
                    onChange={handleChange}
                    placeholder="Impressão geral e comentários finais..."
                    rows={4}
                    className="border-2 focus:border-purple-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={loading || uploading} 
                className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    {cerveja ? "Atualizando..." : "Criando..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Beer className="h-5 w-5" />
                    {cerveja ? "Atualizar Cerveja" : "Criar Cerveja"}
                  </div>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/admin")} 
                disabled={loading || uploading}
                className="h-14 text-lg border-2 hover:border-gray-300 transition-colors"
                size="lg"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}