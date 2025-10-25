/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Console ASCII Theme Colors
        'console': {
          'bg': '#0a0c10',
          'panel': '#0d1117', 
          'grid': '#141922',
          'fg': '#e6f1ff',
          'dim': '#a2adbf',
          'green': '#00ff9c',
          'cyan': '#00e5ff',
          'yellow': '#ffd866',
          'red': '#ff5577',
          'link': '#5bd0ff',
        },
        // Legacy colors for compatibility
        'deep-bg': '#0a0c10',
        'panel-dark': '#0d1117',
        'edge-grey': '#141922',
        'neon-cyan': '#00e5ff',
        'electric-blue': '#3fa9ff',
        'accent-violet': '#7a5cff',
        'text-high': '#e6f1ff',
        'text-mid': '#a2adbf',
        'hairline': '#141922',
      },
      fontFamily: {
        'mono': ['var(--mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
        'console': ['var(--mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
        sans: ['var(--mono)', 'system-ui', 'sans-serif'],
        heading: ['var(--mono)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'plasma-sweep': 'plasma-sweep 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'hero-glow': 'hero-glow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        'plasma-sweep': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,229,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,229,255,0.6)' },
        },
        'hero-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.3))' },
          '50%': { filter: 'drop-shadow(0 0 40px rgba(0,229,255,0.6))' },
        },
        'fadeIn': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'slideUp': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'scaleIn': {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0,229,255,0.3)',
        'neon-lg': '0 0 20px rgba(0,229,255,0.4)',
        'neon-xl': '0 0 40px rgba(0,229,255,0.6)',
      },
      backdropBlur: {
        'cyber': '8px',
      },
      letterSpacing: {
        'tech': '0.02em',
      },
      // Fluid spacing scale for responsive design
      spacing: {
        'fluid-xs': 'clamp(0.5rem, 1vw, 0.75rem)',
        'fluid-sm': 'clamp(1rem, 2vw, 1.5rem)',
        'fluid-md': 'clamp(1.5rem, 3vw, 2.5rem)',
        'fluid-lg': 'clamp(2rem, 4vw, 4rem)',
        'fluid-xl': 'clamp(3rem, 6vw, 6rem)',
      },
      // Better line heights for readability
      lineHeight: {
        'tight': '1.2',
        'snug': '1.4',
        'normal': '1.6',
        'relaxed': '1.7',
        'loose': '1.8',
      },
    },
  },
  plugins: [],
}