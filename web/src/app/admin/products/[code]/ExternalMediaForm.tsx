'use client';
import { useActionState, useId } from 'react';
import { useAdminStrings } from '../../AdminLanguage';
import { saveExternalMedia } from './external-actions';
export default function ExternalMediaForm({ code }: { code: string }) {
  const S = useAdminStrings();
  const [state, action, pending] = useActionState(saveExternalMedia.bind(null, code), {});
  const id = useId();
  return <form action={action} className="grid gap-3 rounded border border-line p-4">
    <h2 className="font-bold">{S.workflow.externalTitle}</h2><p className="text-sm">{S.workflow.externalHelp}</p>
    <label>{S.workflow.mediaKind}<select name="kind" defaultValue={state.kind ?? 'gallery'} className="ms-2 rounded border border-line bg-pure p-2 dark:bg-surface">
      <option value="image">{S.products.media.primaryTitle}</option><option value="gallery">{S.products.media.gallerySection}</option><option value="video">{S.workflow.videos}</option>
    </select></label>
    <label htmlFor={id}>{S.workflow.mediaUrl}</label>
    <input key={state.url} id={id} name="url" type="url" dir="ltr" required maxLength={2048} defaultValue={state.url ?? ''} placeholder="https://cdn.example.com/product.jpg" className="w-full rounded border border-line bg-pure p-3 dark:bg-surface" />
    <button disabled={pending} className="min-h-11 rounded bg-blueprint px-4 font-bold text-white">{pending ? S.products.saving : S.workflow.addLink}</button>
    {state.error && <p role="alert">{state.error}</p>}{state.saved && <p role="status">{S.workflow.linkSaved}</p>}
  </form>;
}
