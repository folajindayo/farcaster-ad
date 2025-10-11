/**
 * Database Index Creation Script
 * Creates optimal indexes for query performance
 * 
 * Time Complexity Improvements with Indexes:
 * - Without indexes: O(n) full collection scan
 * - With indexes: O(log n) B-tree lookup
 * 
 * Run this script after database migrations or on initial setup
 * 
 * Usage:
 *   npm run create-indexes
 *   or
 *   ts-node src/scripts/create-indexes.ts
 */

import mongoose from 'mongoose';
import { HostProfile, Campaign, AdPlacement, Receipt, EpochPayout, Epoch } from '../models';
import { logger } from '../utils/logger';
import { connectDB } from '../config/database';

/**
 * Index definitions for each collection
 * Based on query patterns identified in services
 */
const indexDefinitions = {
  // Host Profile Indexes
  hostProfile: [
    // Primary lookup fields - single field indexes
    { keys: { fid: 1 }, options: { unique: true, name: 'idx_host_fid' } },
    { keys: { walletAddress: 1 }, options: { unique: true, name: 'idx_host_wallet' } },
    { keys: { username: 1 }, options: { name: 'idx_host_username' } },
    { keys: { referralCode: 1 }, options: { sparse: true, name: 'idx_host_referral' } },
    
    // Query optimization indexes
    { keys: { status: 1 }, options: { name: 'idx_host_status' } },
    { keys: { isOptedIn: 1 }, options: { name: 'idx_host_optin' } },
    { keys: { followerCount: -1 }, options: { name: 'idx_host_followers' } },
    { keys: { 'reputation.score': -1 }, options: { name: 'idx_host_reputation' } },
    
    // Compound indexes for common queries
    {
      keys: { status: 1, isOptedIn: 1 },
      options: { name: 'idx_host_active' },
    },
    {
      keys: { status: 1, followerCount: -1, 'reputation.score': -1 },
      options: { name: 'idx_host_matching' },
    },
    
    // Timestamp indexes for analytics
    { keys: { createdAt: -1 }, options: { name: 'idx_host_created' } },
    { keys: { optInDate: -1 }, options: { name: 'idx_host_optin_date' } },
  ],

  // Campaign Indexes
  campaign: [
    // Primary lookup
    { keys: { advertiserId: 1 }, options: { name: 'idx_campaign_advertiser' } },
    
    // Status queries
    { keys: { status: 1 }, options: { name: 'idx_campaign_status' } },
    { keys: { 'schedule.startDate': 1 }, options: { name: 'idx_campaign_start' } },
    { keys: { 'schedule.endDate': 1 }, options: { name: 'idx_campaign_end' } },
    
    // Compound indexes
    {
      keys: { status: 1, 'schedule.startDate': 1 },
      options: { name: 'idx_campaign_active' },
    },
    {
      keys: { advertiserId: 1, status: 1 },
      options: { name: 'idx_campaign_by_advertiser' },
    },
    
    // Timestamps
    { keys: { createdAt: -1 }, options: { name: 'idx_campaign_created' } },
    { keys: { updatedAt: -1 }, options: { name: 'idx_campaign_updated' } },
  ],

  // Ad Placement Indexes
  adPlacement: [
    // Foreign key indexes
    { keys: { campaignId: 1 }, options: { name: 'idx_placement_campaign' } },
    { keys: { hostId: 1 }, options: { name: 'idx_placement_host' } },
    { keys: { advertiserId: 1 }, options: { name: 'idx_placement_advertiser' } },
    
    // Status and type
    { keys: { status: 1 }, options: { name: 'idx_placement_status' } },
    { keys: { slotType: 1 }, options: { name: 'idx_placement_slot' } },
    
    // Compound indexes for common queries
    {
      keys: { campaignId: 1, hostId: 1 },
      options: { unique: true, name: 'idx_placement_unique' },
    },
    {
      keys: { campaignId: 1, status: 1 },
      options: { name: 'idx_placement_campaign_status' },
    },
    {
      keys: { hostId: 1, status: 1 },
      options: { name: 'idx_placement_host_status' },
    },
    
    // Performance metrics (for analytics queries)
    {
      keys: { 'metrics.impressions': -1 },
      options: { name: 'idx_placement_impressions' },
    },
    
    // Timestamps
    { keys: { startDate: 1 }, options: { name: 'idx_placement_start' } },
    { keys: { endDate: 1 }, options: { name: 'idx_placement_end' } },
  ],

  // Receipt Indexes (heavy read/write, critical for performance)
  receipt: [
    // Primary query patterns
    { keys: { hostAddress: 1 }, options: { name: 'idx_receipt_host' } },
    { keys: { campaignId: 1 }, options: { name: 'idx_receipt_campaign' } },
    { keys: { processed: 1 }, options: { name: 'idx_receipt_processed' } },
    { keys: { timestamp: -1 }, options: { name: 'idx_receipt_timestamp' } },
    
    // Compound indexes for hourly payout processing
    {
      keys: { hostAddress: 1, timestamp: -1 },
      options: { name: 'idx_receipt_host_time' },
    },
    {
      keys: { processed: 1, timestamp: -1 },
      options: { name: 'idx_receipt_pending' },
    },
    {
      keys: { campaignId: 1, processed: 1, timestamp: -1 },
      options: { name: 'idx_receipt_campaign_processing' },
    },
    
    // Epoch tracking
    { keys: { epochId: 1 }, options: { sparse: true, name: 'idx_receipt_epoch' } },
  ],

  // Epoch Payout Indexes
  epochPayout: [
    // Primary queries
    { keys: { epochId: 1 }, options: { name: 'idx_payout_epoch' } },
    { keys: { hostAddress: 1 }, options: { name: 'idx_payout_host' } },
    { keys: { claimed: 1 }, options: { name: 'idx_payout_claimed' } },
    
    // Compound indexes
    {
      keys: { hostAddress: 1, claimed: 1 },
      options: { name: 'idx_payout_host_claimed' },
    },
    {
      keys: { epochId: 1, claimed: 1 },
      options: { name: 'idx_payout_epoch_claimed' },
    },
    
    // Timestamps
    { keys: { claimedAt: -1 }, options: { sparse: true, name: 'idx_payout_claimed_at' } },
  ],

  // Epoch Indexes
  epoch: [
    { keys: { status: 1 }, options: { name: 'idx_epoch_status' } },
    { keys: { startTime: -1 }, options: { name: 'idx_epoch_start' } },
    { keys: { endTime: -1 }, options: { name: 'idx_epoch_end' } },
    {
      keys: { status: 1, startTime: -1 },
      options: { name: 'idx_epoch_status_time' },
    },
  ],
};

