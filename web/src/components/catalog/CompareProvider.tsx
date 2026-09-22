'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';

export const COMPARE_MAX = 3;
const STORAGE_KEY = 'softec-compare';

type CompareContextValue = {
  codes: string[];
  has: (code: string) => boolean;
  toggle: (code: string) => void;
  clear: () => void;
  atLimit: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [codes, setCodes] = useState<string[]>([]);

  // Restore selection (per-browser convenience; tolerate blocked storage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCodes(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch {
      /* ignore */
    }
  }, [codes]);

  const toggle = useCallback((code: string) => {
    setCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length >= COMPARE_MAX
          ? prev
          : [...prev, code]
    );
  }, []);

  const clear = useCallback(() => setCodes([]), []);
  const has = useCallback((code: string) => codes.includes(code), [codes]);

  return (
    <CompareContext.Provider value={{ codes, has, toggle, clear, atLimit: codes.length >= COMPARE_MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
}
