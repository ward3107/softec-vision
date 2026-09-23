import { describe, expect, it, vi } from 'vitest';
import { createSupabaseInquiryStore, ATTACHMENT_BUCKET } from './store';
import type { InquiryRecord } from './types';

const record: InquiryRecord = {
  name: 'Dana Levi',
  company: '',
  email: 'dana@example.com',
  phone: '+972 54-123-4567',
  country: 'Israel',
  projectType: '',
  product: 'RAV-500',
  productName: 'Accessible Lecturer Station',
  roomDimensions: '',
  requirements: 'Two accessible lecturer stations.',
  consent: true,
  locale: 'he',
  ipHash: 'b'.repeat(64),
  userAgent: 'agent'
};

/** Minimal stand-in for the parts of the Supabase client the store uses. */
function fakeClient({ insertError = null as null | { message: string } } = {}) {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const uploads: Array<{ bucket: string; path: string; options: unknown }> = [];
  const filters: Array<[string, string, unknown]> = [];
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          const result = insertError
            ? { data: null, error: insertError }
            : { data: { id: '11111111-2222-4333-8444-555555555555' }, error: null };
          return {
            select: () => ({ single: async () => result }),
            then: (resolve: (v: unknown) => void) => resolve({ error: insertError })
          };
        },
        select(_cols: string, _opts: unknown) {
          const chain = {
            eq(col: string, value: unknown) {
              filters.push(['eq', col, value]);
              return chain;
            },
            gte(col: string, value: unknown) {
              filters.push(['gte', col, value]);
              return Promise.resolve({ count: 4, error: null });
            }
          };
          return chain;
        }
      };
    },
    storage: {
      from(bucket: string) {
        return {
          upload: vi.fn(async (path: string, _body: unknown, options: unknown) => {
            uploads.push({ bucket, path, options });
            return { data: { path }, error: null };
          })
        };
      }
    }
  };
  return { client, inserts, uploads, filters };
}

describe('createSupabaseInquiryStore', () => {
  it('inserts the inquiry with consent evidence and returns its id', async () => {
    const { client, inserts } = fakeClient();
    const store = createSupabaseInquiryStore(client as never, { consentVersion: '2026-09-22', now: () => new Date('2026-09-23T10:00:00Z') });
    const { reference } = await store.save(record);

    expect(reference).toBe('11111111-2222-4333-8444-555555555555');
    expect(inserts[0].table).toBe('inquiries');
    expect(inserts[0].row).toMatchObject({
      name: 'Dana Levi',
      company: null,
      email: 'dana@example.com',
      phone: '+972 54-123-4567',
      country: 'Israel',
      project_type: null,
      product_code_snapshot: 'RAV-500',
      room_dimensions: null,
      message: 'Two accessible lecturer stations.',
      locale: 'he',
      source: 'form',
      ip_hash: 'b'.repeat(64),
      user_agent: 'agent',
      consent_at: '2026-09-23T10:00:00.000Z',
      consent_version: '2026-09-22'
    });
  });

  it('uploads attachments to a private bucket under a generated name', async () => {
    const { client, inserts, uploads } = fakeClient();
    const store = createSupabaseInquiryStore(client as never, { consentVersion: 'v1' });
    await store.save(record, { name: '../../evil name.jpg', mime: 'image/jpeg', ext: 'jpg', bytes: new Uint8Array([1]) });

    expect(uploads[0].bucket).toBe(ATTACHMENT_BUCKET);
    // Path is inquiry id + random id — never the customer's filename.
    expect(uploads[0].path).toMatch(/^11111111-2222-4333-8444-555555555555\/[0-9a-f-]{36}\.jpg$/);
    expect(uploads[0].options).toMatchObject({ contentType: 'image/jpeg', upsert: false });
    expect(inserts[1]).toMatchObject({
      table: 'inquiry_attachments',
      row: { inquiry_id: '11111111-2222-4333-8444-555555555555', filename: 'evil name.jpg', mime: 'image/jpeg', size_bytes: 1 }
    });
  });

  it('throws when the insert fails', async () => {
    const { client } = fakeClient({ insertError: { message: 'denied' } });
    const store = createSupabaseInquiryStore(client as never, { consentVersion: 'v1' });
    await expect(store.save(record)).rejects.toThrow(/denied/);
  });

  it('counts recent inquiries from the same address hash', async () => {
    const { client, filters } = fakeClient();
    const store = createSupabaseInquiryStore(client as never, { consentVersion: 'v1' });
    expect(await store.countRecent!('c'.repeat(64), '2026-09-23T09:00:00.000Z')).toBe(4);
    expect(filters).toEqual([
      ['eq', 'ip_hash', 'c'.repeat(64)],
      ['gte', 'created_at', '2026-09-23T09:00:00.000Z']
    ]);
  });
});
