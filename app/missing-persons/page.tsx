import { Suspense } from 'react';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicList, searchValue, type PageSearchParams } from '@/lib/server/public-data';
import type { MissingPerson } from '@/components/missing-persons/missing-person-dialog';
import ListClient from './client';

async function Results({ searchParams }: { searchParams: PageSearchParams }) {
  const query = await searchParams;
  const initialData = await getPublicList<MissingPerson>('/missing-persons', {
    searchTerm: searchValue(query.q).trim() || undefined,
  });
  return <ListClient initialData={initialData} />;
}

export default function Page({ searchParams }: { searchParams: PageSearchParams }) {
  return <Suspense fallback={<PageSkeleton />}><Results searchParams={searchParams} /></Suspense>;
}
