/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 1s ease-in-out infinite',
        'pulse-fast': 'pulse 0.5s ease-in-out infinite',
        'float-up': 'floatUp 2s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out',
        'rainbow': 'rainbow 2s ease infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(-200px) scale(0.5) rotate(360deg)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        rainbow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-5deg)' },
          '75%': { transform: 'translateX(5px) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}
