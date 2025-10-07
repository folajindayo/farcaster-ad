import { ethers } from 'ethers';
import { 
  HostProfile, 
  Campaign, 
  AdPlacement, 
  Receipt, 
  EpochPayout 
} from '../models';
import farcasterAuth from './farcasterAuth';

export interface HostOnboardingData {
  fid: number;
  username: string;
  displayName: string;
  walletAddress: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  selectedSlots: string[];
  preferences?: any;
}

export interface HostEarningsData {
  totalEarnings: string;
  pendingEarnings: string;
  todayEarnings: string;
  thisWeekEarnings: string;
  thisMonthEarnings: string;
  lastPayoutAmount: string;
  lastPayoutDate: Date | null;
  nextPayoutIn: number; // minutes until next payout
  earningsBySlot: {
    slot: string;
    earnings: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  recentPayouts: any[];
  performanceMetrics: {
    averageCPM: number;
    averageCTR: number;
    totalImpressions: number;
    totalClicks: number;
  };
}

export interface HostPerformanceData {
  hourlyStats: {
    hour: number;
    impressions: number;
    clicks: number;
    earnings: string;
  }[];
  topCampaigns: {
    campaignId: string;
    title: string;
    impressions: number;
    earnings: string;
  }[];
  slotPerformance: {
    slot: string;
    fillRate: number;
    ctr: number;
    earnings: string;
  }[];
}

export class HostManager {
  /**
   * Complete host onboarding process
   */
  static async onboardHost(data: HostOnboardingData): Promise<HostProfile> {
    try {
      // Verify Farcaster profile
      const farcasterProfile = await farcasterAuth.verifyFarcasterAuth('', '', data.fid);
      if (!farcasterProfile) {
        throw new Error('Invalid Farcaster profile');
      }

      // Check if host already exists
      let host = await HostProfile.findOne({ 
        where: { fid: data.fid } 
      });

      if (host) {
        // Update existing host
        return await this.updateHostProfile(host.id, {
          walletAddress: data.walletAddress,
          selectedSlots: data.selectedSlots,
          preferences: data.preferences
        });
      }

      // Create slot configurations
      const slots = ['banner', 'pinned_cast', 'frame'].map(type => ({
        type: type as 'banner' | 'pinned_cast' | 'frame',
        enabled: data.selectedSlots.includes(type),
        minCPM: 0.5, // Default $0.50 CPM
        maxAdsPerDay: type === 'banner' ? 10 : 5
      }));

      // Generate referral code
      const referralCode = this.generateReferralCode(data.username);

      // Create new host profile
      host = await HostProfile.create({
        fid: data.fid,
        username: data.username,
        displayName: data.displayName,
        walletAddress: data.walletAddress.toLowerCase(),
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        followerCount: data.followerCount,
        followingCount: 0,
        isVerified: farcasterProfile.verified || false,
        isOptedIn: true,
        optInDate: new Date(),
        status: 'active',
        slots,
        preferences: data.preferences || {},
        referralCode,
        onboardingStep: 5, // Completed
        onboardingCompleted: true
      });

      // Create welcome receipt for first payout
      await this.createWelcomeBonus(host);

      return host;
    } catch (error) {
      console.error('Host onboarding failed:', error);
      throw error;
    }
  }

  /**
   * Update host profile and preferences
   */
  static async updateHostProfile(
    hostId: number,
    updates: Partial<any>
  ): Promise<HostProfile> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new Error('Host not found');
    }

    // Update slots if provided
    if (updates.selectedSlots) {
      const slots = host.slots.map(slot => ({
        ...slot,
        enabled: updates.selectedSlots.includes(slot.type)
      }));
      updates.slots = slots;
      delete updates.selectedSlots;
    }

