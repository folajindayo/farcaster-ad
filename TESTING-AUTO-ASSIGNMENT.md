# Testing the Automatic Assignment Flow

## Setup

1. **Start Backend** (if not already running):
   ```bash
   cd /Users/mac/farcaster-ad-rental/apps/backend
   PORT=3001 npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd /Users/mac/farcaster-ad-rental/apps/frontend
   npm run dev
   ```

3. **Open Browser**:
   - Frontend: http://localhost:3002
   - Backend API Docs: http://localhost:3001/api-docs

## Test Scenario 1: Advertiser Creates Campaign → Auto-Assigns to Hosts

### Steps:
1. **Sign in as Advertiser**
   - Go to http://localhost:3002
   - Click "Sign in with Farcaster"
   - Complete authentication
   - Your role should be "advertiser" by default

2. **Create a Campaign**
   - Go to http://localhost:3002/dashboard
   - Click "Create Campaign" button
   - Fill out the form:
     - **Name:** Test Campaign #1
     - **Objective:** engagement
     - **Ad Type:** pinned_cast (or banner)
     - **Target Audience:** 1k-10k followers
     - **Duration:** 7 days
     - **Budget:** $100
     - **CPM:** $5.00
     - **Banner Image:** Upload any image
     - **CTA Text:** Learn More
     - **CTA URL:** https://example.com
   - Click "Launch Campaign"

3. **Check Backend Logs**
   Look for these log messages:
   ```
   🚀 Triggering auto-assignment for campaign 67...
   💰 Processing funded campaign: 67...
   ✅ Campaign 67... activated
   🔍 Finding matching hosts for campaign: 67...
   📊 Campaign targeting: { followerRange: { min: 1000, max: 10000 }, ... }
   ✅ Found X matching hosts
   🎯 Assigning campaign to host...
   🚀 Deploying ad for campaign...
   ```

4. **Verify in Dashboard**
   - Campaign should appear in the campaigns table
   - Status should be "active"
   - If there are matching hosts in the DB, you'll see assignment logs

## Test Scenario 2: Host Onboards → Auto-Assigned Active Campaigns

### Steps:
1. **Switch to Host Role** (or use a new Farcaster account)
   - If using the same account:
     - Click profile menu → "Switch Role"
     - Select "Host"
   - Or sign out and sign in with a different Farcaster account

2. **Complete Host Onboarding**
   - Go to http://localhost:3002/host/onboarding
   - **Step 1 - Profile:** Confirm your Farcaster profile
   - **Step 2 - Preferences:**
     - Ad Types: ✓ Banner, ✓ Pinned Cast
     - Categories: Leave empty (or add "tech", "crypto")
     - Minimum CPM: 0 (to match all campaigns)
     - Auto-Accept: ON ✓
   - **Step 3 - Review:** Verify settings
   - Click "Start Earning"

3. **Check Backend Logs**
   Look for:
   ```
   🚀 Triggering auto-assignment for new host 67...
   👤 Processing new host: 67...
   🔍 Finding all active campaigns...
   ✅ Campaign 67... assigned to host 67...
   🚀 Deploying ad to host...
   📌 Posting pinned cast...
   🖼️ Updating profile banner...
   🎉 Host 67... matched with X campaigns
   ```

4. **Verify in Dashboard**
   - Go to http://localhost:3002/dashboard
   - You should see "Active Campaigns" (campaigns running on your profile)
   - If there were active campaigns matching your criteria, they'll be listed

## Test Scenario 3: Complete Flow with Multiple Hosts

### Preparation:
Create multiple host accounts in MongoDB (use Mongo Compass or mongo shell):
```javascript
// In MongoDB
use('farcaster-ad-rental');

// Create test users
db.users.insertMany([
  {
    farcasterId: 100001,
    username: "testhost1",
    displayName: "Test Host 1",
    role: "host",
    isHost: true,
    pfpUrl: "https://i.pravatar.cc/150?u=1"
  },
  {
    farcasterId: 100002,
    username: "testhost2",
    displayName: "Test Host 2",
    role: "host",
    isHost: true,
    pfpUrl: "https://i.pravatar.cc/150?u=2"
  }
]);

// Create test hosts
db.hosts.insertMany([
  {
    userId: db.users.findOne({ farcasterId: 100001 })._id,
    farcasterId: 100001,
    username: "testhost1",
    displayName: "Test Host 1",
    followerCount: 5000,
    status: "active",
    acceptingCampaigns: true,
    adTypes: ["banner", "pinned_cast"],
    categories: ["tech"],
    minimumCPM: 0,
    miniAppPermissionsGranted: true,
    totalEarnings: 0,
    pendingEarnings: 0,
    isActive: true
  },
  {
    userId: db.users.findOne({ farcasterId: 100002 })._id,
    farcasterId: 100002,
    username: "testhost2",
    displayName: "Test Host 2",
    followerCount: 8000,
    status: "active",
    acceptingCampaigns: true,
    adTypes: ["banner", "pinned_cast"],
    categories: ["crypto"],
    minimumCPM: 3.0,
    miniAppPermissionsGranted: true,
    totalEarnings: 0,
    pendingEarnings: 0,
    isActive: true
  }
]);
```

