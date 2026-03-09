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
        // 深色主题配色 (类似 Wireshark)
        dark: {
          primary: '#1a1a1a',
          secondary: '#252525',
          tertiary: '#2d2d2d',
          quaternary: '#333333',
        },
        accent: {
          DEFAULT: '#4a9eff',
          hover: '#3a8eef',
        },
        text: {
          primary: '#e0e0e0',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        border: {
          DEFAULT: '#3d3d3d',
          light: '#4d4d4d',
        },
        status: {
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
          info: '#2196f3',
        },
        // 协议颜色
        protocol: {
          tcp: '#4caf50',
          udp: '#2196f3',
          http: '#ff9800',
          https: '#9c27b0',
          dns: '#00bcd4',
          icmp: '#f44336',
          arp: '#795548',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '0.9375rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      height: {
        'header': '3.5rem',
        'sidebar': 'calc(100vh - 3.5rem)',
      },
      minHeight: {
        'sidebar': 'calc(100vh - 3.5rem)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}
