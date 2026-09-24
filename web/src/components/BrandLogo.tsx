import Image from 'next/image';

export default function BrandLogo({
  className = '',
  priority = false,
  dark = false
}: {
  className?: string;
  priority?: boolean;
  /** Light-ink variant (transparent, white wordmark) for dark surfaces like the footer. */
  dark?: boolean;
}) {
  return (
    <Image
      src={dark ? '/brand/softec-vision-logo-dark.png' : '/brand/softec-vision-logo.png'}
      alt="Softec Vision"
      width={1997}
      height={795}
      priority={priority}
      sizes="(min-width: 1024px) 240px, 180px"
      className={`h-auto w-full object-contain ${className}`}
    />
  );
}
