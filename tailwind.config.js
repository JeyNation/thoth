/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f5f5f5',
        surface: '#ffffff',
        primary: {
          DEFAULT: '#007bff',
          dark: '#0056b3',
        },
      },
    },
  },
  plugins: [],
};

