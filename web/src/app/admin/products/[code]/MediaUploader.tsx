'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { UPLOAD_CONFIG, uploadExtension, uploadMime, type UploadKind } from '@/lib/admin/upload';
import { useAdminStrings } from '../../AdminLanguage';
import { prepareUpload, finishUpload } from './upload-actions';

export default function MediaUploader({ code, kind, label }: { code: string; kind: UploadKind; label: string }) {
  const S = useAdminStrings();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const id = useId();
  const config = UPLOAD_CONFIG[kind];
  function upload(fd: FormData) {
    startTransition(async () => {
      setError(''); setSaved(false);
      const file = fd.get('file');
      if (!(file instanceof File) || !file.size) { setError(S.workflow.uploadEmpty); return; }
      if (file.size > config.max || !uploadExtension(kind, file.name)) {
        setError(S.workflow.uploadType); return;
      }
      try {
        const signed = await prepareUpload(code, kind, file.name);
        if ('error' in signed) { setError(signed.error!); return; }
        const result = await createBrowserClient().storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, { contentType: uploadMime(kind, file.name) });
        if (result.error) throw result.error;
        const complete = await finishUpload(code, kind, signed.path);
        if (complete.error) { setError(complete.error); return; }
        setSaved(true); router.refresh();
      } catch { setError(S.workflow.uploadFailed); }
    });
  }
  return <form action={upload} className="grid gap-2">
    <label htmlFor={id} className="text-sm font-semibold">{label} · {S.workflow.upTo} {config.max / 1024 / 1024}MB</label>
    <input id={id} type="file" name="file" accept={config.accept} required disabled={pending} className="max-w-full text-sm" />
    <button disabled={pending} className="min-h-11 rounded bg-blueprint px-4 text-sm font-bold text-white">{pending ? S.workflow.uploading : label}</button>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    {saved && <p role="status" className="text-sm">{S.workflow.uploadSaved}</p>}
  </form>;
}
