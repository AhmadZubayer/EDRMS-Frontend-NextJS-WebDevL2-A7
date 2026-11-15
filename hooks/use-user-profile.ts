'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import useAuth from '@/hooks/use-auth';
import { axiosSecure } from '@/lib/api';
import { refreshApiData } from '@/lib/client-cache';
import type { UserProfileData } from '@/components/profile/edit-profile-drawer';
import { getApiErrorMessage } from '@/utils/api-error';

const fetchProfile = async () => {
  const response = await axiosSecure.get('/users/profile');
  return (response.data?.data ?? response.data) as UserProfileData;
};

export function useUserProfile() {
  const { user } = useAuth();
  const { data, error, mutate } = useSWR(
    user ? ['edrms', 'profile', user.id, user.role] : null,
    fetchProfile,
    { dedupingInterval: 10000, shouldRetryOnError: false },
  );
  const refresh = useCallback(() => refreshApiData(() => mutate()), [mutate]);
  return {
    profile: user ? data ?? null : null,
    loading: Boolean(user) && !data && !error,
    error: error ? getApiErrorMessage(error, 'Unable to load your profile.') : '',
    refresh,
  };
}
