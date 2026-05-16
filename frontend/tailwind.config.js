/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          dark: '#5A52E0',
          light: '#EAE8FF',
        },
        gray: {
          bg: '#F0F2F5',
        },
        dark: {
          sidebar: '#1E2139',
          panel: '#252A48',
          card: '#2D3354',
          input: '#363B5B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card-glow': '0 4px 24px rgba(108, 99, 255, 0.12)',
        'bottom-nav': '0 -4px 24px rgba(0, 0, 0, 0.08)',
        'message-out': '0 2px 8px rgba(108, 99, 255, 0.2)',
      },
      animation: {
        'slide-up': 'slideUpIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.18s ease-out both',
        'fade-slide': 'fadeSlideIn 0.22s ease-out both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        slideUpIn: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
