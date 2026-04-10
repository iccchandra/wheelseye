/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a5f', 950: '#0f172a',
        },
        sidebar: { DEFAULT: '#0f172a', hover: '#1e293b', active: '#1e3a5f', border: '#1e293b', text: '#94a3b8', 'text-active': '#f1f5f9', section: '#475569' },
        surface: { DEFAULT: '#ffffff', secondary: '#f8fafc', tertiary: '#f1f5f9', border: '#e2e8f0', 'border-strong': '#cbd5e1' },
        status: {
          green: '#10b981', 'green-bg': '#ecfdf5',
          orange: '#f59e0b', 'orange-bg': '#fffbeb',
          red: '#ef4444', 'red-bg': '#fef2f2',
          purple: '#8b5cf6', 'purple-bg': '#f5f3ff',
          cyan: '#06b6d4', 'cyan-bg': '#ecfeff',
          pink: '#ec4899', 'pink-bg': '#fdf2f8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        glow: '0 0 20px rgba(59,130,246,0.15)',
        'btn-primary': '0 2px 8px rgba(37,99,235,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease both',
        'slide-in': 'slideIn 0.2s ease both',
        'pulse-dot': 'pulseDot 2s ease infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
};
