-- TopBreja Database Schema
-- Complete setup for craft beer voting and ranking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Usuario (User) Table
CREATE TABLE IF NOT EXISTS usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  foto_perfil TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  ultima_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Proprietario (Owner/Admin) Table
CREATE TABLE IF NOT EXISTS proprietario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES usuario(id) ON DELETE CASCADE,
  nivel_acesso VARCHAR(50) DEFAULT 'admin',
  data_criacao TIMESTAMP DEFAULT NOW()
);

-- Cerveja (Beer) Table
CREATE TABLE IF NOT EXISTS cerveja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  cervejaria VARCHAR(200) NOT NULL,
  estilo VARCHAR(100),
  teor_alcoolico DECIMAL(4,2),
  ibu INTEGER,
  descricao TEXT,
  imagem_url TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  ultima_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Informacao (Additional Beer Info) Table
CREATE TABLE IF NOT EXISTS informacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  tipo VARCHAR(100),
  valor TEXT,
  data_criacao TIMESTAMP DEFAULT NOW()
);

-- Voto (Vote) Table
CREATE TABLE IF NOT EXISTS voto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  data_voto TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, cerveja_id)
);

-- Avaliacao (Rating) Table
CREATE TABLE IF NOT EXISTS avaliacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  estrelas INTEGER CHECK (estrelas >= 1 AND estrelas <= 5),
  data_avaliacao TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, cerveja_id)
);

-- Comentario (Comment) Table
CREATE TABLE IF NOT EXISTS comentario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  data_comentario TIMESTAMP DEFAULT NOW(),
  ultima_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Comentario_Curtida (Comment Like) Table
CREATE TABLE IF NOT EXISTS comentario_curtida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comentario(id) ON DELETE CASCADE,
  data_curtida TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, comentario_id)
);

-- Ranking Table
CREATE TABLE IF NOT EXISTS ranking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cerveja_id UUID UNIQUE REFERENCES cerveja(id) ON DELETE CASCADE,
  total_votos INTEGER DEFAULT 0,
  media_estrelas DECIMAL(3,2) DEFAULT 0,
  total_favoritos INTEGER DEFAULT 0,
  total_comentarios INTEGER DEFAULT 0,
  pontuacao_total DECIMAL(10,2) DEFAULT 0,
  posicao INTEGER,
  ultima_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Selo (Seal/Badge) Table
CREATE TABLE IF NOT EXISTS selo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  tipo VARCHAR(50) CHECK (tipo IN ('ouro', 'prata', 'bronze')),
  data_atribuicao TIMESTAMP DEFAULT NOW(),
  UNIQUE(cerveja_id, tipo)
);

