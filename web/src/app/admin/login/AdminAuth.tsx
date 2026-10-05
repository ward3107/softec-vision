'use client';

import EmailLinkLoginForm from './EmailLinkLoginForm';
import PasswordLoginForm from './PasswordLoginForm';

/** Passwordless email link is primary; password remains an optional recovery route. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-machine dark:text-fog">
        הכניסה מתבצעת באמצעות קישור חד-פעמי למייל. לאחר הכניסה תישאר מחובר בדפדפן הזה, ללא צורך בסיסמה בכל פעם.
      </p>
      <EmailLinkLoginForm initialError={initialError} />
      <details className="border-t border-line pt-3 text-sm dark:border-white/10">
        <summary className="cursor-pointer font-semibold text-machine dark:text-fog">
          אפשרות גיבוי: כניסה עם סיסמה
        </summary>
        <div className="mt-4">
          <PasswordLoginForm />
        </div>
      </details>
    </div>
  );
}
