import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Navy (primary brand / backgrounds) ─────────────────────────────
        navy: {
          50:  '#f0f3fa',
          100: '#dde3f0',
          200: '#bfcae3',
          300: '#94a7cf',
          400: '#6580b8',
          500: '#4763a3',
          600: '#374e8a',
          700: '#2e3f70',
          800: '#1e2a4a',   // primary dark bg
          900: '#131b30',   // deepest bg
          950: '#0b1020',
        },

        // ─── Teal (primary interactive / CTAs) ───────────────────────────────
        teal: {
          50:  '#effefa',
          100: '#c8fff4',
          200: '#93ffe9',
          300: '#56f5d8',
          400: '#22e0c2',
          500: '#0bc4a9',   // primary action color
          600: '#059d89',
          700: '#097e6e',
          800: '#0c6459',
          900: '#0f5249',
          950: '#02332e',
        },

        // ─── Sky (secondary interactive / info) ──────────────────────────────
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',   // links, secondary actions
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ─── Amber (warnings / renewal urgency) ──────────────────────────────
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',   // warning state
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // ─── Rose (errors / critical alerts) ─────────────────────────────────
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',   // error / destructive
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },

        // ─── Green (success / approved status) ───────────────────────────────
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',   // success / active status
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },

        // ─── Purple (AI / Copilot features) ──────────────────────────────────
        purple: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',   // AI copilot accent
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },

      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
