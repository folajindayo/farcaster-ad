# Quick Fix: "Sign in with Farcaster is Unavailable"

## Common Causes & Solutions

### 1. **Browser Cache Issue** (Most Common)

**Symptom:** Button shows "Sign in" but is disabled with tooltip "unavailable"

**Fix:**
```bash
# Hard refresh your browser
- Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Firefox: Ctrl+F5
- Safari: Cmd+Option+R

# Or use incognito/private mode
- Chrome: Ctrl+Shift+N (Cmd+Shift+N on Mac)
- Firefox: Ctrl+Shift+P
```

### 2. **Frontend Cache Issue**

**Fix:**
```bash
# Kill frontend
lsof -ti:3002 | xargs kill -9

# Clear Next.js cache
cd apps/frontend
rm -rf .next

# Restart
npm run dev
```

### 3. **Check Browser Console**

**Open DevTools (F12) and look for:**

❌ **Error: "Failed to fetch relay configuration"**
- Relay server might be down
- Check: https://status.farcaster.xyz

❌ **Error: "CORS policy blocked"**
- Network/firewall blocking relay server
- Try different network or VPN

❌ **Error: "window is not defined"**
- SSR issue - AuthKitProvider needs `typeof window !== 'undefined'` checks
- Already fixed in our code

### 4. **Verify Services Are Running**

```bash
# Check backend
curl http://localhost:3001/health
# Should return: {"status":"ok",...}

# Check frontend
curl http://localhost:3002
# Should return HTML with "Sign in"
```

### 5. **Check Environment Variables**

```bash
# Frontend .env.local should have:
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Backend .env.local should have:
DOMAIN=localhost:3002
MONGODB_URI=mongodb+srv://...
```

### 6. **Verify AuthKit Configuration**

The config should auto-detect your domain:

```typescript
// apps/frontend/src/providers/AuthKitProvider.tsx
{
  rpcUrl: 'https://mainnet.optimism.io',
  domain: window.location.host,  // Auto-detects
  siweUri: window.location.origin, // Auto-detects  
  relay: 'https://relay.farcaster.xyz' // Required!
}
```

### 7. **Test Relay Server**

```bash
# Should return 404 (relay doesn't have a root page - this is normal)
curl https://relay.farcaster.xyz
```

### 8. **Nuclear Option: Full Restart**

```bash
# Kill everything
lsof -ti:3000,3001,3002 | xargs kill -9

# Clear all caches
cd /Users/mac/farcaster-ad-rental
rm -rf apps/frontend/.next
rm -rf apps/backend/dist

# Restart backend (Terminal 1)
cd apps/backend
npm run dev

# Restart frontend (Terminal 2)
cd apps/frontend
npm run dev

# Visit in INCOGNITO/PRIVATE mode
open -na "Google Chrome" --args --incognito http://localhost:3002
```

## Debug Checklist

Run these in order:

```bash
# 1. Check services
✓ Backend running?  curl http://localhost:3001/health
✓ Frontend running? curl http://localhost:3002

# 2. Check browser console (F12)
✓ Any red errors?
✓ Any CORS errors?
✓ Network tab shows failed requests?

# 3. Check relay server
✓ https://status.farcaster.xyz - All green?

# 4. Try incognito mode
✓ Does it work in private/incognito window?
```

## What You Should See (Working)

**In Browser:**
1. Visit http://localhost:3002
2. See landing page with Farcaster sign-in button
3. Button is **enabled** (not grayed out)
4. Click button → QR code modal appears

**In Console (F12):**
```
No errors!
When you click, might see:
- AuthKit logs (normal)
- No "unavailable" or "failed" messages
```

## Still Not Working?

### Collect Debug Info:

1. **Screenshot of browser console** (F12 → Console tab)
2. **Screenshot of Network tab** (F12 → Network → Filter: "farcaster" or "relay")
3. **Browser and OS version**
4. **Output of:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002 | grep "Sign in"
   ```

### Quick Test: Mock Login

If you need to continue development while debugging, use this temporary mock:

```typescript
// In FarcasterAuth.tsx, add this button temporarily:
<Button onClick={() => {
  const mockUser = {
    farcasterId: '798992',
    username: 'folajindayo',
    displayName: 'folajindayo.base.eth',
    role: 'advertiser'
  }
  localStorage.setItem('token', btoa('mock-token'))
  localStorage.setItem('user', JSON.stringify(mockUser))
  router.push('/dashboard')
}}>
  MOCK LOGIN (DEV ONLY)
</Button>
```

**⚠️ REMOVE BEFORE PRODUCTION!**

## Most Likely Fix

**99% of the time, it's browser cache:**

1. Open in **Incognito/Private mode**
2. Visit http://localhost:3002
3. Try signing in

If it works in incognito → It's definitely cache. Clear browser data for localhost:3002.

---

**Status Check:**
- ✅ Backend: Running on port 3001
- ✅ Frontend: Running on port 3002 (cache cleared)
- ✅ MongoDB: Connected
- ✅ AuthKit: v0.8.1 with relay server configured

**Next Step:** Open http://localhost:3002 in **incognito mode** and try!

