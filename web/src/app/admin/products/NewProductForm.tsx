'use client';

import { useActionState } from 'react';
import { createProductDraft } from '../actions';

export default function NewProductForm({ roots }: { roots: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(createProductDraft, {});
  return <details className="mt-4 rounded border border-line p-4">
    <summary className="cursor-pointer font-bold">הוספת דגם חדש</summary>
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label>קוד דגם<input name="code" dir="ltr" required maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9_\-]{0,63}" className="block w-full rounded border p-2" /></label>
      <label>קטגוריה ראשית<select name="family" required className="block w-full rounded border p-2">
        {roots.map(root => <option key={root.id} value={root.id}>{root.name}</option>)}
      </select></label>
      <p className="sm:col-span-2">לאחר יצירת הטיוטה אפשר להוסיף תמונה, פרטים ושיוך לתת־קטגוריה לפני הפרסום.</p>
      <button disabled={pending} className="min-h-11 rounded bg-blueprint px-4 font-bold text-white">יצירת טיוטה</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  </details>;
}
