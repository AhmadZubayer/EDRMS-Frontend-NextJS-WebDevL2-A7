'use client';

import ListPagination from '@/components/list-pagination';
import type { ListSnapshot } from '@/lib/list-data';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useUrlState } from '@/hooks/use-url-state';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquarePlus } from 'lucide-react';
import Navbar from '@/components/navbar';
import SearchBar from '@/components/searchbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useAuth from '@/hooks/use-auth';
import { CommunityPost } from '@/components/community/types';
import CommunityPostCard from '@/components/community/community-post-card';
const AddCommunityPostDrawer = dynamic(() => import('@/components/community/add-community-post-drawer'), { ssr: false });

const CommunityPageContent = ({ initialData }: { initialData?: ListSnapshot<CommunityPost> }) => {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setUrlSearch] = useUrlState('q');
  const [sortOption, setUrlSort] = useUrlState('sort', 'desc');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const authorRoles: Record<string, string> = {
    posted_by_volunteers: 'VOLUNTEER',
    posted_by_relief_org: 'RELIEF_ORG',
    posted_by_admin: 'ADMIN',
  };
  const { items: posts, loading, error, page, totalPages, setPage, refresh: fetchPosts } =
    usePaginatedList<CommunityPost>('/community-posts', {
      initialData,
      params: {
        searchTerm: searchQuery.trim() || undefined,
        sortOrder: sortOption === 'asc' ? 'asc' : 'desc',
        authorId: sortOption === 'posted_by_you' ? user?.id : undefined,
        authorRole: authorRoles[sortOption],
      },
      enabled: sortOption !== 'posted_by_you' || Boolean(user),
    });

  const handleSearchChange = (value: string) => setUrlSearch(value);
  const handleSortChange = (value: string | null) => {
    if (value) setUrlSort(value);
  };
  const handleOpenDrawer = () => {
    if (!user) {
      router.push('/sign-in?returnUrl=/community');
      return;
    }
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full md:w-[65%] max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 rounded-lg border border-border">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Select
                value={sortOption}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full sm:w-[175px] h-9 shrink-0 bg-background text-xs">
                  <SelectValue placeholder="Sort / Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="posted_by_you">Posted by You</SelectItem>
                  <SelectItem value="posted_by_volunteers">Posted by Volunteers</SelectItem>
                  <SelectItem value="posted_by_relief_org">Posted by Relief Org</SelectItem>
                  <SelectItem value="posted_by_admin">Posted by Admin</SelectItem>
                </SelectContent>
              </Select>

              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                onSubmit={() => fetchPosts()}
                placeholder="Search community posts..."
                className="flex-1"
                inputClassName="w-full sm:w-full focus:w-full sm:focus:w-full"
              />
            </div>

            <Button
              onClick={handleOpenDrawer}
              size="default"
              className="shrink-0"
            >
              <Plus className="size-4" />
              <span>Make a post</span>
            </Button>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <div className="flex items-center gap-4 pt-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center space-y-3 rounded-lg border border-dashed border-border bg-card p-4">
                <MessageSquarePlus className="size-10 text-muted-foreground/60 mx-auto" />
                <h3 className="text-sm font-medium text-foreground">
                  No community posts found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? `No updates matching "${searchQuery}". Try a different keyword.`
                    : 'Be the first to share an update, field report, or emergency announcement.'}
                </p>
                <Button
                  onClick={handleOpenDrawer}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="size-3.5" />
                  Make a post
                </Button>
              </div>
            ) : (
              posts.map((post) => (
                <CommunityPostCard
                  key={post.postId}
                  post={post}
                  onPostUpdated={() => fetchPosts()}
                />
              ))
            )}
          </div>
        </div>
        <ListPagination page={page} totalPages={totalPages} onChange={setPage} loading={loading} />
      </main>

      <AddCommunityPostDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={() => fetchPosts()}
      />
    </div>
  );
};

export default CommunityPageContent;
