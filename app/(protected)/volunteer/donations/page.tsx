'use client';

import { useState, useCallback } from 'react';
import { Download, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import EditProfileDrawer from '@/components/profile/edit-profile-drawer';
import { generateDonationReceipt } from '@/utils/lazy-donation-receipt';
import DashboardFrame from '@/components/profile/dashboard-frame';
import ListPagination from '@/components/list-pagination';
import SearchBar from '@/components/searchbar';
import { useUserProfile } from '@/hooks/use-user-profile';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getApiErrorMessage } from '@/utils/api-error';
interface UserDonation {
  id: string;
  campaign_id: string;
  campaign_title: string;
  amount: number;
  payment_gateway: string;
  transaction_id: string;
  status: string;
  paid_at: string;
  created_at: string;
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
const VolunteerDonationsPage = () => {
  const { user } = useAuth();

  const { profile, loading, error: profileError, refresh: refreshProfile } = useUserProfile();
  const [search, setSearch] = useState('');
  const list = usePaginatedList<UserDonation>('/donations/my-donations', {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined },
  });
  const { items: myDonations, refresh: refreshList } = list;
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
        role="VOLUNTEER"
        tab="donations"
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
            <h3 className="text-sm font-medium">Your Donation Contributions</h3>
            <p className="text-xs text-muted-foreground">
              History of humanitarian aid funds contributed through your account.
            </p>
          </div>

          {list.loading ? (<p role="status" className="py-6 text-sm text-muted-foreground">Loading results...</p>) : myDonations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center bg-card space-y-3">
              <HeartHandshake className="size-8 text-muted-foreground/60 mx-auto" />
              <p className="text-xs text-muted-foreground">
                You have not made any donations yet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDonations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell >{d.campaign_title || 'Emergency Aid'}</TableCell>
                      <TableCell >${d.amount}</TableCell>
                      <TableCell className="uppercase">{d.payment_gateway}</TableCell>
                      <TableCell >{formatTrashDate(d.paid_at || d.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            generateDonationReceipt({
                              receiptNo: d.transaction_id || d.id,
                              date: formatTrashDate(d.paid_at || d.created_at),
                              receivedFrom: profile?.name || user?.name || 'Valued Donor',
                              contact: profile?.phone || user?.email || 'N/A',
                              donationAmount: Number(d.amount),
                              paymentMethod: d.payment_gateway,
                              transactionId: d.transaction_id || d.id,
                              campaignTitle: d.campaign_title || 'Emergency Relief Fund',
                              reliefOrg: 'Emergency Disaster Response Management System',
                            });
                          }}

                        >
                          <Download className="size-3.5" />
                          Receipt
                        </Button>
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
    </>
  );
};

export default VolunteerDonationsPage;
