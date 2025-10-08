import { Campaign, Host, AdPlacement } from '../models';

interface MatchCriteria {
  followerRange?: {
    min?: number;
    max?: number;
  };
  categories?: string[];
  cpm?: number;
}

/**
 * Campaign Matching Algorithm
 * Automatically finds and assigns compatible hosts to active campaigns
 */
class CampaignMatcherService {
  /**
   * Find compatible hosts for a campaign
   */
  async findMatchingHosts(campaignId: string): Promise<any[]> {
    try {
      console.log(`🔍 Finding matching hosts for campaign: ${campaignId}`);

      // Get campaign details
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get campaign targeting criteria
      const targeting = campaign.targeting || {};
      const followerRange = this.parseFollowerRange(targeting.followerRange || targeting.audience);
      const categories = targeting.categories || [];
      const campaignCPM = parseFloat(campaign.schedule?.cpm || '5.00');

      console.log(`📊 Campaign targeting:`, {
        followerRange,
        categories,
        cpm: campaignCPM,
        adType: campaign.type
      });

      // Build host query
      const hostQuery: any = {
        // Host must be active and accepting campaigns
        status: 'active',
        acceptingCampaigns: { $ne: false },
      };

      // Match follower range
      if (followerRange.min !== undefined) {
        hostQuery.followerCount = { $gte: followerRange.min };
      }
      if (followerRange.max !== undefined) {
        hostQuery.followerCount = hostQuery.followerCount || {};
        hostQuery.followerCount.$lte = followerRange.max;
      }

      // Match categories (if host has specified categories)
      if (categories.length > 0) {
        hostQuery.$or = [
          { categories: { $in: categories } },
          { categories: { $exists: false } }, // Also include hosts without category restrictions
          { categories: { $size: 0 } }
        ];
      }

      // Match CPM rate (host's minimum CPM must be <= campaign's CPM)
      hostQuery.$or = hostQuery.$or || [];
      hostQuery.$or.push(
        { minimumCPM: { $lte: campaignCPM } },
        { minimumCPM: { $exists: false } }, // Also include hosts without CPM requirements
        { minimumCPM: 0 }
      );

      // Find matching hosts
      const matchingHosts = await Host.find(hostQuery);

      console.log(`✅ Found ${matchingHosts.length} matching hosts`);

      // Filter out hosts that already have this campaign
      const availableHosts = await this.filterExistingPlacements(matchingHosts, campaignId);

      console.log(`✅ ${availableHosts.length} hosts available (after filtering existing placements)`);

      return availableHosts;
    } catch (error) {
      console.error('❌ Error finding matching hosts:', error);
      throw error;
    }
  }

  /**
   * Filter out hosts that already have this campaign assigned
   */
  private async filterExistingPlacements(hosts: any[], campaignId: string): Promise<any[]> {
    const existingPlacements = await AdPlacement.find({
      campaignId,
      status: { $in: ['active', 'pending'] }
    }).select('hostId');

    const assignedHostIds = new Set(existingPlacements.map(p => p.hostId.toString()));

    return hosts.filter(host => !assignedHostIds.has(host._id.toString()));
  }

  /**
   * Parse follower range from targeting criteria
   */
  private parseFollowerRange(rangeString?: string): { min?: number; max?: number } {
    if (!rangeString) return {};

    // Handle ranges like "1k-10k", "10k+", "1000-5000"
    const range = rangeString.toLowerCase();

    if (range.includes('+')) {
      // "10k+" format
      const min = this.parseFollowerCount(range.replace('+', ''));
      return { min };
    }

    if (range.includes('-')) {
      // "1k-10k" format
      const [minStr, maxStr] = range.split('-');
      return {
        min: this.parseFollowerCount(minStr),
        max: this.parseFollowerCount(maxStr)
      };
    }

    // Single number
    const count = this.parseFollowerCount(range);
    return { min: count };
  }

  /**
   * Parse follower count from string (handles "1k", "10k", etc.)
   */
  private parseFollowerCount(str: string): number {
    const cleaned = str.trim().toLowerCase();
    
    if (cleaned.endsWith('k')) {
      return parseFloat(cleaned.replace('k', '')) * 1000;
    }
    
    if (cleaned.endsWith('m')) {
      return parseFloat(cleaned.replace('m', '')) * 1000000;
    }
    
    return parseInt(cleaned, 10) || 0;
  }

  /**
   * Assign a campaign to a host
   */
  async assignCampaignToHost(campaignId: string, hostId: string): Promise<any> {
    try {
      console.log(`🎯 Assigning campaign ${campaignId} to host ${hostId}`);

      // Get campaign and host
      const [campaign, host] = await Promise.all([
        Campaign.findById(campaignId),
        Host.findById(hostId)
      ]);

      if (!campaign) throw new Error('Campaign not found');
      if (!host) throw new Error('Host not found');

      // Check if placement already exists
      const existingPlacement = await AdPlacement.findOne({
        campaignId,
        hostId,
        status: { $in: ['active', 'pending'] }
      });

      if (existingPlacement) {
        console.log(`⚠️ Placement already exists for this campaign and host`);
        return existingPlacement;
      }

      // Create ad placement
      const placement = new AdPlacement({
        campaignId,
        hostId,
        advertiserId: campaign.advertiserId,
        adType: campaign.type,
        status: 'active',
        startDate: new Date(),
        endDate: campaign.schedule?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        pricing: {
          cpm: parseFloat(campaign.schedule?.cpm || '5.00'),
          totalBudget: campaign.budget
        },
        performance: {
          impressions: 0,
          clicks: 0,
          earnings: 0
        }
      });

      await placement.save();

      console.log(`✅ Campaign assigned successfully! Placement ID: ${placement._id}`);

      return placement;
    } catch (error) {
      console.error('❌ Error assigning campaign to host:', error);
      throw error;
    }
  }

  /**
   * Automatically assign campaign to all matching hosts
   */
  async autoAssignCampaign(campaignId: string): Promise<any[]> {
    try {
      console.log(`🚀 Auto-assigning campaign: ${campaignId}`);

      // Find matching hosts
      const matchingHosts = await this.findMatchingHosts(campaignId);

      if (matchingHosts.length === 0) {
        console.log(`⚠️ No matching hosts found for campaign ${campaignId}`);
        return [];
      }

      // Assign to all matching hosts
      const placements = [];
      for (const host of matchingHosts) {
        try {
          const placement = await this.assignCampaignToHost(campaignId, host._id.toString());
          placements.push(placement);
        } catch (error) {
          console.error(`❌ Failed to assign to host ${host._id}:`, error);
          // Continue with other hosts
        }
      }

      console.log(`✅ Campaign auto-assigned to ${placements.length} hosts`);

      return placements;
    } catch (error) {
      console.error('❌ Error in auto-assign:', error);
      throw error;
    }
  }
}

export const campaignMatcher = new CampaignMatcherService();

