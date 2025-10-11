# Neynar API Setup Guide

## ✅ What's Installed

- Neynar SDK: `@neynar/nodejs-sdk` ✅
- Farcaster Posting Service: Updated with real API calls ✅
- Host Model: Extended with `signerUuid` field ✅

## 🔑 Get Your Neynar API Key

### Step 1: Sign Up for Neynar
1. Go to https://dev.neynar.com/
2. Click "Sign Up" or "Get Started"
3. Sign in with your Warpcast/Farcaster account
4. Complete the onboarding

### Step 2: Create API Key
1. Navigate to your Neynar Dashboard
2. Go to "API Keys" section
3. Click "Create New API Key"
4. Copy your API key (starts with something like `NEYNAR-...`)

### Step 3: Add to Environment Variables
Add to `/Users/mac/farcaster-ad-rental/apps/backend/.env.local`:

```env
# Neynar API for Farcaster posting
NEYNAR_API_KEY=your_api_key_here
```

**IMPORTANT**: Keep this key secret! Never commit it to git.

## 📝 Create a Signer for Host

To post on behalf of @kamoru (FID: 802617), we need to create a signer.

### Option A: Manual Signer Creation (Neynar Dashboard)

1. Go to Neynar Dashboard → Signers
2. Click "Create Signer"
3. Connect with Warpcast/Farcaster
4. Authorize the signer for FID 802617
5. Copy the Signer UUID
6. Add it to the host:

```bash
cd /Users/mac/farcaster-ad-rental/apps/backend
npm run host:add-signer 802617 "your-signer-uuid"
```

### Option B: Programmatic Signer Creation (Recommended)

Use Neynar's Developer-Managed Signers:

1. In Neynar Dashboard, go to "Developer Managed Signers"
2. Create a new signer with FID 802617
3. Or use the API:

```typescript
// This will be in our setup script
const signer = await neynarClient.createSigner();
// User visits: signer.signer_approval_url
// After approval, signer.signer_uuid is ready to use
```

## 🚀 Quick Start

### 1. Set API Key

```bash
# Edit .env.local
nano /Users/mac/farcaster-ad-rental/apps/backend/.env.local

# Add this line:
NEYNAR_API_KEY=YOUR_KEY_HERE
```

### 2. Create Signer for Host

I'll create a script to help with this:

```bash
cd /Users/mac/farcaster-ad-rental/apps/backend
npm run signer:create 802617
```

This will:
- Generate a signer approval URL
- You visit the URL and authorize
- Script adds signer UUID to host record

### 3. Test Posting

Once signer is authorized:

```bash
npm run test:post "Blaze"
```

This will make a REAL post on Farcaster!

## 📊 Current Status

### Host: @kamoru (FID: 802617)
- ✅ Host record exists
- ✅ Campaign assigned ("Blaze Africa LTD")
- ⏳ Needs Neynar API key
- ⏳ Needs signer authorization

### Campaign: Blaze Africa LTD
- ✅ Active status
- ✅ Banner image added
- ✅ Ad placement created
- ⏳ Waiting for real posting

## 🔄 Complete Flow

```
1. Get Neynar API Key → Add to .env.local
2. Create Signer → Authorize for FID 802617
3. Add Signer to Host Record
4. Run Assignment → Real post made! ✅
```

## 📋 API Key Verification

After adding your API key, restart the backend:

```bash
cd /Users/mac/farcaster-ad-rental/apps/backend
npm run dev
```

You should see:
```
✅ Neynar API client initialized
```

If you see:
```
⚠️  NEYNAR_API_KEY not set - using mock posting
```

Then the API key wasn't loaded properly.

## 🧪 Test Without Real Posting

You can test the flow without a real API key/signer:

```bash
npm run assign:campaign "Blaze"
```

This will:
- ✅ Match campaign to host
- ✅ Create ad placement
- ⚠️ Log "mock" posting (no real post)

## ⚡ Next Steps

Once you have your Neynar API key:

1. **Add API Key**: Edit `.env.local`
2. **Restart Backend**: `npm run dev`
3. **Create Signer**: Use Neynar dashboard or API
4. **Add to Host**: `npm run host:add-signer 802617 "signer-uuid"`
5. **Test Post**: `npm run assign:campaign "Blaze"`
6. **Verify**: Check Warpcast for the post!

## 🆘 Troubleshooting

### "Neynar API not configured"
- Check `.env.local` has `NEYNAR_API_KEY`
- Restart backend after adding key
- Verify key is valid in Neynar dashboard

### "Host has not authorized a signer"
- Create signer in Neynar dashboard
- Authorize for correct FID (802617)
- Add signer UUID to host record

### "Failed to post cast via Neynar"
- Check signer is still valid
- Verify FID matches
- Check API key permissions
- Look at Neynar dashboard for errors

## 📚 Resources

- Neynar Docs: https://docs.neynar.com/
- Neynar Dashboard: https://dev.neynar.com/
- Neynar API Reference: https://docs.neynar.com/reference
- Neynar SDK Docs: https://github.com/neynarxyz/nodejs-sdk

## 💡 Alternative: Test Signer

For immediate testing, you can use a test signer:

1. Create a test Farcaster account
2. Create signer for that account
3. Test posting there first
4. Then set up real host signer

This way you can verify everything works before involving @kamoru.



