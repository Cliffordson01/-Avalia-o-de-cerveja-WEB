# 🍺 TopBreja: A Plataforma Definitiva para Amantes de Cerveja

## Visão Geral do Projeto

O TopBreja é uma aplicação web moderna e interativa, desenvolvida para entusiastas de cerveja. Ele permite aos usuários descobrir novas cervejas, avaliar suas favoritas, deixar comentários e interagir com uma comunidade vibrante. O projeto foi concebido a partir de protótipos no Figma e implementado utilizando as tecnologias mais recentes para garantir uma experiência de usuário fluida e um backend robusto.

### Funcionalidades Principais:

-   **Catálogo de Cervejas**: Explore uma vasta coleção de cervejas com detalhes ricos.
-   **Avaliações e Comentários**: Compartilhe suas opiniões e veja o que outros usuários pensam.
-   **Sistema de Ranking**: Descubra as cervejas mais bem avaliadas e populares.
-   **Upload de Imagens**: Adicione fotos das suas cervejas favoritas.
-   **Página Administrativa**: Gerencie o cadastro de cervejas e suas informações.
-   **Autenticação de Usuários**: Login e registro seguros para uma experiência personalizada.
-   **Design Responsivo**: Acesso e usabilidade perfeitos em qualquer dispositivo (desktop, tablet, mobile).

## Tecnologias Utilizadas

Este projeto foi construído com um stack tecnológico moderno e eficiente:

### Frontend:
-   **React**: Biblioteca JavaScript para construção de interfaces de usuário.
-   **Vite**: Ferramenta de build rápido para projetos web.
-   **Tailwind CSS**: Framework CSS utilitário para estilização rápida e responsiva.
-   **Shadcn/ui**: Componentes de UI reutilizáveis e acessíveis, construídos com Tailwind CSS e React.
-   **Lucide React**: Biblioteca de ícones para uma interface visualmente rica.
-   **React Router DOM**: Para gerenciamento de rotas na aplicação.

### Backend & Banco de Dados:
-   **Supabase**: Plataforma open-source que oferece funcionalidades de backend como serviço (BaaS), incluindo:
    -   **PostgreSQL**: Banco de dados relacional robusto.
    -   **Supabase Auth**: Sistema de autenticação de usuários.
    -   **Supabase Storage**: Armazenamento de arquivos (imagens).
    -   **Row Level Security (RLS)**: Políticas de segurança para controle de acesso aos dados.
    -   **Realtime**: Sincronização de dados em tempo real (potencial para futuras implementações).

## Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas em seu ambiente de desenvolvimento:

