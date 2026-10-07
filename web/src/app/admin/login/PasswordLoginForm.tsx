'use client';

import { useActionState } from 'react';
import { signIn } from '../actions';
import { S } from '@/lib/admin/strings';
import PasswordInput from '../PasswordInput';

export default function PasswordLoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  const error = state.error
    ? S.errors[state.error]
    : initialError
      ? S.errors[initialError as keyof typeof S.errors]
      : null;

  return (
    <form action={action} className="grid gap-4">
      {error && (
        <p role="alert" className="rounded border-2 border-red-700 bg-pure p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="admin-password-email" className="block text-sm font-semibold">{S.email}</label>
        <input
          id="admin-password-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          className="mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-semibold">{S.password}</label>
        <PasswordInput
          id="admin-password"
          name="password"
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite disabled:opacity-60"
      >
        {pending ? S.signingIn : S.signIn}
      </button>
    </form>
  );
}
