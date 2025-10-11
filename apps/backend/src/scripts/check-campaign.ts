import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Campaign } from '../models/Campaign';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function checkCampaign(campaignName: string) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find campaign by name
    const campaign = await Campaign.findOne({
      title: new RegExp(campaignName, 'i')
    });
    
    if (!campaign) {
      console.log(`❌ Campaign "${campaignName}" not found`);
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 Campaign Details:');
    console.log(`   ID: ${campaign._id}`);
    console.log(`   Title: ${campaign.title}`);
    console.log(`   Type: ${campaign.type}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Budget: $${campaign.budget}`);
    console.log('');
    
    console.log('🎨 Creative Assets:');
    console.log(`   Banner Image: ${campaign.creative?.bannerImage || campaign.creativeAssets?.imageUrl || 'NOT SET ❌'}`);
    console.log(`   Media URL: ${campaign.creative?.mediaUrl || 'NOT SET'}`);
    console.log(`   Pinned Cast Text: ${campaign.creative?.pinnedCastText || campaign.creativeAssets?.castText || 'NOT SET'}`);
    console.log(`   Pinned Cast Media: ${campaign.creative?.pinnedCastMedia || 'NOT SET'}`);
    console.log(`   CTA Text: ${campaign.creative?.ctaText || 'NOT SET'}`);
    console.log(`   CTA URL: ${campaign.creative?.ctaUrl || campaign.creativeAssets?.externalUrl || 'NOT SET'}`);
    console.log('');
    
    console.log('🎯 Targeting:');
    console.log(`   Follower Range: ${campaign.targeting?.followerRange || campaign.targeting?.audience || 'Any'}`);
    console.log(`   Categories: ${campaign.targeting?.categories?.join(', ') || 'Any'}`);
    console.log('');
    
    console.log('📅 Schedule:');
    console.log(`   Start Date: ${campaign.schedule?.startDate || campaign.startDate || 'Not set'}`);
    console.log(`   End Date: ${campaign.schedule?.endDate || campaign.endDate || 'Not set'}`);
    console.log(`   CPM: $${campaign.schedule?.cpm || 'Not set'}`);
    console.log('');
    
    // Check if banner is missing
    const hasBanner = campaign.creative?.bannerImage || campaign.creativeAssets?.imageUrl;
    const hasPinnedCast = campaign.creative?.pinnedCastText || campaign.creativeAssets?.castText;
    
    if (!hasBanner && !hasPinnedCast) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   This campaign has NO creative assets!');
      console.log('   Cannot deploy ads without banner image or cast content.');
      console.log('');
      console.log('💡 To fix this:');
      console.log(`   Run: npm run campaign:add-creative "${campaign._id}"`);
      console.log('');
    } else if (campaign.type === 'banner' && !hasBanner) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   This is a BANNER campaign but has no banner image!');
      console.log('');
      console.log('💡 To fix this:');
      console.log(`   Run: npm run campaign:add-banner "${campaign._id}" "https://example.com/banner.jpg"`);
      console.log('');
    } else if (campaign.type === 'pinned_cast' && !hasPinnedCast) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   This is a PINNED_CAST campaign but has no cast text!');
      console.log('');
    } else {
      console.log('✅ Campaign has creative assets!');
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get campaign name from args
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npm run campaign:check "Campaign Name"');
  process.exit(1);
}

checkCampaign(args.join(' '));



