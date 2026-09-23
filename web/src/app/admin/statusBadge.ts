import type { InquiryStatus } from '@/lib/admin/inquiries';

/** Badge colours per inquiry status (all combinations pass WCAG AA contrast). */
export const statusBadge: Record<InquiryStatus, string> = {
  new: 'bg-blueprint text-pure',
  read: 'bg-paper text-graphite border border-line',
  handled: 'bg-[#e6f4ea] text-[#14532d]',
  archived: 'bg-paper text-machine border border-line'
};
