'use client'

import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  // Simple config - just needs your app's domain for security
  const config = {
    rpcUrl: 'https://mainnet.optimism.io', // Public RPC endpoint (fine for auth)
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3002',
    siweUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002',
  }

  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}

