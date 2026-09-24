import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CANONICAL_SPEC_KEYS, getAdminProduct } from '@/lib/admin/products';
import { getProductMedia, getProductModel } from '@/lib/admin/media';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import { publicMediaUrl } from '@/lib/catalog/media';
import { PRODUCTS, SPEC_LABELS } from '@/lib/catalog/seed';
import { saveProductAction } from '../../actions';
import ProductForm from './ProductForm';
import ProductMediaForm from './ProductMediaForm';

export const dynamic = 'force-dynamic';

const specFields = CANONICAL_SPEC_KEYS.map((key) => ({ key, label: SPEC_LABELS[key] }));

const M = S.products.media;
const M3 = S.products.model3d;
const MEDIA_BANNER: Record<string, string> = {
  updated: M.updated,
  added: M.added,
  removed: M.removed,
  modelUpdated: M3.updated,
  modelRemoved: M3.removed,
  'error-noFile': M.errors.noFile,
  'error-tooLarge': M.errors.tooLarge,
  'error-badType': M.errors.badType,
  'error-unknownProduct': M.errors.unknownProduct
};

export default async function AdminProductEditPage({
  params,
  searchParams
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ media?: string }>;
}) {
  const { code } = await params;
  const { media } = await searchParams;
  const { client } = await requireStaff();
  const product = await getAdminProduct(client, code);

  if (!product) {
    return (
      <>
        <p>{S.products.notFound}</p>
        <Link href="/admin/products" className="mt-4 inline-block font-semibold text-blueprint hover:underline dark:text-skyline">
          {S.products.back}
        </Link>
      </>
    );
  }

  const action = saveProductAction.bind(null, code);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const builtInImage = PRODUCTS.find((p) => p.code === code)?.image ?? '';
  const currentMedia = await getProductMedia(client, code);
  const image = {
    url: supabaseUrl && currentMedia.image ? publicMediaUrl(supabaseUrl, currentMedia.image.path) : builtInImage,
    isBuiltIn: !currentMedia.image
  };
  const gallery = supabaseUrl
    ? currentMedia.gallery.map((item) => ({ id: item.id, url: publicMediaUrl(supabaseUrl, item.path) }))
    : [];
  const modelPath = await getProductModel(client, code);
  const model = { hasModel: modelPath !== null };
  const banner = media ? MEDIA_BANNER[media] : undefined;
  const bannerIsError = media?.startsWith('error-') ?? false;

  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-blueprint hover:underline dark:text-skyline">
        ← {S.products.back}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold" dir="ltr">
        {code}
      </h1>
      <div className="mt-6 grid max-w-3xl gap-8">
        {banner && (
          <p
            role={bannerIsError ? 'alert' : 'status'}
            className={
              bannerIsError
                ? 'rounded border-2 border-red-700 bg-pure p-3 text-sm font-semibold text-red-700 dark:border-red-400 dark:bg-surface dark:text-red-400'
                : 'rounded border border-line bg-[#e6f4ea] p-3 text-sm font-semibold text-[#14532d] dark:border-white/10'
            }
          >
            {banner}
          </p>
        )}
        <ProductMediaForm code={code} image={image} gallery={gallery} model={model} />
        <ProductForm product={product} specFields={specFields} action={action} />
      </div>
    </>
  );
}
