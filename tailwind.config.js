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
        // 近黑底，带极轻的蓝紫倾向
        void: {
          900: '#05060F',
          800: '#090B1A',
          700: '#0E1124',
          600: '#141834',
        },
        // 主强调：紫罗兰（取自参考图 H≈255-260）
        nebula: {
          300: '#C4A4FF',
          400: '#A855F7',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#5B21B6',
        },
        // 辅助：偏蓝的星云色
        comet: {
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
        },
        star: {
          100: '#F4F1FF',
          200: '#D8CEF0',
          300: '#A79FC4',
          400: '#7A7399',
          500: '#524D6B',
        },
        edge: {
          subtle: 'rgba(168, 85, 247, 0.12)',
          soft: 'rgba(168, 85, 247, 0.22)',
          strong: 'rgba(168, 85, 247, 0.45)',
        },
      },
      boxShadow: {
        glass:
          '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -8px rgba(0,0,0,0.65)',
        glow: '0 0 24px -4px rgba(168, 85, 247, 0.45)',
        'glow-lg': '0 0 48px -8px rgba(168, 85, 247, 0.55)',
      },
      maxWidth: {
        prose72: '72ch',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
