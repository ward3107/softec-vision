import createNextIntlPlugin from 'next-intl/plugin';

// Points the plugin at the request config used for server-side i18n.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
  // The process page now lives on the home page as the "How it works" section.
  async redirects() {
    return [{ source: '/:locale(he|en)/process', destination: '/:locale#how', permanent: true }];
  }
};

export default withNextIntl(nextConfig);
