'use client';

import { useCallback, useEffect, useState } from 'react';
import { isCancel, type AxiosInstance } from 'axios';
import { publicApi } from '@/lib/api';
import { getApiErrorMessage } from '@/utils/api-error';

type ListParams = Record<string, string | number | boolean | undefined>;

interface ListOptions {
  client?: AxiosInstance;
  params?: ListParams;
  enabled?: boolean;
  pageSize?: number;
}

export function usePaginatedList<T>(endpoint: string, {
  client = publicApi,
  params = {},
  enabled = true,
  pageSize = 10,
}: ListOptions = {}) {
  const filters = JSON.stringify(params);
  const filterKey = `${endpoint}:${filters}:${pageSize}`;
  const [selection, setSelection] = useState({ filterKey, page: 1 });
  const page = selection.filterKey === filterKey ? selection.page : 1;
  if (selection.filterKey !== filterKey) {
    setSelection({ filterKey, page: 1 });
  }
  const [revision, setRevision] = useState(0);
  const requestKey = `${filterKey}:${page}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    items: T[];
    total: number;
    totalPages: number;
    error: string;
  }>({ key: '', items: [], total: 0, totalPages: 0, error: '' });

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const setPage = useCallback((next: number) => {
    setSelection({ filterKey, page: Math.max(1, Math.trunc(next)) });
  }, [filterKey]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await client.get(endpoint, {
          params: { ...JSON.parse(filters), page, limit: pageSize },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const body = response.data;
        const payload = body?.data ?? body;
        const items: T[] = Array.isArray(payload) ? payload : payload?.data ?? [];
        const meta = body?.meta ?? payload?.meta;
        const total = meta?.total ?? items.length;
        const totalPages = meta?.totalPages ?? Math.ceil(total / pageSize);
        if (page > Math.max(1, totalPages)) {
          setSelection({ filterKey, page: Math.max(1, totalPages) });
          return;
        }
        setResult({ key: requestKey, items, total, totalPages, error: '' });
      } catch (error) {
        if (controller.signal.aborted || isCancel(error)) return;
        setResult({
          key: requestKey,
          items: [],
          total: 0,
          totalPages: 0,
          error: getApiErrorMessage(error, 'Unable to load results. Please try again.'),
        });
      }
    };

    void load();
    return () => controller.abort();
  }, [client, endpoint, enabled, filters, filterKey, page, pageSize, requestKey]);

  return {
    items: enabled ? result.items : [],
    loading: enabled && result.key !== requestKey,
    error: result.key === requestKey ? result.error : '',
    page,
    total: result.total,
    totalPages: result.totalPages,
    setPage,
    refresh,
  };
}
