/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        razorpay: {
          blue: '#0C2340',
          accent: '#0C83FE',
          dark: '#031B33',
          light: '#F4F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0D233E',
          muted: '#64748B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          purple: '#6366F1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
