import { describe, expect, it, vi } from 'vitest';
import {
  decideAccess,
  getInquiryDetail,
  listInquiries,
  parseStatusUpdate,
  replyLinks,
  INQUIRY_STATUSES
} from './inquiries';

describe('decideAccess', () => {
  it('sends visitors without a session to sign in', () => {
    expect(decideAccess(null, null)).toBe('sign-in');
  });
  it('refuses signed-in accounts that have no staff profile', () => {
    expect(decideAccess({ id: 'u1' }, null)).toBe('no-access');
  });
  it('admits staff, distinguishing admins from editors', () => {
    expect(decideAccess({ id: 'u1' }, { role: 'editor' })).toBe('editor');
    expect(decideAccess({ id: 'u1' }, { role: 'admin' })).toBe('admin');
  });
});

describe('parseStatusUpdate', () => {
  const id = '3f2a9c1e-0000-4000-8000-000000000000';
  it('accepts a known status for a valid id', () => {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', 'handled');
    expect(parseStatusUpdate(fd)).toEqual({ id, status: 'handled' });
  });
  it('rejects unknown statuses and malformed ids', () => {
    const bad = new FormData();
    bad.set('id', 'not-a-uuid');
    bad.set('status', 'deleted');
    expect(parseStatusUpdate(bad)).toBeNull();
  });
  it('covers the workflow states', () => {
    expect(INQUIRY_STATUSES).toEqual(['new', 'read', 'handled', 'archived']);
  });
});

describe('replyLinks', () => {
  it('builds email, phone and WhatsApp links, converting local Israeli numbers', () => {
    const links = replyLinks({ email: 'dana@example.com', phone: '054-123-4567', country: 'Israel', reference: 'B2CD141A' });
    expect(links.email).toBe('mailto:dana@example.com?subject=' + encodeURIComponent('Softec Vision — B2CD141A'));
    expect(links.phone).toBe('tel:0541234567');
    expect(links.whatsapp).toBe('https://wa.me/972541234567');
  });
  it('keeps international numbers and recognises Hebrew country names', () => {
    expect(replyLinks({ email: 'a@b.co', phone: '+44 20 7946 0000', country: 'UK', reference: 'X' }).whatsapp).toBe(
      'https://wa.me/442079460000'
    );
    expect(replyLinks({ email: 'a@b.co', phone: '052-000-0000', country: 'ישראל', reference: 'X' }).whatsapp).toBe(
      'https://wa.me/972520000000'
    );
  });
  it('omits WhatsApp when a local number has no known country code', () => {
    expect(replyLinks({ email: 'a@b.co', phone: '020 7946 0000', country: 'UK', reference: 'X' }).whatsapp).toBeNull();
  });
});

/** Chainable stand-in for the Supabase query builder. */
function fakeClient(rows: Record<string, unknown[]>) {
  const calls: Array<[string, ...unknown[]]> = [];
  const builder = (table: string) => {
    const state: { filters: Array<[string, unknown]> } = { filters: [] };
    const result = () => {
      let data = rows[table] ?? [];
      for (const [col, value] of state.filters) data = data.filter((r) => (r as Record<string, unknown>)[col] === value);
      return data;
    };
    const chain = {
      select(cols: string) {
        calls.push(['select', table, cols]);
        return chain;
      },
      eq(col: string, value: unknown) {
        state.filters.push([col, value]);
        calls.push(['eq', table, col, value]);
        return chain;
      },
      order(col: string, opts: unknown) {
        calls.push(['order', table, col, opts]);
        return chain;
      },
      limit(n: number) {
        calls.push(['limit', table, n]);
        return Promise.resolve({ data: result(), error: null });
      },
      maybeSingle() {
        return Promise.resolve({ data: result()[0] ?? null, error: null });
      },
      then(resolve: (v: unknown) => void) {
        resolve({ data: result(), error: null });
      }
    };
    return chain;
  };
  const createSignedUrl = vi.fn(async (path: string, ttl: number) => ({
    data: { signedUrl: `https://signed.example/${path}?ttl=${ttl}` },
    error: null
  }));
  return {
    client: { from: builder, storage: { from: () => ({ createSignedUrl }) } },
    calls,
    createSignedUrl
  };
}

describe('listInquiries', () => {
  it('lists newest first, optionally filtered by status', async () => {
    const { client, calls } = fakeClient({
      inquiries: [
        { id: 'a', status: 'new' },
        { id: 'b', status: 'handled' }
      ]
    });
    const rows = await listInquiries(client as never, { status: 'new' });
    expect(rows.map((r) => r.id)).toEqual(['a']);
    expect(calls).toContainEqual(['order', 'inquiries', 'created_at', { ascending: false }]);
  });
});

describe('getInquiryDetail', () => {
  it('returns the inquiry with short-lived signed links to its files', async () => {
    const { client, createSignedUrl } = fakeClient({
      inquiries: [{ id: 'a', name: 'Dana' }],
      inquiry_attachments: [
        { inquiry_id: 'a', storage_path: 'a/x.jpg', filename: 'room.jpg', mime: 'image/jpeg', size_bytes: 22 }
      ]
    });
    const detail = await getInquiryDetail(client as never, 'a');
    expect(detail?.inquiry.name).toBe('Dana');
    expect(detail?.attachments).toEqual([
      { filename: 'room.jpg', mime: 'image/jpeg', size: 22, url: 'https://signed.example/a/x.jpg?ttl=300' }
    ]);
    expect(createSignedUrl).toHaveBeenCalledWith('a/x.jpg', 300);
  });

  it('returns null when the inquiry is not visible', async () => {
    const { client } = fakeClient({ inquiries: [] });
    expect(await getInquiryDetail(client as never, 'missing')).toBeNull();
  });
});
