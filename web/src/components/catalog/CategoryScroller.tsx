'use client';

import Image from 'next/image';
import { useId, useRef } from 'react';
import { Link } from '@/i18n/navigation';

export interface CategoryScrollerItem {
  key: string;
  label: string;
  description: string;
  image?: string;
  count?: string;
}

/** Horizontal, touch-friendly family carousel with visible keyboard controls. */
export default function CategoryScroller({
  categories,
  labels
}: {
  categories: CategoryScrollerItem[];
  labels: { region: string; previous: string; next: string };
}) {
  const id = useId();
  const rail = useRef<HTMLUListElement>(null);

  function step(direction: 1 | -1) {
    const element = rail.current;
    if (!element) return;
    const rtl = getComputedStyle(element).direction === 'rtl';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({
      left: direction * (rtl ? -1 : 1) * element.clientWidth * 0.82,
      behavior: reduce ? 'auto' : 'smooth'
    });
  }

  return (
    <section aria-label={labels.region} className="mt-10 rounded-[28px] bg-[#E8F5FC] p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-controls={id}
          aria-label={labels.previous}
          className="grid h-11 w-11 place-items-center rounded-full border-2 border-blueprint bg-pure text-blueprint transition-colors hover:bg-blueprint hover:text-pure focus-visible:outline-offset-2"
        >
          <Chevron previous />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-controls={id}
          aria-label={labels.next}
          className="grid h-11 w-11 place-items-center rounded-full border-2 border-blueprint bg-pure text-blueprint transition-colors hover:bg-blueprint hover:text-pure focus-visible:outline-offset-2"
        >
          <Chevron />
        </button>
      </div>

      <ul
        id={id}
        ref={rail}
        role="list"
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-color:#1683C7_#E6F2F9] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:gap-5"
      >
        {categories.map((category) => (
          <li
            key={category.key}
            className="w-[86%] flex-none snap-start sm:w-[48%] lg:w-[32%]"
          >
            <Link
              href={`/catalog/${category.key}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-pure text-graphite shadow-[0_8px_26px_rgba(12,32,48,0.07)] transition-[border-color,box-shadow] hover:border-blueprint hover:shadow-[0_14px_34px_rgba(12,94,145,0.14)] focus-visible:outline-offset-2"
            >
              <div className="p-5 sm:p-6">
                <h2 className="text-lg font-extrabold leading-snug text-blueprint sm:text-xl">
                  {category.label}
                </h2>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-machine">
                  {category.description}
                </p>
                {category.count ? (
                  <p className="mt-3 flex items-baseline gap-2 text-blueprint">
                    <strong className="text-3xl font-extrabold leading-none">{category.count.split(' ')[0]}</strong>
                    <span className="text-sm font-bold">{category.count.substring(category.count.indexOf(' ') + 1)}</span>
                  </p>
                ) : null}
              </div>
              <div className="mt-auto aspect-[4/3] overflow-hidden border-t border-line bg-paper">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    width={640}
                    height={480}
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 86vw"
                    className="h-full w-full scale-[1.12] object-contain transition-transform duration-300 group-hover:scale-[1.18]"
                  />
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chevron({ previous = false }: { previous?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 rtl:-scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={previous ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}
