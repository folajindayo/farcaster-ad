'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface FarcasterAuthProps {
  onSuccess?: (userData: any) => void
}

export default function FarcasterAuth({ onSuccess }: FarcasterAuthProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (token && user) {
      // User is already authenticated
      if (onSuccess) {
        onSuccess(JSON.parse(user))
      } else {
        router.push('/dashboard')
      }
    }
  }, [onSuccess, router])

  const handleFarcasterSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      // Step 1: Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce')
      const { nonce } = await nonceResponse.json()

      // Step 2: Request Farcaster signature
      // In a real app, this would use the Farcaster SDK
      // For now, we'll simulate this with a mock
      const message = `Sign in to Farcaster Ad Rental with nonce: ${nonce}`
      
      // Simulate Farcaster signature (in real app, this would use the SDK)
      const mockSignature = 'mock_signature_' + Math.random().toString(36).substring(2, 15)
      const mockFid = 123456 // Mock Farcaster ID
      
      // Step 3: Verify signature with our backend
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          signature: mockSignature,
          fid: mockFid
        })
      })
      
      const authData = await verifyResponse.json()
      
      if (!verifyResponse.ok) {
        throw new Error(authData.message || 'Authentication failed')
      }
      
      // Step 4: Store token and user data
      localStorage.setItem('token', authData.token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      // Step 5: Call onSuccess or redirect
      if (onSuccess) {
        onSuccess(authData.user)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Farcaster auth error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-xl text-white">Sign in with Farcaster</CardTitle>
        <CardDescription className="text-neutral-400">
          Connect your Farcaster account to access the Ad Rental platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-neutral-300">
            Sign in with your Farcaster account to:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
            <li>Create and manage ad campaigns as an advertiser</li>
            <li>Earn USDC by displaying ads on your profile as a host</li>
            <li>Track performance metrics in real-time</li>
          </ul>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleFarcasterSignIn} 
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
        >
          {loading ? 'Connecting...' : 'Connect Farcaster'}
        </Button>
      </CardFooter>
    </Card>
  )
}


