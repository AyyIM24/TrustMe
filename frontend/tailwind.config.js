/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        hg: {
          bg: '#ffe6ee',
          surface: '#d6ebfc',
          card: '#d6ebfc',
          border: '#fbcfe8',
          text: '#0f172a',
          muted: '#475569',
          // Primary — Clinical Sky Blue
          primary: '#0284c7',
          'primary-dark': '#0369a1',
          'primary-light': '#38bdf8',
          'primary-glow': 'rgba(2, 132, 199, 0.16)',
          // Success — Medical Teal / Mint (Mixture of cyan blue & green)
          success: '#0d9488',
          'success-dark': '#0f766e',
          'success-glow': 'rgba(13, 148, 136, 0.16)',
          // Danger — Clinical Rose / Red
          danger: '#e11d48',
          'danger-dark': '#be123c',
          'danger-glow': 'rgba(225, 29, 72, 0.16)',
          // Accent — Medical Indigo / Sky
          accent: '#0284c7',
          'accent-dark': '#0369a1',
          // Warning — Amber
          warning: '#d97706',
        },
        fs: {
          bg: '#ffe6ee',
          surface: '#d6ebfc',
          card: '#d6ebfc',
          border: '#fbcfe8',
          cyan: '#0284c7',
          crimson: '#e11d48',
          green: '#0d9488',
          amber: '#d97706',
          purple: '#6366f1',
          text: '#0f172a',
          muted: '#475569',
        }
      },
      boxShadow: {
        'card-soft': '0 4px 20px -2px rgba(2, 132, 199, 0.08), 0 2px 8px -1px rgba(244, 114, 182, 0.12)',
        'card-hover': '0 16px 36px -4px rgba(2, 132, 199, 0.18), 0 8px 16px -2px rgba(244, 114, 182, 0.22)',
        'pill-hover': '0 6px 18px rgba(6, 182, 212, 0.22)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
