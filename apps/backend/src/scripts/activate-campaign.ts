/**
 * Campaign Activation Script
 * Activates a specific campaign by ID
 * 
 * Usage:
 *   tsx src/scripts/activate-campaign.ts <campaignId>
 *   tsx src/scripts/activate-campaign.ts 8ebf4161
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Import the Campaign model
import { Campaign } from '../models/Campaign';

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function activateCampaign(campaignId: string) {
  try {
    console.log(`\n🔍 Searching for campaign: ${campaignId}`);

    // Try to find by campaignId field first
    let campaign = await Campaign.findOne({ campaignId: campaignId });

    // If not found, try by _id
    if (!campaign && mongoose.Types.ObjectId.isValid(campaignId)) {
      campaign = await Campaign.findById(campaignId);
    }

    // If still not found, try partial match on _id string
    if (!campaign) {
      const campaigns = await Campaign.find({});
      campaign = campaigns.find((c: any) => 
        c._id.toString().includes(campaignId) ||
        c.campaignId?.includes(campaignId)
      );
    }

    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaignId}`);
      console.log('\n💡 Available campaigns:');
      const allCampaigns = await Campaign.find({}).limit(10);
      allCampaigns.forEach((c: any) => {
        console.log(`  - ${c._id} | ${c.campaignId || 'N/A'} | ${c.title || c.name || 'Untitled'} | Status: ${c.status}`);
      });
      return;
    }

    console.log(`\n✅ Found campaign:`);
    console.log(`  ID: ${campaign._id}`);
    console.log(`  Campaign ID: ${(campaign as any).campaignId || 'N/A'}`);
    console.log(`  Title: ${(campaign as any).title || (campaign as any).name || 'Untitled'}`);
    console.log(`  Current Status: ${(campaign as any).status}`);
    console.log(`  Advertiser ID: ${(campaign as any).advertiserId || 'N/A'}`);
    console.log(`  Budget: $${(campaign as any).budget || 0}`);

    // Check current status
    if ((campaign as any).status === 'active') {
      console.log(`\n⚠️  Campaign is already active!`);
      return;
    }

    // Update to active status
    console.log(`\n🔄 Activating campaign...`);
    
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaign._id,
      {
        $set: {
          status: 'active',
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    console.log(`\n✅ Campaign activated successfully!`);
    console.log(`  New Status: ${(updatedCampaign as any).status}`);
    console.log(`  Updated At: ${(updatedCampaign as any).updatedAt}`);

    // Log full campaign details
    console.log(`\n📊 Full Campaign Details:`);
    console.log(JSON.stringify(updatedCampaign, null, 2));

  } catch (error) {
    console.error('❌ Error activating campaign:', error);
    throw error;
  }
}

async function listCampaigns() {
  try {
    const campaigns = await Campaign.find({}).limit(20).sort({ createdAt: -1 });

    console.log(`\n📋 Recent Campaigns (${campaigns.length}):\n`);
    console.log('ID'.padEnd(26) + 'Campaign ID'.padEnd(15) + 'Title'.padEnd(30) + 'Status'.padEnd(12) + 'Budget');
    console.log('─'.repeat(100));

    campaigns.forEach((c: any) => {
      const id = c._id.toString().slice(-8);
      const campaignId = (c.campaignId || 'N/A').slice(0, 12);
      const title = (c.title || c.name || 'Untitled').slice(0, 28);
      const status = c.status || 'unknown';
      const budget = `$${c.budget || 0}`;

      console.log(
        id.padEnd(26) +
        campaignId.padEnd(15) +
        title.padEnd(30) +
        status.padEnd(12) +
        budget
      );
    });

  } catch (error) {
    console.error('❌ Error listing campaigns:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    console.log('='.repeat(60));
    console.log('Campaign Activation Script');
    console.log('='.repeat(60));

    await connectDB();

    if (!command || command === 'list' || command === '--list' || command === '-l') {
      await listCampaigns();
    } else {
      await activateCampaign(command);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Script completed successfully');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Handle SIGINT gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main();

