import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { BLOG_POSTS, getBlogPost } from '@/lib/blog/posts';
import { BRAND, OG_LOCALE, SITE_URL, localeUrl, metaAlternates } from '@/lib/seo';
import JsonLd, { articleSchema, breadcrumbSchema } from '@/components/JsonLd';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => BLOG_POSTS.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const l = locale as AppLocale;
  const article = post.content[l];
  const path = `/blog/${post.slug}`;
  const image = `${SITE_URL}${post.image}`;
  return {
    title: article.title,
    description: article.description,
    authors: [{ name: 'Softec Vision Engineering Team', url: localeUrl(l, '/about') }],
    creator: 'Softec Vision Engineering Team',
    publisher: 'Softec Vision Ltd',
    alternates: metaAlternates(l, path),
    openGraph: {
      type: 'article',
      siteName: BRAND,
      locale: OG_LOCALE[l],
      alternateLocale: l === 'he' ? OG_LOCALE.en : OG_LOCALE.he,
      url: localeUrl(l, path),
      title: article.title,
      description: article.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: ['Softec Vision Engineering Team'],
      images: [{ url: image, alt: article.imageAlt }]
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.description, images: [image] }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as AppLocale;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const article = post.content[l];
  const t = await getTranslations('blog');
  const articleLd = articleSchema({
    locale: l,
    slug: post.slug,
    title: article.title,
    description: article.description,
    image: post.image,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt
  });
  const breadcrumbLd = breadcrumbSchema(l, [
    { name: t('home'), path: '' },
    { name: t('title'), path: '/blog' },
    { name: article.title, path: `/blog/${post.slug}` }
  ]);

  const formatter = new Intl.DateTimeFormat(l === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'long' });

  return (
    <article className="bg-paper">
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <header className="border-b border-line bg-[#EAF6FC]">
        <div className="mx-auto max-w-[1120px] px-[clamp(20px,4.5vw,72px)] py-[clamp(42px,7vw,88px)]">
          <nav aria-label={t('breadcrumbs')} className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-blueprint">
            <Link href="/">{t('home')}</Link><span aria-hidden="true">/</span>
            <Link href="/blog">{t('title')}</Link>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blueprint">{article.eyebrow}</p>
          <h1 className="mt-3 max-w-[22ch] text-[clamp(2.25rem,5vw,4.7rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-graphite">
            {article.title}
          </h1>
          <p className="mt-5 max-w-[72ch] text-lg leading-relaxed text-[#46535D]">{article.description}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-machine">
            <span>{t('author')}</span>
            <time dateTime={post.updatedAt}>{t('updated')} {formatter.format(new Date(post.updatedAt))}</time>
            <span>{article.readingTime}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1120px] gap-10 px-[clamp(20px,4.5vw,72px)] py-[clamp(48px,7vw,88px)] lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <figure className="overflow-hidden rounded-[24px] border border-line bg-pure shadow-[0_16px_48px_rgba(12,32,48,0.08)]">
            <div className="aspect-[16/10] bg-[#F6FAFC]">
              <Image src={post.image} alt={article.imageAlt} width={1200} height={750} priority sizes="(min-width: 1024px) 760px, 100vw" className="h-full w-full object-contain p-6 sm:p-10" />
            </div>
            <figcaption className="border-t border-line px-5 py-3 text-sm text-machine">{article.imageAlt}</figcaption>
          </figure>

          <p className="mt-10 border-s-4 border-blueprint ps-5 text-xl font-semibold leading-relaxed text-graphite">{article.summary}</p>

          <div className="mt-10 space-y-12">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-[clamp(1.55rem,3vw,2.2rem)] font-extrabold leading-tight tracking-tight text-graphite">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-[1.05rem] leading-[1.85] text-[#3F4A52]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 rounded-2xl bg-[#EAF6FC] p-5 text-[1.02rem] leading-relaxed text-graphite sm:p-6">
                    {section.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-2 w-2 flex-none rounded-full bg-blueprint" /> <span>{bullet}</span></li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-14 border-t border-line pt-8" aria-labelledby="sources-title">
            <h2 id="sources-title" className="text-2xl font-extrabold text-graphite">{article.sourcesTitle}</h2>
            <p className="mt-3 leading-relaxed text-machine">{article.methodology}</p>
            <ol className="mt-5 space-y-4">
              {post.sources.map((source, index) => (
                <li key={source.url} className="flex gap-3 leading-relaxed">
                  <span className="font-extrabold text-blueprint">{index + 1}.</span>
                  <span><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blueprint underline decoration-blueprint/30 underline-offset-4 hover:decoration-blueprint">{source.title}</a><span className="block text-sm text-machine">{source.publisher}</span></span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="lg:order-none" aria-label={article.takeawaysTitle}>
          <div className="sticky top-28 rounded-[22px] border border-softec/25 bg-pure p-6 shadow-[0_12px_36px_rgba(12,32,48,0.07)]">
            <h2 className="text-xl font-extrabold leading-tight text-graphite">{article.takeawaysTitle}</h2>
            <ul className="mt-5 space-y-4">
              {article.takeaways.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#46535D]"><span aria-hidden="true" className="mt-1.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-blueprint text-xs font-bold text-white">✓</span><span>{item}</span></li>)}
            </ul>
            <Link href="/contact" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-blueprint px-5 text-center font-bold text-white hover:bg-graphite">
              {t('discuss')}
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

