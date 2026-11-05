import Image, { type ImageProps } from 'next/image';

/** Keep optimization for owned media; external files load only in the browser. */
export default function CatalogImage(props: ImageProps) {
  const src = typeof props.src === 'string' ? props.src : '';
  let external = false;
  if (src.startsWith('https://')) {
    const host = new URL(src).hostname;
    external = !host.endsWith('.supabase.co') && !host.endsWith('.supabase.in');
  }
  return <Image {...props} alt={props.alt} unoptimized={external || props.unoptimized} />;
}
