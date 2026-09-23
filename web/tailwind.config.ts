import type { Config } from 'tailwindcss';

/**
 * Architectural Precision design tokens, ported from the static site.
 * Colors are also exposed as CSS variables in globals.css.
 */
const config: Config = {
  darkMode: 'class',
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
        // Footer: a softened dark slate carrying the Softec blue undertone —
        // less harsh than near-black graphite, still deep enough for AA-white
        // text. A permanent-dark brand surface (not theme-flipped).
        footer: '#27353E',
        line: 'color-mix(in srgb, #697077 24%, transparent)',
        // Dark-theme-only surfaces/text, used exclusively behind the `dark:`
        // variant. The light-mode tokens above (paper/pure/graphite/etc.)
        // stay fixed brand colors — several are reused as permanent-dark
        // decorative accents (buttons, bands, footer) that must not flip.
        canvas: '#0B0D0F',
        surface: '#16191C',
        ink: '#F3F4F5',
        fog: '#9BA3AB',
        skyline: '#7CC4EE'
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
