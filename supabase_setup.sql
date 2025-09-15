-- TopBreja Database Schema
-- Script para configuração completa do banco de dados no Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuario (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255), -- Será gerenciado pelo Supabase Auth
    descricao TEXT,
    data_nascimento DATE,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Proprietários (Cervejarias)
CREATE TABLE IF NOT EXISTS proprietario (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    endereco TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    situacao VARCHAR(50) DEFAULT 'ativo',
    deletado BOOLEAN DEFAULT false,
    status BOOLEAN DEFAULT true
);

-- 3. Tabela de Cervejas
CREATE TABLE IF NOT EXISTS cerveja (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marca VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    imagem_main TEXT,
    lista_de_imagem TEXT[], -- Array de URLs de imagens
    proprietario_id UUID REFERENCES proprietario(uuid),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true
);

-- 4. Tabela de Informações da Cerveja
CREATE TABLE IF NOT EXISTS informacao (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cerveja_id UUID REFERENCES cerveja(uuid) ON DELETE CASCADE,
    origem VARCHAR(255),
    teor_alcoolico DECIMAL(4,2), -- ABV
    amargor INTEGER, -- IBU
    aparencia TEXT,
    aroma TEXT,
    sabor TEXT,
    corpo_textura TEXT,
    harmonizacao TEXT,
    temperatura_ideal VARCHAR(100),
    impressao_geral TEXT,
    deletado BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Votos
CREATE TABLE IF NOT EXISTS voto (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(uuid),
    cerveja_id UUID REFERENCES cerveja(uuid),
    quantidade INTEGER DEFAULT 1,
    status BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletado BOOLEAN DEFAULT false,
    UNIQUE(usuario_id, cerveja_id) -- Um voto por usuário por cerveja
);

-- 6. Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacao (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(uuid),
    cerveja_id UUID REFERENCES cerveja(uuid),
    quantidade_estrela INTEGER CHECK (quantidade_estrela >= 1 AND quantidade_estrela <= 5),
    status BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletado BOOLEAN DEFAULT false,
    UNIQUE(usuario_id, cerveja_id) -- Uma avaliação por usuário por cerveja
);

-- 7. Tabela de Comentários (com melhorias para curtidas e replies)
CREATE TABLE IF NOT EXISTS comentario (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(uuid),
    cerveja_id UUID REFERENCES cerveja(uuid),
    descricao TEXT NOT NULL,
    reply_to_comment_id UUID REFERENCES comentario(uuid), -- Para respostas
    curtidas INTEGER DEFAULT 0,
    descurtidas INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    editado_em TIMESTAMP WITH TIME ZONE,
    deletado BOOLEAN DEFAULT false
);

-- 8. Tabela de Curtidas em Comentários
CREATE TABLE IF NOT EXISTS comentario_curtida (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(uuid),
    comentario_id UUID REFERENCES comentario(uuid),
    tipo VARCHAR(10) CHECK (tipo IN ('curtida', 'descurtida')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, comentario_id) -- Um tipo de reação por usuário por comentário
);

-- 9. Tabela de Ranking
CREATE TABLE IF NOT EXISTS ranking (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cerveja_id UUID REFERENCES cerveja(uuid) UNIQUE,
    media_avaliacao DECIMAL(3,2) DEFAULT 0,
    total_votos INTEGER DEFAULT 0,
    total_favoritos INTEGER DEFAULT 0,
    total_comentarios INTEGER DEFAULT 0,
    posicao INTEGER,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status BOOLEAN DEFAULT true
);

-- 10. Tabela de Selos
CREATE TABLE IF NOT EXISTS selo (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cerveja_id UUID REFERENCES cerveja(uuid),
    ranking_id UUID REFERENCES ranking(uuid),
    tipo_selo VARCHAR(20) CHECK (tipo_selo IN ('ouro', 'prata', 'bronze', 'posicao')),
    imagem_url TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status BOOLEAN DEFAULT true
);

-- 11. Tabela de Favoritos
CREATE TABLE IF NOT EXISTS favorito (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(uuid),
    cerveja_id UUID REFERENCES cerveja(uuid),
    status BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deletado BOOLEAN DEFAULT false,
    UNIQUE(usuario_id, cerveja_id) -- Um favorito por usuário por cerveja
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cerveja_ativo ON cerveja(ativo);
CREATE INDEX IF NOT EXISTS idx_ranking_posicao ON ranking(posicao);
CREATE INDEX IF NOT EXISTS idx_comentario_cerveja ON comentario(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_comentario_reply ON comentario(reply_to_comment_id);
CREATE INDEX IF NOT EXISTS idx_voto_cerveja ON voto(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_cerveja ON avaliacao(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_favorito_usuario ON favorito(usuario_id);

-- Funções para atualizar ranking automaticamente
CREATE OR REPLACE FUNCTION atualizar_ranking()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar ou inserir ranking para a cerveja
    INSERT INTO ranking (cerveja_id, media_avaliacao, total_votos, total_favoritos, total_comentarios)
    VALUES (
        COALESCE(NEW.cerveja_id, OLD.cerveja_id),
        (SELECT COALESCE(AVG(quantidade_estrela), 0) FROM avaliacao WHERE cerveja_id = COALESCE(NEW.cerveja_id, OLD.cerveja_id) AND deletado = false),
        (SELECT COALESCE(SUM(quantidade), 0) FROM voto WHERE cerveja_id = COALESCE(NEW.cerveja_id, OLD.cerveja_id) AND deletado = false),
        (SELECT COUNT(*) FROM favorito WHERE cerveja_id = COALESCE(NEW.cerveja_id, OLD.cerveja_id) AND deletado = false),
        (SELECT COUNT(*) FROM comentario WHERE cerveja_id = COALESCE(NEW.cerveja_id, OLD.cerveja_id) AND deletado = false)
    )
    ON CONFLICT (cerveja_id) DO UPDATE SET
        media_avaliacao = (SELECT COALESCE(AVG(quantidade_estrela), 0) FROM avaliacao WHERE cerveja_id = EXCLUDED.cerveja_id AND deletado = false),
        total_votos = (SELECT COALESCE(SUM(quantidade), 0) FROM voto WHERE cerveja_id = EXCLUDED.cerveja_id AND deletado = false),
        total_favoritos = (SELECT COUNT(*) FROM favorito WHERE cerveja_id = EXCLUDED.cerveja_id AND deletado = false),
        total_comentarios = (SELECT COUNT(*) FROM comentario WHERE cerveja_id = EXCLUDED.cerveja_id AND deletado = false);

    -- Atualizar posições no ranking
    WITH ranked_cervejas AS (
        SELECT 
            cerveja_id,
            ROW_NUMBER() OVER (ORDER BY media_avaliacao DESC, total_votos DESC) as nova_posicao
        FROM ranking
        WHERE status = true
    )
    UPDATE ranking 
    SET posicao = ranked_cervejas.nova_posicao
    FROM ranked_cervejas
    WHERE ranking.cerveja_id = ranked_cervejas.cerveja_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar ranking automaticamente
CREATE TRIGGER trigger_atualizar_ranking_voto
    AFTER INSERT OR UPDATE OR DELETE ON voto
    FOR EACH ROW EXECUTE FUNCTION atualizar_ranking();

CREATE TRIGGER trigger_atualizar_ranking_avaliacao
    AFTER INSERT OR UPDATE OR DELETE ON avaliacao
    FOR EACH ROW EXECUTE FUNCTION atualizar_ranking();

CREATE TRIGGER trigger_atualizar_ranking_favorito
    AFTER INSERT OR UPDATE OR DELETE ON favorito
    FOR EACH ROW EXECUTE FUNCTION atualizar_ranking();

CREATE TRIGGER trigger_atualizar_ranking_comentario
    AFTER INSERT OR UPDATE OR DELETE ON comentario
    FOR EACH ROW EXECUTE FUNCTION atualizar_ranking();

-- Função para atualizar curtidas em comentários
CREATE OR REPLACE FUNCTION atualizar_curtidas_comentario()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.tipo = 'curtida' THEN
            UPDATE comentario SET curtidas = curtidas + 1 WHERE uuid = NEW.comentario_id;
        ELSIF NEW.tipo = 'descurtida' THEN
            UPDATE comentario SET descurtidas = descurtidas + 1 WHERE uuid = NEW.comentario_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remover curtida/descurtida anterior
        IF OLD.tipo = 'curtida' THEN
            UPDATE comentario SET curtidas = curtidas - 1 WHERE uuid = OLD.comentario_id;
        ELSIF OLD.tipo = 'descurtida' THEN
            UPDATE comentario SET descurtidas = descurtidas - 1 WHERE uuid = OLD.comentario_id;
        END IF;
        -- Adicionar nova curtida/descurtida
        IF NEW.tipo = 'curtida' THEN
            UPDATE comentario SET curtidas = curtidas + 1 WHERE uuid = NEW.comentario_id;
        ELSIF NEW.tipo = 'descurtida' THEN
            UPDATE comentario SET descurtidas = descurtidas + 1 WHERE uuid = NEW.comentario_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.tipo = 'curtida' THEN
            UPDATE comentario SET curtidas = curtidas - 1 WHERE uuid = OLD.comentario_id;
        ELSIF OLD.tipo = 'descurtida' THEN
            UPDATE comentario SET descurtidas = descurtidas - 1 WHERE uuid = OLD.comentario_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar curtidas
CREATE TRIGGER trigger_atualizar_curtidas
    AFTER INSERT OR UPDATE OR DELETE ON comentario_curtida
    FOR EACH ROW EXECUTE FUNCTION atualizar_curtidas_comentario();

-- Inserir dados de exemplo
INSERT INTO proprietario (nome, cnpj, endereco, email, telefone) VALUES
('Cervejaria Black Water', '12.345.678/0001-90', 'Rua das Cervejas, 123', 'contato@blackwater.com', '(11) 1234-5678'),
('Cervejaria JO Dark', '98.765.432/0001-10', 'Av. Malte, 456', 'info@jodark.com', '(11) 9876-5432'),
('Cervejaria Innis Gunn', '11.222.333/0001-44', 'Rua Lúpulo, 789', 'hello@innisgunn.com', '(11) 1122-3344');

INSERT INTO cerveja (marca, nome, imagem_main, proprietario_id) VALUES
('Black Water', 'BLACK WATER BEER', '/images/black-water-beer.jpg', (SELECT uuid FROM proprietario WHERE nome = 'Cervejaria Black Water')),
('JO Dark', 'JO DARK LAGER', '/images/jo-dark-lager.jpg', (SELECT uuid FROM proprietario WHERE nome = 'Cervejaria JO Dark')),
('Innis Gunn', 'INNIS GUNN LAGER', '/images/innis-gunn-lager.jpg', (SELECT uuid FROM proprietario WHERE nome = 'Cervejaria Innis Gunn'));

-- Inserir informações das cervejas
INSERT INTO informacao (cerveja_id, origem, teor_alcoolico, amargor, aparencia, aroma, sabor, corpo_textura, harmonizacao, temperatura_ideal, impressao_geral)
SELECT 
    c.uuid,
    'Brasil',
    5.5,
    45,
    'Cor dourada, âmbar, escura, preta',
    'Notas percebidas: cítrico, frutado, floral, tostado, caramelo, café, chocolate etc.',
    'Perfil principal (doce, amargo, ácido, equilibrado)',
    'Corpo: leve, médio ou encorpado',
    'Comidas que combinam bem (ex.: carnes, queijos, sobremesas, frutos do mar)',
    'Ex.: 4-6°C (gelada), 6-12°C (IPA), 10-14°C (stout)',
    'Quando a espuma assenta e o sabor fala mais alto, só uma fica de pé. A número um da semana, honrando cada gole como um campeão.'
FROM cerveja c;

-- Inserir rankings iniciais
INSERT INTO ranking (cerveja_id, media_avaliacao, total_votos, posicao)
SELECT 
    uuid,
    4.5,
    200,
    ROW_NUMBER() OVER (ORDER BY nome)
FROM cerveja;

