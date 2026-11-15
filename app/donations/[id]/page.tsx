import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicRecord } from '@/lib/server/public-data';
import type { DonationCampaign } from '@/components/donations/types';
import DetailClient from './client';

type Props = { params: Promise<{ id: string }> };

async function Details({ params }: Props) {
  const { id } = await params;
  const initialRecord = await getPublicRecord<DonationCampaign>('/donations/campaigns/' + encodeURIComponent(id));
  if (initialRecord === null) notFound();
  return <DetailClient key={id} id={id} initialRecord={initialRecord} />;
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<PageSkeleton />}><Details params={params} /></Suspense>;
}
