import { Suspense } from 'react';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicList, searchValue, type PageSearchParams } from '@/lib/server/public-data';
import type { DonationCampaign } from '@/components/donations/types';
import ListClient from './client';

async function Results({ searchParams }: { searchParams: PageSearchParams }) {
  const query = await searchParams;
  const initialData = await getPublicList<DonationCampaign>('/donations/campaigns', {
    searchTerm: searchValue(query.q).trim() || undefined,
  });
  return <ListClient initialData={initialData} />;
}

export default function Page({ searchParams }: { searchParams: PageSearchParams }) {
  return <Suspense fallback={<PageSkeleton />}><Results searchParams={searchParams} /></Suspense>;
}
