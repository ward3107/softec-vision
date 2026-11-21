'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setAdminLanguage(locale: string) {
  if (locale !== 'he' && locale !== 'en') return;
  (await cookies()).set('softec-admin-language', locale, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000
  });
  revalidatePath('/admin', 'layout');
}
