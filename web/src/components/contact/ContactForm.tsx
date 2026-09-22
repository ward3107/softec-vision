'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type ProductOption = { code: string; name: string };

/**
 * Quote request form. Today it composes a structured WhatsApp message from the
 * fields (works with no backend). When Supabase is connected, the submit path
 * switches to a server action that stores the inquiry and its attachments — the
 * field contract here already matches the `inquiries` table.
 */
export default function ContactForm({
  waNumber,
  products,
  defaultProduct
}: {
  waNumber: string;
  products: ProductOption[];
  defaultProduct?: string;
}) {
  const t = useTranslations('form');
  const [values, setValues] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    projectType: '',
    product: defaultProduct && products.some((p) => p.code === defaultProduct) ? defaultProduct : '',
    message: '',
    // Honeypot — real users leave it empty.
    website: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = t('required');
    if (!values.phone.trim()) next.phone = t('required');
    if (!values.message.trim()) next.message = t('required');
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = t('invalidEmail');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.website) return; // honeypot tripped — silently ignore
    if (!validate()) return;

    const productName = products.find((p) => p.code === values.product)?.name;
    const lines = [
      t('intro'),
      '',
      `${t('name')}: ${values.name}`,
      values.company && `${t('company')}: ${values.company}`,
      `${t('phone')}: ${values.phone}`,
      values.email && `${t('email')}: ${values.email}`,
      values.projectType && `${t('projectType')}: ${values.projectType}`,
      values.product && `${t('product')}: ${productName} (${values.product})`,
      `${t('message')}: ${values.message}`
    ].filter(Boolean);
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
  }

  const field = 'mt-1 w-full rounded border border-line bg-pure px-3 py-2.5 text-graphite focus-visible:border-blueprint';
  const labelCls = 'block text-sm font-semibold text-graphite';

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="cf-name">
            {t('name')} <span className="text-blueprint">*</span>
          </label>
          <input id="cf-name" className={field} value={values.name} onChange={set('name')} required aria-invalid={!!errors.name} autoComplete="name" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="cf-company">
            {t('company')} <span className="text-machine">({t('optional')})</span>
          </label>
          <input id="cf-company" className={field} value={values.company} onChange={set('company')} autoComplete="organization" />
        </div>
        <div>
          <label className={labelCls} htmlFor="cf-phone">
            {t('phone')} <span className="text-blueprint">*</span>
          </label>
          <input id="cf-phone" className={field} value={values.phone} onChange={set('phone')} required aria-invalid={!!errors.phone} inputMode="tel" autoComplete="tel" dir="ltr" />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="cf-email">
            {t('email')} <span className="text-machine">({t('optional')})</span>
          </label>
          <input id="cf-email" className={field} value={values.email} onChange={set('email')} aria-invalid={!!errors.email} inputMode="email" autoComplete="email" dir="ltr" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="cf-projectType">
            {t('projectType')} <span className="text-machine">({t('optional')})</span>
          </label>
          <input id="cf-projectType" className={field} value={values.projectType} onChange={set('projectType')} />
        </div>
        <div>
          <label className={labelCls} htmlFor="cf-product">
            {t('product')} <span className="text-machine">({t('optional')})</span>
          </label>
          <select id="cf-product" className={field} value={values.product} onChange={set('product')}>
            <option value="">{t('productNone')}</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="cf-message">
          {t('message')} <span className="text-blueprint">*</span>
        </label>
        <textarea id="cf-message" className={field} rows={4} value={values.message} onChange={set('message')} required aria-invalid={!!errors.message} />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>

      {/* Honeypot: visually hidden, off the tab order. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" style={{ clip: 'rect(0 0 0 0)' }}>
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded bg-[#25D366] px-6 font-bold text-white hover:brightness-95 sm:w-auto"
      >
        {t('send')}
      </button>
    </form>
  );
}
