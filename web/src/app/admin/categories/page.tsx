import { requireStaff } from '@/lib/admin/session';
import { listCategories } from '@/lib/catalog/categories';
import CategoryForm from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const { client } = await requireStaff();
  const categories = await listCategories(client);
  const parents = categories.filter(category => !category.parent_id);
  return <>
    <h1 className="text-2xl font-extrabold">ניהול תתי־קטגוריות</h1>
    <p className="mt-2">שמות, סדר והצגה באתר. את שיוך המוצרים משנים במסך עריכת המוצר.</p>
    <CategoryForm parents={parents} />
    {categories.filter(category => category.parent_id).map(category => <CategoryForm key={category.id} category={category} parents={parents} />)}
  </>;
}
