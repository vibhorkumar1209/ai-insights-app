import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0c3649',
          light: '#0e4560',
          xl: '#16587a',
          surface: '#0f2535',
          card: '#132d40',
          cardB: '#183650',
          border: '#1e4a68',
          bg: '#080f16',
        },
        brand: {
          red: '#E63946',
          blue: '#3491E8',
          redL: '#ff6b75',
          blueL: '#6ab8ff',
        },
        ink: {
          primary: '#E8EDF5',
          muted: '#7eaabf',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        'gradient-card': 'linear-gradient(180deg, #132d40, #0f2535)',
      },
    },
  },
  plugins: [],
}

export default config
