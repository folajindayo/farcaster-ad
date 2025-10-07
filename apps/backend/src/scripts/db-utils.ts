#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { database } from '../config/database';
import { migration } from '../utils/migration';

// Load environment variables
dotenv.config();

async function main() {
  const command = process.argv[2];

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster_ad_rental';
    await database.connect({ uri: mongoUri });

    switch (command) {
      case 'init':
        console.log('🚀 Initializing database...');
        const result = await migration.initializeDatabase();
        if (result.success) {
          console.log('✅ Database initialized successfully');
          console.log('Collections created:', result.collectionsCreated?.join(', '));
          console.log('Indexes created:', result.indexesCreated?.join(', '));
        } else {
          console.error('❌ Database initialization failed:', result.message);
          process.exit(1);
        }
        break;

      case 'drop':
        console.log('⚠️ Dropping all collections...');
        const dropResult = await migration.dropAllCollections();
        if (dropResult.success) {
          console.log('✅ All collections dropped successfully');
        } else {
          console.error('❌ Failed to drop collections:', dropResult.message);
          process.exit(1);
        }
        break;

      case 'stats':
        console.log('📊 Getting database statistics...');
        const stats = await migration.getDatabaseStats();
        console.log('Database Stats:', JSON.stringify(stats, null, 2));
        break;

      case 'status':
        console.log('🔍 Database connection status:');
        console.log('Connected:', database.isConnectedToDatabase());
        console.log('State:', database.getConnectionState());
        break;

      default:
        console.log('Available commands:');
        console.log('  init    - Initialize database with collections and indexes');
        console.log('  drop    - Drop all collections (DANGER!)');
        console.log('  stats   - Show database statistics');
        console.log('  status  - Show connection status');
        console.log('');
        console.log('Usage: tsx src/scripts/db-utils.ts <command>');
        break;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

main();


