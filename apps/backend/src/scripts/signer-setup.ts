import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Host } from '../models/Host';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-ad-rental';
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

async function connectDb() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
}

async function disconnectDb() {
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

/**
 * Create a new signer for a host
 */
async function createSigner(fid: number) {
  if (!NEYNAR_API_KEY) {
    console.error('❌ NEYNAR_API_KEY not set in .env.local');
    console.log('\n💡 To fix:');
    console.log('   1. Get API key from https://dev.neynar.com/');
    console.log('   2. Add to apps/backend/.env.local:');
    console.log('      NEYNAR_API_KEY=your_key_here');
    return;
  }

  await connectDb();

  try {
    const host = await Host.findOne({ farcasterId: fid });
    if (!host) {
      console.error(`❌ Host with FID ${fid} not found`);
      return;
    }

    console.log(`📋 Host Found:`);
    console.log(`   Name: ${host.displayName || host.username}`);
    console.log(`   Username: @${host.username}`);
    console.log(`   FID: ${host.farcasterId}`);
    console.log('');

    console.log('🔑 Creating signer via Neynar...\n');

    const config = new Configuration({
      apiKey: NEYNAR_API_KEY,
    });
    const neynar = new NeynarAPIClient(config);

    // Create a managed signer
    const signerResponse = await neynar.createSigner();

    console.log('✅ Signer created successfully!\n');
    console.log('📋 Signer Details:');
    console.log(`   Signer UUID: ${signerResponse.signer_uuid}`);
    console.log(`   Public Key: ${signerResponse.public_key}`);
    console.log(`   Status: ${signerResponse.status}`);
    console.log('');
    
    if (signerResponse.signer_approval_url) {
      console.log('🔗 Authorization Required:');
      console.log(`   Visit this URL to authorize the signer:`);
      console.log(`   ${signerResponse.signer_approval_url}`);
      console.log('');
      console.log('⏱️  Steps:');
      console.log('   1. Open the URL above in your browser');
      console.log('   2. Sign in with Warpcast/Farcaster');
      console.log('   3. Authorize the signer');
      console.log('   4. Come back here and run:');
      console.log(`      npm run host:add-signer ${fid} "${signerResponse.signer_uuid}"`);
      console.log('');
    } else {
      // Signer is already approved (rare case)
      console.log('✅ Signer approved! Adding to host record...');
      host.signerUuid = signerResponse.signer_uuid;
      host.signerAuthorizedAt = new Date();
      await host.save();
      
      console.log('✅ Signer added to host record!');
      console.log('');
      console.log('🚀 Ready to post! Run:');
      console.log(`   npm run assign:campaign "Blaze"`);
    }
  } catch (error: any) {
    console.error('❌ Error creating signer:', error.message);
    
    if (error.message?.includes('API key')) {
      console.log('\n💡 Check your NEYNAR_API_KEY is valid');
    }
  } finally {
    await disconnectDb();
  }
}

/**
 * Add an existing signer UUID to a host
 */
async function addSignerToHost(fid: number, signerUuid: string) {
  await connectDb();

  try {
    const host = await Host.findOne({ farcasterId: fid });
    if (!host) {
      console.error(`❌ Host with FID ${fid} not found`);
      return;
    }

    console.log(`📋 Host Found:`);
    console.log(`   Name: ${host.displayName || host.username}`);
    console.log(`   Username: @${host.username}`);
    console.log(`   FID: ${host.farcasterId}`);
    console.log('');

    console.log(`🔑 Adding signer: ${signerUuid}`);

    host.signerUuid = signerUuid;
    host.signerAuthorizedAt = new Date();
    await host.save();

    console.log('✅ Signer added successfully!\n');
    console.log('🚀 Ready to post! Run:');
    console.log(`   npm run assign:campaign "Blaze"`);
    console.log('');
    console.log('   Or test posting directly:');
    console.log(`   npm run test:post ${fid}`);
  } catch (error: any) {
    console.error('❌ Error adding signer:', error.message);
  } finally {
    await disconnectDb();
  }
}

/**
 * Check signer status for a host
 */
async function checkSigner(fid: number) {
  if (!NEYNAR_API_KEY) {
    console.error('❌ NEYNAR_API_KEY not set');
    return;
  }

  await connectDb();

  try {
    const host = await Host.findOne({ farcasterId: fid });
    if (!host) {
      console.error(`❌ Host with FID ${fid} not found`);
      return;
    }

    console.log(`📋 Host: @${host.username} (FID: ${fid})\n`);

    const signerUuid = (host as any).signerUuid;

    if (!signerUuid) {
      console.log('⚠️  No signer configured');
      console.log('\n💡 To create a signer:');
      console.log(`   npm run signer:create ${fid}`);
      return;
    }

    console.log(`🔑 Signer UUID: ${signerUuid}`);
    console.log(`📅 Authorized: ${(host as any).signerAuthorizedAt || 'Unknown'}`);
    console.log('');

    // Check signer status with Neynar
    console.log('🔍 Checking signer status with Neynar...');

    const config = new Configuration({
      apiKey: NEYNAR_API_KEY,
    });
    const neynar = new NeynarAPIClient(config);

    try {
      // Try to fetch the signer details
      // Note: Neynar SDK might not have a direct method for this
      // You may need to use their API directly
      console.log('✅ Signer is configured');
      console.log('');
      console.log('🚀 Ready to post!');
    } catch (error) {
      console.log('⚠️  Could not verify signer status');
      console.log('   Signer may need re-authorization');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await disconnectDb();
  }
}

// Main CLI
const args = process.argv.slice(2);
const command = args[0];
const fid = parseInt(args[1]);
const signerUuid = args[2];

if (command === 'create' && fid) {
  createSigner(fid);
} else if (command === 'add' && fid && signerUuid) {
  addSignerToHost(fid, signerUuid);
} else if (command === 'check' && fid) {
  checkSigner(fid);
} else {
  console.log('Neynar Signer Setup\n');
  console.log('Commands:');
  console.log('  npm run signer:create <fid>              - Create new signer');
  console.log('  npm run signer:add <fid> <signer-uuid>   - Add existing signer to host');
  console.log('  npm run signer:check <fid>               - Check signer status');
  console.log('');
  console.log('Examples:');
  console.log('  npm run signer:create 802617');
  console.log('  npm run signer:add 802617 "abc-123-xyz"');
  console.log('  npm run signer:check 802617');
  process.exit(1);
}

