import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { BLOG_POSTS } from '@/lib/blog/posts';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return pageMetadata({ locale: l, path: '/blog', title: t('title'), description: t('description') });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;
  const t = await getTranslations('blog');

  return (
    <div className="bg-paper">
      <section className="border-b border-line bg-[#EAF6FC]">
        <div className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(52px,8vw,104px)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blueprint">{t('eyebrow')}</p>
          <h1 className="mt-3 max-w-[20ch] text-[clamp(2.35rem,5vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-graphite">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-[#46535D]">{t('description')}</p>
        </div>
      </section>

      <section aria-labelledby="articles-title" className="mx-auto max-w-shell px-[clamp(20px,4.5vw,72px)] py-[clamp(52px,7vw,92px)]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="articles-title" className="text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold tracking-tight">
              {t('latest')}
            </h2>
            <p className="mt-2 max-w-2xl text-machine">{t('method')}</p>
          </div>
          <span className="rounded-full border border-softec/30 bg-skyline/15 px-4 py-2 text-sm font-bold text-blueprint">
            {t('articleCount', { count: BLOG_POSTS.length })}
          </span>
        </div>

        <div className="grid gap-7 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => {
            const article = post.content[l];
            return (
              <article key={post.slug} className="overflow-hidden rounded-[24px] border border-line bg-pure shadow-[0_16px_42px_rgba(12,32,48,0.08)]">
                <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
                  <div className="aspect-[4/3] overflow-hidden bg-[#F5FAFD]">
                    <Image
                      src={post.image}
                      alt={article.imageAlt}
                      width={900}
                      height={675}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.035]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blueprint">{article.eyebrow}</p>
                    <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-graphite group-hover:text-blueprint">
                      {article.title}
                    </h2>
                    <p className="mt-3 flex-1 leading-relaxed text-machine">{article.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                      <time dateTime={post.updatedAt} className="text-machine">{t('updated')} {new Intl.DateTimeFormat(l === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'medium' }).format(new Date(post.updatedAt))}</time>
                      <span className="font-bold text-blueprint">{t('read')} <span aria-hidden="true">→</span></span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

