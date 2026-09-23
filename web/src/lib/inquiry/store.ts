import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { safeFilename } from './attachment';
import type { InquiryStore } from './types';

/** Private Storage bucket (created by migration 0002); never publicly readable. */
export const ATTACHMENT_BUCKET = 'inquiry-attachments';

const orNull = (value: string) => (value ? value : null);

/**
 * Persists inquiries with the service-role client (server only — it bypasses
 * RLS, so the anon key never needs insert rights on personal data).
 */
export function createSupabaseInquiryStore(
  client: SupabaseClient,
  { consentVersion, now = () => new Date() }: { consentVersion: string; now?: () => Date }
): InquiryStore {
  return {
    async save(record, attachment) {
      const { data, error } = await client
        .from('inquiries')
        .insert({
          name: record.name,
          company: orNull(record.company),
          email: record.email,
          phone: record.phone,
          country: record.country,
          project_type: orNull(record.projectType),
          product_code_snapshot: orNull(record.product),
          room_dimensions: orNull(record.roomDimensions),
          message: record.requirements,
          locale: record.locale,
          source: 'form',
          ip_hash: record.ipHash,
          user_agent: record.userAgent,
          consent_at: now().toISOString(),
          consent_version: consentVersion
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`Inquiry insert failed: ${error?.message ?? 'no row returned'}`);
      const id = (data as { id: string }).id;

      if (!attachment) return { reference: id, attachmentStored: false };

      // Stored under a generated name: the customer's filename is data, not a path.
      const path = `${id}/${randomUUID()}.${attachment.ext}`;
      const upload = await client.storage
        .from(ATTACHMENT_BUCKET)
        .upload(path, attachment.bytes, { contentType: attachment.mime, upsert: false });
      if (upload.error) {
        console.error('[inquiry] attachment upload failed', upload.error.message);
        return { reference: id, attachmentStored: false };
      }
      const link = await client.from('inquiry_attachments').insert({
        inquiry_id: id,
        storage_path: path,
        filename: safeFilename(attachment.name),
        mime: attachment.mime,
        size_bytes: attachment.bytes.length
      });
      if (link.error) {
        console.error('[inquiry] attachment record failed', link.error.message);
        return { reference: id, attachmentStored: false };
      }
      return { reference: id, attachmentStored: true };
    },

    async countRecent(ipHash, sinceIso) {
      const { count, error } = await client
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', sinceIso);
      if (error) throw new Error(error.message);
      return count ?? 0;
    }
  };
}
