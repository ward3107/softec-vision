'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

// The owner's hidden way in: click the monogram in order — S, V, then Ltd
// three times — to reach the admin sign-in. It's only obscurity (the /admin
// routes stay protected by Supabase Auth + RLS regardless); it just keeps a
// visible "Admin" link off the public site. Decorative, so hidden from
// assistive tech and keyboard — staff who need it can open /admin directly.
const SEQUENCE = ['S', 'V', 'L', 'L', 'L'] as const;
type Key = (typeof SEQUENCE)[number];

export default function AdminEntrance() {
  const router = useRouter();
  const progress = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function press(key: Key) {
    if (timer.current) clearTimeout(timer.current);
    if (key === SEQUENCE[progress.current]) {
      progress.current += 1;
      if (progress.current === SEQUENCE.length) {
        progress.current = 0;
        router.push('/admin/login');
        return;
      }
    } else {
      // Wrong tap: start over, but let this tap begin a fresh sequence if it is the first step.
      progress.current = key === SEQUENCE[0] ? 1 : 0;
    }
    timer.current = setTimeout(() => {
      progress.current = 0;
    }, 3000);
  }

  const btn = 'px-1 leading-none text-paper/45 transition-colors hover:text-paper/80';
  return (
    <span className="inline-flex select-none items-baseline gap-0.5 text-sm font-bold tracking-wide" aria-hidden="true">
      <button type="button" tabIndex={-1} onClick={() => press('S')} className={btn}>
        S
      </button>
      <button type="button" tabIndex={-1} onClick={() => press('V')} className={btn}>
        V
      </button>
      <button type="button" tabIndex={-1} onClick={() => press('L')} className={btn}>
        Ltd
      </button>
    </span>
  );
}
