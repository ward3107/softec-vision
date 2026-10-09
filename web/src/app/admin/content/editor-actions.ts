'use server';

import { updateTag, revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/admin/session';
import { listAdminContentBlocks } from '@/lib/admin/content';
import { CONTENT_TAG } from '@/lib/content/source';
import { BLOCK_KEYS, LOCALES, MAX_IMAGE_BYTES, changedBlocks, parseEditorDocument, type EditorDocument } from '@/lib/content/editor';
import { optimizeImage } from '@/lib/media/optimize-image';

export type PublishResult = { ok: true; document: EditorDocument } | { ok: false; error: string };

export async function publishContent(fd: FormData): Promise<PublishResult> {
  const { client } = await requireStaff();
  const uploadedPaths: string[] = [];
  let committed = false;
  try {
    const raw = fd.get('document'), baseline = fd.get('baseline');
    if (typeof raw !== 'string' || typeof baseline !== 'string' || raw.length > 150000 || baseline.length > 150000) {
      return { ok: false, error: 'המסמך אינו תקין.' };
    }
    const document = parseEditorDocument(JSON.parse(raw), process.env.NEXT_PUBLIC_SUPABASE_URL);
    const before = parseEditorDocument(JSON.parse(baseline), process.env.NEXT_PUBLIC_SUPABASE_URL);
    const currentBlocks = await listAdminContentBlocks(client);
    const current = parseEditorDocument(Object.fromEntries(currentBlocks.map(block => [block.key, block.values])), process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (changedBlocks(before, current).length) {
      return { ok: false, error: 'התוכן השתנה בחלון אחר. השינויים שלך נשארו כאן; יש לרענן ולטעון את הגרסה העדכנית לפני פרסום.' };
    }
    const { data: locales, error: localeError } = await client.from('locales').select('code').in('code', [...LOCALES]);
    if (localeError) throw localeError;
    if (!LOCALES.every(locale => locales?.some(row => row.code === locale))) {
      return { ok: false, error: 'הגדרת השפות באתר חסרה. יש להשלים את התקנת מסד הנתונים (עברית ואנגלית). השינויים נשארו בעורך.' };
    }
    // Validate every file before uploading any, so a rejected second file leaves no orphan.
    const images: Array<{ locale: 'he' | 'en'; bytes: Uint8Array; mime: string; ext: string }> = [];
    let imageBytes = 0;
    for (const locale of LOCALES) {
      const file = fd.get(`image.${locale}`);
      if (file === null) continue;
      if (!(file instanceof File) || !file.size) return { ok: false, error: 'בחרו תמונה תקינה שאינה ריקה.' };
      imageBytes += file.size;
      if (imageBytes > MAX_IMAGE_BYTES) return { ok: false, error: 'סך התמונות בפרסום אחד מוגבל ל־3MB.' };
      const optimized = await optimizeImage(file);
      if (!optimized.ok) return { ok: false, error: 'לא ניתן לעבד את התמונה. בחרו תמונת JPG, PNG או WebP תקינה דרך כפתור ההעלאה.' };
      images.push({ locale, bytes: optimized.bytes, mime: optimized.mime, ext: optimized.ext });
    }
    // Files are uploaded only on publication. Removing a photo never deletes its original.
    for (const { locale, bytes, mime, ext } of images) {
      const path = `site/home-${locale}-${crypto.randomUUID()}.${ext}`;
      const { error } = await client.storage.from('product-media').upload(path, bytes, { contentType: mime, upsert: false });
      if (error) throw error;
      uploadedPaths.push(path);
      document['home.hero'][locale].image = client.storage.from('product-media').getPublicUrl(path).data.publicUrl;
    }
    const { data: rows, error: blockError } = await client.from('content_blocks')
      .upsert(BLOCK_KEYS.map(key => ({ key })), { onConflict: 'key' }).select('id,key');
    if (blockError || !rows || rows.length !== BLOCK_KEYS.length) throw new Error('Blocks unavailable');
    const payload = rows.flatMap((row: { id: string; key: keyof EditorDocument }) => LOCALES.map(locale => ({
      block_id: row.id, locale, data: document[row.key][locale]
    })));
    // One database statement publishes every translation together.
    const { error } = await client.from('content_block_translations').upsert(payload, { onConflict: 'block_id,locale' });
    if (error) throw error;
    committed = true;
    updateTag(CONTENT_TAG);
    revalidatePath('/admin/content');
    return { ok: true, document };
  } catch (cause) {
    // Log diagnostic identifiers, never the submitted document or image data.
    console.error('content_publish_failed', {
      code: cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : 'unknown',
      committed
    });
    if (!committed && uploadedPaths.length) await client.storage.from('product-media').remove(uploadedPaths);
    return { ok: false, error: 'הפרסום לא הושלם. השינויים נשמרו בעורך. בדקו חיבור והרשאות ונסו שוב.' };
  }
}
