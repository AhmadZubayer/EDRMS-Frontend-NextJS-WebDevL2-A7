import 'server-only';

import { cache } from 'react';
import { normalizeApiRecord } from '@/lib/api-records';
import { listQuery, readListData, type ListParams, type ListSnapshot } from '@/lib/list-data';

const backendUrl = process.env.BACKEND_URL || 'https://edrms-express-server-ahmadzubayer.vercel.app';

// Memoization is limited to this render request. Live records stay fresh across requests.
const fetchPublicData = cache(async (path: string) => {
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) throw new Error(`Public API request failed (${response.status})`);
  const body = await response.json();
  return { ...body, data: normalizeApiRecord(body.data) };
});

export async function getPublicList<T>(endpoint: string, params: ListParams = {}): Promise<ListSnapshot<T> | undefined> {
  const query = listQuery(params);
  try {
    const body = await fetchPublicData(`${endpoint}?${query}`);
    if (!body) return undefined;
    return { ...readListData<T>(body, 10), query };
  } catch {
    // Let the existing client fetcher recover from a temporary upstream failure.
    return undefined;
  }
}

export async function getPublicRecord<T>(endpoint: string): Promise<T | null | undefined> {
  try {
    const body = await fetchPublicData(endpoint);
    return body === null ? null : body.data as T;
  } catch {
    return undefined;
  }
}

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function searchValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}
