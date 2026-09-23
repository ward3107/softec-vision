'use client';

import { useConsent } from './ConsentProvider';

/** Reopens the consent banner so a visitor can change an earlier choice. Hidden while there is nothing to consent to. */
export default function CookiePreferencesLink({ label }: { label: string }) {
  const { openPreferences, hasAnalytics } = useConsent();
  if (!hasAnalytics) return null;
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="min-h-[44px] items-center py-2 font-semibold text-[#cfe6f6] hover:underline"
    >
      {label}
    </button>
  );
}
