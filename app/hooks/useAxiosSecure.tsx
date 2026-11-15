'use client';

import { axiosSecure } from '@/lib/api';
export { axiosSecure };
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

const useAxiosSecure = () => {
  const { user, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const resInterceptor = axiosSecure.interceptors.response.use(
      (response) => response,
      async (error) => {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          await logOut();
          router.push('/sign-in');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosSecure.interceptors.response.eject(resInterceptor);
    };
  }, [user, logOut, router]);

  return axiosSecure;
};

export default useAxiosSecure;
