import type { ReactElement } from 'react';

// Line icons for the admin chrome and dashboard cards. Inline so the admin adds
// no icon dependency; each inherits colour and size from its parent.
const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-5 w-5'
};

export type AdminIconKey = 'dashboard' | 'inquiries' | 'products' | 'content';

export const AdminIcons: Record<AdminIconKey, ReactElement> = {
  dashboard: (
    <svg {...svg} aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  inquiries: (
    <svg {...svg} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  products: (
    <svg {...svg} aria-hidden="true">
      <path d="m21 8-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  content: (
    <svg {...svg} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  )
};
