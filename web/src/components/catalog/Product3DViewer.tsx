'use client';

import { useEffect, useState } from 'react';

/**
 * Interactive 3D viewer for a product's uploaded glTF Binary (.glb) model,
 * via @google/model-viewer (a self-registering custom element). The library
 * touches DOM APIs at import time, so it's dynamically imported once on the
 * client rather than at module scope — this component is itself only ever
 * reached from ProductMediaSwitch after the visitor opts into the 3D tab, so
 * the model and its viewer script never load for a visitor who stays on
 * photos.
 */
export default function Product3DViewer({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('@google/model-viewer').then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-machine dark:text-fog" role="status">
        …
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      loading="eager"
      reveal="auto"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
