'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AdminProductDetail, ProductStatus } from '@/lib/admin/productForm';
import { PRODUCT_STATUSES } from '@/lib/admin/productForm';
import { S } from '@/lib/admin/strings';
import type { Localized } from '@/lib/catalog/types';
import type { SaveProductState } from '../../actions';

const input = 'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint';
const textarea = `${input} min-h-[7rem]`;

function fieldError(errors: Record<string, string> | undefined, key: string) {
  const code = errors?.[key];
  return code ? (S.products.fieldErrors[code as keyof typeof S.products.fieldErrors] ?? code) : null;
}

function Field({
  id,
  label,
  name,
  value,
  errors,
  multiline,
  dir,
  version
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  errors: Record<string, string> | undefined;
  multiline?: boolean;
  dir: 'rtl' | 'ltr';
  version: number;
}) {
  const message = fieldError(errors, name);
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {/* Uncontrolled by design (see QuoteForm); keyed so a rejected submission's
          echoed value replaces the field instead of being ignored after mount. */}
      <Tag
        key={version}
        id={id}
        name={name}
        dir={dir}
        defaultValue={value}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        className={multiline ? textarea : input}
      />
      {message && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="inline-flex min-h-[44px] items-center rounded border border-blueprint bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
    >
      {pending ? S.products.saving : S.products.save}
    </button>
  );
}

/** Field name → DOM id, matching the ids assigned below. */
const fieldId = (name: string) => `f-${name.replace(/\./g, '-')}`;

export default function ProductForm({
  product,
  specFields,
  action
}: {
  product: AdminProductDetail;
  specFields: Array<{ key: string; label: Localized }>;
  action: (state: SaveProductState, fd: FormData) => Promise<SaveProductState>;
}) {
  const [state, formAction] = useFormState<SaveProductState, FormData>(action, {});
  const savedRef = useRef<HTMLParagraphElement>(null);

  // The product actually loaded when the form first mounted. A validation
  // failure never overwrites what the owner typed with this (or with a
  // meanwhile-refreshed server copy) — only a successful save does.
  const [initial] = useState(product);

  // Bump whenever a new submission result arrives, so the (uncontrolled)
  // fields below remount and pick up their new value.
  const [prevState, setPrevState] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    setVersion((v) => v + 1);
  }

  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback;

  useEffect(() => {
    if (state.saved) {
      savedRef.current?.focus();
      return;
    }
    const firstError = Object.keys(state.errors ?? {})[0];
    if (firstError) document.getElementById(fieldId(firstError))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <form action={formAction} className="grid gap-8" noValidate>
      {state.saved && (
        <p
          ref={savedRef}
          tabIndex={-1}
          role="status"
          className="rounded border border-line bg-[#e6f4ea] p-3 text-sm font-semibold text-[#14532d] focus:outline-none"
        >
          ✓ {S.products.saved}
        </p>
      )}

      <div>
        <label htmlFor="f-status" className="block text-sm font-semibold">
          {S.products.status}
        </label>
        <select
          key={version}
          id="f-status"
          name="status"
          defaultValue={value('status', product.status)}
          className={input}
        >
          {PRODUCT_STATUSES.map((status: ProductStatus) => (
            <option key={status} value={status}>
              {S.products.statuses[status]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-machine">{S.products.statusHelp}</p>
      </div>

      <fieldset className="grid gap-4 rounded border border-line p-4">
        <legend className="px-1 text-sm font-bold">{S.products.nameSection}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="f-name-he"
            label={`${S.products.hebrew} — ${S.products.name}`}
            name="name.he"
            value={value('name.he', initial.translations.he.name)}
            errors={state.errors}
            dir="rtl"
            version={version}
          />
          <Field
            id="f-name-en"
            label={`${S.products.english} — ${S.products.name}`}
            name="name.en"
            value={value('name.en', initial.translations.en.name)}
            errors={state.errors}
            dir="ltr"
            version={version}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="f-description-he"
            label={S.products.hebrew}
            name="description.he"
            value={value('description.he', initial.translations.he.description)}
            errors={state.errors}
            multiline
            dir="rtl"
            version={version}
          />
          <Field
            id="f-description-en"
            label={S.products.english}
            name="description.en"
            value={value('description.en', initial.translations.en.description)}
            errors={state.errors}
            multiline
            dir="ltr"
            version={version}
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{S.products.alt}</p>
          <p className="text-sm text-machine">{S.products.altHelp}</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field
              id="f-alt-he"
              label={S.products.hebrew}
              name="alt.he"
              value={value('alt.he', initial.translations.he.alt_text)}
              errors={state.errors}
              dir="rtl"
              version={version}
            />
            <Field
              id="f-alt-en"
              label={S.products.english}
              name="alt.en"
              value={value('alt.en', initial.translations.en.alt_text)}
              errors={state.errors}
              dir="ltr"
              version={version}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded border border-line p-4">
        <legend className="px-1 text-sm font-bold">{S.products.specsSection}</legend>
        <p className="text-sm text-machine">{S.products.specsHelp}</p>
        {specFields.map(({ key, label }) => (
          <div key={key} className="grid gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2">
            <Field
              id={`f-spec-${key}-he`}
              label={`${label.he} (${S.products.hebrew})`}
              name={`spec.${key}.he`}
              value={value(`spec.${key}.he`, initial.specs[key]?.he ?? '')}
              errors={state.errors}
              dir="rtl"
              version={version}
            />
            <Field
              id={`f-spec-${key}-en`}
              label={`${label.en} (${S.products.english})`}
              name={`spec.${key}.en`}
              value={value(`spec.${key}.en`, initial.specs[key]?.en ?? '')}
              errors={state.errors}
              dir="ltr"
              version={version}
            />
          </div>
        ))}
      </fieldset>

      <Submit />
    </form>
  );
}
