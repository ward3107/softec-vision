'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { S } from '@/lib/admin/strings';
import { signIn, type SignInState } from '../actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="inline-flex min-h-[48px] w-full items-center justify-center rounded bg-blueprint px-6 font-bold text-pure hover:bg-graphite"
    >
      {pending ? S.signingIn : S.signIn}
    </button>
  );
}

export default function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useFormState<SignInState, FormData>(signIn, {});
  const errorKey = state.error ?? initialError;
  const message = errorKey ? S.errors[errorKey as keyof typeof S.errors] : null;

  const input =
    'mt-1 block w-full rounded border border-line bg-pure px-3 py-2.5 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface dark:focus-visible:border-skyline';
  return (
    <form action={action} className="grid gap-4" noValidate>
      {message && (
        <p
          role="alert"
          className="rounded border-2 border-red-700 bg-pure p-3 text-sm font-semibold text-red-700 dark:border-red-400 dark:bg-surface dark:text-red-400"
        >
          {message}
        </p>
      )}
      <div>
        <label htmlFor="admin-email" className="block text-sm font-semibold">
          {S.email}
        </label>
        <input id="admin-email" name="email" type="email" dir="ltr" autoComplete="username" required className={input} />
      </div>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-semibold">
          {S.password}
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className={input}
        />
      </div>
      <Submit />
    </form>
  );
}
