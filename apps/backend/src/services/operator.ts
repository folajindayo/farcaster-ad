import { Campaign, Host, AdPlacement, User } from '../models';
// import { AppError } from '@farcaster-ad-rental/shared';
// Temporary inline implementation
class AppError extends Error {
  constructor(message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class OperatorService {
  /**
   * Automatically validate and approve campaigns
   */
  static async validateCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Validation checks
      const validationChecks = await Promise.all([
        this.validateBudget(campaign),
        this.validateCreative(campaign),
        this.validateTargeting(campaign),
        this.validateSchedule(campaign)
      ]);

      const isValid = validationChecks.every(check => check);

      if (isValid) {
        // Auto-approve if validation passes
        campaign.status = 'active';
        await campaign.save();

        // Start host matching process
        await this.matchHostsToCampaign(campaignId);
      }

      return isValid;

    } catch (error) {
      console.error('Campaign validation failed:', error);
      return false;
    }
  }

  /**
   * Match hosts to campaigns based on targeting and preferences
   */
  static async matchHostsToCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Find eligible hosts
      const eligibleHosts = await this.findEligibleHosts(campaign);
      
      // Create ad placements for matched hosts
      for (const host of eligibleHosts) {
        await this.createAdPlacement(campaign, host);
      }

    } catch (error) {
      console.error('Host matching failed:', error);
    }
  }

  /**
   * Find hosts that match campaign targeting
   */
  private static async findEligibleHosts(campaign: any): Promise<any[]> {
    const { targeting, type } = campaign;
    
    // Build query based on targeting criteria
    const query: any = {
      isActive: true,
      'preferences.autoApprove': true
    };

    // Filter by categories if specified
    if (targeting?.categories && targeting.categories.length > 0) {
      query['preferences.categories'] = {
        $in: targeting.categories
      };
    }

    // Filter by follower count if specified
    if (targeting?.minFollowers || targeting?.maxFollowers) {
      // This would require additional user data from Farcaster API
      // For now, we'll skip this filter
    }

    // Filter by regions if specified
    if (targeting?.regions && targeting.regions.length > 0) {
      // This would require location data from user profiles
      // For now, we'll skip this filter
    }

    // Check host capacity
    const hosts = await Host.find(query)
      .populate('userId', 'username displayName')
      .lean();

    // Filter hosts by available capacity
    const eligibleHosts = [];
    for (const host of hosts) {
      const activePlacements = await AdPlacement.countDocuments({
        hostId: host._id,
        status: { $in: ['active', 'approved'] }
      });

      const maxCampaigns = (host as any).preferences?.maxCampaigns || 5;
      if (activePlacements < maxCampaigns) {
        eligibleHosts.push(host);
      }
    }

    return eligibleHosts;
  }

  /**
   * Create ad placement for matched host
   */
  private static async createAdPlacement(campaign: any, host: any): Promise<void> {
    try {
      const placement = new AdPlacement({
        campaignId: campaign._id,
        hostId: host._id,
        status: host.preferences.autoApprove ? 'approved' : 'pending',
        metrics: {
          impressions: 0,
          clicks: 0,
          engagements: 0,
          earnings: '0'
        }
      });

      await placement.save();

      // If auto-approved, start the placement immediately
      if (host.preferences.autoApprove) {
        placement.status = 'active';
        placement.startedAt = new Date();
        await placement.save();
      }

    } catch (error) {
      console.error('Failed to create ad placement:', error);
    }
  }

  /**
   * Validate campaign budget
   */
  private static async validateBudget(campaign: any): Promise<boolean> {
    const budget = parseFloat(campaign.budget);
    const minBudget = 10; // Minimum $10 USDC
    const maxBudget = 100000; // Maximum $100k USDC

    return budget >= minBudget && budget <= maxBudget;
  }

  /**
   * Validate campaign creative assets
   */
  private static async validateCreative(campaign: any): Promise<boolean> {
    const { creative, type } = campaign;

    if (type === 'banner') {
      return !!(creative?.bannerImage && creative.bannerImage.length > 0);
    }

    if (type === 'pinned_cast') {
      return !!(creative?.pinnedCastText && creative.pinnedCastText.length > 0);
    }

    return false;
  }

  /**
   * Validate campaign targeting
   */
  private static async validateTargeting(campaign: any): Promise<boolean> {
    const { targeting } = campaign;

    // Must have at least one targeting criteria
    if (!targeting) return false;

    const hasCategories = targeting.categories && targeting.categories.length > 0;
    const hasFollowerRange = targeting.minFollowers || targeting.maxFollowers;
    const hasRegions = targeting.regions && targeting.regions.length > 0;

    return hasCategories || hasFollowerRange || hasRegions;
  }

  /**
   * Validate campaign schedule
   */
  private static async validateSchedule(campaign: any): Promise<boolean> {
    const { schedule } = campaign;

    if (!schedule) return false;

    // Must have either duration or max impressions
    const hasDuration = schedule.startDate && schedule.endDate;
    const hasImpressions = schedule.maxImpressions && schedule.maxImpressions > 0;

    return hasDuration || hasImpressions;
  }

  /**
   * Process campaign completion and calculate payouts
   */
  static async processCampaignCompletion(campaignId: string): Promise<void> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Get all placements for this campaign
      const placements = await AdPlacement.find({
        campaignId: campaign._id,
        status: 'active'
      });

      // Calculate performance-based payouts
      const totalImpressions = placements.reduce((sum: any, p: any) => sum + (p.metrics?.impressions || 0), 0);
      const totalClicks = placements.reduce((sum: any, p: any) => sum + (p.metrics?.clicks || 0), 0);

      for (const placement of placements) {
        const impressions = placement.metrics?.impressions || 0;
        const clicks = placement.metrics?.clicks || 0;

        // Calculate proportional earnings based on performance
        const performanceScore = (impressions * 0.7) + (clicks * 0.3);
        const totalPerformance = (totalImpressions * 0.7) + (totalClicks * 0.3);
        
        const proportionalShare = totalPerformance > 0 ? performanceScore / totalPerformance : 0;
        const earnings = (parseFloat(campaign.budget.toString()) * proportionalShare).toFixed(6);

        // Update placement metrics
        placement.metrics.earnings = earnings;
        placement.status = 'completed';
        placement.endedAt = new Date();
        await placement.save();

        // Update host earnings
        const host = await Host.findById(placement.hostId);
        if (host) {
          host.pendingEarnings += parseFloat(earnings);
          await host.save();
        }
      }

      // Mark campaign as completed
      campaign.status = 'completed';
      campaign.spent = campaign.budget;
      await campaign.save();

    } catch (error) {
      console.error('Campaign completion processing failed:', error);
    }
  }

  /**
   * Generate payout cycle with Merkle tree
   */
  static async generatePayoutCycle(): Promise<string> {
    try {
      // Get all hosts with pending earnings
      const hosts = await Host.find({
        pendingEarnings: { $gt: 0 }
      });

      if (hosts.length === 0) {
        throw new AppError('No pending payouts', 400, 'NO_PENDING_PAYOUTS');
      }

      // Create payout data for Merkle tree
      const payouts = hosts.map(host => ({
        hostId: host._id.toString(),
        amount: host.pendingEarnings.toString()
      }));

      // Generate Merkle tree (this would integrate with the shared utility)
      // const merkleTree = new PayoutMerkleTree(payouts);
      // const merkleRoot = merkleTree.getRoot();

      // For now, return a placeholder
      const merkleRoot = '0x' + '0'.repeat(64);

      // TODO: Create payout cycle record
      // TODO: Update host pending earnings to 0
      // TODO: Create payout records

      return merkleRoot;

    } catch (error) {
      console.error('Payout cycle generation failed:', error);
      throw error;
    }
  }
}
