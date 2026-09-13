/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050507',
          900: '#0B0C0E',
          850: '#121316',
          800: '#1A1B1F',
          700: '#2B2D33',
        },
        brand: {
          lime: '#D4FF00',
          crimson: '#FF334B',
          lilac: '#A78BFA',
          gold: '#E5C378',
          cyan: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Syne', 'Outfit', 'Cabinet Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(0, 0, 0, 0.70)',
        'bezel': 'inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.50)',
        'glow-lime': '0 0 35px rgba(212, 255, 0, 0.25)',
        'glow-crimson': '0 0 35px rgba(255, 51, 75, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 18s linear infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(0.98)' },
        },
      }
    },
  },
  plugins: [],
};
