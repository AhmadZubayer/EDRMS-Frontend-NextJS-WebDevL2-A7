import { Suspense } from 'react';
import PageSkeleton from '@/components/page-skeleton';
import { getPublicList, searchValue, type PageSearchParams } from '@/lib/server/public-data';
import type { CommunityPost } from '@/components/community/types';
import CommunityClient from './client';

async function Results({ searchParams }: { searchParams: PageSearchParams }) {
  const query = await searchParams;
  const sort = searchValue(query.sort) || 'desc';
  const roles: Record<string, string> = {
    posted_by_volunteers: 'VOLUNTEER',
    posted_by_relief_org: 'RELIEF_ORG',
    posted_by_admin: 'ADMIN',
  };
  const initialData = sort === 'posted_by_you' ? undefined : await getPublicList<CommunityPost>('/community-posts', {
    searchTerm: searchValue(query.q).trim() || undefined,
    sortOrder: sort === 'asc' ? 'asc' : 'desc',
    authorRole: roles[sort],
  });
  return <CommunityClient initialData={initialData} />;
}

export default function Page({ searchParams }: { searchParams: PageSearchParams }) {
  return <Suspense fallback={<PageSkeleton />}><Results searchParams={searchParams} /></Suspense>;
}
