# Farcaster Mini App Implementation Guide

## Overview
This document outlines the implementation of Farcaster Mini Apps for posting ads on behalf of hosts.

## Architecture

### Two-Part System:
1. **Sign In with Farcaster (AuthKit)** - For authentication (✅ Already implemented)
2. **Farcaster Mini App** - For posting ads on behalf of users (🚧 In Progress)

## Why We Need Mini Apps

According to [Farcaster docs](https://docs.farcaster.xyz/):
- ❌ **Sign In with Farcaster** cannot post on behalf of users
- ✅ **Mini Apps** can post casts (including pinned casts) with user permission

## Implementation Steps

### 1. Mini App Configuration ✅
- SDK installed: `@farcaster/frame-sdk`
- Will be accessible at: `/miniapp`
- Runs inside Warpcast and other Farcaster clients

### 2. Host Onboarding Flow

```
Step 1: Sign In with Farcaster
  ↓ (Authentication complete)
Step 2: Open Mini App in Warpcast
  ↓ (Grant permissions)
Step 3: Configure ad preferences
  ↓ (Set rates, ad types, etc.)
Step 4: Start earning!
```

### 3. Ad Posting Workflow

```
Campaign Created (by advertiser)
  ↓
Match with eligible hosts
  ↓
Mini App posts ad on host's profile
  ↓
Track impressions & clicks
  ↓
Process hourly payouts via Merkle tree
```

## Components

### Frontend (`apps/frontend/`)
- `/src/app/miniapp/page.tsx` - Mini App entry point
- `/src/components/miniapp/` - Mini App components
  - `HostOnboarding.tsx` - Permission grant flow
  - `AdPreview.tsx` - Show hosts what ads look like
  - `EarningsDisplay.tsx` - Real-time earnings

### Backend (`apps/backend/`)
- `/src/routes/miniapp.ts` - Mini App API endpoints (✅ Already exists)
- `/src/services/miniAppService.ts` - Ad posting logic
- `/src/services/farcasterCastService.ts` - Cast to Farcaster API

### Database Updates
```typescript
interface Host {
  // ... existing fields
  
  // Mini App integration
  miniAppPermissionsGranted: boolean;
  miniAppGrantedAt: Date;
  allowedAdTypes: ('pinned_cast' | 'banner')[];
  maxAdsPerDay: number;
  minCpm: number; // Minimum CPM they'll accept
}
```

## Key Features

### 1. Permission Management
- Hosts grant posting permissions via Mini App
- Can revoke permissions at any time
- Granular control (pinned casts, banners, etc.)

### 2. Ad Posting
- Automatic posting when campaigns match criteria
- Respects host's preferences (max ads/day, min CPM)
- Posts as pinned casts on host's profile

### 3. Earnings Tracking
- Real-time tracking of impressions/clicks
- Hourly Merkle-based payouts
- Dashboard shows current earnings

### 4. Quality Control
- Hosts can reject/approve ads
- Set content guidelines
- Block specific advertisers

## Mini App SDK Usage

```typescript
import sdk from "@farcaster/frame-sdk";

// 1. Initialize SDK
await sdk.actions.ready();

// 2. Get user context
const context = await sdk.context;
// { user: { fid: 123, username: "alice" } }

// 3. Request posting permission
await sdk.actions.openUrl("https://warpcast.com/~/settings/apps");

// 4. Post cast on behalf of user
await sdk.actions.cast({
  text: "Check out this amazing product! #ad",
  embeds: ["https://example.com"],
});
```

## Testing Strategy

### Development
1. Test in Mini App simulator
2. Use Warpcast developer mode
3. Test with test accounts

### Production
1. Beta test with small group of hosts
2. Monitor posting success rates
3. Gather feedback and iterate

## Security Considerations

1. **Permission Scope**: Only request necessary permissions
2. **Data Privacy**: Never access private messages or DMs
3. **Rate Limiting**: Respect Farcaster API rate limits
4. **Content Policy**: Ensure ads comply with Farcaster guidelines

## Deployment Checklist

- [ ] Mini App manifest configured
- [ ] SDK integrated and tested
- [ ] Host onboarding flow complete
- [ ] Ad posting logic implemented
- [ ] Error handling & logging
- [ ] Rate limiting implemented
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] User documentation
- [ ] Beta testing complete

## Resources

- [Farcaster Mini Apps Docs](https://docs.farcaster.xyz/)
- [Mini App SDK Reference](https://www.npmjs.com/package/@farcaster/frame-sdk)
- [Sign In with Farcaster](https://docs.farcaster.xyz/auth-kit/)
- [Farcaster Developer Chat](https://warpcast.com/~/channel/fc-devs)

## Next Steps

1. ✅ Install SDK
2. 🚧 Create Mini App manifest
3. 🚧 Build host onboarding component
4. 🚧 Implement ad posting service
5. 🚧 Add permission management
6. 🚧 Test in Warpcast

---

**Note**: This is a phased rollout. We'll start with basic posting capabilities and gradually add more features based on user feedback.

