/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Visual System Palette
        'deep-bg': '#0a0b0f',
        'panel-dark': '#0f1116',
        'edge-grey': '#1a1e27',
        'neon-cyan': '#00e5ff',
        'electric-blue': '#3fa9ff',
        'accent-violet': '#7a5cff',
        'text-high': '#e6f1ff',
        'text-mid': '#a8b0c2',
        'hairline': '#151923',
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
        'orbitron': ['Orbitron', 'monospace'],
        'inter': ['Inter', 'sans-serif'],
        'jetbrains': ['JetBrains Mono', 'monospace'],
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
    },
  },
  plugins: [],
}