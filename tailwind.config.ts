import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], 
        bebas: ['var(--font-bebas)', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'serif'], 
      },
      colors: {
        // Cores temáticas de cerveja - Light Mode Refresh
        beer: {
          50: '#fffdf6',
          100: '#fef7e6',
          200: '#fdecc2',
          300: '#fbdf8e',
          400: '#f8cf4a',
          500: '#f5c044',
          600: '#e6a61c',
          700: '#bf8516',
          800: '#996617',
          900: '#7d5316',
          950: '#432a0a',
        },
        // Cores complementares refrescantes
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'theme-switch': 'themeSwitch 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        themeSwitch: {
          '0%': {
            transform: 'scale(1) rotate(0deg)',
          },
          '50%': {
            transform: 'scale(0.8) rotate(180deg)',
          },
          '100%': {
            transform: 'scale(1) rotate(360deg)',
          },
        },
      },
      backgroundImage: {
        'beer-gradient-light': 'linear-gradient(135deg, #f8cf4a 0%, #f5c044 50%, #e6a61c 100%)',
        'beer-gradient-dark': 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
        'fresh-gradient': 'linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #f8cf4a 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config