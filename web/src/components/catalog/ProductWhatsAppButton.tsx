'use client';

import { useConsent } from '@/components/consent/ConsentProvider';

export default function ProductWhatsAppButton({ href, label, code, className = '' }: { href: string; label: string; code: string; className?: string }) {
  const { track } = useConsent();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_clicked', { source: 'product', product: code })}
      className={`inline-flex min-h-[48px] items-center justify-center rounded bg-[#15803d] px-5 text-center font-bold text-white transition-colors hover:bg-[#166534] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803d] ${className}`}
    >
      {label}
    </a>
  );
}
