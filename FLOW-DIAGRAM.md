# Automatic Campaign Assignment - Flow Diagram

## Overview
```
┌─────────────────┐          ┌─────────────────┐
│   ADVERTISER    │          │      HOST       │
│   Creates       │          │   Completes     │
│   Campaign      │          │   Onboarding    │
└────────┬────────┘          └────────┬────────┘
         │                            │
         ▼                            ▼
┌────────────────────────────────────────────────┐
│        AUTO-ASSIGNMENT SERVICE                 │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │     CAMPAIGN MATCHER SERVICE             │ │
│  │  • Find compatible hosts/campaigns       │ │
│  │  • Check follower count                  │ │
│  │  • Match categories                      │ │
│  │  • Verify CPM rates                      │ │
│  │  • Filter existing placements            │ │
│  └──────────┬───────────────────────────────┘ │
│             │                                  │
│             ▼                                  │
│  ┌──────────────────────────────────────────┐ │
│  │  Create AdPlacement Records              │ │
│  │  • One per matched host                  │ │
│  │  • Status: "active"                      │ │
│  │  • Store targeting & pricing             │ │
│  └──────────┬───────────────────────────────┘ │
│             │                                  │
│             ▼                                  │
│  ┌──────────────────────────────────────────┐ │
│  │   FARCASTER POSTING SERVICE              │ │
│  │  • Post pinned casts                     │ │
│  │  • Update profile banners                │ │
│  │  • Store deployment metadata             │ │
│  └──────────┬───────────────────────────────┘ │
│             │                                  │
│             ▼                                  │
│  ┌──────────────────────────────────────────┐ │
│  │   NOTIFICATION SERVICE                   │ │
│  │  • Notify hosts of new campaigns         │ │
│  │  • Send deployment confirmations         │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## Detailed Flow: Advertiser Creates Campaign

```
┌─────────────────────────────────────────────┐
│ 1. CAMPAIGN CREATION                        │
│    Frontend: CreateCampaignModalDetailed    │
└───────────────┬─────────────────────────────┘
                │
                │ POST /api/campaigns
                │ { name, budget, targeting, ... }
                ▼
┌─────────────────────────────────────────────┐
│ 2. BACKEND: Create Campaign Record          │
│    Route: campaigns.ts                       │
│    • Validate input                          │
│    • Create campaign with status: "active"   │
│    • Save to MongoDB                         │
└───────────────┬─────────────────────────────┘
                │
                │ Trigger async
                ▼
┌─────────────────────────────────────────────┐
│ 3. AUTO-ASSIGNMENT: processFundedCampaign   │
│    Service: autoAssignment.ts                │
│    • Input: campaignId                       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 4. MATCHING: findMatchingHosts              │
│    Service: campaignMatcher.ts               │
│                                              │
│    Query Builder:                            │
│    ┌────────────────────────────────────┐   │
│    │ status: "active"                   │   │
│    │ acceptingCampaigns: true           │   │
│    │ followerCount: { $gte: min, ... }  │   │
│    │ categories: { $in: [...] }         │   │
│    │ minimumCPM: { $lte: campaignCPM }  │   │
│    └────────────────────────────────────┘   │
│                                              │
│    ▼ Execute query                           │
│    ┌────────────────────────────────────┐   │
│    │ Matched Hosts: [host1, host2, ...] │   │
│    └────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │
                │ For each matched host
                ▼
