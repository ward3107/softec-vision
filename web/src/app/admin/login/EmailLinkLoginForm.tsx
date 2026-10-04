'use client';

import { useState, useTransition } from 'react';
import { S } from '@/lib/admin/strings';
import { sendLoginLink } from '../actions';

const input =
  'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface dark:focus-visible:border-skyline';

const submitClass =
  'inline-flex min-h-[48px] w-full items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite';

const show = (key?: string) => (key ? S.errors[key as keyof typeof S.errors] ?? null : null);

export default function EmailLinkLoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(show(initialError));
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const value = String(fd.get('email') ?? '').trim();

    startTransition(async () => {
      const result = await sendLoginLink({}, fd);
      if (result.error) {
        setError(show(result.error));
        setSentTo(null);
        return;
      }
      setEmail(value);
      setError(null);
      setSentTo(value);
    });
  }

  const banner = error && (
    <p
      role="alert"
      className="rounded border-2 border-red-700 bg-pure p-3 text-sm font-semibold text-red-700 dark:border-red-400 dark:bg-surface dark:text-red-400"
    >
      {error}
    </p>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {banner}
      {sentTo && (
        <p
          role="status"
          className="rounded border border-line bg-secondary p-3 text-sm leading-6"
        >
          {S.emailLink.sent(sentTo)}
        </p>
      )}
      <div>
        <label htmlFor="admin-email" className="block text-sm font-semibold">
          {S.email}
        </label>
        <p className="mt-0.5 text-xs text-machine dark:text-fog">{S.emailLink.hint}</p>
        <input
          id="admin-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSentTo(null);
            setError(null);
          }}
          className={input}
        />
      </div>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? S.emailLink.sending : sentTo ? S.emailLink.resend : S.emailLink.send}
      </button>
    </form>
  );
}
