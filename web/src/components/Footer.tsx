import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import BrandLogo from './BrandLogo';
import CookiePreferencesLink from './consent/CookiePreferencesLink';
import CreatorSignature from './CreatorSignature';

export default async function Footer() {
  const t = await getTranslations('footer');

  const links = [
    { href: '/legal/privacy', label: t('privacy') },
    { href: '/legal/accessibility', label: t('accessibility') },
    { href: '/legal/terms', label: t('terms') }
  ];

  return (
    <footer className="bg-graphite text-paper">
      {/* pb-36 keeps the last row clear of the floating WhatsApp/back-to-top/
          accessibility dock (fixed, up to ~124px tall at the bottom-5 corner)
          when the page is scrolled all the way down — otherwise it covers
          the creator signature. */}
      <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] pb-36 pt-8 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="w-[150px] overflow-hidden rounded-sm bg-white p-1.5">
              <BrandLogo />
            </span>
            <span className="font-semibold">{t('rights')}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="min-h-[44px] items-center py-2 font-semibold text-[#cfe6f6] hover:underline">
                {link.label}
              </Link>
            ))}
            <CookiePreferencesLink label={t('cookiePreferences')} />
          </nav>
        </div>
        <div className="mt-7 border-t border-white/15 pt-5">
          <CreatorSignature />
        </div>
      </div>
    </footer>
  );
}
