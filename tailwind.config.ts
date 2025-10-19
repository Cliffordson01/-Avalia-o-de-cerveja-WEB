// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    // Certifique-se de que os caminhos para seus arquivos estão aqui
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        // Mapeia a Inter (corpo do texto)
        sans: ['var(--font-inter)', 'sans-serif'], 
        
        // Mapeia a Bebas Neue (títulos marcantes)
        bebas: ['var(--font-bebas)', 'sans-serif'],
        
        // Mapeia a Cinzel (o novo estilo Dark Souls/épico)
        cinzel: ['var(--font-cinzel)', 'serif'], 
      },
    },
  },
  plugins: [],
}

export default config