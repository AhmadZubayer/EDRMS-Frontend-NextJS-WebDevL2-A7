export type ListParams = Record<string, string | number | boolean | undefined>;

export interface ListData<T> {
  items: T[];
  total: number;
  totalPages: number;
  receivedAt: number;
}

export interface ListSnapshot<T> extends ListData<T> {
  query: string;
}

export function listQuery(params: ListParams, page = 1, limit = 10) {
  const query = new URLSearchParams();
  const values: ListParams = { ...params, page, limit };
  for (const key of Object.keys(values).sort()) {
    const value = values[key];
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return query.toString();
}

export function readListData<T>(body: unknown, limit: number): ListData<T> {
  const envelope = body as { data?: unknown; meta?: { total: number; totalPages: number } };
  const payload = envelope?.data ?? body;
  const nested = payload as { data?: T[]; meta?: { total: number; totalPages: number } };
  const items: T[] = Array.isArray(payload) ? payload : nested?.data ?? [];
  const meta = envelope?.meta ?? nested?.meta;
  const total = meta?.total ?? items.length;
  return { items, total, totalPages: meta?.totalPages ?? Math.ceil(total / limit), receivedAt: Date.now() };
}
