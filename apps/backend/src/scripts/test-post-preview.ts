import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Campaign } from '../models/Campaign';
import { Host } from '../models/Host';
import { AdPlacement } from '../models/AdPlacement';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function showPostPreview() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the campaign and host
    const campaign = await Campaign.findOne({ title: /Blaze/i });
    const host = await Host.findOne({ farcasterId: 802617 });
    
    if (!campaign || !host) {
      console.log('❌ Campaign or host not found');
      return;
    }
    
    console.log('📊 Campaign & Host Details:\n');
    console.log('Campaign:');
    console.log(`  Title: ${campaign.title}`);
    console.log(`  Type: ${campaign.type}`);
    console.log(`  Budget: $${campaign.budget}`);
    console.log(`  Banner: ${campaign.creative?.bannerImage || 'Not set'}`);
    console.log('');
    
    console.log('Host:');
    console.log(`  Name: ${host.displayName}`);
    console.log(`  Username: @${host.username}`);
    console.log(`  FID: ${host.farcasterId}`);
    console.log(`  Followers: ${host.followerCount}`);
    console.log('');
    
    // Build the cast content
    const castText = `🎯 ${campaign.title}\n\n${campaign.description || 'Check out this amazing opportunity!'}\n\n${campaign.creative?.ctaText || 'Learn More'}: ${campaign.creative?.ctaUrl || 'https://example.com'}`;
    
    const embeds = [];
    if (campaign.creative?.bannerImage) {
      embeds.push(campaign.creative.bannerImage);
    }
    
    console.log('━'.repeat(60));
    console.log('📝 CAST PREVIEW - What Would Be Posted:');
    console.log('━'.repeat(60));
    console.log('');
    console.log(castText);
    console.log('');
    if (embeds.length > 0) {
      console.log('🖼️  Embeds:');
      embeds.forEach(url => console.log(`   ${url}`));
      console.log('');
    }
    console.log('━'.repeat(60));
    console.log('');
    
    // Check if placement exists
    const placement = await AdPlacement.findOne({ 
      campaignId: campaign._id,
      hostId: host._id 
    });
    
    if (placement) {
      console.log('✅ Ad Placement Exists:');
      console.log(`   ID: ${placement._id}`);
      console.log(`   Status: ${placement.status}`);
      console.log(`   Ad Type: ${placement.adType}`);
      console.log(`   Created: ${placement.createdAt}`);
      console.log('');
    }
    
    // Show next steps
    console.log('━'.repeat(60));
    console.log('🔧 WORKAROUND FOR NEYNAR SIGNER (402 Error):');
    console.log('━'.repeat(60));
    console.log('');
    console.log('The Neynar API returned 402 (Payment Required) for signer creation.');
    console.log('This feature requires a paid Neynar plan.');
    console.log('');
    console.log('📋 Option 1: Manual Signer Setup');
    console.log('  1. Go to https://dev.neynar.com/');
    console.log('  2. Sign in and upgrade to a paid plan');
    console.log('  3. Create a developer-managed signer for FID 802617');
    console.log('  4. Copy the signer UUID');
    console.log(`  5. Run: npm run signer:add 802617 "your-signer-uuid"`);
    console.log('');
    console.log('📋 Option 2: Use Farcaster Frames');
    console.log('  1. Create a Frame that requests posting permission');
    console.log('  2. User visits Frame and authorizes');
    console.log('  3. Store the signer token');
    console.log('  4. Use for posting');
    console.log('');
    console.log('📋 Option 3: Direct Warpcast Integration');
    console.log('  1. Use Warpcast API directly (if you have access)');
    console.log('  2. Or use the Farcaster Hub API');
    console.log('');
    console.log('📋 Option 4: Manual Post (For Testing)');
    console.log('  As @kamoru, manually post:');
    console.log('  ────────────────────────────────────');
    console.log(castText);
    if (embeds.length > 0) {
      console.log('  With image:', embeds[0]);
    }
    console.log('  ────────────────────────────────────');
    console.log('');
    console.log('💡 Recommended: Option 1 or 4 for immediate testing');
    console.log('');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showPostPreview();



