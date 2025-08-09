/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{svelte,ts,js}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'Noto Sans KR', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          1: '#0b1020',
          2: '#0f1531',
          3: '#131a3f',
          4: '#1b2558'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,.25)',
        glow: '0 0 0 1px rgba(255,255,255,.06), 0 10px 30px rgba(56, 80, 255, .25)'
      },
      borderRadius: {
        xl2: '1rem',
      }
    },
  },
  plugins: [],
};
