import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Campaign } from '../models/Campaign';
import { Host } from '../models/Host';
import { autoAssignment } from '../services/autoAssignment';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDb() {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

/**
 * Check hosts in the database
 */
async function checkHosts() {
  console.log('\n📊 Checking hosts in database...');
  
  const totalHosts = await Host.countDocuments();
  const activeHosts = await Host.countDocuments({ status: 'active' });
  const acceptingHosts = await Host.countDocuments({ 
    status: 'active',
    acceptingCampaigns: { $ne: false }
  });
  
  console.log(`\n📈 Host Statistics:`);
  console.log(`   Total hosts: ${totalHosts}`);
  console.log(`   Active hosts: ${activeHosts}`);
  console.log(`   Accepting campaigns: ${acceptingHosts}`);
  
  if (acceptingHosts > 0) {
    console.log('\n👥 Active Hosts:');
    const hosts = await Host.find({ 
      status: 'active',
      acceptingCampaigns: { $ne: false }
    }).select('username farcasterId followerCount categories minimumCPM').limit(10);
    
    hosts.forEach(host => {
      console.log(`   • @${host.username} (FID: ${host.farcasterId})`);
      console.log(`     Followers: ${host.followerCount || 'N/A'}`);
      console.log(`     Categories: ${host.categories?.join(', ') || 'Any'}`);
      console.log(`     Min CPM: $${host.minimumCPM || 0}`);
    });
  } else {
    console.log('\n⚠️  No active hosts found!');
    console.log('   To test assignment, you need to:');
    console.log('   1. Sign in with Farcaster');
    console.log('   2. Complete host onboarding at /host/onboarding');
    console.log('   3. Set your host status to "active"');
  }
}

/**
 * Assign a specific campaign to hosts
 */
async function assignCampaign(campaignIdentifier: string) {
  await connectDb();
  
  try {
    console.log(`\n🔍 Searching for campaign: ${campaignIdentifier}`);
    
    // Build query dynamically to avoid ObjectId cast errors
    const orConditions: any[] = [
      { campaignId: campaignIdentifier },
      { title: new RegExp(campaignIdentifier, 'i') }
    ];
    
    // Only add _id search if it looks like a valid ObjectId (24 hex chars)
    if (campaignIdentifier.length === 24 && /^[0-9a-fA-F]+$/.test(campaignIdentifier)) {
      orConditions.push({ _id: campaignIdentifier });
    }
    
    // Find the campaign
    let campaign = await Campaign.findOne({ $or: orConditions });
    
    if (!campaign) {
      // Try partial match for _id
      const campaigns = await Campaign.find({});
      campaign = campaigns.find(c => c._id.toString().includes(campaignIdentifier));
    }
    
    if (!campaign) {
      console.error(`\n❌ Campaign with identifier "${campaignIdentifier}" not found.`);
      return;
    }
    
    console.log('\n✅ Found campaign:');
    console.log(`   ID: ${campaign._id}`);
    console.log(`   Title: ${campaign.title || 'Untitled'}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   CPM: $${campaign.schedule?.cpm || '5.00'}`);
    console.log(`   Type: ${campaign.type || 'both'}`);
    
    if (campaign.targeting) {
      console.log(`   Target Audience: ${campaign.targeting.followerRange || campaign.targeting.audience || 'Any'}`);
      console.log(`   Categories: ${campaign.targeting.categories?.join(', ') || 'Any'}`);
    }
    
    // Check hosts
    await checkHosts();
    
    // Proceed with assignment
    console.log(`\n🚀 Starting auto-assignment process...`);
    console.log('─'.repeat(50));
    
    const result = await autoAssignment.processFundedCampaign(campaign._id.toString());
    
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Assignment Results:');
    console.log(`   Campaign: ${campaign.title}`);
    console.log(`   Hosts Matched: ${result.hostsMatched || 0}`);
    console.log(`   Hosts Deployed: ${result.hostsDeployed || 0}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    
    if (result.placements && result.placements.length > 0) {
      console.log('\n📋 Placements Created:');
      result.placements.forEach((placement: any, index: number) => {
        console.log(`   ${index + 1}. Host: ${placement.hostId}`);
        console.log(`      Status: ${placement.status}`);
        console.log(`      Ad Type: ${placement.adType}`);
        console.log(`      Start: ${placement.startDate}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error during assignment:', error);
  } finally {
    await disconnectDb();
  }
}

/**
 * Run periodic matching for all active campaigns
 */
async function runPeriodicMatching() {
  await connectDb();
  
  try {
    console.log('\n🔄 Running periodic matching for all active campaigns...');
    
    // Check hosts first
    await checkHosts();
    
    console.log('\n🚀 Starting periodic matching process...');
    console.log('─'.repeat(50));
    
    const result = await autoAssignment.runPeriodicMatching();
    
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Periodic Matching Results:');
    console.log(`   Campaigns Processed: ${result.campaignsProcessed}`);
    console.log(`   Total New Matches: ${result.totalNewMatches}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 Campaign Details:');
      result.results.forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. Campaign: ${item.campaignId}`);
        console.log(`      New Matches: ${item.newMatches}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error during periodic matching:', error);
  } finally {
    await disconnectDb();
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const campaignId = args[1];

if (command === 'check') {
  connectDb().then(checkHosts).then(disconnectDb);
} else if (command === 'periodic') {
  runPeriodicMatching();
} else if (command === 'assign' && campaignId) {
  assignCampaign(campaignId);
} else {
  console.log('\n📖 Usage:');
  console.log('   npm run assign:check         - Check host statistics');
  console.log('   npm run assign:campaign <id> - Assign specific campaign to hosts');
  console.log('   npm run assign:periodic      - Run periodic matching for all active campaigns');
  console.log('\nExamples:');
  console.log('   npm run assign:campaign 8ebf4161');
  console.log('   npm run assign:campaign "Blaze Africa LTD"');
  console.log('   npm run assign:periodic');
  process.exit(0);
}

