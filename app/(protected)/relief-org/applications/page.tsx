'use client';

import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import EditProfileDrawer from '@/components/profile/edit-profile-drawer';
import DashboardFrame from '@/components/profile/dashboard-frame';
import ListPagination from '@/components/list-pagination';
import SearchBar from '@/components/searchbar';
import { useUserProfile } from '@/hooks/use-user-profile';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getApiErrorMessage } from '@/utils/api-error';
interface UserApplication {
  id: string;
  campaign_id: string;
  campaign_title: string | null;
  applicant_id: string;
  applicant_name: string | null;
  applicant_phone: string | null;
  reason: string;
  payout_details: string;
  proof_document_url?: string | null;
  status: string;
  approved_amount?: number | null;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

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
const ReliefOrgApplicationsPage = () => {
  const { user } = useAuth();

  const { profile, loading, error: profileError, refresh: refreshProfile } = useUserProfile();
  const [search, setSearch] = useState('');
  const list = usePaginatedList<UserApplication>('/donations/my-applications', {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined },
  });
  const { items: myApplications, refresh: refreshList } = list;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [togglingSafety, setTogglingSafety] = useState(false);

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
        tab="applications"
        loading={loading}
        togglingSafety={togglingSafety}
        onEdit={() => setIsEditOpen(true)}
        onToggleSafety={handleToggleSafety}
      >

        {profileError && <p role="alert" className="text-sm text-destructive">{profileError}</p>}
        <SearchBar value={search} onChange={setSearch} onSubmit={refreshList} placeholder="Search results..." />
        {list.error && <p role="alert" className="text-sm text-destructive">{list.error}</p>}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Your Financial Aid Applications</h3>
            <p className="text-xs text-muted-foreground">
              Status of emergency relief funds requested for rehabilitation.
            </p>
          </div>

          {list.loading ? (<p role="status" className="py-6 text-sm text-muted-foreground">Loading results...</p>) : myApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center bg-card space-y-3">
              <FileText className="size-8 text-muted-foreground/60 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No financial aid applications submitted.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Payout Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myApplications.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell >{a.campaign_title || 'Relief Campaign'}</TableCell>
                      <TableCell className="max-w-xs truncate">{a.reason}</TableCell>
                      <TableCell className="font-mono">{a.payout_details}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatTrashDate(a.created_at)}</TableCell>
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
    </>
  );
};

export default ReliefOrgApplicationsPage;
