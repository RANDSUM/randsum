/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  safelist: [
    // Game-specific text colors
    'text-games-blades-500',
    'text-games-daggerheart-500',
    'text-games-fifth-500',
    'text-games-root-rpg-500',
    'text-games-salvageunion-500',
    // Game-specific background colors for hover states
    'hover:bg-games-blades-600/10',
    'hover:bg-games-daggerheart-600/10',
    'hover:bg-games-fifth-600/10',
    'hover:bg-games-root-rpg-600/10',
    'hover:bg-games-salvageunion-600/10'
  ],
  theme: {
    extend: {
      colors: {
        // RANDSUM brand colors
        randsum: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b'
        },
        // Silver/white gradient colors
        silver: {
          50: '#ffffff',
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529'
        },
        // Game-specific accent colors
        'games-blades': {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        },
        'games-daggerheart': {
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed'
        },
        'games-fifth': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        },
        'games-root-rpg': {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        'games-salvageunion': {
          50: '#e0f2fe',
          500: '#87b5d3',
          600: '#6ba3c7',
          700: '#5691bb'
        },
        // App colors
        apps: {
          mcp: {
            50: '#ecfeff',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490'
          },
          robo: {
            50: '#eef2ff',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca'
          }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'silver-gradient':
          'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        'dark-gradient':
          'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'hero-gradient':
          'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)'
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(100, 116, 139, 0.3)',
        'glow-lg': '0 0 40px rgba(100, 116, 139, 0.4)'
      }
    }
  },
  plugins: []
}
