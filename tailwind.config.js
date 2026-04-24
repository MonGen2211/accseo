/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#eafaf5',
          100: '#c5f2e2',
          200: '#9deacd',
          300: '#6ee0b5',
          400: '#3dd6a0',
          500: '#00b894',
          600: '#009975',
          700: '#007a5e',
          800: '#005c47',
          900: '#003d2f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
