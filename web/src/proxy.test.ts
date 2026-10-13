import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import proxy from './proxy';

vi.mock('next-intl/middleware', () => ({
  default: () => () => new Response(null, { status: 200 })
}));

afterEach(() => vi.unstubAllEnvs());

describe('former public hosting address', () => {
  it('permanently redirects public pages while preserving language, path and query', async () => {
    const response = await proxy(new NextRequest('https://softecvision.vercel.app/en/contact?product=LS-1000LPT'));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://www.softec.co.il/en/contact?product=LS-1000LPT');
  });

  it('cannot turn a double-slash path into an external redirect', async () => {
    const response = await proxy(new NextRequest('https://softecvision.vercel.app//example.com/contact'));
    expect(new URL(response.headers.get('location')!).hostname).toBe('www.softec.co.il');
  });

  it.each(['www.softec.co.il', 'softecvision-preview.vercel.app'])('does not redirect %s', async (host) => {
    const response = await proxy(new NextRequest(`https://${host}/en/contact`));
    expect(response.headers.get('location')).toBeNull();
  });

  it.each(['/auth/callback?code=example', '/auth/confirm', '/admin/login'])('preserves the host of the existing %s flow', async (path) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    const response = await proxy(new NextRequest(`https://softecvision.vercel.app${path}`));
    expect(response.headers.get('location')).toBeNull();
  });
});
