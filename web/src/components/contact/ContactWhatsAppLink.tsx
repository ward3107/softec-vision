'use client';

import { useConsent } from '@/components/consent/ConsentProvider';

export default function ContactWhatsAppLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { track } = useConsent();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => track('whatsapp_clicked', { source: 'contact_details' })}
      className="font-semibold text-blueprint"
      dir="ltr"
    >
      {children}
    </a>
  );
}
