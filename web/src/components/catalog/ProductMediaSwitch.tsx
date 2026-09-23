'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox, { type LightboxLabels } from './ImageLightbox';
import Product3DViewer from './Product3DViewer';

const frame = 'aspect-[4/3] overflow-hidden rounded border border-line bg-pure dark:border-white/10 dark:bg-surface';
const zoomable = `${frame} group block w-full cursor-zoom-in`;
const zoomImage = 'h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]';
const tab = (active: boolean) =>
  `inline-flex min-h-[40px] items-center rounded border px-3 text-sm font-semibold ${
    active
      ? 'border-blueprint bg-pure text-blueprint dark:border-skyline dark:bg-surface dark:text-skyline'
      : 'border-line text-machine hover:border-machine dark:border-white/10 dark:text-fog dark:hover:border-white/25'
  }`;

/** Product page image area: photos (click to enlarge) by default, with a 3D tab when the owner has uploaded a model. */
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
  labels: { photos: string; model: string; hint: string; enlarge: string; lightbox: LightboxLabels };
}) {
  const [mode, setMode] = useState<'photos' | 'model'>('photos');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const allPhotos = [{ src: image, alt }, ...gallery];

  const photos = (
    <>
      <button type="button" onClick={() => setOpenIndex(0)} aria-label={labels.enlarge} className={zoomable}>
        <Image
          src={image}
          alt={alt}
          width={1200}
          height={900}
          quality={92}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={zoomImage}
        />
      </button>
      {gallery.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((item, i) => (
            <button key={item.src} type="button" onClick={() => setOpenIndex(i + 1)} aria-label={labels.enlarge} className={zoomable}>
              <Image src={item.src} alt={item.alt} width={480} height={360} sizes="(min-width: 1024px) 16vw, 33vw" className={zoomImage} />
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {model3d ? (
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
      ) : (
        photos
      )}
      <ImageLightbox
        images={allPhotos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        labels={labels.lightbox}
      />
    </>
  );
}
