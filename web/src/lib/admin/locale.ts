import 'server-only';
import { cookies } from 'next/headers';
import { adminStrings, type AdminLocale } from './strings';

export async function getAdminLocale(): Promise<AdminLocale> {
  return (await cookies()).get('softec-admin-language')?.value === 'en' ? 'en' : 'he';
}

export async function getAdminStrings() {
  return adminStrings(await getAdminLocale());
}
