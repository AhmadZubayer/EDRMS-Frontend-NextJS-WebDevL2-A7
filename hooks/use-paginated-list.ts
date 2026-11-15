'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AxiosInstance } from 'axios';
import useSWR from 'swr';
import useAuth from '@/hooks/use-auth';
import { publicApi } from '@/lib/api';
import { refreshApiData } from '@/lib/client-cache';
import { listQuery, readListData, type ListData, type ListParams, type ListSnapshot } from '@/lib/list-data';
import { getApiErrorMessage } from '@/utils/api-error';

interface ListOptions<T> {
  client?: AxiosInstance;
  params?: ListParams;
  enabled?: boolean;
  pageSize?: number;
  initialData?: ListSnapshot<T>;
}

export function usePaginatedList<T>(endpoint: string, {
  client = publicApi,
  params = {},
  enabled = true,
  pageSize = 10,
  initialData,
}: ListOptions<T> = {}) {
  const { user } = useAuth();
  const scope = user ? `${user.id}:${user.role ?? ''}` : 'anonymous';
  const filters = listQuery(params, 1, pageSize);
  const filterKey = `${scope}:${endpoint}:${filters}`;
  const [selection, setSelection] = useState({ filterKey, page: 1 });
  const page = selection.filterKey === filterKey ? selection.page : 1;
  if (selection.filterKey !== filterKey) setSelection({ filterKey, page: 1 });

  const search = String(params.searchTerm ?? '');
  const [settledSearch, setSettledSearch] = useState(search);
  useEffect(() => {
    if (settledSearch === search) return;
    const timer = setTimeout(() => setSettledSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search, settledSearch]);
  const searching = search !== settledSearch;
  const query = listQuery(params, page, pageSize);
  const [hydration, setHydration] = useState({ filterKey, available: true });
  if (hydration.available && hydration.filterKey !== filterKey) {
    setHydration({ filterKey, available: false });
  }
  const fallback = hydration.available && !user && client === publicApi && initialData?.query === query
    ? initialData : undefined;

  const { data, error, mutate } = useSWR<ListData<T>>(
    enabled && !searching ? ['edrms', 'list', scope, client === publicApi ? 'public' : 'secure', endpoint, query] : null,
    async () => {
      const response = await client.get(endpoint, { params: new URLSearchParams(query) });
      return readListData<T>(response.data, pageSize);
    },
    {
      fallbackData: fallback,
      revalidateOnMount: fallback ? false : undefined,
      dedupingInterval: 2000,
      shouldRetryOnError: false,
      onSuccess: (result) => {
        const lastPage = Math.max(1, result.totalPages);
        if (page > lastPage) setSelection({ filterKey, page: lastPage });
      },
    },
  );

  const result = fallback && fallback.receivedAt > (data?.receivedAt ?? 0) ? fallback : data;
  useEffect(() => {
    if (fallback && fallback.receivedAt > (data?.receivedAt ?? 0)) {
      void mutate(fallback, { revalidate: false });
    }
  }, [data, fallback, mutate]);

  const refresh = useCallback(() => refreshApiData(() => mutate()), [mutate]);
  const setPage = useCallback((next: number) => {
    setSelection({ filterKey, page: Math.max(1, Math.trunc(next)) });
  }, [filterKey]);

  return {
    items: enabled && !searching ? result?.items ?? [] : [],
    loading: enabled && (searching || (!result && !error)),
    error: error ? getApiErrorMessage(error, 'Unable to load results. Please try again.') : '',
    page,
    total: enabled ? result?.total ?? 0 : 0,
    totalPages: enabled ? result?.totalPages ?? 0 : 0,
    receivedAt: result?.receivedAt,
    setPage,
    refresh,
  };
}
