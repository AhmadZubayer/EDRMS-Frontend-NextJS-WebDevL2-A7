'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { Plus, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import EditProfileDrawer from '@/components/profile/edit-profile-drawer';
import { DonationCampaign } from '@/components/donations/types';
const AddDonationDrawer = dynamic(() => import('@/components/donations/add-donation-drawer'), { ssr: false });
const CampaignProgressDrawer = dynamic(() => import('@/components/donations/campaign-progress-drawer'), { ssr: false });
import DashboardFrame from '@/components/profile/dashboard-frame';
import ListPagination from '@/components/list-pagination';
import SearchBar from '@/components/searchbar';
import { useUserProfile } from '@/hooks/use-user-profile';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getApiErrorMessage } from '@/utils/api-error';

const ReliefOrgManageDonationsPage = () => {
  const { user } = useAuth();

  const { profile, loading, error: profileError, refresh: refreshProfile } = useUserProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [togglingSafety, setTogglingSafety] = useState(false);
  const [search, setSearch] = useState('');
  const list = usePaginatedList<DonationCampaign>('/donations/campaigns', {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined },
  });
  const { items: campaigns, refresh: refreshList } = list;
  const [isDonationDrawerOpen, setIsDonationDrawerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);
  const [selectedProgressCampaign, setSelectedProgressCampaign] = useState<DonationCampaign | null>(null);
  const [isProgressDrawerOpen, setIsProgressDrawerOpen] = useState(false);

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

  return (
    <>
      <DashboardFrame
        profile={profile}
        role="RELIEF_ORG"
        tab="manage-donations"
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
              <h3 className="text-sm font-medium">Donation Campaigns Management</h3>
              <p className="text-xs text-muted-foreground">
                Track funds raised, disburse financial aid, and publish campaigns.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingCampaign(null);
                setIsDonationDrawerOpen(true);
              }}

            >
              <Plus className="size-4" />
              Create Campaign
            </Button>
          </div>

          {list.loading ? (<p role="status" className="py-6 text-sm text-muted-foreground">Loading results...</p>) : campaigns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center bg-card space-y-3">
              <HeartHandshake className="size-8 text-muted-foreground/60 mx-auto" />
              <p className="text-xs text-muted-foreground">No donation campaigns created.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Title</TableHead>
                    <TableHead>Raised / Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell >{c.title}</TableCell>
                      <TableCell >${c.raised_amount} / ${c.target_amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProgressCampaign(c);
                              setIsProgressDrawerOpen(true);
                            }}

                          >
                            Progress
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCampaign(c);
                              setIsDonationDrawerOpen(true);
                            }}

                          >
                            Edit
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
      <AddDonationDrawer
        open={isDonationDrawerOpen}
        onOpenChange={setIsDonationDrawerOpen}
        onSuccess={fetchPageData}
        editCampaign={editingCampaign}
      />
      <CampaignProgressDrawer
        key={selectedProgressCampaign?.id}
        campaign={selectedProgressCampaign}
        open={isProgressDrawerOpen}
        onClose={() => setIsProgressDrawerOpen(false)}
        onCampaignUpdated={fetchPageData}
      />
    </>
  );
};

export default ReliefOrgManageDonationsPage;
