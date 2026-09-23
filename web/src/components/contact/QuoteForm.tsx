'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useConsent } from '@/components/consent/ConsentProvider';
import { MAX_REQUIREMENTS, PROJECT_TYPES, validateInquiry, type InquiryErrors } from '@/lib/inquiry/schema';

type ProductOption = { code: string; name: string };
type Status = 'idle' | 'submitting' | 'success' | 'whatsapp' | 'error';
type ServerError = 'failed' | 'rateLimited' | 'network';

const EMPTY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  country: '',
  projectType: '',
  product: '',
  requirements: ''
};
type Values = typeof EMPTY;
type Field = keyof Values | 'consent';

const FIELD_ORDER: Field[] = [
  'name',
  'company',
  'email',
  'phone',
  'country',
  'projectType',
  'product',
  'requirements',
  'consent'
];
/** White text on this green passes WCAG AA (≈5:1); WhatsApp's own #25D366 does not. */
const WHATSAPP_BUTTON = 'bg-[#15803d] text-white hover:bg-[#166534]';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Quote request form. When a delivery channel is configured (`onlineEnabled`),
 * requests go to /api/inquiry (stored and/or emailed on the server). Otherwise
 * the same details open in a WhatsApp chat so no lead is lost. WhatsApp stays
 * available as a secondary option either way.
 */
