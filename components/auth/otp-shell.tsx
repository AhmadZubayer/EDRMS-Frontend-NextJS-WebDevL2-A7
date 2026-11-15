'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

type OtpShellProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const OtpShell = ({ icon, title, subtitle, children, footer }: OtpShellProps) => (
  <Card className="w-full max-w-md overflow-hidden rounded-2xl border-white/20 bg-background/85 shadow-2xl backdrop-blur-xl">
    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-rose-500 to-amber-400" />
    <CardContent className="space-y-6 p-8">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/30">
            {icon}
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </CardContent>
  </Card>
);

export const OtpField = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex justify-center">
    <InputOTP maxLength={6} value={value} onChange={onChange} disabled={disabled} pattern={REGEXP_ONLY_DIGITS} autoFocus>
      <InputOTPGroup>
        <InputOTPSlot index={0} className="size-12 text-lg" />
        <InputOTPSlot index={1} className="size-12 text-lg" />
        <InputOTPSlot index={2} className="size-12 text-lg" />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} className="size-12 text-lg" />
        <InputOTPSlot index={4} className="size-12 text-lg" />
        <InputOTPSlot index={5} className="size-12 text-lg" />
      </InputOTPGroup>
    </InputOTP>
  </div>
);

export const useCountdown = (seconds: number) => {
  const [left, setLeft] = React.useState(seconds);
  React.useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, reset: () => setLeft(seconds) };
};
