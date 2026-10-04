import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import AdminEntrance from './AdminEntrance';
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
    <footer className="bg-footer text-paper">
      {/* Keep enough room below the final footer row for the floating WhatsApp and back-to-top controls. */}
      <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] pb-16 pt-4 text-sm sm:pb-24 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="block w-[140px] sm:w-[160px]">
              <BrandLogo dark />
            </span>
            <span className="font-semibold">{t('rights')}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-0 sm:gap-x-6 sm:gap-y-2" aria-label="Legal">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="min-h-[44px] items-center py-2 font-semibold text-[#cfe6f6] hover:underline">
                {link.label}
              </Link>
            ))}
            <CookiePreferencesLink label={t('cookiePreferences')} />
          </nav>
        </div>
        <div className="mt-3 flex flex-col items-center gap-2 border-t border-white/10 pt-3 sm:mt-6 sm:gap-3 sm:pt-4">
          <CreatorSignature />
          <span className="self-end opacity-80 transition-opacity hover:opacity-100">
            <AdminEntrance />
          </span>
        </div>
      </div>
    </footer>
  );
}
