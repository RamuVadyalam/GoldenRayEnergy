/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Grotesk', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'tighter-plus': '-0.035em',
      },
      colors: {
        amber: { 450: '#f59e0b' },
        brand: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      },
    },
  },
  plugins: [],
};
