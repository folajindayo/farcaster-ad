import { Campaign, Receipt, Epoch, EpochPayout, Settlement } from '../models';
import { MerkleBuilder } from './merkleBuilder';
import mongoose from 'mongoose';

/**
 * Hourly Payout System (PRD Section 4.5)
 * 
 * Process:
 * 1. Tracking Service logs impressions per host (offchain database)
 * 2. Every hour:
 *    - Service calculates each host's earned USDC
 *    - Creates a Merkle tree of (host_address, payout_amount)
 *    - Root hash is submitted to smart contract
 *    - Funds for that hour are transferred from escrow to payout contract
 * 3. Auto-Claim:
 *    - Operator keeper bot executes the batch distribution
 *    - Contract disburses funds directly to each host wallet
 *    - Hosts see hourly deposits in their wallet
 */

interface HostEarnings {
  hostAddress: string;
  impressions: number;
  clicks: number;
  earnings: string;
}

export class HourlyPayoutService {
  /**
   * Process hourly payouts for all campaigns (PRD Section 4.5)
   * Called by keeper bot every hour
   */
  static async processHourlyPayouts(): Promise<void> {
    try {
      console.log('🕐 Starting hourly payout process...');
      
      const now = new Date();
      const hourStart = new Date(now);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      console.log(`Processing payouts for hour: ${hourStart.toISOString()}`);
      
      // Get all unprocessed receipts for this hour
      const receipts = await Receipt.find({
        timestamp: {
          $gte: hourStart,
          $lt: hourEnd
        },
        processed: false
      }).lean();
      
      if (receipts.length === 0) {
        console.log('No unprocessed receipts found for this hour');
        return;
      }
      
      console.log(`Found ${receipts.length} unprocessed receipts`);
      
      // Group receipts by campaign
      const campaignReceipts = receipts.reduce((acc, receipt) => {
        const campaignId = receipt.campaignId.toString();
        if (!acc[campaignId]) {
          acc[campaignId] = [];
        }
        acc[campaignId].push(receipt);
        return {};
      }, {} as Record<string, any[]>);
      
      // Process each campaign's payouts
      for (const [campaignId, campaignReceiptsList] of Object.entries(campaignReceipts)) {
        await this.processCampaignHourlyPayout(campaignId, campaignReceiptsList as any[]);
      }
      
      console.log('✅ Hourly payout process completed');
    } catch (error) {
      console.error('❌ Error processing hourly payouts:', error);
      throw error;
    }
  }
  
