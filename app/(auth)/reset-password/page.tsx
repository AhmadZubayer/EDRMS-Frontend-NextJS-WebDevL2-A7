'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { publicApi } from '@/app/lib/public-api';
import { OtpShell, OtpField, useCountdown } from '@/components/auth/otp-shell';

const ResetPasswordContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { left, reset } = useCountdown(60);

  const resend = async () => {
    setError('');
    try {
      await publicApi.post('/auth/forgot-password', { email });
      setInfo('A new code has been sent.');
      reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not resend the code.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await publicApi.post('/auth/reset-password', { email, otp, newPassword: password });
      router.push('/sign-in');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OtpShell
      icon={<ShieldCheck className="size-7" />}
      title="Reset your password"
      subtitle={<>Enter the code sent to <span className="font-medium text-foreground">{email}</span></>}
      footer={
        left > 0 ? `Resend code in ${left}s` : (
          <button type="button" onClick={resend} className="font-medium text-primary hover:underline">Resend code</button>
        )
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <OtpField value={otp} onChange={setOtp} disabled={loading} />
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
        </div>
        {info && !error && <p className="text-sm text-emerald-600">{info}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full rounded-full" disabled={loading || otp.length !== 6 || !password}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Reset password'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/forgot-password" className="hover:underline">Use a different email</Link>
        </p>
      </form>
    </OtpShell>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
