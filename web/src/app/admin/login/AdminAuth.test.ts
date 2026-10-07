import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('./PasswordLoginForm', () => ({ default: ({ initialError }: { initialError?: string }) => createElement('form', { 'data-password': initialError ?? 'ready' }) }));
vi.mock('./EmailLinkLoginForm', () => ({ default: () => createElement('form', { 'data-email-link': true }) }));
import AdminAuth from './AdminAuth';
describe('admin login order', () => {
  it('shows password first and keeps the email link inside a collapsed details', () => {
    const html = renderToStaticMarkup(createElement(AdminAuth));
    expect(html.indexOf('data-password')).toBeLessThan(html.indexOf('<details'));
    expect(html.indexOf('data-email-link')).toBeGreaterThan(html.indexOf('<summary'));
    expect(html).not.toMatch(/<details[^>]*\bopen/);
  });
  it('keeps callback and authorization errors visible above the primary form', () => {
    const html = renderToStaticMarkup(createElement(AdminAuth, { initialError: 'no-access' }));
    expect(html).toContain('data-password="no-access"');
  });
});
