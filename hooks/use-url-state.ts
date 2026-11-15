'use client';

import { useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const useUrlState = (key: string, fallback = '') => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const value = searchParams.get(key) ?? fallback;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(window.location.search);
      if (next && next !== fallback) params.set(key, next);
      else params.delete(key);
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
    },
    [key, fallback, pathname]
  );

  return [value, setValue] as const;
};
