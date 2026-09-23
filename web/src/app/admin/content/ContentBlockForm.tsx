import type { AdminContentBlock } from '@/lib/admin/content';
import { S } from '@/lib/admin/strings';
import { saveContentBlockAction } from '../actions';

const input =
  'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface dark:focus-visible:border-skyline';
const textarea = `${input} min-h-[6rem]`;

const B = S.content.blocks;
const FIELD_LABEL = S.content.fields;
const MULTILINE_FIELDS = new Set(['body']);

export default function ContentBlockForm({ block }: { block: AdminContentBlock }) {
  const meta = B[block.key];
  const action = saveContentBlockAction.bind(null, block.key);

  return (
    <fieldset className="grid gap-4 rounded border border-line p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-bold">{meta.title}</legend>
      <p className="text-sm text-machine dark:text-fog">{meta.help}</p>
      <form action={action} className="grid gap-4">
        {block.fields.map((field) => {
          const label = FIELD_LABEL[field as keyof typeof FIELD_LABEL] ?? field;
          const Tag = MULTILINE_FIELDS.has(field) ? 'textarea' : 'input';
          return (
            <div key={field} className="grid gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2 dark:border-white/10">
              {(['he', 'en'] as const).map((locale) => {
                const id = `f-${block.key}-${field}-${locale}`;
                return (
                  <div key={locale}>
                    <label htmlFor={id} className="block text-sm font-semibold">
                      {label} — {locale === 'he' ? S.products.hebrew : S.products.english}
                    </label>
                    <Tag
                      id={id}
                      name={`${locale}.${field}`}
                      dir={locale === 'he' ? 'rtl' : 'ltr'}
                      defaultValue={block.values[locale][field]}
                      placeholder={block.shipped[locale][field]}
                      className={Tag === 'textarea' ? textarea : input}
                    />
                    <p className="mt-1 text-xs text-machine dark:text-fog">
                      {S.content.shippedLabel}: {block.shipped[locale][field]}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-fit items-center rounded border border-blueprint bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
        >
          {S.content.save}
        </button>
      </form>
    </fieldset>
  );
}
