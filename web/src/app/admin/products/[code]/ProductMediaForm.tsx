import Image from 'next/image';
import { S } from '@/lib/admin/strings';
import ImageUploadForm from './ImageUploadForm';
import ModelUploadForm from './ModelUploadForm';
import {
  addGalleryImageAction,
  removeGalleryImageAction,
  removeProductImageAction,
  removeProductModelAction,
  uploadProductImageAction
} from '../../actions';

const removeButton =
  'inline-flex min-h-[36px] items-center rounded border border-line px-3 text-sm font-semibold hover:border-machine dark:border-white/10 dark:hover:border-white/25';

const M = S.products.media;
const M3 = S.products.model3d;

export default function ProductMediaForm({
  code,
  image,
  gallery,
  model
}: {
  code: string;
  image: { url: string; isBuiltIn: boolean };
  gallery: Array<{ id: string; url: string }>;
  model: { hasModel: boolean };
}) {
  const upload = uploadProductImageAction.bind(null, code);
  const remove = removeProductImageAction.bind(null, code);
  const addGallery = addGalleryImageAction.bind(null, code);
  const removeGallery = removeGalleryImageAction.bind(null, code);
  const removeModel = removeProductModelAction.bind(null, code);

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
            <ImageUploadForm action={upload} label={image.isBuiltIn ? M.upload : M.replace} />
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
        <ImageUploadForm action={addGallery} label={M.addToGallery} />
      </div>

      <div>
        <p className="text-sm font-semibold">{M3.section}</p>
        <p className="text-sm text-machine dark:text-fog">{M3.help}</p>
        <p className="mt-2 text-sm">{model.hasModel ? M3.current : M3.none}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ModelUploadForm code={code} label={model.hasModel ? M3.replace : M3.upload} />
          {model.hasModel && (
            <form action={removeModel}>
              <button type="submit" className={removeButton}>
                {M3.remove}
              </button>
            </form>
          )}
        </div>
      </div>
    </fieldset>
  );
}
