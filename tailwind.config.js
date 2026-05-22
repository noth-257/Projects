/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        void: {
          950: '#07080d',
          900: '#0d0f1a',
          800: '#12152a',
          700: '#1a1f3a',
          600: '#232848',
        },
        ink: {
          100: '#e8eaf6',
          200: '#c5c9e8',
          300: '#9da4d4',
          400: '#7580bf',
          500: '#5060ab',
        },
        aurora: {
          blue: '#5b8dee',
          purple: '#9b6dff',
          cyan: '#3ecfcf',
          green: '#4ade80',
          rose: '#f472b6',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow-blue': '0 0 24px rgba(91,141,238,0.35)',
        'glow-purple': '0 0 24px rgba(155,109,255,0.35)',
      },
    },
  },
  plugins: [],
}
