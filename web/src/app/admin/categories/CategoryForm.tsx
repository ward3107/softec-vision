'use client';

import { useActionState, useId } from 'react';
import type { CategoryRow } from '@/lib/catalog/categories';
import { saveSubcategory, deleteSubcategory } from './actions';

const input = 'block w-full rounded border border-line bg-pure p-2 text-graphite dark:bg-surface dark:text-ink';

export default function CategoryForm({ category, parents }: { category?: CategoryRow; parents: CategoryRow[] }) {
  const [state, action, pending] = useActionState(saveSubcategory, {});
  const [deleted, remove, deleting] = useActionState(deleteSubcategory, {});
  const id = useId();
  const text = (locale: string) => category?.category_translations.find(t => t.locale === locale)?.name ?? '';
  return <section className="mt-5 rounded border border-line p-5 dark:border-white/10">
    <h2 className="mb-3 font-bold">{category ? text('he') : 'הוספת תת־קטגוריה'}</h2>
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <label>קטגוריה ראשית<select name="parent" defaultValue={category?.parent_id ?? parents[0]?.id} className={input} required>
        {parents.filter(parent => !category || parent.id === category.parent_id).map(parent => <option key={parent.id} value={parent.id}>{parent.category_translations.find(t => t.locale === 'he')?.name ?? parent.slug}</option>)}
      </select></label>
      <label>מזהה באנגלית<input name="slug" defaultValue={category?.slug} readOnly={Boolean(category)} dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className={input} required /></label>
      <label>שם בעברית<input name="he" defaultValue={text('he')} maxLength={120} className={input} required /></label>
      <label>שם באנגלית<input name="en" defaultValue={text('en')} dir="ltr" maxLength={120} className={input} required /></label>
      <label>סדר הצגה<input type="number" name="sort" defaultValue={category?.sort ?? 0} min={0} max={10000} className={input} required /></label>
      <label>מצב<select name="status" defaultValue={category?.status ?? 'published'} className={input}>
        <option value="published">מוצג באתר</option><option value="draft">טיוטה</option><option value="archived">בארכיון</option>
      </select></label>
      <button disabled={pending} className="min-h-11 rounded bg-blueprint px-4 font-bold text-white">{pending ? 'שומר...' : 'שמירה'}</button>
      {state.error && <p role="alert">{state.error}</p>}{state.saved && <p role="status">נשמר בהצלחה</p>}
    </form>
    {category && <form action={remove} className="mt-5 border-t border-line pt-3">
      <input type="hidden" name="id" value={category.id} />
      <p className="text-sm">במחיקת תת־קטגוריה, המוצרים שלה יישארו בקטגוריה הראשית.</p>
      <label htmlFor={id} className="my-2 flex gap-2"><input id={id} type="checkbox" name="confirm" required />אישור מחיקת תת־הקטגוריה</label>
      <button disabled={deleting} className="min-h-11 rounded border border-red-700 px-4 text-red-700 dark:text-red-400">מחיקה</button>
      {deleted.error && <p role="alert">{deleted.error}</p>}
    </form>}
  </section>;
}
