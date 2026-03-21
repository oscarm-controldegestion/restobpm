/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF4FB',
          100: '#D5E8F0',
          200: '#BDD7EE',
          500: '#2E75B6',
          700: '#1F3864',
          900: '#0F1E34',
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
