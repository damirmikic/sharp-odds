/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bia: {
          primary: '#0d0f14',
          secondary: '#131620',
          tertiary: '#1a1d28',
          sidebar: '#0b0d12',
          header: '#0f1118',
          border: '#1e2130',
          'border-subtle': '#181b26',
          'border-accent': '#2a3045',
          'text-primary': '#c8ccd8',
          'text-secondary': '#7a8098',
          'text-muted': '#4a506a',
          'text-bright': '#e8ecf4',
          green: '#4ade80',
          red: '#f87171',
          yellow: '#fbbf24',
          blue: '#60a5fa',
        }
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
