import Image from 'next/image';

export default function BrandLogo({
  className = '',
  priority = false
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/softec-vision-logo.png"
      alt="Softec Vision"
      width={1997}
      height={795}
      priority={priority}
      sizes="(min-width: 1024px) 240px, 180px"
      className={`h-auto w-full object-contain ${className}`}
    />
  );
}
