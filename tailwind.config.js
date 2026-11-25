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
        // 展示用衬线：思源宋体优先，回退到系统宋体
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          'STSong',
          'SimSun',
          'Georgia',
          'serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      colors: {
        // 宇宙组曲的星图底色：近黑，带一点点冷灰
        ink: {
          950: '#04050A',
          900: '#070910',
          800: '#0B0E17',
          700: '#11151F',
          600: '#171C28',
        },
        // 纸白：标题、正文、细线的来源色
        paper: {
          50: '#F8F5EC',
          100: '#EFEADE',
          200: '#D9D3C3',
          300: '#A9A496',
          400: '#7B776C',
          500: '#55524A',
        },
        // 黄铜金：强调、链路点亮、档案编号
        gold: {
          200: '#EFDCB4',
          300: '#DEC592',
          400: '#C9A96A',
          500: '#A8894F',
          600: '#7D6539',
        },
        // 冷青：次级信息
        ice: {
          300: '#A9CDD8',
          400: '#82B0C0',
          500: '#5D8B9C',
        },
        // 警示：低饱和的赤陶色，避免破坏整体克制感
        ember: {
          300: '#DCA191',
          400: '#C2745F',
        },
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      maxWidth: {
        prose72: '72ch',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
