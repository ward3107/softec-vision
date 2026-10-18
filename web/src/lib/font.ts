import localFont from 'next/font/local';

/** Self-hosted Google Fonts Assistant, licensed under SIL Open Font License. */
export const assistant = localFont({
  src: '../assets/fonts/Assistant-wght.ttf',
  weight: '400 800',
  display: 'swap',
  variable: '--font-assistant'
});
