/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: {
          DEFAULT: '#131315',
          container: '#1B1B1D',
          high: '#252528',
          highest: '#323236',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        brand: {
          blue: '#3B82F6',
          electric: '#60A5FA',
          cyan: '#06B6D4'
        },
        status: {
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'sweep 4s linear infinite',
        'glow-crimson': 'glowRed 1.5s ease-in-out infinite alternate',
        'glow-emerald': 'glowGreen 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glowRed: {
          '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(239, 68, 68, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.3)' }
        },
        glowGreen: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
