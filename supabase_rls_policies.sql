-- Row Level Security (RLS) Policies para TopBreja
-- Configurações de segurança para proteger os dados dos usuários

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerveja ENABLE ROW LEVEL SECURITY;
ALTER TABLE informacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE proprietario ENABLE ROW LEVEL SECURITY;
ALTER TABLE voto ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario_curtida ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE selo ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorito ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela usuario
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON usuario
    FOR SELECT USING (auth.uid()::text = uuid::text);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar apenas seus próprios dados" ON usuario
    FOR UPDATE USING (auth.uid()::text = uuid::text);

-- Permitir inserção de novos usuários (para registro)
CREATE POLICY "Permitir inserção de novos usuários" ON usuario
    FOR INSERT WITH CHECK (auth.uid()::text = uuid::text);

-- Políticas para a tabela cerveja
-- Todos podem ver cervejas ativas
CREATE POLICY "Todos podem ver cervejas ativas" ON cerveja
    FOR SELECT USING (ativo = true);

-- Apenas administradores podem inserir/atualizar cervejas (por enquanto, permitir a todos)
CREATE POLICY "Permitir inserção de cervejas" ON cerveja
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de cervejas" ON cerveja
    FOR UPDATE USING (true);

-- Políticas para a tabela informacao
-- Todos podem ver informações de cervejas
CREATE POLICY "Todos podem ver informações de cervejas" ON informacao
    FOR SELECT USING (NOT deletado);

-- Permitir inserção/atualização de informações
CREATE POLICY "Permitir inserção de informações" ON informacao
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de informações" ON informacao
    FOR UPDATE USING (true);

-- Políticas para a tabela proprietario
-- Todos podem ver proprietários ativos
CREATE POLICY "Todos podem ver proprietários" ON proprietario
    FOR SELECT USING (NOT deletado);

-- Permitir inserção/atualização
CREATE POLICY "Permitir inserção de proprietários" ON proprietario
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de proprietários" ON proprietario
    FOR UPDATE USING (true);

-- Políticas para a tabela voto
-- Usuários podem ver todos os votos
CREATE POLICY "Todos podem ver votos" ON voto
    FOR SELECT USING (NOT deletado);

-- Usuários autenticados podem votar
CREATE POLICY "Usuários autenticados podem votar" ON voto
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Usuários podem atualizar apenas seus próprios votos
CREATE POLICY "Usuários podem atualizar seus votos" ON voto
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Usuários podem deletar apenas seus próprios votos
CREATE POLICY "Usuários podem deletar seus votos" ON voto
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- Políticas para a tabela avaliacao
-- Todos podem ver avaliações
CREATE POLICY "Todos podem ver avaliações" ON avaliacao
    FOR SELECT USING (NOT deletado);

-- Usuários autenticados podem avaliar
CREATE POLICY "Usuários autenticados podem avaliar" ON avaliacao
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Usuários podem atualizar apenas suas próprias avaliações
CREATE POLICY "Usuários podem atualizar suas avaliações" ON avaliacao
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Usuários podem deletar apenas suas próprias avaliações
CREATE POLICY "Usuários podem deletar suas avaliações" ON avaliacao
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- Políticas para a tabela comentario
-- Todos podem ver comentários não deletados
CREATE POLICY "Todos podem ver comentários" ON comentario
    FOR SELECT USING (NOT deletado);

-- Usuários autenticados podem comentar
CREATE POLICY "Usuários autenticados podem comentar" ON comentario
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Usuários podem atualizar apenas seus próprios comentários
CREATE POLICY "Usuários podem atualizar seus comentários" ON comentario
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Usuários podem deletar apenas seus próprios comentários
CREATE POLICY "Usuários podem deletar seus comentários" ON comentario
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- Políticas para a tabela comentario_curtida
-- Todos podem ver curtidas
CREATE POLICY "Todos podem ver curtidas" ON comentario_curtida
    FOR SELECT USING (true);

-- Usuários autenticados podem curtir/descurtir
CREATE POLICY "Usuários autenticados podem curtir" ON comentario_curtida
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Usuários podem atualizar apenas suas próprias curtidas
CREATE POLICY "Usuários podem atualizar suas curtidas" ON comentario_curtida
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Usuários podem deletar apenas suas próprias curtidas
CREATE POLICY "Usuários podem deletar suas curtidas" ON comentario_curtida
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- Políticas para a tabela ranking
-- Todos podem ver rankings
CREATE POLICY "Todos podem ver rankings" ON ranking
    FOR SELECT USING (status = true);

-- Permitir atualização de rankings (para triggers)
CREATE POLICY "Permitir atualização de rankings" ON ranking
    FOR ALL USING (true);

-- Políticas para a tabela selo
-- Todos podem ver selos
CREATE POLICY "Todos podem ver selos" ON selo
    FOR SELECT USING (status = true);

-- Permitir inserção/atualização de selos
CREATE POLICY "Permitir inserção de selos" ON selo
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de selos" ON selo
    FOR UPDATE USING (true);

-- Políticas para a tabela favorito
-- Usuários podem ver apenas seus próprios favoritos
CREATE POLICY "Usuários podem ver seus favoritos" ON favorito
    FOR SELECT USING (auth.uid()::text = usuario_id::text);

-- Usuários autenticados podem favoritar
CREATE POLICY "Usuários autenticados podem favoritar" ON favorito
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Usuários podem atualizar apenas seus próprios favoritos
CREATE POLICY "Usuários podem atualizar seus favoritos" ON favorito
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Usuários podem deletar apenas seus próprios favoritos
CREATE POLICY "Usuários podem deletar seus favoritos" ON favorito
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- Função para sincronizar usuário do Supabase Auth com tabela usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuario (uuid, nome, email, foto_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário automaticamente quando alguém se registra
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

