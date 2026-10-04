'use client';

import EmailLinkLoginForm from './EmailLinkLoginForm';
import PasswordLoginForm from './PasswordLoginForm';

/** The owner can use a password day to day; a link remains for first-time setup. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  return (
    <div className="grid gap-6">
      <PasswordLoginForm initialError={initialError} />
      <details className="border-t border-line pt-4 text-sm dark:border-white/10">
        <summary className="cursor-pointer font-semibold text-blueprint dark:text-skyline">
          אין לי סיסמה או ששכחתי אותה
        </summary>
        <p className="mt-2 text-machine dark:text-fog">
          אפשר להיכנס פעם אחת עם קישור למייל, ואז לקבוע סיסמה באזור הניהול.
        </p>
        <div className="mt-4">
          <EmailLinkLoginForm />
        </div>
      </details>
    </div>
  );
}
