import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Host } from '../models/Host';
import { User } from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';

async function debugHosts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check all users
    const allUsers = await User.find({}).select('username farcasterId role displayName');
    console.log(`👥 Total Users in Database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n📋 All Users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.displayName || user.username} (@${user.username})`);
        console.log(`      FID: ${user.farcasterId}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      ID: ${user._id}`);
      });
    }
    
    // Check all hosts (regardless of status)
    const allHosts = await Host.find({});
    console.log(`\n🏠 Total Hosts in Database: ${allHosts.length}`);
    
    if (allHosts.length > 0) {
      console.log('\n📋 All Hosts (detailed):');
      allHosts.forEach((host, index) => {
        console.log(`\n   ${index + 1}. ${host.displayName || host.username} (@${host.username})`);
        console.log(`      FID: ${host.farcasterId}`);
        console.log(`      User ID: ${host.userId}`);
        console.log(`      Status: ${host.status || 'undefined'}`);
        console.log(`      Accepting Campaigns: ${host.acceptingCampaigns}`);
        console.log(`      Follower Count: ${host.followerCount || 'N/A'}`);
        console.log(`      Categories: ${host.categories?.join(', ') || 'None'}`);
        console.log(`      Minimum CPM: $${host.minimumCPM || 0}`);
        console.log(`      Ad Types: ${host.adTypes?.join(', ') || 'None'}`);
        console.log(`      Created: ${host.createdAt}`);
      });
    } else {
      console.log('\n⚠️  No hosts found in database!');
      console.log('\n🔍 This could mean:');
      console.log('   1. Host onboarding didn\'t complete successfully');
      console.log('   2. The host record wasn\'t saved to the database');
      console.log('   3. There might be an error in the onboarding route');
    }
    
    // Check active hosts with query
    const activeHosts = await Host.find({ 
      status: 'active',
      acceptingCampaigns: { $ne: false }
    });
    console.log(`\n✅ Active & Accepting Hosts: ${activeHosts.length}`);
    
    // Check by different criteria
    const statusActive = await Host.find({ status: 'active' });
    const statusUndefined = await Host.find({ status: { $exists: false } });
    const acceptingTrue = await Host.find({ acceptingCampaigns: true });
    const acceptingUndefined = await Host.find({ acceptingCampaigns: { $exists: false } });
    
    console.log('\n📊 Status Breakdown:');
    console.log(`   status: 'active' → ${statusActive.length}`);
    console.log(`   status: undefined → ${statusUndefined.length}`);
    console.log(`   acceptingCampaigns: true → ${acceptingTrue.length}`);
    console.log(`   acceptingCampaigns: undefined → ${acceptingUndefined.length}`);
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugHosts();



