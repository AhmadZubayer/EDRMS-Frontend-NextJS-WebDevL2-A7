'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const useUrlState = (key: string, fallback = '') => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = searchParams.get(key) ?? fallback;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(window.location.search);
      if (next && next !== fallback) params.set(key, next);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, fallback, pathname, router]
  );

  return [value, setValue] as const;
};
