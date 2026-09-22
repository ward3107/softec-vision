import type { Config } from 'tailwindcss';

/**
 * Architectural Precision design tokens, ported from the static site.
 * Colors are also exposed as CSS variables in globals.css.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F8F8',
        pure: '#FFFFFF',
        graphite: '#151719',
        machine: '#697077',
        softec: '#1683C7',
        blueprint: '#0C5E91',
        line: 'color-mix(in srgb, #697077 24%, transparent)'
      },
      fontFamily: {
        sans: ['var(--font-assistant)', 'Arial', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '6px'
      },
      maxWidth: {
        shell: '1440px'
      }
    }
  },
  plugins: []
};

export default config;
