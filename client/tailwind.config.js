/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        rentora: {
          bg: '#FFFFFF',
          page: '#F8FAFC',
          sidebar: '#FFFFFF',
          blue: '#1769D2',
          'blue-hover': '#1256B0',
          'blue-light': '#EFF6FF',
          border: '#E2E8F0',
          'text-primary': '#172033',
          'text-secondary': '#64748B',
          success: '#16834A',
          warning: '#D97706',
          danger: '#DC2626',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1769D2', // Exact requested primary blue
          600: '#1256B0', // Exact requested hover blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172033',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
