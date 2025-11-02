import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neutral: {
          950: '#0a0a0a',
          900: '#171717',
          800: '#262626',
          700: '#404040',
          600: '#525252',
          500: '#737373',
          400: '#a1a1a1',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#fafafa',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
      borderColor: {
        DEFAULT: '#262626',
      },
      backgroundColor: {
        primary: '#0a0a0a',
        secondary: '#171717',
        card: '#1a1a1a',
      },
      textColor: {
        primary: '#fafafa',
        secondary: '#a1a1a1',
      },
    },
  },
  plugins: [],
};

export default config;
