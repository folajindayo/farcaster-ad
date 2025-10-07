import { 
  ImpressionEvent, 
  ClickEvent, 
  AdPlacement, 
  Campaign, 
  Receipt, 
  HostProfile 
} from '../models';
import { ethers } from 'ethers';
import { getKeeper } from './keeper';

/**
 * IntegrationBridge connects the tracking system to the payout system
 * This is the critical link that ensures hosts get paid for real ad activity
 */
export class IntegrationBridge {
  
  /**
   * Convert ImpressionEvent to Receipt for merkle payouts
   * This is the KEY function that bridges the two systems
   */
  static async createReceiptFromImpression(
    impressionEvent: any,
    placement: any
  ): Promise<Receipt> {
    try {
      // Get host wallet address from HostProfile
      const host = await HostProfile.findOne({
        where: { id: placement.hostId }
      });

      if (!host) {
        throw new Error(`Host not found for placement ${placement.id}`);
      }

      // Create receipt for merkle payout system
      const receipt = await Receipt.create({
        campaignId: placement.campaignId,
        hostAddress: host.walletAddress.toLowerCase(),
        timestamp: new Date(),
        impressions: 1,
        clicks: 0,
        dwellMs: impressionEvent.dwellMs || 1500, // Default to valid dwell time
        viewerFingerprint: impressionEvent.fingerprint || impressionEvent.ipAddress,
        signature: `IMP_${impressionEvent.id}`,
        processed: false // Will be processed in next hourly batch
      });

      console.log(`Created receipt ${receipt.id} for impression ${impressionEvent.id}`);
      return receipt;
    } catch (error) {
      console.error('Failed to create receipt from impression:', error);
      throw error;
    }
  }

  /**
   * Convert ClickEvent to Receipt update
   */
  static async updateReceiptFromClick(
    clickEvent: any,
    placement: any
  ): Promise<void> {
    try {
      const host = await HostProfile.findOne({
        where: { id: placement.hostId }
      });

      if (!host) {
        console.warn(`Host not found for placement ${placement.id}`);
        return;
      }

      // Find recent receipt for this host and campaign
      const recentReceipt = await Receipt.findOne({
        where: {
          campaignId: placement.campaignId,
          hostAddress: host.walletAddress.toLowerCase(),
          processed: false
        },
        order: [['timestamp', 'DESC']]
      });

      if (recentReceipt) {
        // Update existing receipt with click
        await recentReceipt.save({
          clicks: recentReceipt.clicks + 1
        });
      } else {
        // Create new receipt for click
        await Receipt.create({
          campaignId: placement.campaignId,
          hostAddress: host.walletAddress.toLowerCase(),
          timestamp: new Date(),
          impressions: 0,
          clicks: 1,
          dwellMs: 2000,
          viewerFingerprint: clickEvent.fingerprint || clickEvent.ipAddress,
          signature: `CLK_${clickEvent.id}`,
          processed: false
        });
      }
    } catch (error) {
      console.error('Failed to update receipt from click:', error);
    }
  }

  /**
   * Link Campaign model to CampaignEscrow contract
   */
  static async linkCampaignToContract(
    campaignId: string,
    contractCampaignId: number,
    txHash: string
  ): Promise<void> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Store on-chain campaign ID
      (campaign as any).onChainId = contractCampaignId;
      (campaign as any).fundingTxHash = txHash;
      (campaign as any).fundedAt = new Date();
      await campaign.save();

