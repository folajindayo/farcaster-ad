# Troubleshooting Farcaster Authentication

## Error: "Sign in with Farcaster is Unavailable"

### Possible Causes & Fixes

#### 1. **Missing Relay Server Configuration**

**Fix Applied:** Added official Farcaster relay server

```typescript
const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: window.location.host,
  siweUri: window.location.origin,
  relay: 'https://relay.farcaster.xyz', // ✅ Added this
}
```

#### 2. **Network/CORS Issues**

**Check:**
- Open browser DevTools (F12) → Console
- Look for CORS or network errors
- Verify you can reach: https://relay.farcaster.xyz

**If CORS errors appear:**
```bash
# The relay server might be down or blocking requests
# Check status: https://status.farcaster.xyz
```

#### 3. **RPC Endpoint Issues**

**Current:** Using public Optimism endpoint  
**Issue:** Public endpoints can be slow/rate-limited

**Alternative RPC URLs:**
```typescript
// Option 1: Alchemy (recommended for production)
rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY'

// Option 2: QuickNode
rpcUrl: 'https://YOUR-ENDPOINT.optimism.quiknode.pro/YOUR-KEY'

// Option 3: Infura
rpcUrl: 'https://optimism-mainnet.infura.io/v3/YOUR_KEY'
```

#### 4. **Package Version Compatibility**

**Current Version:** `@farcaster/auth-kit@0.8.1`

**If issues persist, try:**
```bash
cd apps/frontend
yarn remove @farcaster/auth-kit
yarn add @farcaster/auth-kit@latest
```

#### 5. **Browser Console Errors**

**Check for:**
```
❌ Failed to fetch relay configuration
❌ CORS policy blocked
❌ Network request failed
❌ Invalid domain configuration
```

**Debug Steps:**
1. Open DevTools (F12)
2. Go to Console tab
3. Refresh the page
4. Click "Connect Farcaster"
5. Look for red error messages

### Quick Fixes

#### Fix 1: Clear Cache and Rebuild
```bash
# Stop frontend
lsof -ti:3002 | xargs kill -9

# Clear Next.js cache
cd apps/frontend
rm -rf .next

# Rebuild
npm run dev
```

#### Fix 2: Check Environment Variables
```bash
# Frontend .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Backend .env.local
DOMAIN=localhost:3002
```

#### Fix 3: Verify Localhost Setup
```bash
# Make sure both services are running:
# Backend on 3001
curl http://localhost:3001/health

# Frontend on 3002
curl http://localhost:3002
```

### Alternative: Direct API Integration (Fallback)

If AuthKit continues to fail, you can use the lower-level API:

```typescript
import { createAppClient, viemConnector } from '@farcaster/auth-client'

const appClient = createAppClient({
  ethereum: viemConnector(),
  relay: 'https://relay.farcaster.xyz',
})

// Generate auth URL
const authUrl = await appClient.createChannel({
  siweUri: 'http://localhost:3002',
  domain: 'localhost:3002',
})

// Redirect user to authUrl or show QR code
```

### Check Farcaster Service Status

🔗 **Status Page:** https://status.farcaster.xyz  
🔗 **Docs:** https://docs.farcaster.xyz/auth-kit/introduction  
🔗 **GitHub Issues:** https://github.com/farcasterxyz/auth-monorepo/issues

### Common Issues from Farcaster Community

#### Issue: "Relay server unreachable"
**Solution:** The relay server might be temporarily down. Check https://status.farcaster.xyz

#### Issue: "Domain mismatch"
**Solution:** Make sure `domain` in config matches your actual URL
```typescript
// Development
domain: 'localhost:3002'

// Production  
domain: 'your-app.vercel.app'
```

#### Issue: "RPC rate limited"
**Solution:** Use a dedicated RPC provider (Alchemy/QuickNode) instead of public endpoint

### Test Authentication

**Step-by-step test:**
```bash
# 1. Start backend
cd apps/backend && npm run dev

# 2. Start frontend (new terminal)
cd apps/frontend && npm run dev

# 3. Open browser
open http://localhost:3002

# 4. Open DevTools (F12) → Console

# 5. Click "Connect Farcaster"

# 6. Check console for errors

# Expected: QR code should appear
# If error: Copy error message and check against this guide
```

### Still Not Working?

**Collect Debug Info:**
1. Browser console screenshot
2. Network tab → Filter by "farcaster" or "relay"
3. Full error message
4. OS and browser version

**Report Issue:**
- Farcaster Discord: https://warpcast.com/~/channel/dev
- GitHub: https://github.com/farcasterxyz/auth-monorepo/issues

### Workaround: Mock Auth for Development

If you need to continue development while debugging:

```typescript
// Temporary mock auth (development only!)
const handleMockLogin = () => {
  const mockUser = {
    farcasterId: '12345',
    username: 'testuser',
    displayName: 'Test User',
    pfpUrl: '',
    walletAddress: '0x1234...',
    role: 'advertiser'
  }
  
  localStorage.setItem('token', btoa('mock-token-12345'))
  localStorage.setItem('user', JSON.stringify(mockUser))
  router.push('/dashboard')
}
```

**⚠️ Remove before production!**

---

## Current Configuration

**AuthKitProvider:**
```typescript
{
  rpcUrl: 'https://mainnet.optimism.io',
  domain: window.location.host,
  siweUri: window.location.origin,
  relay: 'https://relay.farcaster.xyz'
}
```

**Expected Behavior:**
1. User clicks "Connect Farcaster"
2. QR code modal appears
3. User scans with Warpcast
4. Approval flow in Warpcast app
5. Redirect to dashboard

**If stuck at step 2:** Issue with relay server or network
**If stuck at step 4:** Issue with signature verification

---

**Last Updated:** 2025-10-07  
**AuthKit Version:** 0.8.1  
**References:** [Farcaster Docs](https://docs.farcaster.xyz/)

