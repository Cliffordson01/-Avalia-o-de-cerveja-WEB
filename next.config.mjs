// next.config.mjs - CONFIGURAÇÃO ATUALIZADA PARA NEXT.JS 16
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Desativar tipos em produção para evitar erros
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ❌ REMOVER - eslint não é mais suportado no next.config.mjs
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  
  // ✅ Otimizações de performance
  compress: true,
  poweredByHeader: false,
  
  // ✅ Otimizações de imagens - CONFIGURAÇÃO ATUALIZADA
  images: {
    // ❌ DEPRECATED: domains está obsoleto
    // domains: ['pyforcldtjzvfdenrkoz.supabase.co'],
    
    // ✅ USAR remotePatterns em vez de domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pyforcldtjzvfdenrkoz.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60, // Cache de 60 segundos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // ✅ Novas otimizações para ranking
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Otimizações de compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ✅ Configuração do Turbopack para Next.js 16
  turbopack: {
    // 🔥 Resolve o erro do Turbopack
    // Pode deixar vazio ou adicionar configurações específicas
  },

  // ✅ Headers de segurança E PERFORMANCE
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // ✅ CACHE ESPECÍFICO PARA RANKING
      {
        source: '/ranking',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      // ✅ CACHE AGGRESSIVO PARA STATICOS
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ✅ WEBPACK OPTIMIZATIONS - MANTIDO PARA BUILD DE PRODUÇÃO
  webpack: (config, { dev, isServer }) => {
    // ✅ Otimizar moment.js/lodash (se estiver usando)
    config.resolve.alias = {
      ...config.resolve.alias,
      'moment$': 'moment/moment.js',
    }

    // ✅ Split chunks mais agressivo em produção
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunks
          common: {
            minChunks: 2,
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      }
    }

    return config
  },

  // ✅ EXPERIMENTAL FEATURES PARA PERFORMANCE
  experimental: {
    // optimizeCss: true, // Descomente se quiser otimização CSS extra
    scrollRestoration: true,
  },
}

export default nextConfig