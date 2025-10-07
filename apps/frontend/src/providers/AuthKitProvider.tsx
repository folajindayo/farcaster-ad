'use client'

import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  // AuthKit config according to official Farcaster docs
  // https://docs.farcaster.xyz/auth-kit/introduction
  const config = {
    rpcUrl: 'https://mainnet.optimism.io',
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3002',
    siweUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
    relay: 'https://relay.farcaster.xyz', // Official Farcaster relay server
  }

  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}

