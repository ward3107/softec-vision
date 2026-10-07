'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  id: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  label?: string;
};

export default function PasswordInput({ id, name, autoComplete, minLength, label = 'הסיסמה' }: Props) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = `${visible ? 'הסתרת' : 'הצגת'} ${label}`;

  return (
    <div className="relative mt-1">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        dir="ltr"
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="block min-h-[48px] w-full rounded border border-line bg-pure py-2.5 pl-3 pr-12 focus-visible:border-blueprint dark:border-white/10 dark:bg-surface"
      />
      <button
        type="button"
        aria-label={toggleLabel}
        aria-controls={id}
        aria-pressed={visible}
        title={toggleLabel}
        onClick={() => setVisible(value => !value)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded text-machine hover:text-blueprint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint dark:text-fog dark:hover:text-skyline dark:focus-visible:outline-skyline"
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
