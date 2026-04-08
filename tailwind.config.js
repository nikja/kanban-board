/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          root: '#0a0a0a',
          panel: '#111111',
          column: '#1a1a1a',
          card: '#222222',
          'card-hover': '#2a2a2a',
        },
        border: {
          DEFAULT: '#2a2a2a',
          light: '#333333',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#888888',
          muted: '#555555',
        },
        accent: {
          indigo: '#6366f1',
          purple: '#a855f7',
        },
        status: {
          todo: '#6b7280',
          'in-progress': '#3b82f6',
          'in-review': '#f59e0b',
          done: '#22c55e',
        },
        priority: {
          high: '#ef4444',
          normal: '#6366f1',
          low: '#6b7280',
        },
      },
      animation: {
        slideIn: 'slideIn 0.25s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
