import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('nav');
  return (
    <section className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-24 text-center">
      <p className="text-6xl font-extrabold text-blueprint">404</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
      >
        {t('brand')}
      </Link>
    </section>
  );
}
