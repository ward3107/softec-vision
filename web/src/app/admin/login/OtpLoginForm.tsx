'use client';

import { useState, useTransition } from 'react';
import { S } from '@/lib/admin/strings';
import { sendOtp, verifyOtp } from '../actions';

const input =
  'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface dark:focus-visible:border-skyline';

const submitClass =
  'inline-flex min-h-[48px] w-full items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite';

const show = (key?: string) => (key ? S.errors[key as keyof typeof S.errors] ?? null : null);

export default function OtpLoginForm({ initialError }: { initialError?: string }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(show(initialError));
  const [pending, startTransition] = useTransition();

  function onSendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const value = String(fd.get('email') ?? '').trim();
    startTransition(async () => {
      const result = await sendOtp({}, fd);
      if (result.error) {
        setError(show(result.error));
        return;
      }
      setEmail(value);
      setError(null);
      setStep('code');
    });
  }

  function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    fd.set('email', email);
    startTransition(async () => {
      // On success verifyOtp redirects to /admin; we only return here on error.
      const result = await verifyOtp({}, fd);
      if (result?.error) setError(show(result.error));
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

  if (step === 'code') {
    return (
      <form onSubmit={onVerify} className="grid gap-4" noValidate>
        {banner}
        <div>
          <label htmlFor="admin-otp" className="block text-sm font-semibold">
            {S.otp.codeLabel}
          </label>
          <p className="mt-0.5 text-xs text-machine dark:text-fog">{S.otp.codeHint(email)}</p>
          <input
            id="admin-otp"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            dir="ltr"
            required
            autoFocus
            className={`${input} text-center text-lg tracking-[0.4em]`}
          />
        </div>
        <button type="submit" aria-disabled={pending} className={submitClass}>
          {pending ? S.otp.verifying : S.otp.verify}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setError(null);
          }}
          className="text-sm font-semibold text-blueprint hover:underline dark:text-skyline"
        >
          {S.otp.changeEmail}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSendEmail} className="grid gap-4" noValidate>
      {banner}
      <div>
        <label htmlFor="admin-email" className="block text-sm font-semibold">
          {S.email}
        </label>
        <p className="mt-0.5 text-xs text-machine dark:text-fog">{S.otp.emailHint}</p>
        <input
          id="admin-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          autoFocus
          defaultValue={email}
          className={input}
        />
      </div>
      <button type="submit" aria-disabled={pending} className={submitClass}>
        {pending ? S.otp.sending : S.otp.sendCode}
      </button>
    </form>
  );
}
