/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          'sans-serif',
        ],
      },
      colors: {
        canvas: '#F8FAFC',
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
        },
        line: '#E2E8F0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.12)',
        hover: '0 4px 6px -2px rgba(15, 23, 42, 0.06), 0 16px 40px -12px rgba(15, 23, 42, 0.22)',
      },
      maxWidth: {
        prose72: '72ch',
      },
    },
  },
  plugins: [],
};
