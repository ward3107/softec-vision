import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import '../globals.css';

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-assistant'
});

export const metadata: Metadata = {
  title: 'ניהול — Softec Vision',
  robots: { index: false, follow: false }
};

/** Separate root layout: the owner admin shares no public chrome and is never indexed. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="min-h-screen bg-paper font-sans text-graphite antialiased">{children}</body>
    </html>
  );
}
