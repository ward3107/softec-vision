import { listAdminContentBlocks } from '@/lib/admin/content';
import { requireStaff } from '@/lib/admin/session';
import { S } from '@/lib/admin/strings';
import ContentBlockForm from './ContentBlockForm';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { client } = await requireStaff();
  const blocks = await listAdminContentBlocks(client);

  return (
    <>
      <h1 className="text-2xl font-extrabold">{S.content.title}</h1>
      <p className="mt-1 text-machine dark:text-fog">{S.content.help}</p>
      <div className="mt-6 grid max-w-3xl gap-8">
        {saved && (
          <p role="status" className="rounded border border-line bg-[#e6f4ea] p-3 text-sm font-semibold text-[#14532d] dark:border-white/10">
            ✓ {S.content.saved}
          </p>
        )}
        {blocks.map((block) => (
          <ContentBlockForm key={block.key} block={block} />
        ))}
      </div>
    </>
  );
}
