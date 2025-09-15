import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ImageUpload from '../ui/image-upload'
import { supabase } from '../../lib/supabase'

const AdminBeerForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [formData, setFormData] = useState({
    // Dados da cerveja
    marca: '',
    nome: '',
    
    // Dados do proprietário
    proprietario_nome: '',
    proprietario_cnpj: '',
    proprietario_endereco: '',
    proprietario_email: '',
    proprietario_telefone: '',
    
    // Informações técnicas
    origem: '',
    teor_alcoolico: '',
    amargor: '',
    aparencia: '',
    aroma: '',
    sabor: '',
    corpo_textura: '',
    harmonizacao: '',
    temperatura_ideal: '',
    impressao_geral: ''
  })

  // Função para formatar CNPJ
  const formatCNPJ = (value) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 14) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar telefone
  const formatPhone = (value) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    // Aplicar formatação específica
    if (name === 'proprietario_cnpj') {
      formattedValue = formatCNPJ(value)
    } else if (name === 'proprietario_telefone') {
      formattedValue = formatPhone(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  const uploadImages = async () => {
    console.log('🔄 Iniciando upload de imagens...', { totalImages: images.length })
    const uploadedUrls = []
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      console.log(`📤 Fazendo upload da imagem ${i + 1}:`, { 
        name: image.name, 
        size: image.size, 
        type: image.type 
      })

      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = fileName // Removido 'beer-images/' do início

      console.log(`📁 Caminho do arquivo: ${filePath}`)

      const { data, error } = await supabase.storage
        .from('beer-images')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error(`❌ Erro ao fazer upload da imagem ${i + 1}:`, error)
        alert(`Erro ao fazer upload da imagem ${image.name}: ${error.message}`)
        continue
      }

      console.log(`✅ Upload bem-sucedido da imagem ${i + 1}:`, data)

      const { data: { publicUrl } } = supabase.storage
        .from('beer-images')
        .getPublicUrl(filePath)

      console.log(`🔗 URL pública gerada:`, publicUrl)
      uploadedUrls.push(publicUrl)
    }

    console.log('✅ Upload de imagens concluído:', { uploadedUrls })
    return uploadedUrls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🚀 Iniciando cadastro de cerveja...')
      
      // Validação básica
      if (!formData.marca || !formData.nome) {
        alert('Por favor, preencha pelo menos a marca e o nome da cerveja.')
        return
      }

      if (!formData.proprietario_nome) {
        alert('Por favor, preencha o nome da cervejaria.')
        return
      }

      console.log('📋 Dados do formulário:', formData)
      console.log('🖼️ Imagens selecionadas:', images.length)

      // 1. Upload das imagens
      let imageUrls = []
      if (images.length > 0) {
        imageUrls = await uploadImages()
        if (imageUrls.length === 0) {
          alert('Falha no upload das imagens. Verifique se o bucket beer-images existe e está público.')
          return
        }
      }
      
      // 2. Criar ou buscar proprietário
      console.log('🏢 Criando/buscando proprietário...')
      let proprietarioId
      const { data: existingProprietario } = await supabase
        .from('proprietario')
        .select('uuid')
        .eq('nome', formData.proprietario_nome)
        .single()

      if (existingProprietario) {
        console.log('✅ Proprietário existente encontrado:', existingProprietario.uuid)
        proprietarioId = existingProprietario.uuid
      } else {
        console.log('➕ Criando novo proprietário...')
        const { data: newProprietario, error: proprietarioError } = await supabase
          .from('proprietario')
          .insert({
            nome: formData.proprietario_nome,
            cnpj: formData.proprietario_cnpj.replace(/\D/g, ''), // Remove formatação
            endereco: formData.proprietario_endereco,
            email: formData.proprietario_email,
            telefone: formData.proprietario_telefone.replace(/\D/g, '') // Remove formatação
          })
          .select()
          .single()

        if (proprietarioError) {
          console.error('❌ Erro ao criar proprietário:', proprietarioError)
          throw proprietarioError
        }
        
        console.log('✅ Novo proprietário criado:', newProprietario.uuid)
        proprietarioId = newProprietario.uuid
      }

      // 3. Criar cerveja
      console.log('🍺 Criando cerveja...')
      const cervejaData = {
        marca: formData.marca,
        nome: formData.nome,
        imagem_main: imageUrls[0] || null,
        lista_de_imagem: imageUrls,
        proprietario_id: proprietarioId
      }

      console.log('📝 Dados da cerveja a serem inseridos:', cervejaData)

      const { data: cerveja, error: cervejaError } = await supabase
        .from('cerveja')
        .insert(cervejaData)
        .select()
        .single()

      if (cervejaError) {
        console.error('❌ Erro ao criar cerveja:', cervejaError)
        throw cervejaError
      }

      console.log('✅ Cerveja criada com sucesso:', cerveja.uuid)

      // 4. Criar informações da cerveja
      console.log('📊 Criando informações da cerveja...')
      const informacaoData = {
        cerveja_id: cerveja.uuid,
        origem: formData.origem || null,
        teor_alcoolico: parseFloat(formData.teor_alcoolico) || null,
        amargor: parseInt(formData.amargor) || null,
        aparencia: formData.aparencia || null,
        aroma: formData.aroma || null,
        sabor: formData.sabor || null,
        corpo_textura: formData.corpo_textura || null,
        harmonizacao: formData.harmonizacao || null,
        temperatura_ideal: formData.temperatura_ideal || null,
        impressao_geral: formData.impressao_geral || null
      }

      console.log('📝 Dados das informações a serem inseridos:', informacaoData)

      const { error: informacaoError } = await supabase
        .from('informacao')
        .insert(informacaoData)

      if (informacaoError) {
        console.error('❌ Erro ao criar informações:', informacaoError)
        throw informacaoError
      }

      console.log('✅ Informações da cerveja criadas com sucesso')

      // 5. Criar entrada inicial no ranking (opcional)
      console.log('🏆 Criando entrada no ranking...')
      const { error: rankingError } = await supabase
        .from('ranking')
        .insert({
          cerveja_id: cerveja.uuid,
          media_avaliacao: 0,
          total_votos: 0,
          total_favoritos: 0,
          total_comentarios: 0,
          posicao: null
        })

      if (rankingError) {
        console.warn('⚠️ Aviso ao criar ranking (pode ser normal se já existir):', rankingError)
      } else {
        console.log('✅ Entrada no ranking criada')
      }

      // 6. Resetar formulário
      console.log('🔄 Resetando formulário...')
      setFormData({
        marca: '',
        nome: '',
        proprietario_nome: '',
        proprietario_cnpj: '',
        proprietario_endereco: '',
        proprietario_email: '',
        proprietario_telefone: '',
        origem: '',
        teor_alcoolico: '',
        amargor: '',
        aparencia: '',
        aroma: '',
        sabor: '',
        corpo_textura: '',
        harmonizacao: '',
        temperatura_ideal: '',
        impressao_geral: ''
      })
      setImages([])

      if (onSuccess) onSuccess()
      
      console.log('🎉 Cadastro concluído com sucesso!')
      alert('Cerveja cadastrada com sucesso! Verifique a página inicial para ver o resultado.')

    } catch (error) {
      console.error('💥 Erro geral ao cadastrar cerveja:', error)
      alert(`Erro ao cadastrar cerveja: ${error.message}. Verifique o console para mais detalhes.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto bg-amber-50/80 backdrop-blur-sm border-amber-200">
      <CardHeader className="bg-amber-100/50">
        <CardTitle className="text-3xl text-amber-900 text-center">
          🍺 Cadastrar Nova Cerveja
        </CardTitle>
        <p className="text-amber-700 text-center">
          Adicione uma nova cerveja à nossa plataforma
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados da Cerveja */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-amber-900 border-b border-amber-200 pb-2">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="marca" className="text-amber-800">Marca *</Label>
                <Input
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Heineken"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="nome" className="text-amber-800">Nome da Cerveja *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Heineken Original"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>
          </section>

          {/* Upload de Imagens */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-amber-900 border-b border-amber-200 pb-2">
              Imagens da Cerveja
            </h3>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              maxSizeMB={5}
            />
            {images.length > 0 && (
              <div className="text-sm text-amber-600">
                ✅ {images.length} imagem(ns) selecionada(s)
              </div>
            )}
          </section>

          {/* Dados do Proprietário */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-amber-900 border-b border-amber-200 pb-2">
              Dados da Cervejaria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="proprietario_nome" className="text-amber-800">Nome da Cervejaria *</Label>
                <Input
                  id="proprietario_nome"
                  name="proprietario_nome"
                  value={formData.proprietario_nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Cervejaria Heineken"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="proprietario_cnpj" className="text-amber-800">CNPJ</Label>
                <Input
                  id="proprietario_cnpj"
                  name="proprietario_cnpj"
                  value={formData.proprietario_cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="proprietario_email" className="text-amber-800">Email</Label>
                <Input
                  id="proprietario_email"
                  name="proprietario_email"
                  type="email"
                  value={formData.proprietario_email}
                  onChange={handleInputChange}
                  placeholder="contato@cervejaria.com"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="proprietario_telefone" className="text-amber-800">Telefone</Label>
                <Input
                  id="proprietario_telefone"
                  name="proprietario_telefone"
                  value={formData.proprietario_telefone}
                  onChange={handleInputChange}
                  placeholder="(11) 12345-6789"
                  maxLength={15}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="proprietario_endereco" className="text-amber-800">Endereço</Label>
                <Input
                  id="proprietario_endereco"
                  name="proprietario_endereco"
                  value={formData.proprietario_endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro, cidade, estado"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>
          </section>

          {/* Informações Técnicas */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-amber-900 border-b border-amber-200 pb-2">
              Informações Técnicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="origem" className="text-amber-800">Origem</Label>
                <Input
                  id="origem"
                  name="origem"
                  value={formData.origem}
                  onChange={handleInputChange}
                  placeholder="Ex: Brasil, Alemanha"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="teor_alcoolico" className="text-amber-800">Teor Alcoólico (ABV)</Label>
                <Input
                  id="teor_alcoolico"
                  name="teor_alcoolico"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={formData.teor_alcoolico}
                  onChange={handleInputChange}
                  placeholder="Ex: 5.0"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="amargor" className="text-amber-800">Amargor (IBU)</Label>
                <Input
                  id="amargor"
                  name="amargor"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.amargor}
                  onChange={handleInputChange}
                  placeholder="Ex: 25"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="temperatura_ideal" className="text-amber-800">Temperatura Ideal</Label>
                <Input
                  id="temperatura_ideal"
                  name="temperatura_ideal"
                  value={formData.temperatura_ideal}
                  onChange={handleInputChange}
                  placeholder="Ex: 4-6°C"
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="aparencia" className="text-amber-800">Aparência</Label>
                <Textarea
                  id="aparencia"
                  name="aparencia"
                  value={formData.aparencia}
                  onChange={handleInputChange}
                  placeholder="Descreva a cor, transparência, espuma..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="aroma" className="text-amber-800">Aroma</Label>
                <Textarea
                  id="aroma"
                  name="aroma"
                  value={formData.aroma}
                  onChange={handleInputChange}
                  placeholder="Descreva as notas aromáticas..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="sabor" className="text-amber-800">Sabor</Label>
                <Textarea
                  id="sabor"
                  name="sabor"
                  value={formData.sabor}
                  onChange={handleInputChange}
                  placeholder="Descreva o perfil de sabor..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="corpo_textura" className="text-amber-800">Corpo e Textura</Label>
                <Textarea
                  id="corpo_textura"
                  name="corpo_textura"
                  value={formData.corpo_textura}
                  onChange={handleInputChange}
                  placeholder="Descreva o corpo e sensação na boca..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="harmonizacao" className="text-amber-800">Harmonização</Label>
                <Textarea
                  id="harmonizacao"
                  name="harmonizacao"
                  value={formData.harmonizacao}
                  onChange={handleInputChange}
                  placeholder="Sugestões de harmonização com comidas..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="impressao_geral" className="text-amber-800">Impressão Geral</Label>
                <Textarea
                  id="impressao_geral"
                  name="impressao_geral"
                  value={formData.impressao_geral}
                  onChange={handleInputChange}
                  placeholder="Descrição geral da cerveja..."
                  className="border-amber-200 focus:border-amber-500"
                  rows={4}
                />
              </div>
            </div>
          </section>

          {/* Botão de Submit */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:scale-105 transition-all duration-200"
            >
              {loading ? 'Cadastrando...' : '🍺 Cadastrar Cerveja'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default AdminBeerForm
