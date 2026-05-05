/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['IBM Plex Sans Arabic', 'sans-serif'] },
      colors: {
        primary: { 50:'#f0f4ff', 100:'#dde5ff', 200:'#c4d1ff', 300:'#9eb4ff', 400:'#718cff', 500:'#4f62ff', 600:'#3d48f5', 700:'#3236e0', 800:'#2a2db5', 900:'#272c8e' },
        dark: { 900:'#0f0f12', 800:'#16161c', 700:'#1e1e26', 600:'#262630', 500:'#32323e' },
      },
    },
  },
  plugins: [],
};
