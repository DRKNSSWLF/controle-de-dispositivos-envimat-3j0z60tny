import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import aspectRatioPlugin from '@tailwindcss/aspect-ratio'

const config: Partial<Config> = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        /* Manual da marca ENVIMAT: Inter (primária) e IBM Plex Sans (técnica) */
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tecnica: ['"IBM Plex Sans"', 'system-ui', 'monospace'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Paleta oficial do manual da marca ENVIMAT 2026 */
        envimat: {
          'verde-escuro': '#0A4421',
          verde: '#086830',
          'verde-claro': '#1F9443',
          azul: '#2E6F9E',
          cinza: '#919191',
          'cinza-claro': '#C6C6C6',
          'branco-gelo': '#F2F2F2',
        },
        /* Escala "emerald" remapeada para a paleta ENVIMAT — mantém os usos
           existentes no código alinhados às cores oficiais da marca.
           dark: variantes claras usadas no modo escuro (estratégia "class") */
        emerald: {
          50: '#eef6f1',
          100: '#d9eadd',
          200: '#b8d6c2',
          300: '#8dbb9e',
          400: '#5c9c76',
          500: '#1F9443',
          600: '#086830',
          700: '#0A4421',
          800: '#0A4421',
          900: '#082d17',
          950: '#05200f',
          dark: {
            50: '#12261b',
            100: '#17301f',
            200: '#1d3b26',
            300: '#274730',
            400: '#3f6a50',
            500: '#4f9c6b',
            600: '#6dbd8a',
            700: '#8fd6a8',
            800: '#b2e6c4',
            900: '#d3f2de',
            950: '#eafaf0',
          },
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionProperty: {
        width: 'width',
        height: 'height',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        elevation: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
    },
  },
  plugins: [animatePlugin, typographyPlugin, aspectRatioPlugin],
} satisfies Partial<Config>

export default config