-   **Node.js** (versão 18.x ou superior): Ambiente de execução JavaScript.
-   **yarn** (gerenciador de pacotes): Para instalar as dependências do projeto. Se não tiver, instale via yarn: `yarn install -g yarn`.
-   **Git**: Sistema de controle de versão.
-   **Visual Studio Code** (ou seu editor de código preferido): Para desenvolver a aplicação.
-   **Conta Supabase**: Para configurar o backend e o banco de dados. Crie uma conta gratuita em [supabase.com](https://supabase.com/).

## Configuração do Projeto

Siga estas etapas para configurar e rodar o projeto localmente:

### 1. Clone o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd topbreja
```

### 2. Instale as Dependências

Navegue até o diretório do projeto e instale as dependências usando yarn:

```bash
yarn install
hero-ui install
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (no mesmo nível do `package.json`) e adicione suas credenciais do Supabase. Você pode encontrá-las em `Project Settings > API` no seu painel do Supabase.

```env
NEXT_PUBLIC_SUPABASE_URL="SUA_URL_DO_PROJETO_SUPABASE"
NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_SUPABASE"
```

**Onde encontrar as credenciais?**
-   Vá para o seu projeto no [Supabase](https://supabase.com/).
-   No menu lateral, clique em **Project Settings** (ícone de engrenagem).
-   Clique em **API**.
-   Copie a **Project URL** e a **anon public key**.

## Configuração do Supabase

Para que a aplicação funcione corretamente, você precisa configurar o banco de dados e o armazenamento de arquivos no Supabase.

### 1. Configurar o Banco de Dados (Tabelas, Funções, Triggers)

1.  Acesse o **SQL Editor** no seu painel do Supabase.
2.  Abra o arquivo `supabase_setup.sql` (localizado na raiz do seu projeto `topbreja`).
3.  Copie todo o conteúdo do `supabase_setup.sql` e cole no SQL Editor do Supabase.
4.  Execute o script. Isso criará todas as tabelas, relacionamentos, funções e triggers necessários para o funcionamento da aplicação.

### 2. Configurar Políticas de Row Level Security (RLS)

As políticas RLS são cruciais para a segurança e o funcionamento do upload de imagens. Se você já tentou cadastrar imagens e recebeu o erro `new row violates row-level security policy`, é porque estas políticas não estão configuradas ou estão incorretas.

1.  Acesse o **SQL Editor** no seu painel do Supabase.
2.  Abra o arquivo `supabase_rls_policies.sql` (localizado na raiz do seu projeto `topbreja`).
3.  Copie todo o conteúdo do `supabase_rls_policies.sql` e cole no SQL Editor do Supabase.
4.  Execute o script. Isso habilitará o RLS para as tabelas e criará as políticas que permitem o acesso e manipulação de dados de forma segura.

### 3. Configurar o Supabase Storage (Bucket de Imagens)

1.  No painel do Supabase, vá para **Storage** no menu lateral.
2.  Clique em **Create bucket**.
3.  Defina o nome do bucket como `beer-images`.
4.  **Marque a opção 


de **Public bucket** (balde público).
5.  Clique em **Create bucket**.

**Importante**: Certifique-se de que as políticas RLS para o `storage.objects` (criadas no passo anterior) estão ativas e corretas para o bucket `beer-images`.

## Rodando a Aplicação

Após configurar o Supabase e as variáveis de ambiente, você pode iniciar o servidor de desenvolvimento:

```bash
yarn dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Estrutura do Projeto

O projeto segue uma estrutura modular e organizada para facilitar o desenvolvimento e a manutenção:

```
topbreja/
├── public/
│   └── ... (arquivos estáticos)
├── src/
│   ├── assets/
│   │   └── ... (imagens, ícones, etc.)
│   ├── components/
│   │   ├── beer/
│   │   │   ├── BeerBattle.jsx
│   │   │   ├── BeerCard.jsx
│   │   │   └── FeaturedBeer.jsx
│   │   ├── comments/
│   │   │   ├── CommentForm.jsx
│   │   │   ├── CommentItem.jsx
│   │   │   └── CommentsList.jsx
│   │   ├── forms/
│   │   │   └── AdminBeerForm.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   └── ui/
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── input.jsx
│   │       ├── label.jsx
│   │       ├── textarea.jsx
│   │       ├── image-upload.jsx
│   │       ├── star-rating.jsx
│   │       └── tabs.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Admin.jsx
│   │   ├── BeerDetail.jsx
│   │   └── Home.jsx
│   ├── App.css
│   ├── App.jsx
│   └── main.jsx
├── .env.local
├── .gitignore
├── index.html
├── package.json
├── yarn-lock.yaml
├── README.md
├── supabase_setup.sql
└── supabase_rls_policies.sql
```

-   **`src/components/`**: Contém componentes React reutilizáveis, organizados por funcionalidade (cerveja, comentários, formulários, layout, UI genérica).
-   **`src/contexts/`**: Gerenciamento de estado global, como autenticação.
-   **`src/lib/`**: Arquivos de configuração e utilitários, como a inicialização do cliente Supabase.
-   **`src/pages/`**: Componentes de página que representam as diferentes rotas da aplicação.
-   **`supabase_setup.sql`**: Script SQL para criar o esquema do banco de dados no Supabase.
-   **`supabase_rls_policies.sql`**: Script SQL para configurar as políticas de segurança (RLS) no Supabase.
-   **`.env.local`**: Arquivo para variáveis de ambiente sensíveis (credenciais do Supabase).

## Contribuindo

Contribuições são bem-vindas! Se você deseja melhorar o projeto, siga estas etapas:

1.  Faça um fork do repositório.
2.  Crie uma nova branch (`git checkout -b feature/sua-feature`).
3.  Faça suas alterações e commit (`git commit -m 'feat: Adiciona nova feature'`).
4.  Envie para o fork (`git push origin feature/sua-feature`).
5.  Abra um Pull Request detalhando suas mudanças.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Contato

Para dúvidas, sugestões ou feedback, entre em contato com [https://github.com/Cliffordson01].

## Link para documentação
https://drive.google.com/drive/folders/1-e_qjbq7AEHcy9wpSKrIJUegoHQlICke?usp=sharing
