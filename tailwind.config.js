/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        sunk: 'rgb(var(--sunk) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ipe: 'rgb(var(--ipe) / <alpha-value>)',
        arauc: 'rgb(var(--arauc) / <alpha-value>)',
        mar: 'rgb(var(--mar) / <alpha-value>)',
        tomate: 'rgb(var(--tomate) / <alpha-value>)',
        lavanda: 'rgb(var(--lavanda) / <alpha-value>)',
        kiwi: 'rgb(var(--kiwi) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        chip: '4px 4px 0 0 rgb(var(--ink))',
        chipsm: '2px 2px 0 0 rgb(var(--ink))',
      },
    },
  },
  plugins: [],
};
