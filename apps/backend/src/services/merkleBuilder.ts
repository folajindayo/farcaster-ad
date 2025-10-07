import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { Op } from 'sequelize';
import { 
  Campaign, 
  Receipt, 
  Epoch, 
  EpochPayout, 
  Host 
} from '../models';

export interface HostPayout {
  index: number;
  hostAddress: string;
  amount: string; // in USDC (6 decimals)
  impressions: number;
  clicks: number;
  score: number;
}

export interface MerkleData {
  root: string;
  leaves: string[];
  proofs: { [hostAddress: string]: string[] };
  payouts: HostPayout[];
  totalAmount: string;
}

export class MerkleBuilder {
  private readonly MINIMUM_DWELL_MS = 1000;
  private readonly CLICK_WEIGHT = 10;
  private readonly MINIMUM_PAYOUT_USDC = 0.01; // $0.01 minimum

  /**
   * Get current epoch number (hour-based)
   */
  getCurrentEpoch(): number {
    return Math.floor(Date.now() / (3600 * 1000));
  }

  /**
   * Get epoch time boundaries
   */
  getEpochBounds(epoch: number): { start: Date; end: Date } {
    const startMs = epoch * 3600 * 1000;
    const endMs = (epoch + 1) * 3600 * 1000;
    return {
      start: new Date(startMs),
      end: new Date(endMs)
    };
  }

  /**
   * Build merkle tree for a campaign epoch
   */
  async buildMerkleTree(
    campaignId: number, 
    epoch: number
  ): Promise<MerkleData> {
    const { start, end } = this.getEpochBounds(epoch);

    // Fetch campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Fetch receipts for this epoch
    const receipts = await Receipt.find({
      campaignId,
      timestamp: {
        $gte: start,
        $lt: end
      },
      processed: false
    }).sort({ timestamp: 1 });

    // Apply fraud filters and aggregate by host
    const hostAggregates = await this.aggregateReceipts(receipts);
    
    // Calculate payouts based on campaign budget
    const hourlyBudget = this.calculateHourlyBudget(campaign);
    const payouts = this.calculatePayouts(hostAggregates, hourlyBudget);

    // Filter out tiny payouts below threshold
    const filteredPayouts = payouts.filter(p => 
      parseFloat(p.amount) >= this.MINIMUM_PAYOUT_USDC
    );

    // Sort by host address for deterministic ordering
    filteredPayouts.sort((a, b) => 
      a.hostAddress.toLowerCase().localeCompare(b.hostAddress.toLowerCase())
    );

    // Assign indices
    filteredPayouts.forEach((payout, index) => {
      payout.index = index;
    });

    // Build merkle tree
    const { tree, leaves, proofs } = this.buildTree(filteredPayouts);
    const root = tree.getHexRoot();

    // Calculate total amount
    const totalAmount = filteredPayouts
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toFixed(6);

    return {
      root,
      leaves,
      proofs,
      payouts: filteredPayouts,
      totalAmount
    };
  }

  /**
   * Aggregate receipts with fraud filtering
   */
  private async aggregateReceipts(
    receipts: Receipt[]
  ): Promise<Map<string, { impressions: number; clicks: number }>> {
    const hostMap = new Map<string, { 
      impressions: number; 
      clicks: number;
      fingerprints: Set<string>;
      lastSeen: number;
    }>();

    for (const receipt of receipts) {
      // Skip if dwell time too low (likely bot)
      if (receipt.dwellMs && receipt.dwellMs < this.MINIMUM_DWELL_MS) {
        continue;
      }

      const hostData = hostMap.get(receipt.hostAddress) || {
        impressions: 0,
        clicks: 0,
        fingerprints: new Set<string>(),
        lastSeen: 0
      };

      // Deduplicate by fingerprint within short window (30 seconds)
      const now = receipt.timestamp.getTime();
      if (receipt.viewerFingerprint) {
        if (hostData.fingerprints.has(receipt.viewerFingerprint) &&
            now - hostData.lastSeen < 30000) {
          // Skip duplicate view from same viewer
          continue;
        }
        hostData.fingerprints.add(receipt.viewerFingerprint);
      }

      hostData.impressions += receipt.impressions;
      hostData.clicks += receipt.clicks;
      hostData.lastSeen = now;

      hostMap.set(receipt.hostAddress, hostData);
    }

    // Convert to simple aggregate map
    const aggregates = new Map<string, { impressions: number; clicks: number }>();
    for (const [host, data] of hostMap) {
      // Apply caps per host (e.g., max 1000 impressions per hour)
      const cappedImpressions = Math.min(data.impressions, 1000);
      const cappedClicks = Math.min(data.clicks, 100);

      aggregates.set(host, {
        impressions: cappedImpressions,
        clicks: cappedClicks
      });
    }

    return aggregates;
  }

