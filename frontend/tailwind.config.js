/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.45s ease-out both',
      },
      colors: {
        sail: {
          bg: "#FAFBFD",
          card: "#FFFFFF",
          border: "#DFE6EE",
          muted: "#B9C3CF",
          textSecondary: "#6C7A89",
          charcoal: "#22272E",
          sidebar: "#1B2028",
          sidebarHover: "#262C36",
          darkBtn: "#1E232A",
          darkBtnHover: "#2A303A",
          highlight: "#F0F4F8",
          tagBg: "#EDF2F7"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'terminal': '6px',
      }
    },
  },
  plugins: [],
}
