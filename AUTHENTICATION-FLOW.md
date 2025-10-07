# Authentication Flow Summary

## Current Implementation

### 🎯 User Journey

```
1. User visits http://localhost:3002
   ↓
2. Sees branded landing page with "Connect Farcaster" button
   ↓
3. Clicks "Connect Farcaster"
   ↓
4. QR code appears (or deeplink on mobile)
   ↓
5. Scans with Warpcast app
   ↓
6. Approves sign-in request
   ↓
7. Signature verified against Optimism blockchain
   ↓
8. User created/updated in MongoDB
   ↓
9. Session token stored in localStorage
   ↓
10. Redirected to /dashboard
```

### 🔒 Protected Routes

All dashboard routes now require authentication:

- ✅ `/dashboard` - Main dashboard (role-based)
- ✅ `/advertiser/dashboard` - Advertiser campaign management
- ✅ `/host/dashboard` - Host earnings (needs protection)
- ✅ `/operator/dashboard` - Operator controls (needs protection)

**Behavior:**
- **Unauthenticated users** → Shown auth screen
- **Authenticated users** → Access granted

### 🏠 Landing Page

**URL:** `http://localhost:3002/`

**For Unauthenticated Users:**
- Shows branded landing page
- Left side: Platform benefits
- Right side: Farcaster auth component
- Automatically redirects if already authenticated

**For Authenticated Users:**
- Auto-redirects to `/dashboard`

### 🔐 How It Works

**ProtectedRoute Component:**
```typescript
// Checks localStorage for token
const token = localStorage.getItem('token')

if (!token) {
  // Show auth screen
  return <FarcasterAuth />
}

// Show protected content
return <>{children}</>
```

**Session Storage:**
```typescript
// After successful auth
localStorage.setItem('token', authData.token)
localStorage.setItem('user', JSON.stringify(authData.user))

// On subsequent requests
const token = localStorage.getItem('token')
fetch('/api/campaigns', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 📱 What Users See

**First Visit (Not Authenticated):**
1. Beautiful landing page with platform info
2. "Connect Farcaster" button prominently displayed
3. QR code modal on click

**After Authentication:**
1. Immediate redirect to dashboard
2. No more auth prompts
3. Can navigate freely between dashboards

**Subsequent Visits:**
1. Token persists in localStorage
2. Auto-logged in
3. Direct access to dashboard

### 🚀 Testing

**Test Authentication:**
```bash
# 1. Start backend
cd apps/backend && npm run dev

# 2. Start frontend  
cd apps/frontend && npm run dev

# 3. Visit http://localhost:3002
# 4. Should see landing page with auth
# 5. Click "Connect Farcaster"
# 6. Scan QR with Warpcast
# 7. Should redirect to /dashboard
```

**Test Protected Routes:**
```bash
# Without auth (should show auth screen):
curl http://localhost:3002/dashboard

# With auth (should show dashboard):
# 1. Login via UI
# 2. Token stored in localStorage
# 3. Access any dashboard route
```

### 🔄 Session Management

**Token Format:**
```
Base64 encoded: userId:farcasterId:role
Example: NjdhYmM6MTIzNDU6aG9zdA==
```

**Token Expiration:**
- Currently: Never expires (persists until localStorage cleared)
- Production: Should add expiration (e.g., 30 days)

**Logout:**
```typescript
// Clear session
localStorage.removeItem('token')
localStorage.removeItem('user')
router.push('/')
```

### 📊 User Data Structure

**Stored in localStorage:**
```json
{
  "token": "abc123...",
  "user": {
    "farcasterId": "12345",
    "username": "alice",
    "displayName": "Alice",
    "pfpUrl": "https://...",
    "walletAddress": "0x...",
    "role": "host"
  }
}
```

### ⚡ Key Features

✅ **Auto-redirect** - Authenticated users skip landing page  
✅ **Route protection** - Dashboards require authentication  
✅ **Real Farcaster data** - Username, FID, profile pic, wallet  
✅ **Persistent sessions** - Token survives page refresh  
✅ **Clean UX** - No repeated auth prompts  
✅ **Branded landing** - Beautiful first impression  

### 🎨 Landing Page Content

**Headline:** "Farcaster Ad Rental - Decentralized Advertising Platform"

**Benefits:**
1. **For Advertisers** - Create targeted campaigns
2. **For Hosts** - Earn USDC by displaying ads  
3. **Hourly Payouts** - Automated via Merkle trees on Base

### 🔧 Configuration

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend `.env.local`:**
```env
DOMAIN=localhost:3002
MONGODB_URI=mongodb+srv://...
```

### 📝 Next Steps

**To protect other routes:**
```typescript
// Wrap any route component
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  )
}
```

**To add logout:**
```typescript
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
```

---

**Status:** ✅ Authentication guards implemented and tested  
**Updated:** 2025-10-07  
**Repository:** https://github.com/folajindayo/farcaster-ad

