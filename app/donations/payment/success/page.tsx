'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Download } from 'lucide-react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { publicApi } from '@/lib/api';
import { generateDonationReceipt } from '@/utils/lazy-donation-receipt';

const PaymentSuccessContent = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const txId = searchParams.get('tx_id');
  const provider = searchParams.get('provider');
  const paymentRef = sessionId || searchParams.get('ref');
  const autoDownloadedRef = useRef(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (dataToUse?: any) => {
    const data = dataToUse || receiptData;
    if (!data) return;
    setDownloading(true);
    try {
      await generateDonationReceipt({
        receiptNo: data.transaction_id || txId || 'TXN-EDRMS',
        date: new Date(data.paid_at || Date.now()).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        receivedFrom: data.donor_name || (data.is_anonymous ? 'Anonymous Donor' : 'Valued Donor'),
        contact: data.donor_contact || (data.is_anonymous ? 'Anonymous' : 'N/A'),
        donationAmount: Number(data.amount || 0),
        paymentMethod: data.payment_gateway || (provider === 'bkash' ? 'BKASH' : 'STRIPE'),
        transactionId: data.transaction_id || txId || 'N/A',
        campaignTitle: data.campaign_title || 'Emergency Relief Fund',
        reliefOrg: data.relief_org || 'Emergency Disaster Response Management System',
      });
    } catch {
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!paymentRef) {
        setLoading(false);
        return;
      }

      let payload: any = null;
      for (let attempt = 0; attempt < 8 && !cancelled; attempt++) {
        try {
          const res = await publicApi.get('/payments/receipt', { params: { ref: paymentRef } });
          payload = res.data?.data || res.data;
          if (payload?.status === 'COMPLETED') break;
        } catch {
          payload = null;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (cancelled) return;
      setLoading(false);

      if (!payload) {
        setNotice('We could not load your receipt yet. Please try again shortly.');
        return;
      }

      setReceiptData(payload);

      if (payload.status !== 'COMPLETED') {
        setNotice('Your payment is still being confirmed. You can download the receipt once it completes.');
        return;
      }

      if (!autoDownloadedRef.current) {
        autoDownloadedRef.current = true;
        await handleDownload(payload);
        toast.add({
          title: 'Thank you for your contribution to the mankind.',
          description: 'Your donation receipt has been downloaded.',
          type: 'success',
          timeout: 8000,
        });
      }
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [paymentRef]);

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center max-w-md mx-auto my-16 bg-card border border-border rounded-lg space-y-4">
      <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <CheckCircle2 className="size-8" />
      </div>
      <h1 className="text-2xl font-medium tracking-tight text-foreground">
        Thank You for Your Donation!
      </h1>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Your payment has been successfully processed through {provider === 'bkash' ? 'bKash' : 'Stripe'}. Reference ID: <span className="font-mono font-medium break-all">{receiptData?.transaction_id || txId || 'N/A'}</span>.
      </p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
          <Spinner className="size-4" />
          <span>Verifying transaction and preparing your receipt...</span>
        </div>
      ) : (
        <>
        {notice && <p className="text-xs text-amber-600">{notice}</p>}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Button
            onClick={() => handleDownload()}
            disabled={downloading || !receiptData}
            className="w-full sm:w-auto"
          >
            {downloading ? <Spinner className="size-4" /> : <Download className="size-4" />}
            <span>Download Receipt</span>
          </Button>
          <Button
            variant="outline"
            render={<Link href="/donations" />}
            className="w-full sm:w-auto"
          >
            <span>Return to Donations</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
        </>
      )}
    </div>
  );
};

const PaymentSuccessPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto my-16 bg-card border border-border rounded-lg space-y-4">
              <Skeleton className="size-16" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          }
        >
          <PaymentSuccessContent />
        </Suspense>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;
