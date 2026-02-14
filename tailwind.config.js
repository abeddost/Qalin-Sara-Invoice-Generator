/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0d9488',
          charcoal: '#1f2937',
          cream: '#fef3c7',
          amber: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
