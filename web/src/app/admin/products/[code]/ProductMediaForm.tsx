import Image from 'next/image';
import { S } from '@/lib/admin/strings';
import {
  addGalleryImageAction,
  removeGalleryImageAction,
  removeProductImageAction,
  uploadProductImageAction
} from '../../actions';

const fileInput =
  'block w-full text-sm file:me-3 file:min-h-[44px] file:rounded file:border file:border-line file:bg-pure file:px-4 file:font-semibold file:text-graphite dark:file:border-white/10 dark:file:bg-surface dark:file:text-ink';
const removeButton =
  'inline-flex min-h-[36px] items-center rounded border border-line px-3 text-sm font-semibold hover:border-machine dark:border-white/10 dark:hover:border-white/25';

const M = S.products.media;

export default function ProductMediaForm({
  code,
  image,
  gallery
}: {
  code: string;
  image: { url: string; isBuiltIn: boolean };
  gallery: Array<{ id: string; url: string }>;
}) {
  const upload = uploadProductImageAction.bind(null, code);
  const remove = removeProductImageAction.bind(null, code);
  const addGallery = addGalleryImageAction.bind(null, code);
  const removeGallery = removeGalleryImageAction.bind(null, code);

  return (
    <fieldset className="grid gap-6 rounded border border-line p-4 dark:border-white/10">
      <div>
        <legend className="px-1 text-sm font-bold">{M.section}</legend>
        <p className="text-sm text-machine dark:text-fog">{M.help}</p>
      </div>

      <div>
        <p className="text-sm font-semibold">{M.primaryTitle}</p>
        <p className="text-sm text-machine dark:text-fog">{M.primaryHelp}</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <span className="block overflow-hidden rounded border border-line bg-pure dark:border-white/10 dark:bg-surface">
              <Image src={image.url} alt="" width={160} height={120} className="h-[120px] w-[160px] object-contain" />
            </span>
            <p className="mt-1 text-xs text-machine dark:text-fog">{image.isBuiltIn ? M.builtIn : M.current}</p>
          </div>
          <div className="grid gap-2">
            <form action={upload} className="flex flex-wrap items-center gap-2">
              <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className={fileInput} />
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center rounded border border-blueprint bg-blueprint px-4 text-sm font-bold text-pure hover:bg-graphite"
              >
                {image.isBuiltIn ? M.upload : M.replace}
              </button>
            </form>
            {!image.isBuiltIn && (
              <form action={remove}>
                <button type="submit" className={removeButton}>
                  {M.remove}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">{M.gallerySection}</p>
        <p className="text-sm text-machine dark:text-fog">{M.galleryHelp}</p>
        {gallery.length === 0 ? (
          <p className="mt-2 text-sm text-machine dark:text-fog">{M.galleryEmpty}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-4">
            {gallery.map((item) => (
              <li key={item.id} className="grid gap-1">
                <span className="block overflow-hidden rounded border border-line bg-pure dark:border-white/10 dark:bg-surface">
                  <Image src={item.url} alt="" width={120} height={90} className="h-[90px] w-[120px] object-contain" />
                </span>
                <form action={removeGallery}>
                  <input type="hidden" name="mediaId" value={item.id} />
                  <button type="submit" className={removeButton}>
                    {M.removeFromGallery}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addGallery} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className={fileInput} />
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center rounded border border-line px-4 text-sm font-bold hover:border-machine dark:border-white/10 dark:hover:border-white/25"
          >
            {M.addToGallery}
          </button>
        </form>
      </div>
    </fieldset>
  );
}