/**
 * Create indexes for a specific model
 */
async function createIndexesForModel(
  model: mongoose.Model<any>,
  indexes: Array<{ keys: any; options?: any }>,
  modelName: string
): Promise<void> {
  logger.info(`Creating indexes for ${modelName}...`);

  for (const { keys, options } of indexes) {
    try {
      await model.collection.createIndex(keys, options || {});
      logger.info(`✓ Index created: ${options?.name || JSON.stringify(keys)}`);
    } catch (error: any) {
      // Index already exists - this is fine
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        logger.debug(`Index already exists: ${options?.name || JSON.stringify(keys)}`);
      } else {
        logger.error(`Failed to create index for ${modelName}`, error, {
          keys,
          options,
        });
      }
    }
  }

  logger.info(`Completed indexes for ${modelName}\n`);
}

/**
 * List all indexes for a model
 */
async function listIndexes(model: mongoose.Model<any>, modelName: string): Promise<void> {
  const indexes = await model.collection.getIndexes();
  logger.info(`${modelName} indexes:`, indexes);
}

/**
 * Analyze index usage (requires MongoDB 3.2+)
 */
async function analyzeIndexUsage(model: mongoose.Model<any>, modelName: string): Promise<void> {
  try {
    const stats = await model.collection.aggregate([{ $indexStats: {} }]).toArray();
    logger.info(`${modelName} index usage:`, stats);
  } catch (error) {
    logger.warn(`Index stats not available for ${modelName}`, error);
  }
}

/**
 * Drop unused indexes
 * BE CAREFUL - only run this if you're sure the indexes are not needed
 */
async function dropUnusedIndexes(
  model: mongoose.Model<any>,
  modelName: string,
  minOps: number = 100
): Promise<void> {
  try {
    const stats = await model.collection.aggregate([{ $indexStats: {} }]).toArray();
    
    for (const stat of stats) {
      const indexName = stat.name;
      const ops = stat.accesses?.ops || 0;
      
      // Never drop _id index
      if (indexName === '_id_') continue;
      
      if (ops < minOps) {
        logger.warn(`Index ${indexName} has low usage (${ops} ops). Consider dropping.`);
        // Uncomment to actually drop:
        // await model.collection.dropIndex(indexName);
        // logger.info(`Dropped index: ${indexName}`);
      }
    }
  } catch (error) {
    logger.warn(`Could not analyze unused indexes for ${modelName}`, error);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    logger.info('=================================================');
    logger.info('Database Index Creation Script');
    logger.info('=================================================\n');

    // Connect to database
    await connectDB();
    logger.info('✓ Connected to database\n');

    // Create indexes for each model
    await createIndexesForModel(HostProfile, indexDefinitions.hostProfile, 'HostProfile');
    await createIndexesForModel(Campaign, indexDefinitions.campaign, 'Campaign');
    await createIndexesForModel(AdPlacement, indexDefinitions.adPlacement, 'AdPlacement');
    await createIndexesForModel(Receipt, indexDefinitions.receipt, 'Receipt');
    await createIndexesForModel(EpochPayout, indexDefinitions.epochPayout, 'EpochPayout');
    await createIndexesForModel(Epoch, indexDefinitions.epoch, 'Epoch');

    logger.info('\n=================================================');
    logger.info('All indexes created successfully!');
    logger.info('=================================================\n');

    // List all indexes (optional)
    if (process.env.VERBOSE === 'true') {
      logger.info('\nListing all indexes...\n');
      await listIndexes(HostProfile, 'HostProfile');
      await listIndexes(Campaign, 'Campaign');
      await listIndexes(AdPlacement, 'AdPlacement');
      await listIndexes(Receipt, 'Receipt');
      await listIndexes(EpochPayout, 'EpochPayout');
      await listIndexes(Epoch, 'Epoch');
    }

    // Analyze index usage (requires MongoDB 3.2+)
    if (process.env.ANALYZE === 'true') {
      logger.info('\nAnalyzing index usage...\n');
      await analyzeIndexUsage(HostProfile, 'HostProfile');
      await analyzeIndexUsage(Campaign, 'Campaign');
      await analyzeIndexUsage(AdPlacement, 'AdPlacement');
      await analyzeIndexUsage(Receipt, 'Receipt');
      await analyzeIndexUsage(EpochPayout, 'EpochPayout');
      await analyzeIndexUsage(Epoch, 'Epoch');
    }

    logger.info('\n✓ Index creation complete!');
    logger.info('Query performance should be significantly improved.\n');
    
    process.exit(0);
  } catch (error) {
    logger.error('Index creation failed', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createIndexesForModel, listIndexes, analyzeIndexUsage, dropUnusedIndexes };