### Test:
1. **Create Campaign as Advertiser**
   - Target: 1k-10k followers
   - Categories: tech, crypto
   - CPM: $5.00

2. **Expected Result:**
   - Both hosts should be matched (follower count in range, CPM >= minimum)
   - Backend logs should show:
     ```
     ✅ Found 2 matching hosts
     🎯 Assigning campaign to host testhost1...
     🎯 Assigning campaign to host testhost2...
     🚀 Deploying ads to both hosts...
     🎉 Campaign successfully deployed to 2 hosts
     ```

3. **Verify in Database:**
   ```javascript
   // Check ad_placements collection
   db.ad_placements.find({ 
     campaignId: ObjectId("YOUR_CAMPAIGN_ID") 
   }).pretty();
   
   // Should see 2 placements (one for each host)
   ```

## Debugging

### If Auto-Assignment Doesn't Trigger:

1. **Check Backend Logs:**
   - Look for error messages
   - Ensure MongoDB is connected
   - Verify campaign was created successfully

2. **Check Campaign Status:**
   ```javascript
   // In MongoDB
   db.campaigns.findOne({ _id: ObjectId("CAMPAIGN_ID") });
   // Status should be "active"
   ```

3. **Check Host Eligibility:**
   ```javascript
   // In MongoDB
   db.hosts.find({
     status: "active",
     acceptingCampaigns: true,
     followerCount: { $gte: 1000, $lte: 10000 }
   });
   ```

4. **Check for Existing Placements:**
   ```javascript
   // In MongoDB
   db.ad_placements.find({
     campaignId: ObjectId("CAMPAIGN_ID"),
     status: { $in: ["active", "pending"] }
   });
   ```

### If No Matching Hosts Found:

- **Follower Count:** Ensure host follower counts fall within campaign's target range
- **Categories:** If campaign has categories, host must have matching categories (or no categories)
- **CPM:** Host's minimum CPM must be ≤ campaign's CPM
- **Status:** Host must have `status: "active"` and `acceptingCampaigns: true`

### Manual Testing via API:

Test the auto-assignment service directly:
```bash
# Test campaign auto-assignment
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "advertiserId": "YOUR_USER_ID",
    "name": "Test Campaign",
    "budget": 100,
    "type": "pinned_cast",
    "targeting": {
      "audience": "1k-10k followers",
      "categories": ["tech"]
    },
    "schedule": {
      "cpm": "5.00"
    },
    "creative": {
      "mediaUrl": "https://example.com/image.jpg",
      "ctaText": "Learn More",
      "ctaUrl": "https://example.com"
    }
  }'
```

## Expected Outcomes

### ✅ Success Indicators:
- Backend logs show matching, assignment, and deployment steps
- `ad_placements` collection has new records
- Campaign appears in advertiser's dashboard with "active" status
- Campaign appears in host's dashboard as "Active Campaigns"
- No errors in backend logs

### ❌ Failure Indicators:
- No matching hosts found (check targeting criteria)
- MongoDB connection errors
- Missing required fields in request
- TypeScript/linting errors in services

## Next Steps After Testing

1. **Integrate Real Farcaster API:**
   - Replace mock implementations in `farcasterPosting.ts`
   - Add real cast posting
   - Add real profile banner updates

2. **Add Blockchain Event Listener:**
   - Listen for campaign funding events
   - Trigger auto-assignment on funding

3. **Add Real Notifications:**
   - Email notifications
   - In-app notifications
   - Farcaster direct casts

4. **Add Periodic Matching Cron:**
   - Schedule `autoAssignment.runPeriodicMatching()` every 15 minutes
   - Catch any missed assignments

## Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify MongoDB connection
3. Ensure all required fields are present in requests
4. Check that hosts meet campaign targeting criteria
5. Review the implementation docs: `AUTO-ASSIGNMENT-IMPLEMENTATION.md`