-- Favorito (Favorite) Table
CREATE TABLE IF NOT EXISTS favorito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
  cerveja_id UUID REFERENCES cerveja(id) ON DELETE CASCADE,
  data_favorito TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, cerveja_id)
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate ranking score
CREATE OR REPLACE FUNCTION calcular_pontuacao_ranking(
  p_total_votos INTEGER,
  p_media_estrelas DECIMAL,
  p_total_favoritos INTEGER,
  p_total_comentarios INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (p_total_votos * 1.0) + 
         (p_media_estrelas * 2.0) + 
         (p_total_favoritos * 1.5) + 
         (p_total_comentarios * 0.5);
END;
$$ LANGUAGE plpgsql;

-- Function to update ranking
CREATE OR REPLACE FUNCTION atualizar_ranking() RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert ranking data
  INSERT INTO ranking (cerveja_id, total_votos, media_estrelas, total_favoritos, total_comentarios, pontuacao_total, ultima_atualizacao)
  SELECT 
    c.id,
    COALESCE(COUNT(DISTINCT v.id), 0) as total_votos,
    COALESCE(AVG(a.estrelas), 0) as media_estrelas,
    COALESCE(COUNT(DISTINCT f.id), 0) as total_favoritos,
    COALESCE(COUNT(DISTINCT co.id), 0) as total_comentarios,
    calcular_pontuacao_ranking(
      COALESCE(COUNT(DISTINCT v.id), 0),
      COALESCE(AVG(a.estrelas), 0),
      COALESCE(COUNT(DISTINCT f.id), 0),
      COALESCE(COUNT(DISTINCT co.id), 0)
    ) as pontuacao_total,
    NOW()
  FROM cerveja c
  LEFT JOIN voto v ON c.id = v.cerveja_id
  LEFT JOIN avaliacao a ON c.id = a.cerveja_id
  LEFT JOIN favorito f ON c.id = f.cerveja_id
  LEFT JOIN comentario co ON c.id = co.cerveja_id
  WHERE c.id = COALESCE(NEW.cerveja_id, OLD.cerveja_id)
  GROUP BY c.id
  ON CONFLICT (cerveja_id) 
  DO UPDATE SET
    total_votos = EXCLUDED.total_votos,
    media_estrelas = EXCLUDED.media_estrelas,
    total_favoritos = EXCLUDED.total_favoritos,
    total_comentarios = EXCLUDED.total_comentarios,
    pontuacao_total = EXCLUDED.pontuacao_total,
    ultima_atualizacao = EXCLUDED.ultima_atualizacao;

  -- Update positions
  WITH ranked_cervejas AS (
    SELECT 
      cerveja_id,
      ROW_NUMBER() OVER (ORDER BY pontuacao_total DESC, ultima_atualizacao ASC) as nova_posicao
    FROM ranking
  )
  UPDATE ranking r
  SET posicao = rc.nova_posicao
  FROM ranked_cervejas rc
  WHERE r.cerveja_id = rc.cerveja_id;

  -- Update seals for top 3
  DELETE FROM selo;
  
  INSERT INTO selo (cerveja_id, tipo, data_atribuicao)
  SELECT cerveja_id, 'ouro', NOW()
  FROM ranking
  WHERE posicao = 1;
  
  INSERT INTO selo (cerveja_id, tipo, data_atribuicao)
  SELECT cerveja_id, 'prata', NOW()
  FROM ranking
  WHERE posicao = 2;
  
  INSERT INTO selo (cerveja_id, tipo, data_atribuicao)
  SELECT cerveja_id, 'bronze', NOW()
  FROM ranking
  WHERE posicao = 3;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync auth users with usuario table
CREATE OR REPLACE FUNCTION sync_auth_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuario (auth_id, nome, email, foto_perfil, data_criacao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'foto_perfil',
    NOW()
  )
  ON CONFLICT (auth_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for votes
CREATE TRIGGER trigger_atualizar_ranking_voto
AFTER INSERT OR DELETE ON voto
FOR EACH ROW
EXECUTE FUNCTION atualizar_ranking();

-- Trigger for ratings
CREATE TRIGGER trigger_atualizar_ranking_avaliacao
AFTER INSERT OR UPDATE OR DELETE ON avaliacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_ranking();

-- Trigger for favorites
CREATE TRIGGER trigger_atualizar_ranking_favorito
AFTER INSERT OR DELETE ON favorito
FOR EACH ROW
EXECUTE FUNCTION atualizar_ranking();

-- Trigger for comments
CREATE TRIGGER trigger_atualizar_ranking_comentario
AFTER INSERT OR DELETE ON comentario
FOR EACH ROW
EXECUTE FUNCTION atualizar_ranking();

-- Trigger to sync auth users
CREATE TRIGGER trigger_sync_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_auth_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerveja ENABLE ROW LEVEL SECURITY;
ALTER TABLE informacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE voto ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario_curtida ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE selo ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorito ENABLE ROW LEVEL SECURITY;

-- Usuario policies
CREATE POLICY "Usuarios podem ver todos os perfis" ON usuario FOR SELECT USING (true);
CREATE POLICY "Usuarios podem atualizar seu proprio perfil" ON usuario FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Usuarios podem inserir seu proprio perfil" ON usuario FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Proprietario policies
CREATE POLICY "Todos podem ver proprietarios" ON proprietario FOR SELECT USING (true);
CREATE POLICY "Apenas proprietarios podem modificar" ON proprietario FOR ALL USING (
  EXISTS (SELECT 1 FROM proprietario WHERE usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid()))
);

-- Cerveja policies
CREATE POLICY "Todos podem ver cervejas" ON cerveja FOR SELECT USING (true);
CREATE POLICY "Apenas proprietarios podem criar cervejas" ON cerveja FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM proprietario WHERE usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid()))
);
CREATE POLICY "Apenas proprietarios podem atualizar cervejas" ON cerveja FOR UPDATE USING (
  EXISTS (SELECT 1 FROM proprietario WHERE usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid()))
);
CREATE POLICY "Apenas proprietarios podem deletar cervejas" ON cerveja FOR DELETE USING (
  EXISTS (SELECT 1 FROM proprietario WHERE usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid()))
);

-- Informacao policies
CREATE POLICY "Todos podem ver informacoes" ON informacao FOR SELECT USING (true);
CREATE POLICY "Apenas proprietarios podem modificar informacoes" ON informacao FOR ALL USING (
  EXISTS (SELECT 1 FROM proprietario WHERE usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid()))
);

-- Voto policies
CREATE POLICY "Todos podem ver votos" ON voto FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem votar" ON voto FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem deletar seus proprios votos" ON voto FOR DELETE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);

-- Avaliacao policies
CREATE POLICY "Todos podem ver avaliacoes" ON avaliacao FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem avaliar" ON avaliacao FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem atualizar suas proprias avaliacoes" ON avaliacao FOR UPDATE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem deletar suas proprias avaliacoes" ON avaliacao FOR DELETE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);

-- Comentario policies
CREATE POLICY "Todos podem ver comentarios" ON comentario FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem comentar" ON comentario FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem atualizar seus proprios comentarios" ON comentario FOR UPDATE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem deletar seus proprios comentarios" ON comentario FOR DELETE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);

-- Comentario_Curtida policies
CREATE POLICY "Todos podem ver curtidas" ON comentario_curtida FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem curtir" ON comentario_curtida FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem remover suas proprias curtidas" ON comentario_curtida FOR DELETE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);

-- Ranking policies
CREATE POLICY "Todos podem ver rankings" ON ranking FOR SELECT USING (true);

-- Selo policies
CREATE POLICY "Todos podem ver selos" ON selo FOR SELECT USING (true);

-- Favorito policies
CREATE POLICY "Todos podem ver favoritos" ON favorito FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem favoritar" ON favorito FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);
CREATE POLICY "Usuarios podem remover seus proprios favoritos" ON favorito FOR DELETE USING (
  usuario_id IN (SELECT id FROM usuario WHERE auth_id = auth.uid())
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_voto_cerveja ON voto(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_voto_usuario ON voto(usuario_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_cerveja ON avaliacao(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_usuario ON avaliacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentario_cerveja ON comentario(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_comentario_usuario ON comentario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favorito_cerveja ON favorito(cerveja_id);
CREATE INDEX IF NOT EXISTS idx_favorito_usuario ON favorito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ranking_posicao ON ranking(posicao);
CREATE INDEX IF NOT EXISTS idx_ranking_pontuacao ON ranking(pontuacao_total DESC);