  /**
   * Calculate hourly budget for campaign
   */
  private calculateHourlyBudget(campaign: any): number {
    // Simple allocation: divide remaining budget by remaining hours
    const remainingHours = Math.max(
      1,
      Math.floor((campaign.endDate.getTime() - Date.now()) / (3600 * 1000))
    );
    
    const remainingBudget = parseFloat(campaign.remainingAmount || campaign.fundedAmount);
    const hourlyBudget = remainingBudget / remainingHours;
    
    // Cap at reasonable hourly max (e.g., $1000/hour)
    return Math.min(hourlyBudget, 1000);
  }

  /**
   * Calculate payouts based on scores
   */
  private calculatePayouts(
    aggregates: Map<string, { impressions: number; clicks: number }>,
    hourlyBudget: number
  ): HostPayout[] {
    const payouts: HostPayout[] = [];
    let totalScore = 0;

    // Calculate scores
    const scores = new Map<string, number>();
    for (const [host, data] of aggregates) {
      const score = data.impressions + (data.clicks * this.CLICK_WEIGHT);
      scores.set(host, score);
      totalScore += score;
    }

    // Allocate budget proportionally
    for (const [host, score] of scores) {
      if (score === 0) continue;

      const data = aggregates.get(host)!;
      const amount = (hourlyBudget * score / totalScore);
      
      payouts.push({
        index: 0, // Will be assigned later
        hostAddress: host,
        amount: amount.toFixed(6),
        impressions: data.impressions,
        clicks: data.clicks,
        score
      });
    }

    return payouts;
  }

  /**
   * Build merkle tree from payouts
   */
  private buildTree(payouts: HostPayout[]): {
    tree: MerkleTree;
    leaves: string[];
    proofs: { [hostAddress: string]: string[] };
  } {
    // Create leaves
    const leaves = payouts.map(payout => {
      const amountWei = ethers.utils.parseUnits(payout.amount, 6); // USDC has 6 decimals
      return keccak256(
        ethers.utils.solidityPack(
          ['uint256', 'address', 'uint256'],
          [payout.index, payout.hostAddress, amountWei]
        )
      );
    });

    // Build tree
    const tree = new MerkleTree(leaves, keccak256, { 
      sortPairs: true 
    });

    // Generate proofs
    const proofs: { [hostAddress: string]: string[] } = {};
    payouts.forEach((payout, index) => {
      const proof = tree.getHexProof(leaves[index]);
      proofs[payout.hostAddress] = proof;
    });

    return {
      tree,
      leaves: leaves.map(l => '0x' + l.toString('hex')),
      proofs
    };
  }

  /**
   * Save epoch data to database
   */
  async saveEpochData(
    campaignId: number,
    epoch: number,
    merkleData: MerkleData
  ): Promise<void> {
    const epochId = `${campaignId}_${epoch}`;

    // Create or update epoch
    await Epoch.findOneAndUpdate(
      { id: epochId },
      {
        id: epochId,
        campaignId,
        epoch,
        merkleRoot: merkleData.root,
        allocatedAmount: merkleData.totalAmount,
        status: 'pending',
        claimedAmount: '0'
      },
      { upsert: true }
    );

    // Save individual payouts
    for (const payout of merkleData.payouts) {
      await EpochPayout.create({
        epochId,
        campaignId,
        epoch,
        index: payout.index,
        hostAddress: payout.hostAddress,
        amount: payout.amount,
        proof: merkleData.proofs[payout.hostAddress],
        claimed: false
      });
    }

    // Mark receipts as processed
    const { start, end } = this.getEpochBounds(epoch);
    await Receipt.updateMany(
      {
        campaignId,
        timestamp: {
          $gte: start,
          $lt: end
        },
        processed: false
      },
      {
        processed: true,
        epochId
      }
    );
  }

  /**
   * Generate and save epoch for a campaign
   */
  async generateEpoch(campaignId: number, epoch?: number): Promise<MerkleData> {
    // Use current epoch if not specified
    if (!epoch) {
      epoch = this.getCurrentEpoch() - 1; // Process previous hour
    }

    // Check if epoch already exists
    const epochId = `${campaignId}_${epoch}`;
    const existingEpoch = await Epoch.findById(epochId);
    if (existingEpoch && existingEpoch.status !== 'pending') {
      throw new Error(`Epoch ${epochId} already finalized`);
    }

    // Build merkle tree
    const merkleData = await this.buildMerkleTree(campaignId, epoch);

    // Save to database
    await this.saveEpochData(campaignId, epoch, merkleData);

    return merkleData;
  }

  /**
   * Get unclaimed payouts for batching
   */
  async getUnclaimedPayouts(
    campaignId: number,
    epoch: number,
    limit: number = 100
  ): Promise<any[]> {
    return await EpochPayout.find({
      campaignId,
      epoch,
      claimed: false
    })
    .limit(limit)
    .sort({ index: 1 });
  }
}
