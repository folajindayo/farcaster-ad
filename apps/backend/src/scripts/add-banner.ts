import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Campaign } from '../models/Campaign';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function addBannerToCampaign(campaignIdentifier: string, bannerUrl?: string) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find campaign
    const orConditions: any[] = [
      { title: new RegExp(campaignIdentifier, 'i') }
    ];
    
    if (campaignIdentifier.length === 24 && /^[0-9a-fA-F]+$/.test(campaignIdentifier)) {
      orConditions.push({ _id: campaignIdentifier });
    }
    
    let campaign = await Campaign.findOne({ $or: orConditions });
    
    if (!campaign) {
      const campaigns = await Campaign.find({});
      campaign = campaigns.find(c => c._id.toString().includes(campaignIdentifier));
    }
    
    if (!campaign) {
      console.log(`❌ Campaign "${campaignIdentifier}" not found`);
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 Found Campaign:');
    console.log(`   ID: ${campaign._id}`);
    console.log(`   Title: ${campaign.title}`);
    console.log(`   Type: ${campaign.type}`);
    console.log('');
    
    // Use provided banner URL or a default test banner
    const newBannerUrl = bannerUrl || 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?w=1200&h=400&fit=crop';
    
    console.log(`🖼️  Adding banner image: ${newBannerUrl}`);
    
    // Update campaign with banner
    if (!campaign.creative) {
      campaign.creative = {};
    }
    campaign.creative.bannerImage = newBannerUrl;
    campaign.creative.mediaUrl = newBannerUrl;
    
    // Also update creativeAssets for backward compatibility
    if (!campaign.creativeAssets) {
      campaign.creativeAssets = {};
    }
    campaign.creativeAssets.imageUrl = newBannerUrl;
    
    await campaign.save();
    
    console.log('✅ Banner added successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log(`   1. Re-run assignment: npm run assign:campaign "${campaign.title}"`);
    console.log(`   2. The banner should now deploy to the host`);
    console.log('');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get args
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage:');
  console.log('  npm run campaign:add-banner "Campaign Name"');
  console.log('  npm run campaign:add-banner "Campaign Name" "https://example.com/banner.jpg"');
  process.exit(1);
}

const campaignId = args[0];
const bannerUrl = args[1];

addBannerToCampaign(campaignId, bannerUrl);



