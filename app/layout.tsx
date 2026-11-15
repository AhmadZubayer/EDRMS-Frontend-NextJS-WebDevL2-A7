import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist_Mono, Google_Sans } from 'next/font/google';

import { AuthProvider } from '@/contexts/auth-provider';
import FontProvider from '@/components/font-provider';
import Footer from '@/components/footer';
import ChatbotUI from '@/components/lazy-chatbot';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';
const googleSans = Google_Sans({
  variable: '--font-google-sans',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Arial', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EDRMS',
  description: 'Emergency & Disaster Response Management System',
};

const RootLayout = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full">
        <FontProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster>
                <div className="flex min-h-screen flex-col">
                  <div className="flex-1">{children}</div>
                  <Footer />
                  <ChatbotUI />
                </div>
              </Toaster>
            </TooltipProvider>
          </AuthProvider>
        </FontProvider>
      </body>
    </html>
  );
};

export default RootLayout;
