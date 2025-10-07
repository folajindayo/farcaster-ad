# Farcaster Authentication Flow - Simplified

## Your Use Case
**Goal:** Host or Advertiser connects Farcaster account → Logs in → Can perform actions (create campaigns, earn from ads, etc.)

## The Flow (5 Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: User Clicks "Connect Farcaster"                        │
│  ────────────────────────────────────────────────────────────   │
│  • User visits your app (localhost:3002 or your domain)         │
│  • Sees the Sign In button                                      │
│  • Clicks it                                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: QR Code Appears / Deeplink Opens                       │
│  ────────────────────────────────────────────────────────────   │
│  • Desktop: QR code shown on screen                             │
│  • Mobile: Warpcast app opens directly                          │
│  • Message says: "Sign in to localhost:3002"                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: User Approves in Warpcast                              │
│  ────────────────────────────────────────────────────────────   │
│  • User scans QR code with Warpcast (or approves in app)        │
│  • Warpcast shows: "farcaster-ad-rental wants to sign you in"   │
│  • User taps "Approve"                                          │
│  • Warpcast creates cryptographic signature                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Backend Verifies Signature                             │
│  ────────────────────────────────────────────────────────────   │
│  • Frontend receives: signature + FID + username + pfp          │
│  • Sends to your backend API: POST /api/auth/verify             │
│  • Backend uses @farcaster/auth-client to verify signature      │
│  • Checks signature against Optimism blockchain (via RPC)       │
│  • If valid → Creates/updates user in MongoDB                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: User Is Logged In!                                     │
│  ────────────────────────────────────────────────────────────   │
│  • Token stored in localStorage                                 │
│  • User data stored: FID, username, display name, pfp, wallet   │
│  • Redirected to /dashboard                                     │
│  • Can now create campaigns, opt-in as host, view earnings, etc.│
└─────────────────────────────────────────────────────────────────┘
```

## What Each URL Does

### RPC URL (`https://mainnet.optimism.io`)
**Purpose:** Verify the signature is real

**Why Optimism?**
- Farcaster stores all account data on Optimism (Ethereum L2)
- When user signs in, the library queries Optimism to check:
  - Does this FID (Farcaster ID) exist?
  - Does the signature match this account's keys?
  - Is the signature valid and not expired?

**Do you need a paid RPC?**
- ❌ No, for authentication
- Public endpoint works fine
- Only need paid RPC if you're doing 1000s of requests/min

### SIWE URI / Domain (`localhost:3002`)
**Purpose:** Prevent phishing attacks

**How it works:**
- The signed message includes your domain
- Example message: "I want to sign in to **localhost:3002** as @username"
- If someone steals the signature, they can't use it on `malicious-site.com`
- Backend verifies the domain in the signature matches YOUR domain

**Security:**
```
✅ Good: Signature says "localhost:3002" → Your backend checks "localhost:3002" → ✅ Valid
❌ Bad:  Signature says "localhost:3002" → Attacker's backend checks "evil.com" → ❌ Rejected
```

## User Actions After Login

Once authenticated, the user's Farcaster data is stored:

```typescript
{
  farcasterId: "12345",        // Their FID
  username: "alice",           // Their @handle
  displayName: "Alice",        // Display name
  pfpUrl: "https://...",      // Profile picture
  walletAddress: "0x...",     // Connected wallet
  role: "host",               // Their role in your app
  token: "abc123..."          // Session token
}
```

### What They Can Do:

**As a Host:**
- ✅ Opt-in to display ads on their profile
- ✅ View earnings dashboard
- ✅ Track impressions and clicks
- ✅ Claim USDC payouts

**As an Advertiser:**
- ✅ Create ad campaigns
- ✅ Upload banner images
- ✅ Set budgets and targeting
- ✅ Track campaign performance
- ✅ Manage active campaigns

**As an Operator:**
- ✅ Approve/reject campaigns
- ✅ Monitor platform metrics
- ✅ Manage host onboarding
- ✅ Configure platform settings

## Session Management

**Token Storage:**
```typescript
// After successful auth
localStorage.setItem('token', authData.token)
localStorage.setItem('user', JSON.stringify(authData.user))

// On subsequent requests
const token = localStorage.getItem('token')
fetch('/api/campaigns', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
})
```

**Token Format:**
```
Base64 encoded: userId:farcasterId:role
Example: NjdhYmM6MTIzNDU6aG9zdA==
Decoded: 67abc:12345:host
```

## Why This Approach?

✅ **No Passwords** - Users sign in with their Farcaster app (like "Sign in with Google")  
✅ **Decentralized** - Identity lives on Optimism blockchain, not your database  
✅ **Secure** - Cryptographic signatures, domain binding, replay protection  
✅ **Simple** - Users already have Farcaster accounts (Warpcast)  
✅ **Web3 Native** - Brings wallet addresses for USDC payments  

## Common Questions

**Q: Why can't I just use username/password?**  
A: This is Web3! Users have Farcaster accounts with verified wallets. No need for passwords when you have cryptographic signatures.

**Q: What if user doesn't have Warpcast?**  
A: They need a Farcaster account to use your platform (that's the whole point - it's for Farcaster users).

**Q: Can I test without scanning QR codes?**  
A: On mobile, it will deeplink directly to Warpcast. On desktop, you scan the QR with your phone.

**Q: How long does the session last?**  
A: Until they clear localStorage or you implement token expiration (currently permanent).

**Q: Can I add email/password as backup?**  
A: You could, but defeats the purpose of Web3 social login. Stick with Farcaster for your use case.

## Summary

**Simple Version:**
1. User clicks button
2. Scans QR with Warpcast
3. Approves in app
4. Signature verified on blockchain
5. Logged in!

**Technical Version:**
1. AuthKit SignInButton rendered
2. SIWE message generated with domain
3. Farcaster app signs message with user's private key
4. Signature + profile data returned
5. Backend verifies signature against Optimism RPC
6. User record created/updated in MongoDB
7. Session token issued
8. User authenticated

**Bottom Line:** It's like "Sign in with Google" but for Farcaster, with blockchain verification! 🚀

