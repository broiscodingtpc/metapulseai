/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Dark mode palette (WCAG AA compliant)
        'deep-bg': '#0a0b0f',
        'panel-dark': '#0f1116',
        'edge-grey': '#1a1e27',
        'neon-cyan': '#00e5ff',
        'electric-blue': '#3fa9ff',
        'accent-violet': '#7a5cff',
        'text-high': '#e6f1ff', // High contrast: 14:1 on dark bg
        'text-mid': '#b8c0d2', // Medium contrast: 7:1 on dark bg (improved from #a8b0c2)
        'hairline': '#151923',
        // Light mode palette (WCAG AA compliant)
        'light-bg': '#ffffff',
        'light-panel': '#f8f9fa',
        'light-edge': '#e5e7eb',
        'light-text-high': '#1a1a1a', // High contrast: 16:1 on white
        'light-text-mid': '#4b5563', // Medium contrast: 7:1 on white (improved from #6b7280)
        // Accessible color variants
        'dark': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'outfit': ['var(--font-outfit)', 'sans-serif'],
        'rajdhani': ['var(--font-rajdhani)', 'sans-serif'],
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-rajdhani)', 'monospace'],
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