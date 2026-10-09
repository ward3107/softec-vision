'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { S } from '@/lib/admin/strings';
import { MAX_MODEL_BYTES, MODEL_BUCKET, validGlb } from '@/lib/media/model-policy';
import { beginModelUpload, finishModelUpload } from './model-actions';

export default function ModelUploadForm({ code, label }: { code: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const errors = { ...S.products.model3d.errors, uploadFailed: S.products.media.errors.uploadFailed };
  function submit(fd: FormData) {
    const file = fd.get('file');
    startTransition(async () => {
      setError(''); setMessage('');
      try {
        if (!(file instanceof File) || !file.size) { setError(errors.noFile); return; }
        if (file.size > MAX_MODEL_BYTES) { setError(errors.tooLarge); return; }
        if (!validGlb(new Uint8Array(await file.arrayBuffer()))) { setError(errors.badType); return; }
        const started = await beginModelUpload(code, file.size);
        if (!started.ok) { setError(errors[started.error]); return; }
        // Loaded only for a model upload; image editors do not need the storage SDK.
        const { createClient } = await import('@supabase/supabase-js');
        const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        }).storage;
        const uploaded = await storage.from(MODEL_BUCKET).uploadToSignedUrl(started.path, started.token, file, { contentType: 'model/gltf-binary' });
        if (uploaded.error) { setError(errors.uploadFailed); return; }
        const result = await finishModelUpload(code, started.path);
        if (!result.ok) { setError(errors[result.error]); return; }
        setMessage(S.products.model3d.updated);
        router.refresh();
      } catch { setError(errors.uploadFailed); }
    });
  }
  return <form action={submit} className="grid gap-2">
    <fieldset disabled={pending} className="flex flex-wrap items-center gap-2">
      <input type="file" name="file" aria-label="דגם תלת־ממד" accept=".glb,model/gltf-binary" required className="block w-full text-sm" />
      <button type="submit" className="min-h-[44px] rounded border border-line px-4 text-sm font-bold disabled:opacity-60">
        {pending ? 'מעלה ובודק דגם…' : label}
      </button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
