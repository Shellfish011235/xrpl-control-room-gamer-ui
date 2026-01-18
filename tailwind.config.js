/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0f1a',
        'cyber-darker': '#050810',
        'cyber-navy': '#0d1526',
        'cyber-panel': '#111827',
        'cyber-border': '#1e3a5f',
        'cyber-glow': '#00d4ff',
        'cyber-blue': '#00aaff',
        'cyber-cyan': '#00ffff',
        'cyber-purple': '#a855f7',
        'cyber-magenta': '#ff00ff',
        'cyber-green': '#00ff88',
        'cyber-yellow': '#ffd700',
        'cyber-orange': '#ff8c00',
        'cyber-red': '#ff4444',
        'cyber-text': '#e0e7ff',
        'cyber-muted': '#64748b',
        'ripple-blue': '#008cff',
        'ripple-dark': '#006097',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'Rajdhani', 'system-ui', 'sans-serif'],
        'display': ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'grid-move': 'gridMove 20s linear infinite',
        'data-flow': 'dataFlow 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px #00d4ff' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px #00d4ff' },
        },
        'gridMove': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
        'dataFlow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
}
