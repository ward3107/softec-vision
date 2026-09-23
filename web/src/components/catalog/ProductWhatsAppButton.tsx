'use client';

import { useConsent } from '@/components/consent/ConsentProvider';

export default function ProductWhatsAppButton({ href, label, code }: { href: string; label: string; code: string }) {
  const { track } = useConsent();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => track('whatsapp_clicked', { source: 'product', product: code })}
      className="inline-flex min-h-[48px] items-center rounded bg-[#15803d] px-5 font-bold text-white hover:bg-[#166534]"
    >
      {label}
    </a>
  );
}
