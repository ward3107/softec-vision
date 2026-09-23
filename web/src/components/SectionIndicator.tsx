'use client';

import { useEffect, useState } from 'react';

type Section = { id: string; label: string };

/**
 * Desktop "you are here" indicator: a column of dots, one per page section,
 * that highlights the section currently in view as you scroll and jumps to a
 * section when clicked. Uses IntersectionObserver; hidden below `lg` and for
 * anyone who prefers reduced motion the jump is instant.
 */
export default function SectionIndicator({ sections, label }: { sections: Section[]; label: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.5, 1] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <nav
      aria-label={label}
      className="fixed end-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex print:hidden"
    >
      {sections.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(s.id)}
            aria-current={isActive ? 'true' : undefined}
            title={s.label}
            className="group flex items-center gap-2"
          >
            <span
              className={`whitespace-nowrap rounded bg-pure px-2 py-0.5 text-xs font-semibold text-graphite shadow-sm ring-1 ring-line transition-opacity dark:bg-surface dark:text-ink dark:ring-white/10 ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {s.label}
            </span>
            <span
              className={`h-2.5 w-2.5 flex-none rounded-full border transition-all ${
                isActive
                  ? 'scale-125 border-blueprint bg-blueprint dark:border-skyline dark:bg-skyline'
                  : 'border-machine bg-transparent group-hover:border-blueprint dark:border-fog dark:group-hover:border-skyline'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
