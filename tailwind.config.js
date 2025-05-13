/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Activar el modo oscuro basado en clases
  theme: {
    extend: {
      colors: {
        // Puedes personalizarlo según los colores de tu marca
      },
      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8, backgroundColor: 'rgba(59, 130, 246, 0.2)' },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 2s ease-in-out 1',
      },
    },
  },
  plugins: [],
} 