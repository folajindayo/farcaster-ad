import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Host } from '../models/Host';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

async function createSignerForHost() {
  if (!NEYNAR_API_KEY) {
    console.error('❌ NEYNAR_API_KEY not set');
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  try {
    const host = await Host.findOne({ farcasterId: 802617 });
    if (!host) {
      console.error('❌ Host not found');
      return;
    }

    console.log('📋 Host: @' + host.username + ' (FID: ' + host.farcasterId + ')\n');

    const config = new Configuration({
      apiKey: NEYNAR_API_KEY,
    });
    const client = new NeynarAPIClient(config);

    console.log('🔑 Attempting to create signer...\n');
    console.log('Method 1: Using createSigner()...');
    
    try {
      // Try basic createSigner
      const signerResponse = await client.createSigner();
      
      console.log('✅ Signer created!');
      console.log('Signer UUID:', signerResponse.signer_uuid);
      console.log('Public Key:', signerResponse.public_key);
      console.log('Status:', signerResponse.status);
      
      if (signerResponse.signer_approval_url) {
        console.log('\n🔗 Authorization URL:');
        console.log(signerResponse.signer_approval_url);
        console.log('\n📋 Steps:');
        console.log('1. Visit the URL above');
        console.log('2. Sign in as @kamoru');
        console.log('3. Authorize the signer');
        console.log('4. Run: npm run signer:add 802617 "' + signerResponse.signer_uuid + '"');
      }
    } catch (error: any) {
      console.log('❌ createSigner failed:', error.message);
      
      if (error.response?.status === 402) {
        console.log('\n💡 The 402 error might be specific to createSigner.');
        console.log('Let me check if there are alternative methods...\n');
        
        // Try alternative: Check if user already has signers
        console.log('Method 2: Checking existing signers for FID 802617...');
        try {
          const signers = await client.fetchSigners(802617);
          console.log('✅ Found existing signers:', signers);
          
          if (signers && (signers as any).signers && (signers as any).signers.length > 0) {
            const signer = (signers as any).signers[0];
            console.log('\n🎉 User already has a signer!');
            console.log('Signer UUID:', signer.signer_uuid);
            console.log('\nRun: npm run signer:add 802617 "' + signer.signer_uuid + '"');
          } else {
            console.log('⚠️ No existing signers found');
          }
        } catch (signerError: any) {
          console.log('❌ Could not fetch signers:', signerError.message);
        }
        
        // Explain the situation
        console.log('\n━'.repeat(60));
        console.log('📚 UNDERSTANDING NEYNAR SIGNERS:');
        console.log('━'.repeat(60));
        console.log('\nOn the FREE plan, you have:');
        console.log('✅ Read /user APIs');
        console.log('✅ Read & Write /cast APIs');
        console.log('\nHowever, to POST on behalf of a user (@kamoru), you need:');
        console.log('1️⃣  User Authorization - User must authorize your app');
        console.log('2️⃣  A Signer - Token that lets you post for them');
        console.log('\n💡 WORKAROUND OPTIONS:');
        console.log('\nOption A: User creates signer via Warpcast');
        console.log('  1. User goes to Warpcast settings');
        console.log('  2. Connects your app');
        console.log('  3. Gives you the signer token');
        console.log('\nOption B: Use a Frame for authorization');
        console.log('  1. Create a Farcaster Frame');
        console.log('  2. User interacts with Frame');
        console.log('  3. Frame gets posting permission');
        console.log('\nOption C: Manual posting (testing)');
        console.log('  1. Copy the cast content');
        console.log('  2. Post manually as @kamoru');
        console.log('  3. Verify the format works');
        console.log('\nOption D: Check Neynar Dashboard');
        console.log('  1. Go to https://dev.neynar.com/');
        console.log('  2. Check if you can create signers there');
        console.log('  3. Dashboard might have different limits');
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createSignerForHost();