export default function QuoteForm({
  products,
  defaultProduct,
  onlineEnabled,
  waNumber
}: {
  products: ProductOption[];
  defaultProduct?: string;
  onlineEnabled: boolean;
  waNumber: string;
}) {
  const t = useTranslations('form');
  const locale = useLocale() as 'he' | 'en';
  const { track } = useConsent();
  const known = (code?: string | null) => Boolean(code && products.some((p) => p.code === code));

  const [values, setValues] = useState<Values>({ ...EMPTY, product: known(defaultProduct) ? defaultProduct! : '' });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<ServerError | null>(null);
  const [reference, setReference] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<Promise<string | null> | null>(null);
  const startedRef = useRef(false);

  // The page is pre-rendered, so read a ?product= preselection in the browser.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('product');
    if (known(code)) setValues((v) => (v.product ? v : { ...v, product: code! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to what changed: the error summary, or the result message.
  useEffect(() => {
    if (attempt > 0 && Object.keys(errors).length > 0) summaryRef.current?.focus();
  }, [attempt, errors]);
  useEffect(() => {
    if (status === 'success' || status === 'error' || status === 'whatsapp') resultRef.current?.focus();
  }, [status]);

  const fetchToken = () =>
    fetch('/api/inquiry', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { token?: string } | null) => j?.token ?? null)
      .catch(() => null);

  /** Fetched once the visitor starts the form, so plain page views make no request. */
  const ensureToken = () => {
    if (!onlineEnabled) return null;
    if (!tokenRef.current) tokenRef.current = fetchToken();
    return tokenRef.current;
  };

  /** Marks the form as started the first time it's touched — once per visit. */
  const onFirstInteraction = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track('quote_started');
    }
    void ensureToken();
  };

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const productName = products.find((p) => p.code === values.product)?.name;

  const whatsappUrl = () => {
    const pairs: Array<[string, string]> = [
      [t('name'), values.name],
      [t('company'), values.company],
      [t('email'), values.email],
      [t('phone'), values.phone],
      [t('country'), values.country],
      [t('projectType'), values.projectType ? t(`projectTypes.${values.projectType}`) : ''],
      [t('product'), values.product ? `${productName} (${values.product})` : ''],
      [t('requirements'), values.requirements]
    ];
    const lines = [t('whatsappIntro'), '', ...pairs.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v.trim()}`)];
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  function validate(): InquiryErrors {
    const result = validateInquiry({ ...values, consent, locale });
    return result.ok ? {} : { ...result.errors };
  }

  async function post(retry = true): Promise<void> {
    const token = await ensureToken();
    const fd = new FormData(formRef.current!);
    fd.set('locale', locale);
    fd.set('token', token ?? '');

    let response: Response;
    try {
      response = await fetch('/api/inquiry', { method: 'POST', body: fd });
    } catch {
      setServerError('network');
      setStatus('error');
      return;
    }
    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      reference?: string;
      errors?: InquiryErrors;
      error?: string;
    };

    if (response.ok && body.ok) {
      setReference(body.reference);
      setStatus('success');
      track('quote_completed');
      return;
    }
    if ((response.status === 422 || response.status === 413) && body.errors) {
      setErrors(body.errors);
      setAttempt((n) => n + 1);
      setStatus('idle');
      return;
    }
    if (response.status === 400 && retry) {
      // Stale token, or submitted too quickly: get a fresh token and retry once.
      if (body.error === 'token') tokenRef.current = fetchToken();
      await wait(3_200);
      return post(false);
    }
    setServerError(response.status === 429 ? 'rateLimited' : 'failed');
    setStatus('error');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const found = validate();
    setErrors(found);
    setAttempt((n) => n + 1);
    if (Object.keys(found).length > 0) {
      setStatus('idle');
      return;
    }

    if (!onlineEnabled) {
      track('whatsapp_clicked', { source: 'quote_form_offline' });
      window.open(whatsappUrl(), '_blank', 'noopener');
      setStatus('whatsapp');
      return;
    }
    setServerError(null);
    setStatus('submitting');
    await post();
  }

  function reset() {
    setValues({ ...EMPTY });
    setConsent(false);
    setErrors({});
    setAttempt(0);
    setReference(undefined);
    setServerError(null);
    setStatus('idle');
    tokenRef.current = null;
  }

  const label = (field: Field) => (field === 'consent' ? t('consentShort') : t(field));
  const errorId = (field: Field) => `qf-${field}-error`;
  const describedBy = (field: Field, hint?: boolean) =>
    [hint ? `qf-${field}-hint` : '', errors[field] ? errorId(field) : ''].filter(Boolean).join(' ') || undefined;

  const input =
    'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 text-graphite focus-visible:border-blueprint aria-[invalid=true]:border-red-700 dark:border-white/10 dark:bg-surface dark:text-ink dark:focus-visible:border-skyline dark:aria-[invalid=true]:border-red-400';
  const labelClass = 'block text-sm font-semibold text-graphite dark:text-ink';

  /** Label, hint, control and error for one field. A plain function (not a component) so inputs keep focus. */
  const row = (field: Field, control: ReactNode, { required = false, hint }: { required?: boolean; hint?: string } = {}) => (
    <div>
      <label className={labelClass} htmlFor={`qf-${field}`}>
        {label(field)}{' '}
        {required ? (
          <span className="text-red-700 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="font-normal text-machine dark:text-fog">({t('optional')})</span>
        )}
      </label>
      {hint && (
        <p id={`qf-${field}-hint`} className="mt-0.5 text-xs text-machine dark:text-fog">
          {hint}
        </p>
      )}
      {control}
      {errors[field] && (
        <p id={errorId(field)} className="mt-1 text-sm font-medium text-red-700 dark:text-red-400">
          {t(`errors.${errors[field]}`)}
        </p>
      )}
    </div>
  );

  const invalid = (field: Field) => ({
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(field)
  });

  if (status === 'success') {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="rounded border border-line bg-pure p-6 dark:border-white/10 dark:bg-surface">
        <h3 className="text-xl font-extrabold">{t('successTitle')}</h3>
        <p className="mt-2 text-machine dark:text-fog">{t('successBody')}</p>
        {reference && <p className="mt-3 font-semibold">{t('successReference', { reference })}</p>}
        <p className="mt-3 text-sm text-machine dark:text-fog">{t('successNext')}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_clicked', { source: 'quote_form_success' })}
            className="inline-flex min-h-[44px] items-center rounded border border-line px-4 text-sm font-bold text-graphite hover:border-machine dark:border-white/10 dark:text-ink dark:hover:border-white/25"
          >
            {t('whatsappLink')}
          </a>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded px-4 text-sm font-bold text-blueprint hover:underline dark:text-skyline"
          >
            {t('sendAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocusCapture={onFirstInteraction}
      noValidate
      className="grid gap-5"
      aria-describedby="qf-required-note"
    >
      <p id="qf-required-note" className="text-sm text-machine dark:text-fog">
        {t('requiredNote')}
      </p>

      {attempt > 0 && Object.keys(errors).length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="qf-summary-title"
          className="rounded border-2 border-red-700 bg-pure p-4 dark:border-red-400 dark:bg-surface"
        >
          <h3 id="qf-summary-title" className="font-bold text-red-700 dark:text-red-400">
            {t('errorSummary')}
          </h3>
          <ul className="mt-2 list-disc ps-5 text-sm">
            {FIELD_ORDER.filter((f) => errors[f]).map((f) => (
              <li key={f}>
                <a href={`#qf-${f}`} className="font-semibold text-red-700 underline underline-offset-2 dark:text-red-400">
                  {label(f)}: {t(`errors.${errors[f]}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {row(
          'name',
          <input id="qf-name" name="name" className={input} value={values.name} onChange={set('name')} required autoComplete="name" maxLength={120} {...invalid('name')} />,
          { required: true }
        )}
        {row(
          'company',
          <input id="qf-company" name="company" className={input} value={values.company} onChange={set('company')} autoComplete="organization" maxLength={160} {...invalid('company')} />
        )}
        {row(
          'email',
          <input id="qf-email" name="email" type="email" dir="ltr" className={input} value={values.email} onChange={set('email')} required autoComplete="email" inputMode="email" maxLength={200} {...invalid('email')} />,
          { required: true }
        )}
        {row(
          'phone',
          <input id="qf-phone" name="phone" type="tel" dir="ltr" className={input} value={values.phone} onChange={set('phone')} required autoComplete="tel" inputMode="tel" maxLength={32} {...invalid('phone')} />,
          { required: true }
        )}
        {row(
          'country',
          <input id="qf-country" name="country" className={input} value={values.country} onChange={set('country')} required autoComplete="country-name" maxLength={80} {...invalid('country')} />,
          { required: true }
        )}
        {row(
          'projectType',
          <select id="qf-projectType" name="projectType" className={input} value={values.projectType} onChange={set('projectType')} {...invalid('projectType')}>
            <option value="">{t('projectTypeNone')}</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`projectTypes.${type}`)}
              </option>
            ))}
          </select>
        )}
        {row(
          'product',
          <select id="qf-product" name="product" className={input} value={values.product} onChange={set('product')} {...invalid('product')}>
            <option value="">{t('productNone')}</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {row(
        'requirements',
        <textarea
          id="qf-requirements"
          name="requirements"
          rows={5}
          className={input}
          value={values.requirements}
          onChange={set('requirements')}
          required
          maxLength={MAX_REQUIREMENTS}
          aria-invalid={Boolean(errors.requirements)}
          aria-describedby={describedBy('requirements', true)}
        />,
        { required: true, hint: t('requirementsHint') }
      )}

      {/* Honeypot: hidden from people and assistive technology; bots fill it. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" style={{ clip: 'rect(0 0 0 0)' }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="qf-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-0.5 h-5 w-5 flex-none accent-blueprint"
            {...invalid('consent')}
          />
          <label htmlFor="qf-consent" className="text-sm text-graphite dark:text-ink">
            {t.rich('consent', {
              link: (chunks) => (
                <Link href="/legal/privacy" className="font-semibold text-blueprint underline underline-offset-2 dark:text-skyline">
                  {chunks}
                </Link>
              )
            })}{' '}
            <span className="text-red-700 dark:text-red-400" aria-hidden="true">
              *
            </span>
          </label>
        </div>
        {errors.consent && (
          <p id={errorId('consent')} className="mt-1 text-sm font-medium text-red-700 dark:text-red-400">
            {t(`errors.${errors.consent}`)}
          </p>
        )}
      </div>

      {(status === 'error' || status === 'whatsapp') && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role={status === 'error' ? 'alert' : 'status'}
          className={`rounded bg-pure p-4 dark:bg-surface ${status === 'error' ? 'border-2 border-red-700 dark:border-red-400' : 'border border-line dark:border-white/10'}`}
        >
          {status === 'error' ? (
            <>
              <h3 className="font-bold text-red-700 dark:text-red-400">{t('errorTitle')}</h3>
              <p className="mt-1 text-sm">
                {t(serverError === 'rateLimited' ? 'errorRateLimited' : serverError === 'network' ? 'errorNetwork' : 'errorFailed')}
              </p>
            </>
          ) : (
            <p className="text-sm">{t('whatsappOpened')}</p>
          )}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_clicked', { source: 'quote_form_retry' })}
            className={`mt-3 inline-flex min-h-[44px] items-center rounded px-4 text-sm font-bold ${WHATSAPP_BUTTON}`}
          >
            {t('tryWhatsapp')}
          </a>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {status === 'submitting' ? t('sending') : ''}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          aria-disabled={status === 'submitting'}
          className={`inline-flex min-h-[48px] w-full items-center justify-center rounded px-7 font-bold sm:w-auto ${
            onlineEnabled ? 'bg-blueprint text-pure hover:bg-graphite' : WHATSAPP_BUTTON
          } ${status === 'submitting' ? 'cursor-progress opacity-80' : ''}`}
        >
          {status === 'submitting' ? t('sending') : onlineEnabled ? t('send') : t('sendWhatsapp')}
        </button>
        {onlineEnabled && (
          <p className="text-sm text-machine dark:text-fog">
            {t('whatsappAlt')}{' '}
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_clicked', { source: 'quote_form_alt' })}
              className="font-semibold text-blueprint underline underline-offset-2 dark:text-skyline"
            >
              {t('whatsappLink')}
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
