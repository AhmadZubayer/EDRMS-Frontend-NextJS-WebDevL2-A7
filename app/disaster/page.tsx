import { Suspense } from 'react';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicList, searchValue, type PageSearchParams } from '@/lib/server/public-data';
import type { Disaster } from '@/components/disaster/types';
import ListClient from './client';

async function Results({ searchParams }: { searchParams: PageSearchParams }) {
  const query = await searchParams;
  const initialData = await getPublicList<Disaster>('/disasters', {
    searchTerm: searchValue(query.q).trim() || undefined,
  });
  return <ListClient initialData={initialData} />;
}

export default function Page({ searchParams }: { searchParams: PageSearchParams }) {
  return <Suspense fallback={<PageSkeleton />}><Results searchParams={searchParams} /></Suspense>;
}
