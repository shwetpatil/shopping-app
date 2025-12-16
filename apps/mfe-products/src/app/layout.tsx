import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '../lib/query-provider';
import { ErrorBoundary } from '../components/error-boundary';
import { WebVitals } from '../components/web-vitals';
import { WishlistProvider } from '../contexts/wishlist-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Products MFE',
  description: 'Products microfrontend with React Query',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <WishlistProvider>
              <WebVitals />
              {children}
            </WishlistProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
