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
        // ─── Navy (primary brand / backgrounds — prototype values) ───────────
        navy: {
          DEFAULT: '#0B1929',  // page background
          mid:     '#112238',  // sidebar, modal backgrounds
          light:   '#1A3350',  // active tab/hover fill
          50:  '#f0f3fa',
          100: '#dde3f0',
          200: '#bfcae3',
          300: '#94a7cf',
          400: '#6580b8',
          500: '#4763a3',
          600: '#374e8a',
          700: '#2e3f70',
          800: '#1e2a4a',
          900: '#131b30',
          950: '#0b1020',
        },

        // ─── Teal (primary interactive / CTAs — prototype: #00C2A8) ──────────
        teal: {
          DEFAULT: '#00C2A8',
          50:  '#effefa',
          100: '#c8fff4',
          200: '#93ffe9',
          300: '#56f5d8',
          400: '#22e0c2',
          500: '#0bc4a9',
          600: '#059d89',
          700: '#097e6e',
          800: '#0c6459',
          900: '#0f5249',
          950: '#02332e',
        },

        // ─── Sky (secondary highlight — prototype: #38BDF8) ──────────────────
        sky: {
          DEFAULT: '#38BDF8',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ─── Amber (warnings / pending states — prototype: #F59E0B) ──────────
        amber: {
          DEFAULT: '#F59E0B',
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // ─── Rose (alerts / overdue — prototype: #F43F5E) ────────────────────
        rose: {
          DEFAULT: '#F43F5E',
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },

        // ─── Green (approved / active — prototype: #10B981) ──────────────────
        green: {
          DEFAULT: '#10B981',
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },

        // ─── Purple (AI elements — prototype: #A78BFA) ───────────────────────
        purple: {
          DEFAULT: '#A78BFA',
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },

        // ─── Text hierarchy ───────────────────────────────────────────────────
        text: {
          DEFAULT: '#E8F0F8',
          muted:   '#7A9BBD',
          dim:     '#4A6A8A',
        },

        // ─── Brand accent (blue, as specified in 6D task) ────────────────────
        brand: {
          DEFAULT: '#3b82f6',
          hover:   '#2563eb',
          light:   '#60a5fa',
        },

        // ─── Status aliases ───────────────────────────────────────────────────
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#6366f1',
      },

      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
      },

      boxShadow: {
        card:       '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
      },

      borderColor: {
        subtle:  'rgba(56, 189, 248, 0.12)',
        DEFAULT: 'rgba(56, 189, 248, 0.20)',
      },

      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #7C3AED, #00C2A8)',
      },

      screens: {
        xl:    '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
