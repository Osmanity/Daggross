export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'avenir': ['"Avenir LT Pro"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4fbf8b',
          dull: '#44ae7c',
        },
      },
      fontWeight: {
        light: 300,
        book: 350,
        normal: 400,
        medium: 500,
        heavy: 800,
        black: 900,
      },
      scale: {
        '108': '1.08',
      },
      maxWidth: {
        '72': '18rem',
        '80': '20rem',
        '105': '26.25rem',
      },
      padding: {
        '18': '4.5rem',
      },
      lineHeight: {
        '15': '3.75rem',
      },
      width: {
        '88': '22rem',
      },
      height: {
        '13': '3.25rem',
      },
    },
  },
  plugins: [],
} 