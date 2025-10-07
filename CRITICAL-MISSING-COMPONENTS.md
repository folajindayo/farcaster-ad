# Critical Missing Components for PRD Completion

## 🚨 CRITICAL GAPS (Blocking Launch)

### 1. **No Actual Ad Display System**
Currently we track and pay for "impressions" but there's no mechanism to actually:
- Display ads on Farcaster profiles
- Serve ad creatives to users
- Track real impressions/clicks
- Connect displayed ads to payments

**Impact**: The entire system is theoretical without this.

### 2. **No Host Opt-in Flow**
Hosts cannot:
- Install the miniapp
- Choose which profile slots to monetize
- Link their wallet to receive payments
- See which ads are showing

**Impact**: No way for users to participate.

### 3. **No Campaign Creation UI**
Advertisers cannot:
- Upload creatives
- Set budgets and targeting
- Launch campaigns
- Track performance

**Impact**: No way for advertisers to use the platform.

## 🔥 IMMEDIATE ACTION ITEMS

### Day 1-2: Ad Serving Foundation
```typescript
// Need to create:
apps/backend/src/services/adServer.ts
- getAdForHost(hostId, placement)
- trackImpression(adId, hostId)
- trackClick(adId, hostId)

apps/backend/src/models/AdCreative.ts
- imageUrl, text, ctaLink, placement

apps/backend/src/routes/serve.ts
- GET /api/ads/serve/:hostId/:placement
- POST /api/ads/impression
- POST /api/ads/click
```

### Day 3-4: Host Opt-in System
```typescript
// Need to create:
apps/frontend/src/pages/host/onboarding.tsx
- Miniapp installation flow
- Slot selection (banner/pinned/frame)
- Wallet connection
- Earnings dashboard

apps/backend/src/models/HostProfile.ts
- fid, slots[], walletAddress, status
```

### Day 5-6: Campaign Creation
```typescript
// Need to create:
apps/frontend/src/pages/advertiser/create-campaign.tsx
- Upload creative
- Set budget
- Choose targeting
- Review & fund

apps/backend/src/services/campaignManager.ts
- validateCreative()
- estimateReach()
- approveCampaign()
```

## 📋 MINIMUM VIABLE PRODUCT CHECKLIST

### ✅ Done
- [x] Smart contracts for payouts
- [x] Merkle tree generation
- [x] Automated hourly distribution
- [x] Basic API structure

### ❌ Required for MVP
- [ ] **Ad serving endpoint** (returns ad for profile)
- [ ] **Impression tracking** (logs actual views)
- [ ] **Host registration** (opt-in flow)
- [ ] **Campaign creation** (upload + fund)
- [ ] **Basic targeting** (at least by follower count)
- [ ] **Creative storage** (S3/IPFS)
- [ ] **Farcaster frame integration**
- [ ] **Click tracking with redirects**
- [ ] **Approval queue for operator**
- [ ] **Complete dashboards** (all 3 roles)

## 🎯 RECOMMENDED IMPLEMENTATION PATH

### Week 1: Make It Work
1. **Monday-Tuesday**: Basic ad serving
   - Simple endpoint that returns an ad
   - Store creatives locally/S3
   - Track impressions in existing Receipt model

2. **Wednesday-Thursday**: Host opt-in
   - Simple form to register
   - Store in Host model
   - Connect to payout system

3. **Friday**: Campaign creation
   - Basic form for advertisers
   - Upload creative
   - Fund with USDC

### Week 2: Farcaster Integration
1. **Monday-Tuesday**: Frame rendering
2. **Wednesday-Thursday**: Profile integration
3. **Friday**: Testing with real profiles

### Week 3: Polish
1. Complete dashboards
2. Add analytics
3. Improve UX
4. Testing & bug fixes

## ⚡ Quick Wins (Can Do Today)

1. **Mock Ad Server** (2 hours)
   - Create endpoint that returns dummy ad
   - Connect to existing tracking

2. **Host Registration** (3 hours)
   - Simple form + API endpoint
   - Store in database
   - Link to payouts

3. **Campaign Stub** (2 hours)
   - Basic model with creative URL
   - Manual creation via API
   - Connect to ad server

## 🏗️ Architecture Decisions Needed

1. **Creative Storage**
   - Local uploads folder? ❌ (doesn't scale)
   - S3/CloudFlare R2? ✅ (recommended)
   - IPFS? 🤔 (decentralized but slow)

2. **Ad Assignment**
   - Random fair distribution? ✅ (simple)
   - Weighted by performance? 🤔 (complex)
   - Targeting-based? 🤔 (requires user data)

3. **Farcaster Integration**
   - Direct API calls? 
   - Warpcast miniapp?
   - Custom client?

## 💡 Simplified MVP Approach

Instead of building everything, start with:

1. **Static Ad Pool**
   - Manually create 5-10 test campaigns
   - Rotate them randomly to hosts
   - Track impressions based on profile views

2. **Simple Host Opt-in**
   - Just a wallet address + FID
   - Auto-approve all hosts
   - Show same ad to all

3. **Manual Campaign Creation**
   - Advertiser sends USDC to contract
   - Operator manually creates campaign
   - No UI needed initially

This would create a working system in 2-3 days that actually serves ads and pays hosts!


