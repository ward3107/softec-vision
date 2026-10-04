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
      {/* Leave enough room below the final footer row for the floating WhatsApp and back-to-top controls. */}
      <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] pb-24 pt-6 text-sm sm:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="block w-[160px]">
              <BrandLogo dark />
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
        <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/10 pt-4">
          <CreatorSignature />
          <span className="self-end opacity-80 transition-opacity hover:opacity-100">
            <AdminEntrance />
          </span>
        </div>
      </div>
    </footer>
  );
}
