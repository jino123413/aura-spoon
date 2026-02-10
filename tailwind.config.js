/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B61FF',
          light: '#9D8AFF',
          dark: '#5A3FD6',
        },
        accent: {
          DEFAULT: '#E8DEFF',
          light: '#F3EDFF',
        },
        bg: {
          DEFAULT: '#F8F5FF',
          card: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#EDE8FF',
          light: '#F5F0FF',
        },
      },
      fontFamily: {
        gmarket: ['GmarketSans', 'Pretendard Variable', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
