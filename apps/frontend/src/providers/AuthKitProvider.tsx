'use client'

import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  // Configuration for Farcaster AuthKit
  const config = {
    rpcUrl: 'https://mainnet.optimism.io',
    domain: 'localhost:3002',
    siweUri: 'http://localhost:3002',
  }

  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}

