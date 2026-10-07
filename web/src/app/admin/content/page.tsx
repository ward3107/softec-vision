import { listAdminContentBlocks } from '@/lib/admin/content';
import { requireStaff } from '@/lib/admin/session';
import { getAllProducts } from '@/lib/catalog';
import { isAllowedImage, parseEditorDocument } from '@/lib/content/editor';
import VisualEditor from './VisualEditor';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const { client } = await requireStaff();
  const blocks = await listAdminContentBlocks(client);

  const initial = parseEditorDocument(Object.fromEntries(blocks.map(block => [block.key, block.values])), process.env.NEXT_PUBLIC_SUPABASE_URL);
  const products = await getAllProducts();
  const assets = [...new Map(products.filter(product => isAllowedImage(product.image, process.env.NEXT_PUBLIC_SUPABASE_URL)).map(product => [product.image, { src: product.image, label: product.code }])).values()];
  return <VisualEditor initial={initial} assets={assets} />;
}
