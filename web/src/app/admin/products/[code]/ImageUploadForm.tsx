'use client';

import { useId, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { prepareImage } from '@/lib/media/prepare-image';
import { IMAGE_ACCEPT } from '@/lib/media/image-policy';

function Fields({ label, errorId }: { label: string; errorId: string }) {
  const { pending } = useFormStatus();
  return <fieldset disabled={pending} className="flex flex-wrap items-center gap-2">
    <input type="file" name="file" aria-label={label} aria-describedby={errorId} accept={IMAGE_ACCEPT} required
      className="block w-full text-sm file:me-3 file:min-h-[44px] file:rounded file:border file:border-line file:bg-pure file:px-4 file:font-semibold file:text-graphite dark:file:bg-surface dark:file:text-ink" />
    <button type="submit" className="inline-flex min-h-[44px] items-center rounded border border-blueprint bg-blueprint px-4 text-sm font-bold text-pure disabled:opacity-60">
      {pending ? 'מכין ומעלה תמונה…' : label}
    </button>
  </fieldset>;
}

export default function ImageUploadForm({ action, label }: { action: (fd: FormData) => Promise<void>; label: string }) {
  const [error, setError] = useState('');
  const errorId = useId();
  async function upload(fd: FormData) {
    setError('');
    const file = fd.get('file');
    if (!(file instanceof File)) return;
    let prepared: File;
    try { prepared = await prepareImage(file); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'לא ניתן להכין את התמונה.');
      return;
    }
    const payload = new FormData();
    payload.set('file', prepared);
    // Allow Next.js to handle the action's redirect (do not catch it).
    await action(payload);
  }
  return <form action={upload} className="grid gap-2">
    <Fields label={label} errorId={errorId} />
    <p id={errorId} role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>
  </form>;
}