  /**
   * Process hourly payout for a single campaign
   */
  private static async processCampaignHourlyPayout(
    campaignId: string,
    receipts: any[]
  ): Promise<void> {
    try {
      console.log(`Processing payout for campaign ${campaignId} with ${receipts.length} receipts`);
      
      // Get campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        console.log(`Campaign ${campaignId} not active, skipping`);
        return;
      }
      
      // Calculate earnings for each host
      const hostEarningsMap = new Map<string, HostEarnings>();
      
      for (const receipt of receipts) {
        const hostAddress = receipt.hostAddress.toLowerCase();
        
        if (!hostEarningsMap.has(hostAddress)) {
          hostEarningsMap.set(hostAddress, {
            hostAddress,
            impressions: 0,
            clicks: 0,
            earnings: '0'
          });
        }
        
        const hostData = hostEarningsMap.get(hostAddress)!;
        hostData.impressions += receipt.impressions || 0;
        hostData.clicks += receipt.clicks || 0;
      }
      
      // Calculate total impressions for this campaign this hour
      const totalImpressions = Array.from(hostEarningsMap.values())
        .reduce((sum, host) => sum + host.impressions, 0);
      
      if (totalImpressions === 0) {
        console.log(`No impressions for campaign ${campaignId}, skipping`);
        return;
      }
      
      // Calculate hourly budget allocation
      // Simple model: CPM-based pricing
      const cpm = parseFloat(campaign.schedule?.cpm || '5.00'); // Default $5 CPM
      const hourlyBudget = (totalImpressions / 1000) * cpm;
      
      // Check if campaign has enough budget
      const remainingBudget = parseFloat(campaign.budget) - parseFloat(campaign.spent || '0');
      const actualPayout = Math.min(hourlyBudget, remainingBudget);
      
      if (actualPayout <= 0) {
        console.log(`Campaign ${campaignId} has no remaining budget, marking as completed`);
        campaign.status = 'completed';
        await campaign.save();
        return;
      }
      
      // Apply platform fee (5% default)
      const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5');
      const platformFee = actualPayout * (platformFeePercent / 100);
      const hostsPayout = actualPayout - platformFee;
      
      // Calculate each host's earnings based on their impression share
      for (const hostData of hostEarningsMap.values()) {
        const impressionShare = hostData.impressions / totalImpressions;
        const earnings = hostsPayout * impressionShare;
        hostData.earnings = earnings.toFixed(6);
      }
      
      // Create Epoch for this payout cycle
      const epoch = await Epoch.create({
        startTime: receipts[0].timestamp,
        endTime: new Date(),
        totalReceipts: receipts.length,
        totalImpressions,
        totalPayout: actualPayout.toFixed(6),
        platformFee: platformFee.toFixed(6),
        status: 'pending'
      });
      
      // Generate Merkle tree
      const hostEarnings = Array.from(hostEarningsMap.values());
      const { merkleRoot, proofs } = await MerkleBuilder.buildMerkleTree(
        hostEarnings.map(h => ({
          address: h.hostAddress,
          amount: h.earnings
        }))
      );
      
      // Update epoch with Merkle root
      epoch.merkleRoot = merkleRoot;
      epoch.status = 'ready';
      await epoch.save();
      
      // Create EpochPayouts for each host
      for (let i = 0; i < hostEarnings.length; i++) {
        const host = hostEarnings[i];
        await EpochPayout.create({
          epochId: epoch._id,
          hostAddress: host.hostAddress,
          amount: host.earnings,
          impressions: host.impressions,
          clicks: host.clicks,
          merkleProof: proofs[i],
          claimed: false
        });
      }
      
      // Mark receipts as processed
      await Receipt.updateMany(
        {
          _id: { $in: receipts.map(r => r._id) }
        },
        {
          $set: {
            processed: true,
            epochId: epoch._id
          }
        }
      );
      
      // Update campaign spent
      campaign.spent = (parseFloat(campaign.spent || '0') + actualPayout).toFixed(6);
      
      // Check if campaign should be completed
      if (parseFloat(campaign.spent) >= parseFloat(campaign.budget)) {
        campaign.status = 'completed';
      }
      
      await campaign.save();
      
      console.log(`✅ Created epoch ${epoch._id} for campaign ${campaignId}`);
      console.log(`   - Total payout: $${actualPayout.toFixed(2)}`);
      console.log(`   - Platform fee: $${platformFee.toFixed(2)}`);
      console.log(`   - Hosts payout: $${hostsPayout.toFixed(2)}`);
      console.log(`   - Merkle root: ${merkleRoot}`);
      console.log(`   - ${hostEarnings.length} hosts will receive payouts`);
      
    } catch (error) {
      console.error(`Error processing campaign ${campaignId} payout:`, error);
      throw error;
    }
  }
  
  /**
   * Submit Merkle root to smart contract
   * This would be called by the keeper bot after generating the Merkle tree
   */
  static async submitMerkleRoot(epochId: string): Promise<void> {
    try {
      const epoch = await Epoch.findById(epochId);
      if (!epoch) {
        throw new Error('Epoch not found');
      }
      
      if (epoch.status !== 'ready') {
        throw new Error('Epoch not ready for submission');
      }
      
      // TODO: Integrate with blockchain service to submit to smart contract
      // const tx = await merkleDistributorContract.submitRoot(
      //   epoch.merkleRoot,
      //   epoch.totalPayout
      // );
      
      // For now, just mark as submitted
      epoch.status = 'submitted';
      epoch.submittedAt = new Date();
      await epoch.save();
      
      console.log(`Merkle root submitted for epoch ${epochId}`);
    } catch (error) {
      console.error('Error submitting Merkle root:', error);
      throw error;
    }
  }
  
  /**
   * Execute batch distribution
   * Called by keeper bot after Merkle root is submitted
   */
  static async executeBatchDistribution(epochId: string): Promise<void> {
    try {
      const epoch = await Epoch.findById(epochId);
      if (!epoch) {
        throw new Error('Epoch not found');
      }
      
      if (epoch.status !== 'submitted') {
        throw new Error('Epoch not submitted yet');
      }
      
      // Get all payouts for this epoch
      const payouts = await EpochPayout.find({ epochId });
      
      // TODO: Integrate with blockchain service to execute batch distribution
      // const tx = await merkleDistributorContract.batchDistribute(
      //   payouts.map(p => ({
      //     address: p.hostAddress,
      //     amount: p.amount,
      //     proof: p.merkleProof
      //   }))
      // );
      
      // For now, just mark as distributed
      epoch.status = 'distributed';
      epoch.distributedAt = new Date();
      await epoch.save();
      
      // Mark all payouts as claimed
      await EpochPayout.updateMany(
        { epochId },
        { $set: { claimed: true, claimedAt: new Date() } }
      );
      
      console.log(`✅ Batch distribution executed for epoch ${epochId}`);
      console.log(`   - ${payouts.length} hosts received payouts`);
    } catch (error) {
      console.error('Error executing batch distribution:', error);
      throw error;
    }
  }
  
  /**
   * Get host earnings for current hour (real-time)
   * Used for Host Dashboard (PRD Section 4.6)
   */
  static async getCurrentHourEarnings(hostAddress: string): Promise<any> {
    try {
      const hourStart = new Date();
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      const receipts = await Receipt.find({
        hostAddress: hostAddress.toLowerCase(),
        timestamp: {
          $gte: hourStart,
          $lt: hourEnd
        },
        processed: false
      }).lean();
      
      const totalImpressions = receipts.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const totalClicks = receipts.reduce((sum, r) => sum + (r.clicks || 0), 0);
      
      // Estimate earnings (will be finalized at end of hour)
      const estimatedCPM = 5.00; // Default CPM
      const estimatedEarnings = (totalImpressions / 1000) * estimatedCPM * 0.95; // After 5% platform fee
      
      return {
        hourStart,
        hourEnd,
        impressions: totalImpressions,
        clicks: totalClicks,
        estimatedEarnings: estimatedEarnings.toFixed(6),
        receiptsCount: receipts.length
      };
    } catch (error) {
      console.error('Error getting current hour earnings:', error);
      throw error;
    }
  }
  
  /**
   * Get host lifetime earnings
   * Used for Host Dashboard (PRD Section 4.6)
   */
  static async getLifetimeEarnings(hostAddress: string): Promise<any> {
    try {
      const payouts = await EpochPayout.find({
        hostAddress: hostAddress.toLowerCase()
      }).lean();
      
      const totalEarnings = payouts.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
      const claimedEarnings = payouts
        .filter(p => p.claimed)
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
      const pendingEarnings = totalEarnings - claimedEarnings;
      
      return {
        totalEarnings: totalEarnings.toFixed(6),
        claimedEarnings: claimedEarnings.toFixed(6),
        pendingEarnings: pendingEarnings.toFixed(6),
        totalPayouts: payouts.length,
        claimedPayouts: payouts.filter(p => p.claimed).length
      };
    } catch (error) {
      console.error('Error getting lifetime earnings:', error);
      throw error;
    }
  }
}

export default HourlyPayoutService;