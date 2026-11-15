'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { publicApi } from '@/app/lib/public-api';
import { OtpShell } from '@/components/auth/otp-shell';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await publicApi.post('/auth/forgot-password', { email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OtpShell
      icon={<KeyRound className="size-7" />}
      title="Forgot password?"
      subtitle="Enter your email and we will send you a 6-digit reset code."
      footer={<>Remembered it? <Link href="/sign-in" className="font-medium text-primary hover:underline">Back to sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-11 w-full rounded-full" disabled={loading || !email}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset code'}
        </Button>
      </form>
    </OtpShell>
  );
}
