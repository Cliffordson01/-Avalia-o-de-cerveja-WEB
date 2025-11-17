// next.config.mjs - CONFIGURAÇÃO SIMPLIFICADA
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Configurações básicas
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ✅ Configurações de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pyforcldtjzvfdenrkoz.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // ✅ REMOVER completamente webpack e turbopack
  // ❌ NÃO usar webpack: () => {}
  // ❌ NÃO usar turbopack: {}
  
  // ✅ Headers de segurança (opcional, pode remover se der problema)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
}

export default nextConfig;