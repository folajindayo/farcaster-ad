import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Host } from '../models/Host';
import { User } from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function createHostFromUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find user with role 'host'
    const hostUser = await User.findOne({ role: 'host' });
    
    if (!hostUser) {
      console.log('❌ No user with role "host" found');
      console.log('   Please onboard a user as a host first');
      await mongoose.disconnect();
      return;
    }
    
    console.log('👤 Found host user:');
    console.log(`   Name: ${hostUser.displayName || hostUser.username}`);
    console.log(`   Username: @${hostUser.username}`);
    console.log(`   FID: ${hostUser.farcasterId}`);
    console.log(`   User ID: ${hostUser._id}`);
    
    // Check if Host record already exists
    const existingHost = await Host.findOne({ farcasterId: hostUser.farcasterId });
    
    if (existingHost) {
      console.log('\n⚠️  Host record already exists:');
      console.log(`   Host ID: ${existingHost._id}`);
      console.log(`   Status: ${existingHost.status}`);
      console.log(`   Accepting Campaigns: ${existingHost.acceptingCampaigns}`);
      await mongoose.disconnect();
      return;
    }
    
    // Create Host record
    console.log('\n🚀 Creating Host record...');
    
    const host = new Host({
      userId: hostUser._id,
      farcasterId: hostUser.farcasterId,
      username: hostUser.username,
      displayName: hostUser.displayName || hostUser.username,
      followerCount: 1000, // Default follower count for testing
      status: 'active',
      acceptingCampaigns: true,
      adTypes: ['banner', 'pinned_cast'],
      categories: [], // Accept all categories
      minimumCPM: 0, // Accept all CPM rates
      miniAppPermissionsGranted: true,
      lastPermissionUpdate: new Date(),
      isActive: true,
      totalEarnings: 0,
      pendingEarnings: 0,
      preferences: {}
    });
    
    await host.save();
    
    console.log('\n✅ Host record created successfully!');
    console.log(`   Host ID: ${host._id}`);
    console.log(`   Status: ${host.status}`);
    console.log(`   Accepting Campaigns: ${host.acceptingCampaigns}`);
    console.log(`   Follower Count: ${host.followerCount}`);
    console.log(`   Ad Types: ${host.adTypes.join(', ')}`);
    console.log(`   Minimum CPM: $${host.minimumCPM}`);
    console.log(`   Categories: ${host.categories.length === 0 ? 'All' : host.categories.join(', ')}`);
    
    console.log('\n💡 Next steps:');
    console.log(`   1. Run: npm run assign:campaign 8ebf4161`);
    console.log(`   2. This will assign the active campaign to this host`);
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createHostFromUser();



