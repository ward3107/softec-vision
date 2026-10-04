'use client';

import EmailLinkLoginForm from './EmailLinkLoginForm';

/** Passwordless admin sign-in using a one-time link sent to the staff email. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  return <EmailLinkLoginForm initialError={initialError} />;
}
