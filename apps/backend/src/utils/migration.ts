import { database } from '../config/database';
import mongoose from 'mongoose';

export interface MigrationResult {
  success: boolean;
  message: string;
  collectionsCreated?: string[];
  indexesCreated?: string[];
  error?: string;
}

export class DatabaseMigration {
  private static instance: DatabaseMigration;

  private constructor() {}

  public static getInstance(): DatabaseMigration {
    if (!DatabaseMigration.instance) {
      DatabaseMigration.instance = new DatabaseMigration();
    }
    return DatabaseMigration.instance;
  }

  /**
   * Initialize database with collections and indexes
   */
  public async initializeDatabase(): Promise<MigrationResult> {
    try {
      if (!database.isConnectedToDatabase()) {
        throw new Error('Database not connected');
      }

      const collectionsCreated: string[] = [];
      const indexesCreated: string[] = [];

      // Import models to ensure they are registered with mongoose
      await import('../models');

      // Get all registered models
      const models = [
        'User', 'Host', 'Advertiser', 'Campaign', 
        'AdPlacement', 'Payout', 'PayoutCycle', 
        'ImpressionEvent', 'ClickEvent'
      ];

      // Create collections if they don't exist
      for (const modelName of models) {
        try {
          const Model = require('../models')[modelName];
          if (Model) {
            await Model.createCollection();
            collectionsCreated.push(modelName.toLowerCase());
          }
        } catch (error) {
          console.warn(`Collection ${modelName} might already exist:`, error);
        }
      }

      // Create indexes
      const indexResults = await this.createIndexes();
      indexesCreated.push(...indexResults);

      return {
        success: true,
        message: 'Database initialized successfully',
        collectionsCreated,
        indexesCreated
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to initialize database',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create all necessary indexes for performance
   */
  private async createIndexes(): Promise<string[]> {
    const indexesCreated: string[] = [];

    try {
      // User indexes
      const User = require('../models').User;
      await User.collection.createIndex({ farcasterId: 1 }, { unique: true });
      await User.collection.createIndex({ walletAddress: 1 }, { unique: true });
      indexesCreated.push('users_farcasterId', 'users_walletAddress');

      // Host indexes
      const Host = require('../models').Host;
      await Host.collection.createIndex({ userId: 1 });
      indexesCreated.push('hosts_userId');

      // Advertiser indexes
      const Advertiser = require('../models').Advertiser;
      await Advertiser.collection.createIndex({ userId: 1 });
      indexesCreated.push('advertisers_userId');

      // Campaign indexes
      const Campaign = require('../models').Campaign;
      await Campaign.collection.createIndex({ advertiserId: 1 });
      await Campaign.collection.createIndex({ status: 1 });
      indexesCreated.push('campaigns_advertiserId', 'campaigns_status');

      // AdPlacement indexes
      const AdPlacement = require('../models').AdPlacement;
      await AdPlacement.collection.createIndex({ campaignId: 1 });
      await AdPlacement.collection.createIndex({ hostId: 1 });
      await AdPlacement.collection.createIndex({ status: 1 });
      indexesCreated.push('ad_placements_campaignId', 'ad_placements_hostId', 'ad_placements_status');

      // Payout indexes
      const Payout = require('../models').Payout;
      await Payout.collection.createIndex({ hostId: 1 });
      await Payout.collection.createIndex({ status: 1 });
      indexesCreated.push('payouts_hostId', 'payouts_status');

      // Event indexes
      const ImpressionEvent = require('../models').ImpressionEvent;
      await ImpressionEvent.collection.createIndex({ placementId: 1 });
      await ImpressionEvent.collection.createIndex({ timestamp: 1 });
      indexesCreated.push('impression_events_placementId', 'impression_events_timestamp');

      const ClickEvent = require('../models').ClickEvent;
      await ClickEvent.collection.createIndex({ placementId: 1 });
      await ClickEvent.collection.createIndex({ timestamp: 1 });
      indexesCreated.push('click_events_placementId', 'click_events_timestamp');

    } catch (error) {
      console.warn('Some indexes might already exist:', error);
    }

    return indexesCreated;
  }

  /**
   * Drop all collections (use with caution!)
   */
  public async dropAllCollections(): Promise<MigrationResult> {
    try {
      if (!database.isConnectedToDatabase()) {
        throw new Error('Database not connected');
      }

      const collections = [
        'users', 'hosts', 'advertisers', 'campaigns',
        'ad_placements', 'payouts', 'payout_cycles',
        'impression_events', 'click_events'
      ];

      for (const collectionName of collections) {
        try {
          await database.getConnection().db.collection(collectionName).drop();
        } catch (error) {
          console.warn(`Collection ${collectionName} might not exist:`, error);
        }
      }

      return {
        success: true,
        message: 'All collections dropped successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to drop collections',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStats(): Promise<any> {
    try {
      if (!database.isConnectedToDatabase()) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      const collections = await db.listCollections().toArray();
      const collectionStats = [];

      for (const collection of collections) {
        const stats = await db.collection(collection.name).stats();
        collectionStats.push({
          name: collection.name,
          count: stats.count,
          size: stats.size
        });
      }

      return {
        database: stats,
        collections: collectionStats
      };

    } catch (error) {
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }
}

export const migration = DatabaseMigration.getInstance();
