'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Link } from '@/i18n/navigation';

export interface ExplorerItem {
  key: string;
  label: string;
  /** Model count for a subcategory, or the product code for a product. */
  meta: string;
  image?: string;
  alt: string;
  href: string;
  kind: 'subcategory' | 'product';
}

export interface ExplorerCategory {
  key: string;
  label: string;
  description: string;
  image?: string;
  /** Subcategories when the family has them, otherwise its products. */
  items: ExplorerItem[];
}

/**
 * Home-page product families: one picture tile per main category. A tile is a
 * disclosure button; opening it reveals that family's subcategories (or, for a
 * family without subcategories, its products) as picture cards linking on to
 * the filtered category or the product. Every panel is server-rendered and
 * only toggled with `hidden`, so all the links stay in the HTML for crawlers.
 */
export default function CategoryExplorer({
  categories,
  labels
}: {
  categories: ExplorerCategory[];
  labels: { viewAll: string; empty: string; contact: string; previous: string; next: string };
}) {
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const panels = useRef<Record<string, HTMLDivElement | null>>({});
  const rails = useRef<Record<string, HTMLUListElement | null>>({});

  // Bring a newly opened panel into view (mainly for phones, where it can open below the fold).
  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panels.current[open]?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [open]);

  function scrollProducts(categoryKey: string, direction: -1 | 1) {
    const rail = rails.current[categoryKey];
    if (!rail) return;
    const rtl = getComputedStyle(rail).direction === 'rtl';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({
      left: direction * (rtl ? -1 : 1) * rail.clientWidth * 0.82,
      behavior: reduce ? 'auto' : 'smooth'
    });
  }

  return (
    <div className="mt-8">
      <ul
        style={{ '--cols': categories.length } as CSSProperties}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      >
        {categories.map((category) => {
          const isOpen = open === category.key;
          return (
            <li key={category.key}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${category.key}`}
                onClick={() => setOpen(isOpen ? null : category.key)}
                className={`group flex h-full w-full flex-col overflow-hidden rounded border-2 bg-pure text-start transition-colors dark:bg-surface ${
                  isOpen
                    ? 'border-blueprint shadow-md dark:border-skyline'
                    : 'border-line hover:border-blueprint dark:border-white/10 dark:hover:border-skyline'
                }`}
              >
                <span className="block aspect-[4/3] w-full overflow-hidden border-b border-line bg-pure dark:border-white/10 dark:bg-surface">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      width={480}
                      height={360}
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 42vw"
                      className="h-full w-full scale-[1.06] object-contain transition-transform duration-300 group-hover:scale-[1.1]"
                    />
                  ) : (
                    <PlaceholderIcon cart={category.key.includes('cart')} />
                  )}
                </span>
                <span className="flex flex-1 items-start justify-between gap-2 p-3 sm:p-4">
                  <span className={`text-sm font-bold leading-snug sm:text-base ${isOpen ? 'text-blueprint dark:text-skyline' : ''}`}>
                    {category.label}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`mt-0.5 h-5 w-5 flex-none text-blueprint transition-transform duration-200 dark:text-skyline ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {categories.map((category) => (
        <div
          key={category.key}
          id={`${baseId}-${category.key}`}
          ref={(el) => {
            panels.current[category.key] = el;
          }}
          role="region"
          aria-label={category.label}
          hidden={open !== category.key}
          className="mt-6 scroll-mt-28 rounded border border-line bg-paper p-5 sm:p-7 dark:border-white/10 dark:bg-canvas"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold">{category.label}</h3>
              <p className="mt-1 max-w-2xl text-sm text-machine dark:text-fog">{category.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {category.items.some((item) => item.kind === 'product') ? (
                <>
                  <button type="button" className="grid h-11 w-11 place-items-center rounded-full border-2 border-blueprint bg-pure text-blueprint hover:bg-blueprint hover:text-pure" onClick={() => scrollProducts(category.key, -1)} aria-label={labels.previous}>
                    <Chevron direction="previous" />
                  </button>
                  <button type="button" className="grid h-11 w-11 place-items-center rounded-full border-2 border-blueprint bg-pure text-blueprint hover:bg-blueprint hover:text-pure" onClick={() => scrollProducts(category.key, 1)} aria-label={labels.next}>
                    <Chevron direction="next" />
                  </button>
                </>
              ) : null}
              <Link href={`/catalog/${category.key}`} className="font-bold text-blueprint hover:underline dark:text-skyline">
                {labels.viewAll} →
              </Link>
            </div>
          </div>
          {category.items.length > 0 ? (
            <ul
              ref={(el) => {
                rails.current[category.key] = el;
              }}
              className={category.items.some((item) => item.kind === 'product')
                ? 'mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-color:#1683C7_#E6F2F9] [scrollbar-width:thin] [&>*]:w-[82%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[46%] lg:[&>*]:w-[31%]'
                : 'mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3'}
            >
              {category.items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-pure transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-blueprint hover:shadow-[0_14px_35px_rgba(12,94,145,0.12)] dark:border-white/10 dark:bg-surface dark:hover:border-skyline"
                  >
                    <span className={item.kind === 'product' ? 'order-first block p-4 pb-3' : 'order-last block border-t border-line p-3 dark:border-white/10'}>
                      <span className="block font-extrabold leading-snug group-hover:text-blueprint dark:group-hover:text-skyline">{item.label}</span>
                      <span className="mt-1 block text-sm font-extrabold text-blueprint">{item.meta}</span>
                    </span>
                    <span className="block aspect-[4/3] overflow-hidden bg-[#F8FBFD]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.alt}
                          width={640}
                          height={480}
                          sizes="(min-width: 1024px) 30vw, 46vw"
                          className="h-full w-full scale-[1.06] object-contain transition-transform duration-300 group-hover:scale-[1.1]"
                        />
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-machine dark:text-fog">
              {labels.empty}{' '}
              <Link href="/contact" className="font-bold text-blueprint hover:underline dark:text-skyline">
                {labels.contact}
              </Link>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'previous' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

/** Stand-in for a family that has no product photo yet: a quiet line icon. */
function PlaceholderIcon({ cart }: { cart: boolean }) {
  return (
    <span className="flex h-full w-full items-center justify-center bg-paper text-machine/60 dark:bg-canvas dark:text-fog/60" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {cart ? (
          <>
            <rect x="5" y="3" width="14" height="14" rx="1.5" />
            <path d="M5 8h14M5 12.5h14" />
            <circle cx="8" cy="19.5" r="1.5" />
            <circle cx="16" cy="19.5" r="1.5" />
          </>
        ) : (
          <>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />
          </>
        )}
      </svg>
    </span>
  );
}
