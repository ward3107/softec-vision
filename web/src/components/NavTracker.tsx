'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordLocation } from '@/lib/navHistory';

/** Records each in-app URL (path + query) for BackButton. Renders nothing. */
export default function NavTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    recordLocation(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
}