┌─────────────────────────────────────────────┐
│ 5. PLACEMENT: assignCampaignToHost          │
│    Service: campaignMatcher.ts               │
│                                              │
│    Create AdPlacement:                       │
│    ┌────────────────────────────────────┐   │
│    │ campaignId: campaign._id           │   │
│    │ hostId: host._id                   │   │
│    │ advertiserId: campaign.advertiserId│   │
│    │ adType: campaign.type              │   │
│    │ status: "active"                   │   │
│    │ startDate: now                     │   │
│    │ pricing: { cpm, budget }           │   │
│    │ performance: { impressions: 0 }    │   │
│    └────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 6. DEPLOYMENT: deployAdToHost               │
│    Service: farcasterPosting.ts              │
│                                              │
│    If adType = "pinned_cast":                │
│    ┌────────────────────────────────────┐   │
│    │ • Build cast text from creative    │   │
│    │ • postCastToFarcaster()            │   │
│    │ • pinCast()                        │   │
│    │ • Store castHash in metadata       │   │
│    └────────────────────────────────────┘   │
│                                              │
│    If adType = "banner":                     │
│    ┌────────────────────────────────────┐   │
│    │ • Get banner image URL             │   │
│    │ • updateFarcasterProfileBanner()   │   │
│    │ • Store bannerUrl in metadata      │   │
│    └────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 7. NOTIFICATION: notifyHost                 │
│    Service: autoAssignment.ts                │
│    • Log notification message               │
│    • (TODO: Send email/in-app/Farcaster)    │
└─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 8. COMPLETE                                 │
│    • Campaign live on all matched hosts     │
│    • Advertiser sees campaign in dashboard  │
│    • Hosts see campaign in their dashboard  │
└─────────────────────────────────────────────┘
```

## Detailed Flow: Host Completes Onboarding

```
┌─────────────────────────────────────────────┐
│ 1. HOST ONBOARDING                          │
│    Frontend: host/onboarding/page.tsx       │
│    • Step 1: Confirm Farcaster profile      │
│    • Step 2: Set preferences                │
│    • Step 3: Review & submit                │
└───────────────┬─────────────────────────────┘
                │
                │ POST /api/hosts/onboard
                │ { farcasterId, preferences, ... }
                ▼
┌─────────────────────────────────────────────┐
│ 2. BACKEND: Create/Update Host Record      │
│    Route: hosts.ts                           │
│                                              │
│    Create Host:                              │
│    ┌────────────────────────────────────┐   │
│    │ farcasterId: fid                   │   │
│    │ username: "alice"                  │   │
│    │ followerCount: 5000                │   │
│    │ status: "active"                   │   │
│    │ acceptingCampaigns: true           │   │
│    │ adTypes: ["banner","pinned_cast"]  │   │
│    │ categories: ["tech", "crypto"]     │   │
│    │ minimumCPM: 0                      │   │
│    └────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │
                │ Trigger async
                ▼
┌─────────────────────────────────────────────┐
│ 3. AUTO-ASSIGNMENT: processNewHost          │
│    Service: autoAssignment.ts                │
│    • Input: hostId                           │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 4. FIND ACTIVE CAMPAIGNS                    │
│    Query: Campaign.find({ status: "active" })│
│                                              │
│    For each active campaign:                 │
│    ┌────────────────────────────────────┐   │
│    │ • Call findMatchingHosts()         │   │
│    │ • Check if this host is a match    │   │
│    └────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │
                │ For each matched campaign
                ▼
┌─────────────────────────────────────────────┐
│ 5. MATCHING: findMatchingHosts              │
│    Service: campaignMatcher.ts               │
│                                              │
│    Check if host matches campaign:           │
│    ┌────────────────────────────────────┐   │
│    │ ✓ Host follower count in range    │   │
│    │ ✓ Host categories overlap         │   │
│    │ ✓ Host minimum CPM acceptable      │   │
│    │ ✓ No existing placement            │   │
│    └────────────────────────────────────┘   │
│                                              │
│    If match: add to assignments[]            │
└───────────────┬─────────────────────────────┘
                │
                │ For each matching campaign
                ▼
