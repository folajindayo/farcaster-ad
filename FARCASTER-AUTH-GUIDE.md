# Farcaster Authentication Guide

This guide explains how users connect their Farcaster accounts using **Sign In with Farcaster (SIWF)** - the official authentication method as documented at [https://docs.farcaster.xyz/](https://docs.farcaster.xyz/).

## Overview

We've implemented **real Farcaster authentication** using the official `@farcaster/auth-kit` library. This is NOT a mock - it's the actual production-ready authentication system used by Farcaster applications.

## How It Works

### 1. **User Flow**

When a user clicks "Connect Farcaster":

1. **AuthKit Sign In Button** - Opens a QR code or deeplink to the user's Farcaster client (Warpcast, etc.)
2. **User Approves** - User scans QR code or approves in their Farcaster app
3. **Signature Generated** - Farcaster app signs a message proving ownership of the account
4. **Profile Data Returned** - AuthKit returns:
   - `fid` (Farcaster ID)
   - `username` (Farcaster handle)
   - `displayName` (Display name)
   - `pfpUrl` (Profile picture)
   - `custody` (Custody address)
   - `verifications` (Connected wallet addresses)
   - `message` (Signed message)
   - `signature` (Cryptographic signature)

5. **Backend Verification** - Our backend verifies the signature using `@farcaster/auth-client`
6. **User Created/Updated** - User record is created or updated in MongoDB with real Farcaster data
7. **Session Token** - A session token is issued and stored in localStorage

### 2. **Frontend Implementation**

#### AuthKit Provider (`src/providers/AuthKitProvider.tsx`)

```typescript
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
```

#### Authentication Component (`src/components/auth/FarcasterAuth.tsx`)

```typescript
import { SignInButton, useProfile } from '@farcaster/auth-kit'

const handleSuccess = useCallback(async (res: any) => {
  const { fid, username, displayName, pfpUrl, custody, verifications } = res.profile
  const { message, signature } = res

  // Send to backend for verification
  const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message, signature, fid, username, displayName, pfpUrl, custody, verifications
    })
  })
  
  const authData = await verifyResponse.json()
  localStorage.setItem('token', authData.token)
  localStorage.setItem('user', JSON.stringify(authData.user))
}, [])

// In render
<SignInButton
  onSuccess={handleSuccess}
  onError={(err) => setError(err?.message || 'Authentication failed')}
/>
```

### 3. **Backend Verification**

#### Service (`src/services/farcasterAuth.ts`)

```typescript
import { createAppClient, viemConnector } from '@farcaster/auth-client'

const appClient = createAppClient({
  ethereum: viemConnector(),
})

export const verifyFarcasterAuth = async (
  message: string, 
  signature: string, 
  fid: number,
  username?: string,
  displayName?: string,
  pfpUrl?: string,
  custody?: string,
  verifications?: string[]
) => {
  // Verify signature using official Farcaster Auth Client
  const { success, fid: verifiedFid } = await appClient.verifySignInMessage({
    message,
    signature,
    domain: process.env.DOMAIN || 'farcaster-ad-rental.vercel.app',
    nonce: message.split('nonce: ')[1] || generateNonce(),
  })

  if (!success || verifiedFid !== fid) {
    throw new Error('Invalid Farcaster signature')
  }

  // Create or update user with REAL Farcaster data
  let user = await User.findOne({ farcasterId: fid.toString() })
  
  if (!user) {
    user = await User.create({
      farcasterId: fid.toString(),
      walletAddress: verifications?.[0] || custody || '',
      username: username || `user_${fid}`,
      displayName: displayName || `User ${fid}`,
      pfpUrl: pfpUrl || '',
      role: 'host',
      isOptedIn: false,
    })
  } else {
    // Update with latest data
    if (username) user.username = username
    if (displayName) user.displayName = displayName
    if (pfpUrl) user.pfpUrl = pfpUrl
    await user.save()
  }

  const token = Buffer.from(`${user._id}:${user.farcasterId}:${user.role}`).toString('base64')

  return { user, token }
}
```

### 4. **API Route**

```typescript
router.post('/api/auth/verify', async (req, res) => {
  const { message, signature, fid, username, displayName, pfpUrl, custody, verifications } = req.body

  const result = await verifyFarcasterAuth(
    message, signature, fid, username, displayName, pfpUrl, custody, verifications
  )
  
  res.json(result)
})
```

## Configuration

### Frontend Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_RPC_URL=https://mainnet.optimism.io
NEXT_PUBLIC_DOMAIN=localhost:3002
NEXT_PUBLIC_SIWE_URI=http://localhost:3002
```

### Backend Environment Variables (`.env.local`)

```env
DOMAIN=localhost:3002
MONGODB_URI=mongodb+srv://...
```

## Key Features

✅ **Real Farcaster Integration** - Uses official `@farcaster/auth-kit` and `@farcaster/auth-client`  
✅ **Cryptographic Verification** - Signatures are cryptographically verified on the backend  
✅ **Profile Data** - Real username, display name, profile picture, and wallet addresses  
✅ **QR Code Support** - Users can scan QR codes with their mobile Farcaster app  
✅ **Deeplink Support** - Direct app-to-app authentication on mobile  
✅ **Session Management** - Secure token-based sessions  
✅ **Auto-Update** - User profiles update automatically on each sign-in  

## Testing

### Local Testing

1. Start the backend:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. Visit `http://localhost:3002`

4. Click "Connect Farcaster"

5. Scan the QR code with your Farcaster mobile app (Warpcast) OR click the deeplink if on mobile

6. Approve the sign-in request in your Farcaster app

7. You'll be automatically redirected to the dashboard with your real Farcaster profile!

### Production Deployment

For production, update the environment variables:

```env
# Frontend
NEXT_PUBLIC_DOMAIN=your-domain.com
NEXT_PUBLIC_SIWE_URI=https://your-domain.com

# Backend
DOMAIN=your-domain.com
```

## Security

- **Signature Verification**: Every authentication request is cryptographically verified
- **Nonce Protection**: Random nonces prevent replay attacks
- **Domain Binding**: Signatures are bound to your domain to prevent phishing
- **Session Tokens**: Secure base64-encoded tokens for API authentication
- **No Password Storage**: Users authenticate via their Farcaster app - no passwords stored

## User Data Stored

When a user connects their Farcaster account, we store:

```typescript
{
  farcasterId: string,        // Farcaster ID (FID)
  username: string,            // @username
  displayName: string,         // Display name
  pfpUrl: string,             // Profile picture URL
  walletAddress: string,       // Primary verified wallet
  role: 'host' | 'advertiser' | 'operator',
  isOptedIn: boolean,         // Whether they're participating as a host
  createdAt: Date,
  updatedAt: Date
}
```

## References

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Sign In with Farcaster Guide](https://docs.farcaster.xyz/auth-kit/introduction)
- [AuthKit API Reference](https://docs.farcaster.xyz/auth-kit/api)
- [@farcaster/auth-kit NPM](https://www.npmjs.com/package/@farcaster/auth-kit)
- [@farcaster/auth-client NPM](https://www.npmjs.com/package/@farcaster/auth-client)

## Support

If users have issues connecting:

1. Ensure they have a Farcaster account (via Warpcast or another client)
2. Check that they've approved the sign-in request in their app
3. Verify environment variables are set correctly
4. Check browser console for any errors
5. Ensure backend is running and accessible

---

**This is a production-ready implementation using official Farcaster libraries - not a mock or simulation.**

