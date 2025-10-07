import { ImpressionEvent, ClickEvent, Campaign, Receipt, Host } from '../models';

// Helper functions
const calculateCTR = (clicks: number, impressions: number): number => 
  impressions === 0 ? 0 : (clicks / impressions) * 100;

const calculateCPM = (spend: string, impressions: number): number => 
  impressions === 0 ? 0 : (parseFloat(spend) / impressions) * 1000;

export class TrackingService {
  /**
   * Track ad impression (PRD Section 4.4)
   */
  static async trackImpression(data: {
    campaignId: string;
    placementId: string;
    placementType: string;
    timestamp?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    try {
      const { campaignId, placementId, placementType, ipAddress, userAgent, referrer } = data;

      // Verify campaign exists and is active
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Invalid or inactive campaign');
      }

      // Basic fraud detection - check for rapid impressions from same IP
      if (ipAddress) {
        const recentImpressions = await ImpressionEvent.countDocuments({
          campaignId,
          ipAddress,
          timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
        });

        if (recentImpressions > 50) {
          console.warn(`Potential fraud detected: ${recentImpressions} impressions from ${ipAddress}`);
          // Still track but flag for review
        }
      }

      // Create impression event
      const impression = new ImpressionEvent({
        campaignId,
        placementId,
        placementType,
        userAgent,
        ipAddress,
        referrer,
        timestamp: new Date()
      });

      await impression.save();

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId);

      // CRITICAL: Create Receipt for hourly payout system (PRD Section 4.5)
      await this.createPayoutReceipt(campaignId, placementId, 'impression', ipAddress);

      console.log(`Impression tracked: Campaign ${campaignId}, Placement ${placementId}`);
    } catch (error) {
      console.error('Impression tracking failed:', error);
      throw error;
    }
  }

  /**
   * Track ad click (PRD Section 4.4)
   */
  static async trackClick(data: {
    campaignId: string;
    placementId: string;
    placementType: string;
    timestamp?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    try {
      const { campaignId, placementId, placementType, ipAddress, userAgent, referrer } = data;

      // Verify campaign exists and is active
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || campaign.status !== 'active') {
        throw new Error('Invalid or inactive campaign');
      }

      // Create click event
      const click = new ClickEvent({
        campaignId,
        placementId,
        placementType,
        userAgent,
        ipAddress,
        referrer,
        timestamp: new Date()
      });

      await click.save();

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId);

      // CRITICAL: Create Receipt for hourly payout system
      await this.createPayoutReceipt(campaignId, placementId, 'click', ipAddress);

      console.log(`Click tracked: Campaign ${campaignId}, Placement ${placementId}`);
    } catch (error) {
      console.error('Click tracking failed:', error);
      throw error;
    }
  }

  /**
   * Track interaction (likes, shares, etc.)
   */
  static async trackInteraction(data: {
    campaignId: string;
    placementId: string;
    placementType: string;
    interactionType: string;
    timestamp?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const { campaignId } = data;

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId);

      console.log(`Interaction tracked: Campaign ${campaignId}`);
    } catch (error) {
      console.error('Interaction tracking failed:', error);
      throw error;
    }
  }

  /**
   * Update campaign metrics based on events (PRD Section 4.4)
   */
  private static async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) return;

      // Count total impressions and clicks for this campaign
      const totalImpressions = await ImpressionEvent.countDocuments({ campaignId });
      const totalClicks = await ClickEvent.countDocuments({ campaignId });

      // Calculate CTR and CPM
      const ctr = calculateCTR(totalClicks, totalImpressions);
      const cpm = calculateCPM(campaign.budget, totalImpressions);

      // Update campaign metrics
      (campaign as any).metrics = {
        impressions: totalImpressions,
        clicks: totalClicks,
        engagements: 0,
        spend: campaign.spent || '0',
        ctr,
        cpm
      };

      await campaign.save();

      console.log(`Campaign ${campaignId} metrics updated: ${totalImpressions} impressions, ${totalClicks} clicks`);
    } catch (error) {
      console.error('Campaign metrics update failed:', error);
    }
  }

  /**
   * CRITICAL: Create receipt for hourly Merkle payout system (PRD Section 4.5)
   * This bridges the tracking system to the payout system
   */
  private static async createPayoutReceipt(
    campaignId: string,
    placementId: string,
    eventType: 'impression' | 'click',
    fingerprint?: string
  ): Promise<void> {
    try {
      // Get host from placementId (format: hostId_campaignId)
      const hostId = placementId.split('_')[0];
      
      // Get host wallet address
      const host = await Host.findById(hostId);
      if (!host || !host.walletAddress) {
        console.warn(`Host ${hostId} missing wallet address - cannot create receipt`);
        return;
      }

      // Get current hour start time
      const hourStart = new Date();
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600000);

      // Check if receipt already exists for this hour
      let receipt = await Receipt.findOne({
        campaignId,
        hostAddress: host.walletAddress.toLowerCase(),
        timestamp: {
          $gte: hourStart,
          $lt: hourEnd
        },
        processed: false
      });

      if (receipt) {
        // Update existing receipt
        if (eventType === 'impression') {
          receipt.impressions = (receipt.impressions || 0) + 1;
        } else if (eventType === 'click') {
          receipt.clicks = (receipt.clicks || 0) + 1;
        }
        await receipt.save();
        console.log(`Receipt updated for host ${host.walletAddress}: ${eventType}`);
      } else {
        // Create new receipt for this hour
        receipt = await Receipt.create({
          campaignId,
          hostAddress: host.walletAddress.toLowerCase(),
          timestamp: hourStart,
          impressions: eventType === 'impression' ? 1 : 0,
          clicks: eventType === 'click' ? 1 : 0,
          dwellMs: 1500, // Default valid dwell time
          viewerFingerprint: fingerprint || 'unknown',
          processed: false,
          signature: `${eventType.toUpperCase()}_${Date.now()}`
        });
        console.log(`New receipt created for host ${host.walletAddress}: ${eventType}`);
      }
    } catch (error) {
      console.error('Failed to create payout receipt:', error);
      // Don't throw - we don't want to break tracking if receipt creation fails
    }
  }

  /**
   * Get campaign analytics (PRD Section 4.6)
   */
  static async getCampaignAnalytics(campaignId: string): Promise<any> {
    try {
      const campaign = await Campaign.findById(campaignId).lean();
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get impression and click counts
      const totalImpressions = await ImpressionEvent.countDocuments({ campaignId });
      const totalClicks = await ClickEvent.countDocuments({ campaignId });

      // Calculate metrics
      const ctr = calculateCTR(totalClicks, totalImpressions);
      const cpm = calculateCPM(campaign.budget, totalImpressions);

      return {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          status: campaign.status,
          budget: campaign.budget,
          spent: campaign.spent || '0'
        },
        metrics: {
          impressions: totalImpressions,
          clicks: totalClicks,
          engagements: 0,
          ctr,
          cpm
        }
      };
    } catch (error) {
      console.error('Campaign analytics retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get host analytics (PRD Section 4.6)
   */
  static async getHostAnalytics(hostId: string): Promise<any> {
    try {
      const host = await Host.findById(hostId);
      if (!host) {
        throw new Error('Host not found');
      }

      // Get all receipts for this host
      const receipts = await Receipt.find({
        hostAddress: host.walletAddress?.toLowerCase()
      }).lean();

      const totalImpressions = receipts.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const totalClicks = receipts.reduce((sum, r) => sum + (r.clicks || 0), 0);
      const totalEarnings = receipts.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);

      return {
        host: {
          id: host._id,
          username: host.username,
          walletAddress: host.walletAddress
        },
        metrics: {
          impressions: totalImpressions,
          clicks: totalClicks,
          earnings: totalEarnings.toFixed(6),
          ctr: calculateCTR(totalClicks, totalImpressions)
        },
        receiptsCount: receipts.length
      };
    } catch (error) {
      console.error('Host analytics retrieval failed:', error);
      throw error;
    }
  }
}