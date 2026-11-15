import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicRecord } from '@/lib/server/public-data';
import type { RescueRequest } from '@/components/rescue-requests/types';
import DetailClient from './client';

type Props = { params: Promise<{ id: string }> };

async function Details({ params }: Props) {
  const { id } = await params;
  const initialRecord = await getPublicRecord<RescueRequest>('/rescue-requests/' + encodeURIComponent(id));
  if (initialRecord === null) notFound();
  return <DetailClient key={id} id={id} initialRecord={initialRecord} />;
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<PageSkeleton />}><Details params={params} /></Suspense>;
}
