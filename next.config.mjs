// next.config.mjs - CONFIGURAÇÃO SUPER SIMPLIFICADA
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Mude para false para debug
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pyforcldtjzvfdenrkoz.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // ✅ REMOVER TUDO que causa conflito com Turbopack
  // ❌ REMOVER webpack, turbopack, experimental, compiler
  
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig