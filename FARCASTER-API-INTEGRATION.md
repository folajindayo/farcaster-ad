# Farcaster API Integration - Required for Real Posting

## Current Status

🟡 **PARTIALLY IMPLEMENTED** - The system has the logic and flow in place, but the actual Farcaster API calls are **mocked/simulated**.

## The Issue

When you saw the campaign matched but no post was made, it's because:

1. ✅ **Campaign Matching**: Works perfectly (campaign matched with host)
2. ✅ **Ad Placement Created**: Database record created successfully  
3. ✅ **Deployment Logic**: Service tries to deploy the ad
4. ❌ **Actual Posting**: Mock implementation, doesn't actually post to Farcaster

## What Needs To Be Implemented

### 1. Farcaster Hub API Integration

The Farcaster posting service (`/apps/backend/src/services/farcasterPosting.ts`) has these methods marked as **TODO**:

```typescript
// Line 267-278: Mock implementation
private async postCastToFarcaster(fid: number, options: CastOptions): Promise<string> {
  // TODO: Implement actual Farcaster API/SDK call
  console.log(`📡 Posting to Farcaster for FID ${fid}:`, options);
  
  // This would use the Farcaster Hub API or SDK
  // Example: await farcasterClient.submitCast({ fid, text: options.text, embeds: options.embeds });
  
  // Return mock cast hash for now
  const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
  return mockHash;
}

// Line 283-289: Mock implementation
private async pinCast(fid: number, castHash: string): Promise<void> {
  // TODO: Implement actual Farcaster API call to pin cast
  console.log(`📌 Pinning cast ${castHash} for FID ${fid}`);
  
  // This would use Farcaster API
  // Example: await farcasterClient.pinCast({ fid, castHash });
}

// Line 310-316: Mock implementation
private async updateFarcasterProfileBanner(fid: number, imageUrl: string): Promise<void> {
  // TODO: Implement actual Farcaster API call
  console.log(`🖼️ Updating banner for FID ${fid} to: ${imageUrl}`);
  
  // This would use Farcaster API
  // Example: await farcasterClient.updateProfile({ fid, pfpUrl: imageUrl });
}
```

## How To Implement Real Posting

### Option 1: Use Neynar API (Recommended)

Neynar provides a hosted Farcaster API that's easier to use than running your own Hub.

```bash
npm install @neynar/nodejs-sdk
```

```typescript
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

// Post a cast
const cast = await neynarClient.publishCast(
  process.env.NEYNAR_SIGNER_UUID!, // Host's signer
  text,
  {
    embeds: [{ url: imageUrl }]
  }
);

// Update profile (requires Frame Actions or Signer)
```

**Setup Required:**
1. Get API key from [Neynar Dashboard](https://dev.neynar.com/)
2. Each host needs to authorize a "signer" (similar to OAuth)
3. Store signer UUID for each host in the Host model

### Option 2: Use Farcaster Hub Directly

Run your own Farcaster Hub and submit messages directly.

```bash
npm install @farcaster/hub-nodejs
```

```typescript
import { getSSLHubRpcClient } from "@farcaster/hub-nodejs";

const client = getSSLHubRpcClient("hub-grpc.pinata.cloud");

// Submit cast
const castAddData = {
  fid: hostFid,
  text: castText,
  embeds: embedUrls,
  type: MessageType.CAST_ADD,
};

const result = await client.submitMessage(castAddData);
```

**Setup Required:**
1. Connect to a Hub (your own or public like Pinata's)
2. Each host must sign messages with their Farcaster private key
3. More complex but gives full control

### Option 3: Use Farcaster Frames (For Profile Updates)

For banner updates, you might need Frame Actions which allow users to grant permissions.

```typescript
// Frame that requests permission to update profile
const frame = {
  buttons: [
    {
      action: "post",
      label: "Allow Ad on My Profile",
      target: `${BACKEND_URL}/api/frame/authorize`
    }
  ]
};
```

## What's Needed For Each Approach

### Neynar API (Easiest)
- [ ] Sign up for Neynar account
- [ ] Get API key
- [ ] Implement signer flow for hosts
- [ ] Store signer UUID per host
- [ ] Update `farcasterPosting.ts` methods

### Farcaster Hub (Most Control)
- [ ] Run or connect to Hub
- [ ] Implement message signing
- [ ] Handle host private keys securely
- [ ] Update `farcasterPosting.ts` methods

### Current Workaround

Right now, the system:
1. ✅ Matches campaigns to hosts
2. ✅ Creates AdPlacement records
3. ✅ Logs what it WOULD post
4. ❌ Doesn't actually post to Farcaster

## Testing The Current Flow

Even without real API integration, you can verify the logic works:

```bash
# 1. Add banner to campaign
npm run campaign:add-banner "Blaze"

# 2. Re-run assignment
npm run assign:campaign "Blaze"

# 3. Check the logs - you'll see:
#    ✅ Campaign matched
#    ✅ AdPlacement created
#    📡 Mock posting to Farcaster (simulated)
#    ✅ Deployment "complete" (but not real)
```

## Recommended Implementation Plan

### Phase 1: Neynar Integration (1-2 days)
1. **Setup Neynar**
   - Create Neynar account
   - Get API key
   - Add to environment variables

2. **Add Signer Flow**
   - Update Host model to store `signerUuid`
   - Create `/api/host/authorize-signer` endpoint
   - Frontend: Add "Authorize Posting" button on host dashboard

3. **Update Posting Service**
   ```typescript
   // In farcasterPosting.ts
   import { NeynarAPIClient } from "@neynar/nodejs-sdk";
   
   const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
   
   private async postCastToFarcaster(fid: number, options: CastOptions): Promise<string> {
     const host = await Host.findOne({ farcasterId: fid });
     if (!host?.signerUuid) {
       throw new Error('Host has not authorized posting');
     }
     
     const cast = await neynar.publishCast(
       host.signerUuid,
       options.text,
       { embeds: options.embeds?.map(url => ({ url })) }
     );
     
     return cast.hash;
   }
   ```

4. **Test End-to-End**
   - Host authorizes signer
   - Campaign created
   - Auto-assignment triggers
   - Real cast posted to Farcaster ✅

### Phase 2: Profile Banner Updates (1-2 days)
1. Research Frame Actions for profile updates
2. Implement banner update flow
3. Test on testnet first

### Phase 3: Production (1 day)
1. Handle edge cases
2. Add retry logic
3. Monitor posting success rate
4. Add webhooks for post verification

## Example: Complete Implementation

```typescript
// apps/backend/src/services/farcasterPosting.ts

import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

class FarcasterPostingService {
  private async postCastToFarcaster(fid: number, options: CastOptions): Promise<string> {
    try {
      // Get host's signer
      const host = await Host.findOne({ farcasterId: fid });
      if (!host?.signerUuid) {
        throw new Error(`Host FID ${fid} has not authorized posting permissions`);
      }
      
      console.log(`📡 Posting to Farcaster for FID ${fid}:`, options);
      
      // Post cast via Neynar
      const response = await neynar.publishCast(
        host.signerUuid,
        options.text,
        {
          embeds: options.embeds?.map(url => ({ url })),
          parent: options.parentUrl
        }
      );
      
      console.log(`✅ Cast posted successfully! Hash: ${response.hash}`);
      
      return response.hash;
    } catch (error) {
      console.error('❌ Failed to post cast:', error);
      throw error;
    }
  }
  
  private async pinCast(fid: number, castHash: string): Promise<void> {
    // Neynar doesn't have direct pinning API yet
    // You might need to use Frame Actions or wait for feature
    console.log(`📌 Pinning cast ${castHash} for FID ${fid}`);
    console.log(`⚠️  Note: Pinning requires Frame Action or manual action`);
  }
  
  private async updateFarcasterProfileBanner(fid: number, imageUrl: string): Promise<void> {
    // This requires Frame Actions or special permissions
    console.log(`🖼️ Updating banner for FID ${fid} to: ${imageUrl}`);
    console.log(`⚠️  Note: Profile updates require user authorization via Frame`);
    
    // Alternative: Use Warpcast API if available
    // Or require hosts to manually update via your Frame
  }
}
```

## Files To Update

1. **Environment Variables** (`.env.local`)
   ```env
   NEYNAR_API_KEY=your_api_key_here
   ```

2. **Host Model** (`apps/backend/src/models/Host.ts`)
   ```typescript
   // Add to schema
   signerUuid: {
     type: String,
     required: false
   },
   signerAuthorizedAt: {
     type: Date,
     required: false
   }
   ```

3. **Posting Service** (`apps/backend/src/services/farcasterPosting.ts`)
   - Replace mock implementations
   - Add real API calls

4. **Authorization Route** (`apps/backend/src/routes/hosts.ts`)
   ```typescript
   // New endpoint
   router.post('/authorize-signer', async (req, res) => {
     // Handle Neynar signer authorization
   });
   ```

5. **Frontend** (`apps/frontend/src/app/host/dashboard/page.tsx`)
   - Add "Authorize Posting" button
   - Show signer status

## Summary

**Current State**: ✅ Logic works, ❌ Not posting to real Farcaster

**Next Steps**:
1. Choose API provider (Neynar recommended)
2. Implement signer authorization flow
3. Update posting service with real API calls
4. Test end-to-end

**Estimated Time**: 3-5 days for full implementation

**Priority**: High - This is needed for the platform to actually function

Would you like me to implement the Neynar integration? It's the fastest path to getting real posts working.



