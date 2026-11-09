import Link from 'next/link';
import { requireStaff } from '@/lib/admin/session';
import { getAdminStrings } from '@/lib/admin/locale';
import { listCategories } from '@/lib/catalog/categories';
import { SPEC_LABELS } from '@/lib/catalog/seed';
import { createProductAction } from '../../actions';
import ProductForm from '../[code]/ProductForm';

export const dynamic = 'force-dynamic';
export default async function NewProductPage() {
  const { client } = await requireStaff();
  const S = await getAdminStrings();
  const categories = await listCategories(client);
  return <div className="grid max-w-3xl gap-5">
    <Link href="/admin/products">{S.products.back}</Link>
    <h1 className="text-2xl font-extrabold">{S.workflow.createTitle}</h1>
    <p>{S.workflow.createHelp}</p>
    <ProductForm creating categories={categories} action={createProductAction}
      specFields={Object.entries(SPEC_LABELS).map(([key, label]) => ({ key, label }))}
      product={{ code: '', status: 'draft', cat: '', sub: null, specs: {}, translations: {
        he: { name: '', description: '', alt_text: '' }, en: { name: '', description: '', alt_text: '' }
      } }} />
  </div>;
}