┌─────────────────────────────────────────────┐
│ 6. PLACEMENT: assignCampaignToHost          │
│    Service: campaignMatcher.ts               │
│    • Create AdPlacement record               │
│    • Status: "active"                        │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 7. DEPLOYMENT: deployAdToHost               │
│    Service: farcasterPosting.ts              │
│    • Post pinned casts                       │
│    • Update profile banners                  │
│    • Store deployment metadata               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 8. NOTIFICATION: notifyHost                 │
│    • "X campaigns now live on your profile!" │
└─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 9. COMPLETE                                 │
│    • Host profile active                    │
│    • Campaigns assigned and live            │
│    • Host sees campaigns in dashboard       │
└─────────────────────────────────────────────┘
```

## Matching Algorithm Logic

```
┌─────────────────────────────────────────────┐
│ CAMPAIGN MATCHER: findMatchingHosts         │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 1. Parse Campaign Targeting                 │
│    • followerRange: "1k-10k" → min:1000,    │
│      max:10000                               │
│    • categories: ["tech", "crypto"]          │
│    • cpm: $5.00                              │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 2. Build Host Query                         │
│                                              │
│    Required:                                 │
│    ├─ status: "active"                      │
│    └─ acceptingCampaigns: true              │
│                                              │
│    Optional (if specified):                  │
│    ├─ followerCount: { $gte: 1000,          │
│    │                    $lte: 10000 }        │
│    ├─ categories: { $in: ["tech","crypto"]  │
│    │               OR $exists: false }       │
│    └─ minimumCPM: { $lte: 5.00              │
│                     OR $exists: false }      │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 3. Execute MongoDB Query                    │
│    Host.find(query)                          │
│    ▼                                         │
│    Matched Hosts: [host1, host2, ...]       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 4. Filter Existing Placements               │
│    • Find AdPlacement.find({                 │
│        campaignId: campaign._id,             │
│        status: { $in: ["active","pending"] } │
│      })                                      │
│    • Remove hosts with existing placements   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ 5. Return Available Hosts                   │
│    • Matched: 5 hosts                        │
│    • Already assigned: 2 hosts               │
│    • Available: 3 hosts ✅                   │
└─────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│  Advertiser  │
└──────┬───────┘
       │ Creates
       ▼
┌──────────────┐     triggers    ┌──────────────┐
│   Campaign   │ ───────────────>│AutoAssignment│
│  (active)    │                 │   Service    │
└──────────────┘                 └──────┬───────┘
                                        │ queries
                                        ▼
┌──────────────┐     matches     ┌──────────────┐
│     Host     │ <───────────────│   Matching   │
│   (active,   │                 │   Algorithm  │
│ accepting)   │                 └──────────────┘
└──────┬───────┘
       │
       │ creates
       ▼
┌──────────────┐
│ AdPlacement  │
│   (active)   │
└──────┬───────┘
       │
       │ triggers
       ▼
┌──────────────┐
│  Farcaster   │
│   Posting    │
│   Service    │
└──────┬───────┘
       │
       │ deploys to
       ▼
┌──────────────┐
│  Farcaster   │
│   Profile    │
│ (banner +    │
│  pinned)     │
└──────────────┘
```

## Database Relationships

```
┌──────────────┐
│     User     │
│ ─────────────│
│  _id         │
│  farcasterId │───┐
│  username    │   │
│  role        │   │
└──────────────┘   │
                   │ references
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   Host   │  │Advertiser│  │ Campaign │
│──────────│  │──────────│  │──────────│
│  _id     │  │  _id     │  │  _id     │
│  userId  │  │  userId  │  │  advId───┼─┐
│  fid     │  │  fid     │  │  status  │ │
│  status  │  │  budget  │  │  budget  │ │
│  adTypes │  └──────────┘  │  target  │ │
└────┬─────┘                └──────────┘ │
     │                                    │
     │ referenced by                      │
     │                                    │
     │              ┌─────────────────────┘
     │              │
     │              │
     ▼              ▼
  ┌─────────────────────┐
  │    AdPlacement      │
  │─────────────────────│
  │  _id                │
  │  campaignId    ─────┼─┐ links
  │  hostId        ─────┼─┘ together
  │  advertiserId       │
  │  adType             │
  │  status             │
  │  metadata:          │
  │    castHash         │
  │    bannerUrl        │
  │  performance:       │
  │    impressions      │
  │    clicks           │
  │    earnings         │
  └─────────────────────┘
```

## State Transitions

### Campaign States:
```
draft → active → completed
   │       │
   │       └──> paused → active
   │
   └──> cancelled
```

### AdPlacement States:
```
pending → active → completed
             │
             └──> paused → active
             │
             └──> cancelled
```

### Host States:
```
inactive → active → paused → active
              │
              └──> inactive
```

## Summary

The automatic assignment system is a sophisticated, multi-layered service that:

1. **Matches** campaigns with compatible hosts based on multiple criteria
2. **Assigns** campaigns by creating placement records
3. **Deploys** ads to Farcaster profiles (banner + pinned cast)
4. **Notifies** hosts when campaigns go live

All of this happens **automatically** without any manual intervention! 🎉

