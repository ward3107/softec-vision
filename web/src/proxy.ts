import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { SITE_URL } from './lib/seo';

const intl = createMiddleware(routing);

/**
 * The owner admin (/admin) and Supabase auth endpoints sit outside locale
 * routing. Auth callbacks and the explicit magic-link confirmation page must
 * receive their tokens at the exact paths generated in Supabase emails.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/auth/callback' || pathname === '/auth/confirm') return NextResponse.next();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminSession(request);
  // Consolidate public pages from the former hosting address onto the domain.
  // Auth/admin sessions stay on their original host; preview deployments are
  // also unaffected because only this exact production alias is redirected.
  if (request.nextUrl.hostname === 'softecvision.vercel.app') {
    const destination = new URL(SITE_URL);
    destination.pathname = pathname;
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  return intl(request);
}

async function adminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    });
    await supabase.auth.getUser();
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Run on all paths except API routes, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
