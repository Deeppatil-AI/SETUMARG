/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terrain: {
          ink: 'var(--terrain-ink)',
          paper: 'var(--terrain-paper)',
          'paper-muted': 'var(--terrain-paper-muted)',
          'paper-card': 'var(--terrain-paper-card)',
        },
        slope: {
          slate: 'var(--slope-slate)',
          light: 'var(--slope-slate-light)',
          border: 'var(--slope-slate-border)',
        },
        monsoon: {
          blue: 'var(--monsoon-blue)',
          light: 'var(--monsoon-blue-light)',
        },
        risk: {
          safe: 'var(--risk-safe)',
          amber: 'var(--risk-amber)',
          red: 'var(--risk-red)',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
