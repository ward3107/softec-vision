'use client';

import EmailLinkLoginForm from './EmailLinkLoginForm';
import PasswordLoginForm from './PasswordLoginForm';

/** Email and password are primary; the one-time link stays available below. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  return (
    <div className="grid gap-4">
      <PasswordLoginForm initialError={initialError} />
      <details className="border-t border-line pt-3 text-sm dark:border-white/10">
        <summary className="cursor-pointer font-semibold text-machine dark:text-fog">
          כניסה באמצעות קישור למייל
        </summary>
        <div className="mt-4">
          <EmailLinkLoginForm />
        </div>
      </details>
    </div>
  );
}
