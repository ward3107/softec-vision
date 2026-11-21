import { requireStaff } from '@/lib/admin/session';
import { listCategories } from '@/lib/catalog/categories';
import { getAdminStrings } from '@/lib/admin/locale';
import CategoryForm from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const S = await getAdminStrings();
  const { client } = await requireStaff();
  const categories = await listCategories(client);
  const parents = categories.filter(category => !category.parent_id);
  return <>
    <h1 className="text-2xl font-extrabold">{S.workflow.categoryTitle}</h1>
    <p className="mt-2">{S.workflow.categoryHelp}</p>
    <CategoryForm parents={parents} />
    {categories.filter(category => category.parent_id).map(category => <CategoryForm key={category.id} category={category} parents={parents} />)}
  </>;
}
