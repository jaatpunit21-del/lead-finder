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
        luxury: {
          black: '#111111',
          blue: '#0F2744',
          gold: '#C7A86B',
          cream: '#FAF8F4',
          gray: '#F3F3F3',
          darkBlue: '#0A1B2F',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      letterSpacing: {
        'luxury': '0.15em',
        'widest-luxury': '0.25em',
      }
    },
  },
  plugins: [],
}