    await host.save(updates);
    return host;
  }

  /**
   * Toggle host opt-in status
   */
  static async toggleOptIn(
    hostId: number,
    optIn: boolean
  ): Promise<HostProfile> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new Error('Host not found');
    }

    await host.save({
      isOptedIn: optIn,
      status: optIn ? 'active' : 'paused',
      ...(optIn ? { optInDate: new Date() } : { optOutDate: new Date() })
    });

    // Remove active ad placements if opting out
    if (!optIn) {
      await AdPlacement.updateMany(
        { hostId, status: 'active' },
        { status: 'inactive' }
      );
    }

    return host;
  }

  /**
   * Update slot configuration
   */
  static async updateSlotConfig(
    hostId: number,
    slotType: string,
    config: Partial<any>
  ): Promise<HostProfile> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new Error('Host not found');
    }

    const slots = host.slots.map(slot => {
      if (slot.type === slotType) {
        return { ...slot, ...config };
      }
      return slot;
    });

    await host.save({ slots });
    return host;
  }

  /**
   * Get host earnings data
   */
  static async getHostEarnings(
    hostId: number
  ): Promise<HostEarningsData> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new Error('Host not found');
    }

    // Get earnings from different time periods
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Fetch payouts
    const [allPayouts, recentPayouts, todayReceipts, weekReceipts, monthReceipts] = await Promise.all([
      EpochPayout.find({
        where: { hostAddress: host.walletAddress },
        attributes: ['amount', 'claimed']
      }),
      EpochPayout.find({
        where: { 
          hostAddress: host.walletAddress,
          claimed: true
        },
        order: [['claimedAt', 'DESC']],
        limit: 10
      }),
      Receipt.find({
        where: {
          hostAddress: host.walletAddress,
          timestamp: { $gte: todayStart }
        },
        attributes: ['impressions', 'clicks']
      }),
      Receipt.find({
        where: {
          hostAddress: host.walletAddress,
          timestamp: { $gte: weekStart }
        },
        attributes: ['impressions', 'clicks']
      }),
      Receipt.find({
        where: {
          hostAddress: host.walletAddress,
          timestamp: { $gte: monthStart }
        },
        attributes: ['impressions', 'clicks']
      })
    ]);

    // Calculate earnings
    const totalEarnings = allPayouts
      .filter(p => p.claimed)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const pendingEarnings = allPayouts
      .filter(p => !p.claimed)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Calculate earnings by period (simplified - would need actual payout data)
    const todayEarnings = todayReceipts.length * 0.001; // Mock calculation
    const weekEarnings = weekReceipts.length * 0.001;
    const monthEarnings = monthReceipts.length * 0.001;

    // Calculate next payout time (hourly)
    const nextHour = new Date(Math.ceil(now.getTime() / 3600000) * 3600000);
    const nextPayoutIn = Math.floor((nextHour.getTime() - now.getTime()) / 60000);

    // Get slot performance
    const placements = await AdPlacement.find({ hostId })
      .populate('campaignId', 'title')
      .lean();

    const slotStats: any = {};
    placements.forEach((p: any) => {
      if (!slotStats[p.slotType]) {
        slotStats[p.slotType] = {
          slot: p.slotType,
          earnings: 0,
          impressions: 0,
          clicks: 0
        };
      }
      slotStats[p.slotType].impressions += p.metrics?.impressions || 0;
      slotStats[p.slotType].clicks += p.metrics?.clicks || 0;
    });

    const earningsBySlot = Object.values(slotStats).map((stat: any) => ({
      ...stat,
      earnings: (stat.impressions * 0.001).toFixed(2),
      ctr: stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0
    }));

    return {
      totalEarnings: totalEarnings.toFixed(2),
      pendingEarnings: pendingEarnings.toFixed(2),
      todayEarnings: todayEarnings.toFixed(2),
      thisWeekEarnings: weekEarnings.toFixed(2),
      thisMonthEarnings: monthEarnings.toFixed(2),
      lastPayoutAmount: recentPayouts[0]?.amount || '0',
      lastPayoutDate: recentPayouts[0]?.claimedAt || null,
      nextPayoutIn,
      earningsBySlot,
      recentPayouts: recentPayouts.map(p => ({
        amount: p.amount,
        date: p.claimedAt,
        txHash: p.claimedTxHash
      })),
      performanceMetrics: {
        averageCPM: host.metrics.averageCPM,
        averageCTR: host.metrics.averageCTR,
        totalImpressions: host.metrics.totalImpressions,
        totalClicks: host.metrics.totalClicks
      }
    };
  }

  /**
   * Get host performance analytics
   */
  static async getHostPerformance(
    hostId: number,
    days: number = 7
  ): Promise<HostPerformanceData> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new Error('Host not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get hourly stats
    const receipts = await Receipt.find({
      hostAddress: host.walletAddress,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Group by hour
    const hourlyStats: any = {};
    receipts.forEach((receipt: any) => {
      const hour = new Date(receipt.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          hour,
          impressions: 0,
          clicks: 0,
          earnings: 0
        };
      }
      hourlyStats[hour].impressions += receipt.impressions;
      hourlyStats[hour].clicks += receipt.clicks;
      hourlyStats[hour].earnings += receipt.impressions * 0.001; // Mock calculation
    });

    // Get top campaigns
    const placements = await AdPlacement.find({ hostId })
      .populate('campaignId', 'title')
      .sort({ 'metrics.impressions': -1 })
      .limit(5)
      .lean();

    const topCampaigns = placements.map((p: any) => ({
      campaignId: p.campaignId,
      title: p.campaignId?.title || 'Unknown',
      impressions: p.metrics?.impressions || 0,
      earnings: ((p.metrics?.impressions || 0) * 0.001).toFixed(2)
    }));

    // Get slot performance
    const slotPerformance = host.slots.map(slot => {
      const slotPlacements = placements.filter((p: any) => p.slotType === slot.type);
      const totalImpressions = slotPlacements.reduce(
        (sum: any, p: any) => sum + (p.metrics?.impressions || 0), 0
      );
      const totalClicks = slotPlacements.reduce(
        (sum: any, p: any) => sum + (p.metrics?.clicks || 0), 0
      );
      
      return {
        slot: slot.type,
        fillRate: slot.enabled ? Math.min(100, (slotPlacements.length / 10) * 100) : 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        earnings: (totalImpressions * 0.001).toFixed(2)
      };
    });

    return {
      hourlyStats: Object.values(hourlyStats).map((stat: any) => ({
        ...stat,
        earnings: stat.earnings.toFixed(2)
      })),
      topCampaigns,
      slotPerformance
    };
  }

  /**
   * Get hosts for campaign targeting
   */
  static async getTargetedHosts(
    campaignId: string,
    filters: {
      minFollowers?: number;
      maxFollowers?: number;
      categories?: string[];
      regions?: string[];
      slotType?: string;
    }
  ): Promise<HostProfile[]> {
    return await HostProfile.findActiveHosts(filters);
  }

  /**
   * Update host reputation
   */
  static async updateHostReputation(
    hostId: number,
    updates: {
      fraudIncident?: boolean;
      qualityScore?: number;
      responseRate?: number;
    }
  ): Promise<void> {
    const host = await HostProfile.findById(hostId);
    if (!host) return;

    const reputation = { ...host.reputation };

    if (updates.fraudIncident) {
      reputation.fraudFlags++;
      reputation.score = Math.max(0, reputation.score - 10);
    }

    if (updates.qualityScore !== undefined) {
      reputation.qualityScore = updates.qualityScore;
    }

    if (updates.responseRate !== undefined) {
      reputation.responseRate = updates.responseRate;
    }

    // Recalculate overall score
    reputation.score = Math.round(
      (reputation.qualityScore * 0.5) +
      (reputation.responseRate * 0.3) +
      (Math.max(0, 100 - reputation.fraudFlags * 10) * 0.2)
    );

    await host.save({ reputation });

    // Suspend if score too low
    if (reputation.score < 20) {
      await host.save({ status: 'suspended' });
    }
  }

  /**
   * Create welcome bonus for new hosts
   */
  private static async createWelcomeBonus(host: HostProfile): Promise<void> {
    // Create a welcome bonus receipt
    await Receipt.create({
      campaignId: 0, // System campaign
      hostAddress: host.walletAddress,
      timestamp: new Date(),
      impressions: 10, // Bonus impressions
      clicks: 0,
      dwellMs: 0,
      processed: false,
      signature: 'WELCOME_BONUS'
    });
  }

  /**
   * Generate unique referral code
   */
  private static generateReferralCode(username: string): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${username.substring(0, 3).toUpperCase()}${random}`;
  }

  /**
   * Process referral
   */
  static async processReferral(
    newHostId: number,
    referralCode: string
  ): Promise<void> {
    const referrer = await HostProfile.findOne({
      where: { referralCode }
    });

    if (!referrer) return;

    // Update new host
    await HostProfile.save(
      { referredBy: referrer.walletAddress },
      { where: { id: newHostId } }
    );

    // Create referral bonus for referrer
    await Receipt.create({
      campaignId: 0,
      hostAddress: referrer.walletAddress,
      timestamp: new Date(),
      impressions: 100, // Referral bonus
      clicks: 0,
      dwellMs: 0,
      processed: false,
      signature: 'REFERRAL_BONUS'
    });
  }

  /**
   * Get host by Farcaster ID
   */
  static async getHostByFid(fid: number): Promise<HostProfile | null> {
    return await HostProfile.findOne({ where: { fid } });
  }

  /**
   * Get host by wallet address
   */
  static async getHostByWallet(walletAddress: string): Promise<HostProfile | null> {
    return await HostProfile.findOne({ 
      where: { walletAddress: walletAddress.toLowerCase() } 
    });
  }

  /**
   * Get all active hosts
   */
  static async getActiveHosts(): Promise<HostProfile[]> {
    return await HostProfile.find({
      where: {
        status: 'active',
        isOptedIn: true
      }
    });
  }

  /**
   * Batch update host metrics
   */
  static async batchUpdateMetrics(
    updates: Array<{
      walletAddress: string;
      impressions: number;
      clicks: number;
      earnings: number;
    }>
  ): Promise<void> {
    for (const update of updates) {
      const host = await this.getHostByWallet(update.walletAddress);
      if (host) {
        host.updateMetrics(
          update.impressions,
          update.clicks,
          update.earnings
        );
        await host.save();
      }
    }
  }
}
