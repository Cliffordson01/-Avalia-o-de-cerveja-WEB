-- Sample data for TopBreja
-- Insert sample beers to get started

INSERT INTO cerveja (nome, cervejaria, estilo, teor_alcoolico, ibu, descricao, imagem_url) VALUES
(
  'Colorado Indica',
  'Cervejaria Colorado',
  'India Pale Ale (IPA)',
  7.0,
  65,
  'Uma IPA brasileira com lúpulos americanos, apresentando notas cítricas e amargor equilibrado. Perfeita para os amantes de cervejas lupuladas.',
  '/placeholder.svg?height=400&width=300'
),
(
  'Eisenbahn Pilsen',
  'Cervejaria Eisenbahn',
  'Pilsen',
  4.8,
  25,
  'Cerveja de baixa fermentação, clara e refrescante. Seguindo a tradição alemã, apresenta sabor suave e equilibrado.',
  '/placeholder.svg?height=400&width=300'
),
(
  'Wals Dubbel',
  'Cervejaria Wals',
  'Belgian Dubbel',
  7.5,
  20,
  'Cerveja de estilo belga com coloração escura, notas de caramelo, frutas secas e especiarias. Complexa e encorpada.',
  '/placeholder.svg?height=400&width=300'
);
