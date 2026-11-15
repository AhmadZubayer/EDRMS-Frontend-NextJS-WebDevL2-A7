import { mutate } from 'swr';

let pendingRefresh: Promise<unknown> | undefined;

export function invalidateApiCache(revalidate = true) {
  const matches = (key: unknown) => Array.isArray(key) && key[0] === 'edrms';
  const request = (async () => {
    await mutate(matches, undefined, { revalidate: false });
    if (revalidate) await mutate(matches);
  })();
  pendingRefresh = request;
  void request.finally(() => {
    if (pendingRefresh === request) pendingRefresh = undefined;
  }).catch(() => {});
  return request;
}

export function refreshApiData(refresh: () => Promise<unknown>) {
  return pendingRefresh ?? refresh();
}
