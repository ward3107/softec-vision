import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function Footer() {
  const t = await getTranslations('footer');

  const links = [
    { href: '/legal/privacy', label: t('privacy') },
    { href: '/legal/accessibility', label: t('accessibility') },
    { href: '/legal/terms', label: t('terms') }
  ];

  return (
    <footer className="bg-graphite text-paper">
      <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-4 px-[clamp(20px,4.5vw,72px)] py-8 text-sm">
        <span className="font-semibold">{t('rights')}</span>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-[44px] items-center py-2 font-semibold text-[#cfe6f6] hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
