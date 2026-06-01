/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.tsx",
    "./components/**/*.tsx",
    "./services/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: 'rgba(255, 255, 255, 0.03)',
        primary: '#00F5E1',
        primaryDark: '#00A8B5',
        secondary: '#A78BFA',
        accent: '#FF2E63',
        muted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px -5px #00F5E1' },
          'to': { boxShadow: '0 0 20px 5px rgba(0, 245, 225, 0.3)' },
        }
      }
    }
  },
  plugins: [],
}
