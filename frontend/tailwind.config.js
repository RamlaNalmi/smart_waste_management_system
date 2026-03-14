/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civic-blue': '#1F3A5F',
        'steel-blue': '#3A6EA5',
        'light-grey': '#F4F6F8',
        'dark-blue': '#2C3E50',
        'grey': '#7F8C8D',
        'healthy': '#2ECC71',
        'warning': '#F39C12',
        'critical': '#E74C3C',
        'odor': '#E67E22',
        'humidity': '#3498DB',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
