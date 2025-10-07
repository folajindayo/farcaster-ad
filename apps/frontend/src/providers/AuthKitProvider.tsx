'use client'

import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'

export default function AuthKitProvider({ children }: { children: React.ReactNode }) {
  // Get the current domain (works in both dev and production)
  const isDev = process.env.NODE_ENV === 'development'
  const domain = isDev ? 'localhost:3002' : (process.env.NEXT_PUBLIC_DOMAIN || 'farcaster-ad-rental.vercel.app')
  
  const config = {
    // RPC URL for Optimism (where Farcaster data lives)
    // Use a proper RPC provider (Alchemy/Infura) in production for reliability
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.optimism.io',
    
    // Your app's domain - used to prevent phishing attacks
    domain: domain,
    
    // SIWE URI - where the authentication message says it's from
    // Should match your domain for security
    siweUri: isDev ? 'http://localhost:3002' : `https://${domain}`,
  }

  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  )
}

