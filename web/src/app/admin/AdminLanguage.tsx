'use client';

import { createContext, useContext, useTransition } from 'react';
import { adminStrings, type AdminLocale } from '@/lib/admin/strings';
import { setAdminLanguage } from './language-actions';

const Context = createContext<AdminLocale>('he');
export function AdminLanguage({ locale, children }: { locale: AdminLocale; children?: React.ReactNode }) {
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}
export const useAdminLocale = () => useContext(Context);
export const useAdminStrings = () => adminStrings(useAdminLocale());

export function AdminLanguageSwitch() {
  const locale = useAdminLocale();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} lang={locale === 'he' ? 'en' : 'he'}
    className="min-h-11 rounded border border-line px-3 text-sm font-semibold"
    onClick={() => startTransition(() => setAdminLanguage(locale === 'he' ? 'en' : 'he'))}>
    {locale === 'he' ? 'English' : 'עברית'}
  </button>;
}
