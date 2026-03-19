import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: '#d4a943',
        'gold-light': '#f0c060',
        'dark-bg': '#0f1117',
        'dark-surface': '#161a24',
        'dark-card': '#1c2130',
        'dark-border': '#252d3d',
        'text-muted': '#6b7280',
      },
    },
  },
  plugins: [],
}
export default config
