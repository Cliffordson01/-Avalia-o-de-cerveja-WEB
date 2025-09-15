import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AdminBeerForm from '../components/forms/AdminBeerForm'
import { Plus, Beer, Users, BarChart3, Settings } from 'lucide-react'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('beers')

  const handleBeerSuccess = () => {
    // Refresh da lista ou feedback de sucesso
    console.log('Cerveja cadastrada com sucesso!')
    setActiveTab('beers') // Voltar para a aba de cervejas
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          🛠️ Painel Administrativo
        </h1>
        <p className="text-amber-700 text-lg">
          Gerencie cervejas, usuários e estatísticas do TopBreja
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-amber-100 border border-amber-200">
          <TabsTrigger 
            value="beers" 
            className="flex items-center space-x-2 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
          >
            <Beer className="w-4 h-4" />
            <span>Cervejas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center space-x-2 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
          >
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="flex items-center space-x-2 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="add-beer" 
            className="flex items-center space-x-2 data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Cerveja</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beers" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center">
                  <Beer className="w-5 h-5 mr-2" />
                  Total de Cervejas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-amber-600 mb-2">0</div>
                <p className="text-sm text-amber-600">Cervejas cadastradas</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Mais Votada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-amber-600 mb-2">-</div>
                <p className="text-sm text-amber-600">Nenhuma cerveja ainda</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => setActiveTab('add-beer')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Cerveja
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Lista de cervejas seria aqui */}
          <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Cervejas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Beer className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-800 mb-2">
                  Nenhuma cerveja cadastrada ainda
                </h3>
                <p className="text-amber-600 mb-6">
                  Comece adicionando sua primeira cerveja à plataforma
                </p>
                <Button 
                  variant="outline" 
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-full px-8"
                  onClick={() => setActiveTab('add-beer')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar primeira cerveja
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-8">
          <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gerenciamento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-800 mb-2">
                  Funcionalidade em desenvolvimento
                </h3>
                <p className="text-amber-600">
                  Em breve você poderá gerenciar usuários da plataforma
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6 mt-8">
          <Card className="bg-amber-50/80 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Estatísticas da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-800 mb-2">
                  Funcionalidade em desenvolvimento
                </h3>
                <p className="text-amber-600">
                  Em breve você terá acesso a relatórios e estatísticas detalhadas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-beer" className="space-y-6 mt-8">
          <AdminBeerForm onSuccess={handleBeerSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Admin

