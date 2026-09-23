import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import BrandLogo from './BrandLogo';

export default async function Header() {
  const t = await getTranslations('nav');

  const links = [
    { href: '/catalog', label: t('products') },
    { href: '/custom', label: t('custom') },
    { href: '/about', label: t('about') },
    { href: '/process', label: t('process') }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-pure">
      <div className="mx-auto flex min-h-[88px] max-w-shell items-center gap-6 px-[clamp(20px,4.5vw,72px)] py-4">
        <Link href="/" className="w-[150px] flex-none sm:w-[190px]" aria-label={t('brand')}>
          <BrandLogo priority />
        </Link>

        <nav aria-label={t('primary')} className="ms-auto hidden items-center gap-[clamp(18px,2.2vw,34px)] text-base font-semibold lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blueprint">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex flex-none items-center gap-3 lg:ms-0">
          <LanguageSwitcher />
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
          >
            {t('quote')}
          </Link>
        </div>
      </div>
    </header>
  );
}
