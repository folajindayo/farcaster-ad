import type { Metadata } from 'next';
import './globals.css';
import AuthKitProvider from '@/providers/AuthKitProvider';

export const metadata: Metadata = {
  title: 'Farcaster Ad Rental - Advertiser Dashboard',
  description: 'Decentralized advertising platform for Farcaster - Cyberpunk Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-cyber-100 antialiased">
        <AuthKitProvider>
          {children}
        </AuthKitProvider>
      </body>
    </html>
  );
}
