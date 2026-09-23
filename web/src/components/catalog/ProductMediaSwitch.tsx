'use client';

import { useState } from 'react';
import Image from 'next/image';
import Product3DViewer from './Product3DViewer';

const frame = 'aspect-[4/3] overflow-hidden rounded border border-line bg-pure dark:border-white/10 dark:bg-surface';
const tab = (active: boolean) =>
  `inline-flex min-h-[40px] items-center rounded border px-3 text-sm font-semibold ${
    active
      ? 'border-blueprint bg-pure text-blueprint dark:border-skyline dark:bg-surface dark:text-skyline'
      : 'border-line text-machine hover:border-machine dark:border-white/10 dark:text-fog dark:hover:border-white/25'
  }`;

/** Product page image area: photos by default, with a 3D tab when the owner has uploaded a model. */
export default function ProductMediaSwitch({
  image,
  alt,
  gallery,
  model3d,
  labels
}: {
  image: string;
  alt: string;
  gallery: Array<{ src: string; alt: string }>;
  model3d?: string;
  labels: { photos: string; model: string; hint: string };
}) {
  const [mode, setMode] = useState<'photos' | 'model'>('photos');

  const photos = (
    <>
      <div className={frame}>
        <Image
          src={image}
          alt={alt}
          width={900}
          height={675}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-full w-full object-contain"
        />
      </div>
      {gallery.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((item) => (
            <div key={item.src} className={frame}>
              <Image
                src={item.src}
                alt={item.alt}
                width={480}
                height={360}
                sizes="(min-width: 1024px) 16vw, 33vw"
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (!model3d) return photos;

  return (
    <>
      <div role="tablist" className="mb-3 flex gap-2">
        <button type="button" role="tab" aria-selected={mode === 'photos'} className={tab(mode === 'photos')} onClick={() => setMode('photos')}>
          {labels.photos}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'model'} className={tab(mode === 'model')} onClick={() => setMode('model')}>
          {labels.model}
        </button>
      </div>
      {mode === 'photos' ? (
        photos
      ) : (
        <>
          <div className={frame}>
            <Product3DViewer src={model3d} alt={alt} />
          </div>
          <p className="mt-2 text-xs text-machine dark:text-fog">{labels.hint}</p>
        </>
      )}
    </>
  );
}
