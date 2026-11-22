import { requireStaff } from '@/lib/admin/session';
import { listCategories } from '@/lib/catalog/categories';
import CategoryForm from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const { client } = await requireStaff();
  const categories = await listCategories(client);
  const roots = categories.filter(category => !category.parent_id);
  const children = (id: string) => categories.filter(category => category.parent_id === id);
  const title = (row: typeof categories[number]) => row.category_translations.find(t => t.locale === 'he')?.name || row.slug;
  const parents = roots.flatMap(root => [
    { id: root.id, label: title(root) },
    ...children(root.id).map(sub => ({ id: sub.id, label: [title(root), title(sub)].join(' / ') }))
  ]);
  const ordered = roots.flatMap(root => [root, ...children(root.id).flatMap(sub => [sub, ...children(sub.id)])]);
  return <>
    <h1 className="text-2xl font-extrabold">ניהול קטגוריות</h1>
    <p className="mt-2">שמות, סדר והצגה באתר. את שיוך המוצרים משנים במסך עריכת המוצר.</p>
    <CategoryForm parents={parents} />
    {ordered.map(category => <CategoryForm key={category.id} category={category} parents={parents} />)}
  </>;
}
