'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FarcasterAuth from '@/components/auth/FarcasterAuth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        router.push('/dashboard')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyber-400 via-cyber-300 to-cyber-500 bg-clip-text text-transparent">
              Farcaster Ad Rental
            </h1>
            <p className="text-xl text-cyber-200">
              Decentralized Advertising Platform
            </p>
          </div>
          
          <div className="space-y-4 text-cyber-300">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyber-400 rounded-full mt-2"></div>
              <div>
                <h3 className="text-cyber-100 font-semibold mb-1">For Advertisers</h3>
                <p className="text-sm">Create targeted campaigns and reach Farcaster users</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyber-400 rounded-full mt-2"></div>
              <div>
                <h3 className="text-cyber-100 font-semibold mb-1">For Hosts</h3>
                <p className="text-sm">Earn USDC by displaying ads on your profile</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyber-400 rounded-full mt-2"></div>
              <div>
                <h3 className="text-cyber-100 font-semibold mb-1">Hourly Payouts</h3>
                <p className="text-sm">Automated settlements via Merkle trees on Base</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth */}
        <div className="flex justify-center">
          <FarcasterAuth />
        </div>
      </div>
    </div>
  )
}
