'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FarcasterAuth from './FarcasterAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-cyber-300 text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <FarcasterAuth 
            onSuccess={(userData) => {
              setIsAuthenticated(true)
              router.push('/dashboard')
            }} 
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

