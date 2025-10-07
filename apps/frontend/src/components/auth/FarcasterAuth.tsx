'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { SignInButton, useProfile } from '@farcaster/auth-kit'

interface FarcasterAuthProps {
  onSuccess?: (userData: any) => void
}

export default function FarcasterAuth({ onSuccess }: FarcasterAuthProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated, profile } = useProfile()

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

  // Handle successful Farcaster authentication
  const handleSuccess = useCallback(async (res: any) => {
    try {
      setError(null)

      // The response contains the user's Farcaster profile and signature
      const { fid, username, displayName, pfpUrl, custody, verifications } = res.profile
      const { message, signature } = res

      // Verify signature with our backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          signature,
          fid,
          username,
          displayName,
          pfpUrl,
          custody,
          verifications
        })
      })
      
      const authData = await verifyResponse.json()
      
      if (!verifyResponse.ok) {
        throw new Error(authData.message || 'Authentication failed')
      }
      
      // Store token and user data
      localStorage.setItem('token', authData.token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      // Call onSuccess or redirect
      if (onSuccess) {
        onSuccess(authData.user)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Farcaster auth error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }, [onSuccess, router])

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
      <CardFooter className="w-full">
        <div className="w-full">
          <SignInButton
            onSuccess={handleSuccess}
            onError={(err) => setError(err?.message || 'Authentication failed')}
            onSignOut={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
            }}
          />
        </div>
      </CardFooter>
    </Card>
  )
}


