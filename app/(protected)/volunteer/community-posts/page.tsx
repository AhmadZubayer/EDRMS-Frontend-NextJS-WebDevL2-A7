'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MuiModal from '@/components/mui-modal';
import { toast } from '@/components/ui/toast';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import EditProfileDrawer from '@/components/profile/edit-profile-drawer';
import { CommunityPost } from '@/components/community/types';
const AddCommunityPostDrawer = dynamic(() => import('@/components/community/add-community-post-drawer'), { ssr: false });
import DashboardFrame from '@/components/profile/dashboard-frame';
import ListPagination from '@/components/list-pagination';
import SearchBar from '@/components/searchbar';
import { useUserProfile } from '@/hooks/use-user-profile';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getApiErrorMessage } from '@/utils/api-error';
const formatTrashDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
const VolunteerCommunityPostsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading, error: profileError, refresh: refreshProfile } = useUserProfile();
  const [search, setSearch] = useState('');
  const list = usePaginatedList<CommunityPost>('/community-posts', {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined, authorId: user?.id },
  });
  const { items: myPosts, refresh: refreshList } = list;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [togglingSafety, setTogglingSafety] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [confirmTrashItem, setConfirmTrashItem] = useState<CommunityPost | null>(null);

  const fetchPageData = useCallback(
    () => Promise.all([refreshProfile(), refreshList()]),
    [refreshProfile, refreshList],
  );

  const handleToggleSafety = async () => {
    try {
      setTogglingSafety(true);
      await axiosSecure.patch('/users/is-safe');
      await fetchPageData();
    } catch (err) {
      toast.add({ id: 'safety-update-error', title: getApiErrorMessage(err, 'Failed to update safety status.'), type: 'error' });
    } finally {
      setTogglingSafety(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!confirmTrashItem) return;
    try {
      setActionInProgress('moving-to-trash');
      const url = `/community-posts/${confirmTrashItem.postId}`;
      await axiosSecure.delete(url);
      toast.add({
        id: `trash-success-${confirmTrashItem.postId}`,
        title: 'Item moved to trash.',
        type: 'success',
        timeout: 4000,
      });
      setConfirmTrashItem(null);
      await fetchPageData();
    } catch (err) {
      toast.add({
        id: 'trash-error',
        title: getApiErrorMessage(err, 'Failed to delete item'),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <>
      <DashboardFrame
        profile={profile}
        role="VOLUNTEER"
        tab="posts"
        loading={loading}
        togglingSafety={togglingSafety}
        onEdit={() => setIsEditOpen(true)}
        onToggleSafety={handleToggleSafety}
      >

        {profileError && <p role="alert" className="text-sm text-destructive">{profileError}</p>}
        <SearchBar value={search} onChange={setSearch} onSubmit={refreshList} placeholder="Search results..." />
        {list.error && <p role="alert" className="text-sm text-destructive">{list.error}</p>}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Your Community Posts</h3>
              <p className="text-xs text-muted-foreground">
                Discussions, field warnings, and informational updates you have posted.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreatePostOpen(true)}

            >
              <Plus className="size-4" />
              Create Post
            </Button>
          </div>

          {list.loading ? (<p role="status" className="py-6 text-sm text-muted-foreground">Loading results...</p>) : myPosts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center bg-card space-y-3">
              <MessageSquare className="size-8 text-muted-foreground/60 mx-auto" />
              <p className="text-xs text-muted-foreground">
                You have not created any community posts yet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Interactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myPosts.map((post) => (
                    <TableRow key={post.postId}>
                      <TableCell className="max-w-xs truncate">{post.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {post.CommunityResponse?.Reactions?.total || 0} reactions &bull; {post.CommunityResponse?.totalComments || 0} comments
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell >{formatTrashDate(post.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/community/${post.postId}`)}

                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setConfirmTrashItem(post);

                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <ListPagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} loading={list.loading} />
      </DashboardFrame>
      {profile && (
        <EditProfileDrawer
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          profile={profile}
          onSuccess={fetchPageData}
        />
      )}
      <AddCommunityPostDrawer
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
        onSuccess={fetchPageData}
      />
      <MuiModal
        open={!!confirmTrashItem}
        onClose={() => setConfirmTrashItem(null)}
        title="Move Item to Trash?"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTrashItem(null)}

            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleMoveToTrash}
              disabled={actionInProgress === 'moving-to-trash'}

            >
              <Trash2 className="size-3.5" />
              Move to Trash
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-medium text-foreground">
            {confirmTrashItem?.title}
          </span>
          ? This record will be moved to your Trash and can be restored within 30 days.
        </p>
      </MuiModal>
    </>
  );
};

export default VolunteerCommunityPostsPage;
