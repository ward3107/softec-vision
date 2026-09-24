import createNextIntlPlugin from 'next-intl/plugin';

// Points the plugin at the request config used for server-side i18n.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy. A static site (SSG) can't use per-request nonces
 * without forcing every page to render dynamically, and the JSON-LD blocks are
 * built per page, so `script-src` allows inline (React auto-escapes, and the
 * JSON-LD payloads are escaped in JsonLd.tsx). Everything else is locked to the
 * app's own origin plus the few services it actually talks to: Supabase
 * (Postgres/Storage over https + realtime over wss) and, once enabled,
 * consent-gated GA4. `wasm-unsafe-eval` + blob workers cover the optional 3D
 * model viewer. In development the policy is skipped so webpack HMR (which needs
 * eval and a ws connection) keeps working.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // The strict CSP is production-only; dev keeps HMR (eval + ws) working.
  ...(isDev ? [] : [{ key: 'Content-Security-Policy', value: csp }])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Product/media images are served from Supabase Storage in later phases.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' }
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // The process page now lives on the home page as the "How it works" section.
  async redirects() {
    return [{ source: '/:locale(he|en)/process', destination: '/:locale#how', permanent: true }];
  }
};

export default withNextIntl(nextConfig);
