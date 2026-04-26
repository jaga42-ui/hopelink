/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-raspberry': '#9f1164',
        'pearl-beige': '#e8dab2',
        'dusty-lavender': '#846b8a',
        'blazing-flame': '#ff4a1c',
        'pine-teal': '#29524a',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #9f1164, #ff4a1c)',
        'wild-gradient': 'radial-gradient(circle at top left, #9f1164, #e8dab2, #846b8a, #ff4a1c, #29524a)',
      }
    },
  },
  plugins: [],
}