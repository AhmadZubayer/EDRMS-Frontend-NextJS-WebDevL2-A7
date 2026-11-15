'use client';

import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { UsersRound } from 'lucide-react';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { toast } from '@/components/ui/toast';
import ListPagination from '@/components/list-pagination';
import SearchBar from '@/components/searchbar';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getApiErrorMessage } from '@/utils/api-error';
import OperationsDashboard, { LoadError } from './operations-dashboard';
import RegistrationNotice from './registration-notice';
import OpportunityCard from './opportunity-card';
import {
  OrganizationJoin,
  OrganizationOpportunity,
  VolunteerProfile,
} from './types';

export default function GroupBrowser({
  tab = 'groups',
}: {
  tab?: 'groups' | 'opportunities';
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [profileLoading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const groupList = usePaginatedList<OrganizationOpportunity>(ENDPOINTS.VOLUNTEERS.ORGANIZATION_REQUESTS, {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined },
  });
  const applicationList = usePaginatedList<OrganizationJoin>(ENDPOINTS.VOLUNTEERS.MY_ORGANIZATION_JOINS, {
    client: axiosSecure,
    enabled: Boolean(user),
    params: { searchTerm: search.trim() || undefined },
  });
  const { refresh: refreshGroups } = groupList;
  const { refresh: refreshApplications } = applicationList;
  const groups = groupList.items;
  const applications = applicationList.items;
  const loading = profileLoading || groupList.loading || applicationList.loading;
  const load = useCallback(() => {
    refreshGroups();
    refreshApplications();
    return Promise.all([
      axiosSecure.get(ENDPOINTS.VOLUNTEERS.ME).catch((error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }),
    ])
      .then(([profile]) => {
        setError('');
        setProfile(profile ? (profile.data?.data ?? profile.data) : null);
      })
      .catch((error: unknown) => {
        setError(
          getApiErrorMessage(
            error,
            'Unable to load volunteer groups. Please retry.',
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [refreshGroups, refreshApplications]);
  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const apply = async (id: string) => {
    setSubmitting(id);
    try {
      await axiosSecure.post(
        ENDPOINTS.VOLUNTEERS.JOIN_ORGANIZATION_REQUEST(id),
      );
      toast.add({
        id: 'group-applied',
        title: 'Application sent to the relief organization.',
        type: 'success',
      });
      await load();
    } catch (error) {
      toast.add({
        id: 'group-apply-error',
        title: getApiErrorMessage(error, 'Unable to submit your application.'),
        type: 'error',
      });
    } finally {
      setSubmitting(null);
    }
  };
  return (
    <OperationsDashboard role="VOLUNTEER" tab={tab}>
      <div className="space-y-5">
        <div>
          <h1 className="text-base font-semibold">
            {tab === 'groups'
              ? 'Volunteer Groups'
              : 'Relief Organization Opportunities'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore relief organization groups, apply to join, and track your
            application status.
          </p>
        </div>
        <SearchBar value={search} onChange={setSearch} onSubmit={load} placeholder="Search volunteer groups..." />
        {loading ? (
          <p role="status" className="py-8 text-sm text-muted-foreground">
            Loading volunteer groups...
          </p>
        ) : (error || groupList.error || applicationList.error) ? (
          <LoadError message={error || groupList.error || applicationList.error} retry={load} />
        ) : (
          <>
            <RegistrationNotice profile={profile} />
            {groups.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-card p-10 text-center space-y-3">
                <UsersRound className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm">No volunteer groups available yet.</p>
                <p className="text-xs text-muted-foreground">
                  Groups published by relief organizations will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {groups.map((group) => (
                  <OpportunityCard
                    key={group.id}
                    opportunity={group}
                    applicationStatus={group.application_status}
                    canApply={profile?.verification_status?.toLowerCase() === 'verified'}
                    joining={submitting === group.id}
                    onJoin={() => apply(group.id)}
                  />
                ))}
              </div>
            )}
            <ListPagination page={groupList.page} totalPages={groupList.totalPages} onChange={groupList.setPage} loading={groupList.loading} />
            <h2 className="text-sm font-semibold">Your applications</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {applications.map((application) => application.organization_request && (
                <OpportunityCard
                  key={application.id}
                  opportunity={application.organization_request}
                  applicationStatus={application.status}
                  canApply={false}
                  joining={false}
                  onJoin={() => {}}
                />
              ))}
            </div>
            {applications.length === 0 && <p className="text-sm text-muted-foreground">No matching applications.</p>}
            <ListPagination page={applicationList.page} totalPages={applicationList.totalPages} onChange={applicationList.setPage} loading={applicationList.loading} />
          </>
        )}
      </div>
    </OperationsDashboard>
  );
}
