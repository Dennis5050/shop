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
        brand: {
          50: '#e8faf4',
          100: '#c5f3e4',
          200: '#8ee6cb',
          300: '#4ed2ae',
          400: '#25D366',
          500: '#00a884', // WhatsApp Meta Primary Green
          600: '#008069', // WhatsApp Dark Green
          700: '#006654',
          800: '#015243',
          900: '#024338',
          950: '#00251f',
        },
        whatsapp: {
          green: '#25D366',
          teal: '#128c7e',
          darkGreen: '#075e54',
          metaGreen: '#00a884',
          appHeader: '#008069',
          blueTick: '#53bdeb',
          darkBg: '#0b141a',
          darkSidebar: '#111b21',
          darkHeader: '#202c33',
          darkHover: '#222e35',
          darkActive: '#2a3942',
          bubbleOut: '#005c4b',
          bubbleIn: '#202c33',
          textPrimary: '#e9edef',
          textSecondary: '#8696a0',
          inputBg: '#2a3942',
          border: '#222d34',
        },
        chat: {
          bg: '#0b141a',
          sidebar: '#111b21',
          header: '#202c33',
          panel: '#0b141a',
          bubbleOut: '#005c4b',
          bubbleIn: '#202c33',
          bubbleText: '#e9edef',
          muted: '#8696a0',
          hover: '#222e35',
          active: '#2a3942',
          border: '#222d34',
        },
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
