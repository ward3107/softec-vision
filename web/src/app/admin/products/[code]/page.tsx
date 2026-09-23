import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CANONICAL_SPEC_KEYS, getAdminProduct } from '@/lib/admin/products';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { SPEC_LABELS } from '@/lib/catalog/seed';
import AdminShell from '../../AdminShell';
import { saveProductAction } from '../../actions';
import ProductForm from './ProductForm';

export const dynamic = 'force-dynamic';

const specFields = CANONICAL_SPEC_KEYS.map((key) => ({ key, label: SPEC_LABELS[key] }));

export default async function AdminProductEditPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { client, user } = await requireStaff();
  const product = await getAdminProduct(client, code);

  if (!product) {
    return (
      <AdminShell email={user?.email} active="products">
        <p>{S.products.notFound}</p>
        <Link href="/admin/products" className="mt-4 inline-block font-semibold text-blueprint hover:underline">
          {S.products.back}
        </Link>
      </AdminShell>
    );
  }

  const action = saveProductAction.bind(null, code);

  return (
    <AdminShell email={user?.email} active="products">
      <Link href="/admin/products" className="text-sm font-semibold text-blueprint hover:underline">
        ← {S.products.back}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold" dir="ltr">
        {code}
      </h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm product={product} specFields={specFields} action={action} />
      </div>
    </AdminShell>
  );
}
