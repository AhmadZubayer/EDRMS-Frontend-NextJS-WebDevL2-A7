'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { publicApi } from '@/app/lib/public-api';
import { useAuth } from '@/app/contexts/AuthProvider';
import { OtpShell, OtpField } from '@/components/auth/otp-shell';

const VerifyEmailContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { fetchCurrentUser } = useAuth();
  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6 || !email) return;
    setLoading(true);
    setError('');
    try {
      const res = await publicApi.post('/auth/verify-email', { email, otp });
      const token = res.data?.data?.accessToken;
      if (token) localStorage.setItem('access_token', token);
      await fetchCurrentUser();
      setDone(true);
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired code.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OtpShell
      icon={<MailCheck className="size-7" />}
      title={done ? 'Email verified' : 'Verify your email'}
      subtitle={
        done ? 'Welcome aboard! Redirecting you now...' : (
          <>We sent a 6-digit code to <span className="font-medium text-foreground">{email || 'your email'}</span></>
        )
      }
      footer={<>Wrong account? <Link href="/sign-up" className="font-medium text-primary hover:underline">Sign up again</Link></>}
    >
      {!done && (
        <form onSubmit={submit} className="space-y-5">
          {!params.get('email') && (
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
          <OtpField value={otp} onChange={setOtp} disabled={loading} />
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full rounded-full" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Verify & Continue'}
          </Button>
        </form>
      )}
    </OtpShell>
  );
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
