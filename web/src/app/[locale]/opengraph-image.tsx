import { ImageResponse } from 'next/og';
import { routing, type AppLocale } from '@/i18n/routing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Softec Vision — technology furniture, engineered and manufactured to order';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TAGLINE: Record<AppLocale, string> = {
  he: 'עמדות מרצה, בקרה ותצוגה — מתוכננות ומיוצרות בהתאמה אישית',
  en: 'Lecturer, control and display stations — designed and manufactured to order'
};

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = (routing.locales as readonly string[]).includes(locale) ? (locale as AppLocale) : routing.defaultLocale;
  const rtl = l === 'he';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0C5E91 0%, #151719 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
          <span>SOFTEC</span>
          <span style={{ color: '#7CC4EE', marginLeft: 12 }}>VISION</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 900,
            textAlign: rtl ? 'right' : 'left',
            alignSelf: rtl ? 'flex-end' : 'flex-start'
          }}
        >
          {TAGLINE[l]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#CFE6F6' }}>
          <div style={{ width: 40, height: 4, background: '#1683C7' }} />
          <span>Softec Vision Ltd</span>
        </div>
      </div>
    ),
    size
  );
}
