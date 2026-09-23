import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import BrandLogo from './BrandLogo';
import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';

export default async function Header() {
  const t = await getTranslations('nav');

  const links = [
    { href: '/catalog', label: t('products') },
    { href: '/custom', label: t('custom') },
    { href: '/about', label: t('about') },
    { href: '/process', label: t('process') }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-pure dark:border-white/10 dark:bg-surface">
      <div className="mx-auto flex min-h-[88px] max-w-shell items-center gap-3 px-[clamp(16px,4.5vw,72px)] py-4 sm:gap-6">
        <Link href="/" className="w-[116px] flex-none sm:w-[190px]" aria-label={t('brand')}>
          <BrandLogo priority />
        </Link>

        <nav aria-label={t('primary')} className="ms-auto hidden items-center gap-[clamp(18px,2.2vw,34px)] text-base font-semibold lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blueprint dark:hover:text-skyline">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex flex-none items-center gap-3 lg:ms-0">
          <ThemeToggle toLightLabel={t('themeToLight')} toDarkLabel={t('themeToDark')} />
          <LanguageSwitcher />
          <MobileNav
            links={links}
            primaryLabel={t('primary')}
            openLabel={t('menuOpen')}
            closeLabel={t('menuClose')}
          />
        </div>
      </div>
    </header>
  );
}
