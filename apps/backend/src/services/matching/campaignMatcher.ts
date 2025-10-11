/**
 * Campaign Matching Service (Optimized)
 * Automatically finds and assigns compatible hosts to active campaigns
 * 
 * Algorithm Optimizations:
 * - O(1) host lookup using hash maps
 * - Parallel placement creation instead of sequential
 * - Single database query for existing placements
 * - Efficient filtering with Set operations
 * - Batch operations where possible
 */

import { Campaign } from '../../models';
import { HostProfile } from '../../models/Host';
import { AdPlacement } from '../../models/AdPlacement';
import { logger, PerformanceLogger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';
import { validatePositiveNumber } from '../../utils/validation';
import { cache, CacheKeys } from '../../utils/cache';

/**
 * Match criteria for campaign-host matching
 */
interface MatchCriteria {
  followerRange?: {
    min?: number;
    max?: number;
  };
  categories?: string[];
  cpm?: number;
  slotType?: string;
  verified?: boolean;
  minReputationScore?: number;
}

/**
 * Campaign Matcher Service
 * Implements efficient matching algorithms with O(1) and O(n log n) complexity
 */
export class CampaignMatcherService {
  /**
   * Find compatible hosts for a campaign
   * Time Complexity: O(n) where n is number of matching hosts
   * Space Complexity: O(m) where m is number of existing placements
   */
  async findMatchingHosts(campaignId: string): Promise<any[]> {
    const perf = new PerformanceLogger('findMatchingHosts', { campaignId });

    try {
      // Get campaign details (with caching)
      const campaign = await this.getCampaignCached(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign', campaignId);
      }

      // Extract and validate matching criteria
      const criteria = this.buildMatchCriteria(campaign);

      logger.info('Finding matching hosts', { campaignId, criteria });

      // Build optimized database query
      const hostQuery = this.buildOptimizedHostQuery(criteria);

      // Execute query with proper indexing
      // This query will use indexes on: status, followerCount, reputation.score
      // Time Complexity: O(log n) with proper indexes
      const [matchingHosts, existingPlacements] = await Promise.all([
        HostProfile.find(hostQuery)
          .select('_id username followerCount slots reputation')
          .sort({ 'reputation.score': -1, followerCount: -1 }) // Prioritize by reputation
          .limit(100) // Reasonable limit
          .lean(),
        this.getExistingPlacements(campaignId),
      ]);

      // Create hash set of already assigned host IDs for O(1) lookup
      // Time Complexity: O(m) where m is existing placements
      // Space Complexity: O(m)
      const assignedHostIds = new Set(existingPlacements.map((p) => p.hostId.toString()));

      // Filter out already assigned hosts
      // Time Complexity: O(n) where n is matching hosts
      const availableHosts = matchingHosts.filter(
        (host) => !assignedHostIds.has(host._id.toString())
      );

      // Apply additional filters that can't be done at database level
      // Time Complexity: O(n)
      const filteredHosts = this.applyAdvancedFilters(availableHosts, criteria);

      logger.info('Host matching completed', {
        campaignId,
        totalMatches: matchingHosts.length,
        available: availableHosts.length,
        afterFilters: filteredHosts.length,
      });

      perf.end({ matches: filteredHosts.length });
      return filteredHosts;
    } catch (error) {
      logger.error('Failed to find matching hosts', error, { campaignId });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Assign a campaign to a specific host
   * Time Complexity: O(1) for checks, O(log n) for database operations with indexes
   */
  async assignCampaignToHost(campaignId: string, hostId: string): Promise<any> {
    const perf = new PerformanceLogger('assignCampaignToHost', {
      campaignId,
      hostId,
    });

    try {
      // Check if placement already exists (with index on campaignId + hostId)
      // Time Complexity: O(log n) with compound index
      const existingPlacement = await AdPlacement.findOne({
        campaignId,
        hostId,
        status: { $in: ['active', 'pending'] },
      }).lean();

      if (existingPlacement) {
        logger.debug('Placement already exists', { campaignId, hostId });
        perf.end({ action: 'skipped' });
        return existingPlacement;
      }

      // Get campaign and host in parallel
      const [campaign, host] = await Promise.all([
        Campaign.findById(campaignId).lean(),
        HostProfile.findById(hostId).lean(),
      ]);

      if (!campaign) throw new NotFoundError('Campaign', campaignId);
      if (!host) throw new NotFoundError('Host', hostId);

      // Create ad placement
      const placement = await AdPlacement.create({
        campaignId,
        hostId,
        advertiserId: campaign.advertiserId,
        slotType: campaign.type || 'banner',
        status: 'active',
        startDate: new Date(),
        endDate:
          campaign.schedule?.endDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cpm: parseFloat(campaign.schedule?.cpm || '5.00'),
        metrics: {
          impressions: 0,
          clicks: 0,
          earnings: 0,
        },
      });

      logger.info('Campaign assigned to host', {
        campaignId,
        hostId,
        placementId: placement._id,
      });

      perf.end({ action: 'created', placementId: placement._id });
      return placement;
    } catch (error) {
      logger.error('Failed to assign campaign to host', error, {
        campaignId,
        hostId,
      });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Auto-assign campaign to all matching hosts
   * Optimized with parallel processing
   * Time Complexity: O(n) with parallelization, where n is number of hosts
   * Space Complexity: O(n) for storing results
   */
  async autoAssignCampaign(campaignId: string): Promise<any[]> {
    const perf = new PerformanceLogger('autoAssignCampaign', { campaignId });

    try {
      // Find matching hosts
      const matchingHosts = await this.findMatchingHosts(campaignId);

      if (matchingHosts.length === 0) {
        logger.info('No matching hosts found for campaign', { campaignId });
        perf.end({ matches: 0 });
        return [];
      }

      // Assign to all hosts in parallel (OPTIMIZATION: was sequential before)
      // Time Complexity: O(n) with parallelization vs O(n * operation_time) sequential
      // This is a major performance improvement for large numbers of hosts
      const placementPromises = matchingHosts.map((host) =>
        this.assignCampaignToHost(campaignId, host._id.toString()).catch(
          (error) => {
            // Log error but don't fail the entire operation
            logger.error('Failed to assign to host', error, {
              campaignId,
              hostId: host._id.toString(),
            });
            return null; // Return null for failed assignments
          }
        )
      );

      const results = await Promise.all(placementPromises);

      // Filter out failed assignments (null values)
      const successfulPlacements = results.filter((p) => p !== null);

      logger.info('Campaign auto-assigned', {
        campaignId,
        totalHosts: matchingHosts.length,
        successful: successfulPlacements.length,
        failed: matchingHosts.length - successfulPlacements.length,
      });

      perf.end({
        matches: matchingHosts.length,
        placements: successfulPlacements.length,
      });

      return successfulPlacements;
    } catch (error) {
      logger.error('Auto-assignment failed', error, { campaignId });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Batch assign multiple campaigns
   * Optimized for bulk operations
   */
  async batchAssignCampaigns(campaignIds: string[]): Promise<Map<string, any[]>> {
    const perf = new PerformanceLogger('batchAssignCampaigns', {
      count: campaignIds.length,
    });

    try {
      // Process all campaigns in parallel
      const results = await Promise.all(
        campaignIds.map(async (campaignId) => {
          try {
            const placements = await this.autoAssignCampaign(campaignId);
            return { campaignId, placements };
          } catch (error) {
            logger.error('Batch assignment failed for campaign', error, {
              campaignId,
            });
            return { campaignId, placements: [] };
          }
        })
      );

      // Convert to Map for O(1) lookup
      const resultMap = new Map<string, any[]>();
      results.forEach(({ campaignId, placements }) => {
        resultMap.set(campaignId, placements);
      });

      logger.info('Batch assignment completed', {
        campaigns: campaignIds.length,
        totalPlacements: Array.from(resultMap.values()).reduce(
          (sum, p) => sum + p.length,
          0
        ),
      });

      perf.end();
      return resultMap;
    } catch (error) {
      logger.error('Batch assignment failed', error);
      perf.error(error);
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Get campaign with caching
   * Time Complexity: O(1) cache hit, O(log n) cache miss
   */
  private async getCampaignCached(campaignId: string): Promise<any> {
    return cache.getOrSet(
      CacheKeys.campaign(campaignId),
      async () => {
        const campaign = await Campaign.findById(campaignId).lean();
        return campaign;
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Build match criteria from campaign
   */
  private buildMatchCriteria(campaign: any): MatchCriteria {
    const targeting = campaign.targeting || {};
    const followerRange = this.parseFollowerRange(
      targeting.followerRange || targeting.audience
    );
    const categories = targeting.categories || [];
    const cpm = parseFloat(campaign.schedule?.cpm || '5.00');

    return {
      followerRange,
      categories,
      cpm,
      slotType: campaign.type,
      verified: targeting.verified,
      minReputationScore: targeting.minReputationScore,
    };
  }

  /**
   * Build optimized database query
   * Uses indexes on: status, followerCount, reputation.score
   */
  private buildOptimizedHostQuery(criteria: MatchCriteria): any {
    const query: any = {
      status: 'active',
      isOptedIn: true,
    };

    // Follower range (uses index on followerCount)
    if (criteria.followerRange?.min !== undefined) {
      query.followerCount = { $gte: criteria.followerRange.min };
    }
    if (criteria.followerRange?.max !== undefined) {
      query.followerCount = query.followerCount || {};
      query.followerCount.$lte = criteria.followerRange.max;
    }

    // Verified status
    if (criteria.verified !== undefined) {
      query.isVerified = criteria.verified;
    }

    // Minimum reputation score (uses index on reputation.score)
    if (criteria.minReputationScore !== undefined) {
      query['reputation.score'] = { $gte: criteria.minReputationScore };
    }

    return query;
  }

  /**
   * Get existing placements for campaign
   * Time Complexity: O(log n + m) where m is matching placements
   */
  private async getExistingPlacements(campaignId: string): Promise<any[]> {
    return AdPlacement.find({
      campaignId,
      status: { $in: ['active', 'pending'] },
    })
      .select('hostId')
      .lean();
  }

  /**
   * Apply advanced filters that can't be done at database level
   * Time Complexity: O(n) where n is number of hosts
   */
  private applyAdvancedFilters(
    hosts: any[],
    criteria: MatchCriteria
  ): any[] {
    let filtered = hosts;

    // Filter by categories (check if host categories overlap with campaign categories)
    if (criteria.categories && criteria.categories.length > 0) {
      filtered = filtered.filter((host) => {
        const hostCategories = host.preferences?.categories || [];
        if (hostCategories.length === 0) return true; // No restrictions
        return criteria.categories!.some((cat) => hostCategories.includes(cat));
      });
    }

    // Filter by slot type availability
    if (criteria.slotType) {
      filtered = filtered.filter((host) => {
        const slot = host.slots?.find((s: any) => s.type === criteria.slotType);
        return slot && slot.enabled;
      });
    }

    // Filter by CPM (host's min CPM must be <= campaign's CPM)
    if (criteria.cpm) {
      filtered = filtered.filter((host) => {
        const hostMinCPM = host.preferences?.minCPM || 0;
        return hostMinCPM <= criteria.cpm!;
      });
    }

    return filtered;
  }

  /**
   * Parse follower range from targeting criteria
   * Time Complexity: O(1)
   */
  private parseFollowerRange(
    rangeString?: string
  ): { min?: number; max?: number } {
    if (!rangeString) return {};

    const range = rangeString.toLowerCase().trim();

    // Handle "10k+" format
    if (range.includes('+')) {
      const min = this.parseFollowerCount(range.replace('+', ''));
      return { min };
    }

    // Handle "1k-10k" format
    if (range.includes('-')) {
      const [minStr, maxStr] = range.split('-').map((s) => s.trim());
      return {
        min: this.parseFollowerCount(minStr),
        max: this.parseFollowerCount(maxStr),
      };
    }

    // Single number
    const count = this.parseFollowerCount(range);
    return { min: count };
  }

  /**
   * Parse follower count from string (handles "1k", "10k", "1m" etc.)
   * Time Complexity: O(1)
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
}

// Export singleton instance
export const campaignMatcher = new CampaignMatcherService();

export default campaignMatcher;



