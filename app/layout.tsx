import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { AuthProvider } from '@/contexts/auth-provider';
import FontProvider from '@/components/font-provider';
import StyledRegistry from '@/components/styled-registry';
import Footer from '@/components/footer';
import ChatbotUI from '@/components/lazy-chatbot';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';
const geist = Geist({
  variable: '--font-geist-sans',
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
      className={`${geist.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full">
        <AppRouterCacheProvider>
          <StyledRegistry>
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
          </StyledRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
};

export default RootLayout;
