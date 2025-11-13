import type { Config } from 'tailwindcss'

export default {
  darkMode: 'selector', // This tells Tailwind to use .dark class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config
