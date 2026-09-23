import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Workflow states for a quote request (enum `inquiry_status` in the database). */
export const INQUIRY_STATUSES = ['new', 'read', 'handled', 'archived'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type Access = 'sign-in' | 'no-access' | 'editor' | 'admin';

/** Who may use the admin area: only accounts with a staff profile. */
export function decideAccess(user: { id: string } | null, profile: { role: string } | null): Access {
  if (!user) return 'sign-in';
  if (!profile) return 'no-access';
  return profile.role === 'admin' ? 'admin' : 'editor';
}

const statusUpdate = z.object({ id: z.string().uuid(), status: z.enum(INQUIRY_STATUSES) });

export function parseStatusUpdate(fd: FormData): { id: string; status: InquiryStatus } | null {
  const parsed = statusUpdate.safeParse({ id: fd.get('id'), status: fd.get('status') });
  return parsed.success ? parsed.data : null;
}

const ISRAEL = /^(israel|ישראל|il)$/i;

/** Quick ways to answer a request from the admin view. */
export function replyLinks({
  email,
  phone,
  country,
  reference
}: {
  email: string | null;
  phone: string | null;
  country: string | null;
  reference: string;
}) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const international = (phone ?? '').trim().startsWith('+');
  let whatsapp: string | null = null;
  if (digits.length >= 6) {
    if (international) whatsapp = `https://wa.me/${digits}`;
    else if (digits.startsWith('0') && ISRAEL.test((country ?? '').trim())) whatsapp = `https://wa.me/972${digits.slice(1)}`;
  }
  return {
    email: email ? `mailto:${email}?subject=${encodeURIComponent(`Softec Vision — ${reference}`)}` : null,
    phone: digits ? `tel:${international ? '+' : ''}${digits}` : null,
    whatsapp
  };
}

export interface InquiryRow {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  project_type: string | null;
  product_code_snapshot: string | null;
  room_dimensions: string | null;
  message: string;
  locale: string | null;
  status: InquiryStatus;
  consent_at: string | null;
  consent_version: string | null;
}

const LIST_COLUMNS = 'id, created_at, name, company, country, product_code_snapshot, status';

/** Total inquiries, and how many are still 'new' — for the dashboard. */
export async function countInquiries(client: SupabaseClient): Promise<{ total: number; new: number }> {
  const [total, fresh] = await Promise.all([
    client.from('inquiries').select('id', { count: 'exact', head: true }),
    client.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new')
  ]);
  if (total.error) throw new Error(total.error.message);
  if (fresh.error) throw new Error(fresh.error.message);
  return { total: total.count ?? 0, new: fresh.count ?? 0 };
}

/** Newest first; RLS limits this to staff. */
export async function listInquiries(
  client: SupabaseClient,
  { status, limit = 200 }: { status?: InquiryStatus; limit?: number } = {}
): Promise<Array<Pick<InquiryRow, 'id' | 'created_at' | 'name' | 'company' | 'country' | 'product_code_snapshot' | 'status'>>> {
  let query = client.from('inquiries').select(LIST_COLUMNS);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as never;
}

const SIGNED_URL_TTL_SECONDS = 300;

export async function getInquiryDetail(client: SupabaseClient, id: string) {
  const { data: inquiry, error } = await client.from('inquiries').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!inquiry) return null;

  const { data: files } = await client
    .from('inquiry_attachments')
    .select('storage_path, filename, mime, size_bytes')
    .eq('inquiry_id', id);

  const attachments = await Promise.all(
    ((files ?? []) as Array<{ storage_path: string; filename: string; mime: string; size_bytes: number }>).map(
      async (file) => {
        const signed = await client.storage
          .from('inquiry-attachments')
          .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);
        return { filename: file.filename, mime: file.mime, size: file.size_bytes, url: signed.data?.signedUrl ?? null };
      }
    )
  );
  return { inquiry: inquiry as InquiryRow, attachments };
}
