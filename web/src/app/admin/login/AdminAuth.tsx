'use client';

import { useState } from 'react';
import { S } from '@/lib/admin/strings';
import LoginForm from './LoginForm';
import OtpLoginForm from './OtpLoginForm';

/** Admin sign-in: passwordless email OTP by default, with a password fallback. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  const [method, setMethod] = useState<'otp' | 'password'>('otp');

  return (
    <div className="grid gap-5">
      {method === 'otp' ? <OtpLoginForm initialError={initialError} /> : <LoginForm initialError={initialError} />}
      <button
        type="button"
        onClick={() => setMethod((m) => (m === 'otp' ? 'password' : 'otp'))}
        className="justify-self-start text-sm font-semibold text-machine hover:text-blueprint dark:text-fog dark:hover:text-skyline"
      >
        {method === 'otp' ? S.otp.usePassword : S.otp.useOtp}
      </button>
    </div>
  );
}
