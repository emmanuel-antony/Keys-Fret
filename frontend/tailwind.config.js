/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        'surface-2': '#1a2236',
        indigo: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        purple: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'drift': 'drift 8s ease-in-out infinite',
        'drift-delayed': 'drift 10s ease-in-out infinite -3s',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse': 'glow-pulse 1.2s ease-in-out infinite',
        'beat': 'beat-ring 0.8s ease-out',
        'shimmer': 'shimmer 1.8s infinite linear',
        'wave': 'wave-bar 1s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%':       { transform: 'translateY(-30px) scale(1.05)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.85) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.6' },
        },
        'beat-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.6)' },
          '70%':  { boxShadow: '0 0 0 12px rgba(99, 102, 241, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'wave-bar': {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':       { transform: 'scaleY(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.15)',
        'glow-purple': '0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.1)',
        'glow-key': '0 0 15px rgba(99,102,241,0.8)',
      },
    },
  },
  plugins: [],
}
