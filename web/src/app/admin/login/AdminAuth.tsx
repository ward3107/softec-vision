'use client';

import EmailLinkLoginForm from './EmailLinkLoginForm';

/** Passwordless admin entry; the signed-in session is kept in this browser. */
export default function AdminAuth({ initialError }: { initialError?: string }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-machine dark:text-fog">
        הכניסה מתבצעת באמצעות קישור חד-פעמי למייל. לאחר הכניסה תישאר מחובר בדפדפן הזה, ללא סיסמה.
      </p>
      <EmailLinkLoginForm initialError={initialError} />
    </div>
  );
}
