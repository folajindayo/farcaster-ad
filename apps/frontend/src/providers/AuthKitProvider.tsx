'use client'

import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  const config = {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.optimism.io',
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'farcaster-ad-rental.vercel.app',
    siweUri: process.env.NEXT_PUBLIC_SIWE_URI || 'http://localhost:3002',
  }

  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}

