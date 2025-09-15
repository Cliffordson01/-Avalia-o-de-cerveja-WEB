# Guia de Configuração do Supabase - TopBreja

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha os dados do projeto:
   - **Name**: TopBreja
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"

## 2. Configurar o Banco de Dados

### 2.1 Executar Script Principal
1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie e cole todo o conteúdo do arquivo `supabase_setup.sql`
4. Clique em "Run" para executar o script
5. Verifique se todas as tabelas foram criadas sem erros

### 2.2 Configurar Políticas de Segurança (RLS)
1. Ainda no **SQL Editor**, crie uma nova query
2. Copie e cole todo o conteúdo do arquivo `supabase_rls_policies.sql`
3. Clique em "Run" para executar as políticas
4. Verifique se não há erros

## 3. Configurar Autenticação

### 3.1 Configurações Básicas
1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, adicione: `http://localhost:5173` (para desenvolvimento)
3. Em **Redirect URLs**, adicione: `http://localhost:5173/**`

### 3.2 Configurar Provedores OAuth (Opcional)
Para habilitar login com Google e Facebook:

#### Google OAuth:
1. Vá para **Authentication** > **Providers**
2. Clique em **Google**
3. Habilite o provedor
4. Adicione suas credenciais do Google Cloud Console
5. Salve as configurações

#### Facebook OAuth:
1. Vá para **Authentication** > **Providers**
2. Clique em **Facebook**
3. Habilite o provedor
4. Adicione suas credenciais do Facebook Developers
5. Salve as configurações

## 4. Configurar Storage (Para Upload de Imagens)

1. Vá para **Storage**
2. Clique em "Create a new bucket"
3. Nome do bucket: `beer-images`
4. Torne o bucket público:
   - Clique no bucket criado
   - Vá para **Policies**
   - Clique em "New policy"
   - Use o template "Allow public read access"
   - Modifique para permitir upload por usuários autenticados

### Política de Storage Sugerida:
```sql
-- Permitir leitura pública de imagens
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'beer-images');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'beer-images' 
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários deletem apenas suas próprias imagens
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'beer-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 5. Obter Credenciais do Projeto

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (URL do projeto)
   - **anon public** (Chave pública anônima)

## 6. Configurar Variáveis de Ambiente

1. No projeto React, edite o arquivo `.env.local`
2. Substitua os valores pelas credenciais do seu projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## 7. Testar a Conexão

1. No terminal, navegue até a pasta do projeto:
   ```bash
   cd topbreja
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm run dev --host
   ```

3. Acesse `http://localhost:5173` no navegador
4. Verifique se a aplicação carrega sem erros no console

## 8. Inserir Dados de Teste (Opcional)

Se quiser adicionar mais dados de teste, você pode executar queries adicionais no SQL Editor:

```sql
-- Inserir mais cervejas de exemplo
INSERT INTO cerveja (marca, nome, imagem_main, proprietario_id) VALUES
('Heineken', 'Heineken Original', '/images/heineken.jpg', (SELECT uuid FROM proprietario LIMIT 1)),
('Stella Artois', 'Stella Artois', '/images/stella.jpg', (SELECT uuid FROM proprietario LIMIT 1)),
('Corona', 'Corona Extra', '/images/corona.jpg', (SELECT uuid FROM proprietario LIMIT 1));
```

## 9. Verificação Final

Após completar todos os passos:

1. ✅ Projeto criado no Supabase
2. ✅ Tabelas criadas com sucesso
3. ✅ Políticas RLS configuradas
4. ✅ Autenticação configurada
5. ✅ Storage configurado
6. ✅ Variáveis de ambiente definidas
7. ✅ Aplicação conectando sem erros

## Próximos Passos

Com o Supabase configurado, você pode:
- Testar o cadastro e login de usuários
- Adicionar cervejas através de um formulário admin
- Testar votação e avaliação de cervejas
- Implementar upload de imagens
- Desenvolver as funcionalidades de comentários

## Troubleshooting

### Erro de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique se não há erros de sintaxe nos scripts SQL

### Erro de Autenticação
- Confirme se as URLs de redirect estão configuradas
- Verifique se as políticas RLS estão ativas
- Teste com um usuário de exemplo

### Erro de Upload
- Confirme se o bucket foi criado
- Verifique se as políticas de storage estão corretas
- Teste com arquivos pequenos primeiro

