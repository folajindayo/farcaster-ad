import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function testNeynarAPI() {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  if (!apiKey) {
    console.error('❌ NEYNAR_API_KEY not set');
    return;
  }
  
  console.log('🔑 API Key found');
  console.log('🔧 Initializing Neynar client...\n');
  
  try {
    const config = new Configuration({
      apiKey: apiKey,
    });
    const client = new NeynarAPIClient(config);
    
    console.log('✅ Client initialized successfully!\n');
    
    // Test: Fetch user info
    console.log('📊 Testing: Fetch user info for FID 802617...');
    try {
      const userInfo = await client.fetchBulkUsers([802617]);
      console.log('✅ User fetch successful!');
      console.log('User:', userInfo.users[0]?.username);
      console.log('Display Name:', userInfo.users[0]?.display_name);
      console.log('Follower Count:', userInfo.users[0]?.follower_count);
      console.log('');
    } catch (error: any) {
      console.log('❌ User fetch failed:', error.message);
      console.log('');
    }
    
    // Check available methods
    console.log('🔍 Checking available cast methods...\n');
    
    // List all methods that contain 'cast' or 'publish'
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      .filter(name => 
        name.toLowerCase().includes('cast') || 
        name.toLowerCase().includes('publish') ||
        name.toLowerCase().includes('signer')
      );
    
    console.log('Available methods:');
    methods.forEach(method => {
      console.log(`  - ${method}`);
    });
    console.log('');
    
    // Try to check what parameters publishCast needs
    console.log('📋 For posting, we typically need:');
    console.log('  1. A signer UUID (from user authorization)');
    console.log('  2. Or use user\'s existing signer');
    console.log('  3. Cast text and embeds');
    console.log('');
    
    console.log('💡 Next steps:');
    console.log('  1. User needs to authorize the app (via Frame or OAuth)');
    console.log('  2. Or we can look for alternative posting methods');
    console.log('  3. Check if there\'s a /cast/create endpoint we can use');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testNeynarAPI();