      console.log(`Linked campaign ${campaignId} to contract ID ${contractCampaignId}`);
    } catch (error) {
      console.error('Failed to link campaign to contract:', error);
      throw error;
    }
  }

  /**
   * Sync campaign spending between off-chain and on-chain
   */
  static async syncCampaignSpending(campaignId: string): Promise<void> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || !(campaign as any).onChainId) {
        console.warn(`Campaign ${campaignId} not linked to contract`);
        return;
      }

      // Calculate total spent from receipts
      const receipts = await Receipt.find({
        campaignId: (campaign as any).onChainId,
        processed: true
      });

      const totalImpressions = receipts.reduce((sum, r) => sum + r.impressions, 0);
      const totalClicks = receipts.reduce((sum, r) => sum + r.clicks, 0);
      
      // Calculate spending (simplified - would use actual CPM/CPC)
      const impressionCost = totalImpressions * 0.001; // $0.001 per impression
      const clickCost = totalClicks * 0.01; // $0.01 per click
      const totalSpent = impressionCost + clickCost;

      // Update campaign spending
      campaign.spent = totalSpent;
      campaign.totalImpressions = totalImpressions;
      campaign.totalClicks = totalClicks;
      await campaign.save();

      console.log(`Synced campaign ${campaignId}: spent $${totalSpent}`);
    } catch (error) {
      console.error('Failed to sync campaign spending:', error);
    }
  }

  /**
   * Bridge AdPlacement metrics to hourly epochs
   */
  static async bridgePlacementToEpoch(
    placementId: string,
    epochHour: number
  ): Promise<void> {
    try {
      const placement = await AdPlacement.findById(placementId);
      if (!placement) {
        console.warn(`Placement ${placementId} not found`);
        return;
      }

      // Get host
      const host = await HostProfile.findById(placement.hostId);
      if (!host) {
        console.warn(`Host not found for placement ${placementId}`);
        return;
      }

      // Get metrics for this hour (simplified)
      const impressions = await ImpressionEvent.countDocuments({
        placementId,
        createdAt: {
          $gte: new Date(epochHour * 3600000),
          $lt: new Date((epochHour + 1) * 3600000)
        }
      });

      const clicks = await ClickEvent.countDocuments({
        placementId,
        createdAt: {
          $gte: new Date(epochHour * 3600000),
          $lt: new Date((epochHour + 1) * 3600000)
        }
      });

      if (impressions > 0 || clicks > 0) {
        // Create receipt for this hour's activity
        await Receipt.create({
          campaignId: placement.campaignId,
          hostAddress: host.walletAddress.toLowerCase(),
          timestamp: new Date(epochHour * 3600000),
          impressions,
          clicks,
          dwellMs: 1500,
          processed: false,
          signature: `EPOCH_${epochHour}_${placementId}`
        });
      }
    } catch (error) {
      console.error('Failed to bridge placement to epoch:', error);
    }
  }

  /**
   * Batch convert all unprocessed events to receipts
   * Run this periodically to ensure all activity is captured
   */
  static async batchConvertEventsToReceipts(): Promise<number> {
    let converted = 0;
    
    try {
      // Get unprocessed impression events
      const unprocessedImpressions = await ImpressionEvent.find({
        processedForPayout: false
      })
      .limit(1000)
      .populate('placementId')
      .lean();

      for (const impression of unprocessedImpressions) {
        try {
          await this.createReceiptFromImpression(
            impression,
            impression.placementId
          );
          
          // Mark as processed
          await ImpressionEvent.findByIdAndUpdate(impression._id, { processedForPayout: true });
          converted++;
        } catch (err) {
          console.error(`Failed to convert impression ${impression.id}:`, err);
        }
      }

      // Get unprocessed click events
      const unprocessedClicks = await ClickEvent.find({
        processedForPayout: false
      })
      .limit(1000)
      .populate('placementId')
      .lean();

      for (const click of unprocessedClicks) {
        try {
          await this.updateReceiptFromClick(
            click,
            click.placementId
          );
          
          await ClickEvent.findByIdAndUpdate(click._id, { processedForPayout: true });
          converted++;
        } catch (err) {
          console.error(`Failed to convert click ${click.id}:`, err);
        }
      }

      console.log(`Converted ${converted} events to receipts`);
      return converted;
    } catch (error) {
      console.error('Batch conversion failed:', error);
      return converted;
    }
  }

  /**
   * Validate system integration
   * Check that both systems are properly connected
   */
  static async validateIntegration(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if hosts have wallet addresses
      const hostsWithoutWallet = await HostProfile.countDocuments({
        walletAddress: null,
        isOptedIn: true
      });

      if (hostsWithoutWallet > 0) {
        issues.push(`${hostsWithoutWallet} hosts missing wallet addresses`);
      }

      // Check if campaigns are linked to contracts
      const unlinkedCampaigns = await Campaign.countDocuments({
        status: 'active',
        onChainId: null
      });

      if (unlinkedCampaigns > 0) {
        issues.push(`${unlinkedCampaigns} active campaigns not linked to contracts`);
      }

      // Check if receipts are being created
      const recentReceipts = await Receipt.countDocuments({
        timestamp: {
          $gte: new Date(Date.now() - 3600000) // Last hour
        }
      });

      if (recentReceipts === 0) {
        issues.push('No receipts created in the last hour');
      }

      // Check if keeper is running
      const keeper = getKeeper();
      if (!keeper) {
        issues.push('Keeper service not initialized');
      } else {
        const status = keeper.getStatus();
        if (!status.running) {
          issues.push('Keeper service not running');
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Integration validation failed:', error);
      return {
        isValid: false,
        issues: ['Validation failed: ' + (error as Error).message]
      };
    }
  }

  /**
   * Initialize integration bridge
   * Set up listeners and scheduled tasks
   */
  static async initialize(): Promise<void> {
    console.log('Initializing Integration Bridge...');

    // Run batch conversion every 5 minutes
    setInterval(async () => {
      await this.batchConvertEventsToReceipts();
    }, 5 * 60 * 1000);

    // Sync campaign spending every 10 minutes  
    setInterval(async () => {
      const campaigns = await Campaign.find({ status: 'active' });
      for (const campaign of campaigns) {
        await this.syncCampaignSpending(campaign.id);
      }
    }, 10 * 60 * 1000);

    // Validate integration every hour
    setInterval(async () => {
      const validation = await this.validateIntegration();
      if (!validation.isValid) {
        console.error('Integration issues detected:', validation.issues);
        // Could send alerts here
      }
    }, 60 * 60 * 1000);

    console.log('Integration Bridge initialized');
  }
}
