'use client';

import { useActionState, useId } from 'react';
import { useAdminStrings } from '../../AdminLanguage';
import { deleteProductAction } from '../../actions';

export default function DeleteProductForm({ code }: { code: string }) {
  const S = useAdminStrings();
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(deleteProductAction.bind(null, code), {});
  const id = useId();
  return <form action={action} className="rounded border border-red-700 p-4 dark:border-red-400">
    <h2 className="font-bold">{S.workflow.deleteTitle}</h2>
    <p className="my-2 text-sm">{S.workflow.deleteHelp} <strong dir="ltr">{code}</strong></p>
    <label htmlFor={id} className="block">{S.workflow.confirmCode}</label>
    <input id={id} name="confirmCode" dir="ltr" required autoComplete="off" className="my-2 block w-full rounded border border-line bg-pure p-2 dark:bg-surface" />
    <button disabled={pending} className="min-h-11 rounded bg-red-700 px-4 font-bold text-white">{pending ? S.workflow.deleting : S.workflow.deleteButton}</button>
    {state.error && <p role="alert">{state.error}</p>}
  </form>;
}
