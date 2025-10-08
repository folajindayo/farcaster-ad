import { Campaign } from '../models';
import { campaignMatcher } from './campaignMatcher';
import { farcasterPosting } from './farcasterPosting';

/**
 * Automatic Campaign Assignment Service
 * Handles the complete flow of matching, assigning, and deploying campaigns to hosts
 */
class AutoAssignmentService {
  /**
   * Process a newly funded campaign
   * This is triggered when a campaign receives funding and becomes active
   */
  async processFundedCampaign(campaignId: string): Promise<any> {
    try {
      console.log(`💰 Processing funded campaign: ${campaignId}`);

      // Update campaign status to active
      const campaign = await Campaign.findByIdAndUpdate(
        campaignId,
        { status: 'active' },
        { new: true }
      );

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      console.log(`✅ Campaign ${campaignId} activated`);

      // Auto-assign to matching hosts
      const placements = await campaignMatcher.autoAssignCampaign(campaignId);

      if (placements.length === 0) {
        console.log(`⚠️ No hosts matched for campaign ${campaignId}`);
        return {
          success: true,
          campaignId,
          hostsMatched: 0,
          placements: [],
          message: 'Campaign activated but no matching hosts found'
        };
      }

      // Deploy ads to all matched hosts
      const deployments = [];
      for (const placement of placements) {
        try {
          const deployment = await farcasterPosting.deployAdToHost(
            placement.hostId.toString(),
            campaignId
          );
          deployments.push(deployment);

          console.log(`✅ Ad deployed to host ${placement.hostId}`);

          // TODO: Send notification to host
          await this.notifyHost(placement.hostId.toString(), campaignId);
        } catch (error) {
          console.error(`❌ Failed to deploy to host ${placement.hostId}:`, error);
          // Continue with other hosts
        }
      }

      console.log(`🎉 Campaign ${campaignId} successfully deployed to ${deployments.length} hosts`);

      return {
        success: true,
        campaignId,
        hostsMatched: placements.length,
        hostsDeployed: deployments.length,
        placements,
        deployments
      };
    } catch (error) {
      console.error('❌ Error processing funded campaign:', error);
      throw error;
    }
  }

  /**
   * Process a new host that just completed onboarding
   * Assign them to any active campaigns they match
   */
  async processNewHost(hostId: string): Promise<any> {
    try {
      console.log(`👤 Processing new host: ${hostId}`);

      // Find all active campaigns
      const activeCampaigns = await Campaign.find({ status: 'active' });

      if (activeCampaigns.length === 0) {
        console.log(`⚠️ No active campaigns available`);
        return {
          success: true,
          hostId,
          campaignsMatched: 0,
          message: 'No active campaigns available'
        };
      }

      const assignments = [];

      // Check each campaign for compatibility
      for (const campaign of activeCampaigns) {
        try {
          // Find if this host matches this campaign
          const matchingHosts = await campaignMatcher.findMatchingHosts(campaign._id.toString());
          const isMatch = matchingHosts.some(h => h._id.toString() === hostId);

          if (isMatch) {
            // Assign campaign to host
            const placement = await campaignMatcher.assignCampaignToHost(
              campaign._id.toString(),
              hostId
            );

            // Deploy ad to host
            const deployment = await farcasterPosting.deployAdToHost(
              hostId,
              campaign._id.toString()
            );

            assignments.push({
              campaignId: campaign._id,
              campaignName: campaign.title || campaign.name,
              placement,
              deployment
            });

            console.log(`✅ Campaign ${campaign._id} assigned to host ${hostId}`);
          }
        } catch (error) {
          console.error(`❌ Failed to assign campaign ${campaign._id}:`, error);
          // Continue with other campaigns
        }
      }

      console.log(`🎉 Host ${hostId} matched with ${assignments.length} campaigns`);

      // Send notification to host
      if (assignments.length > 0) {
        await this.notifyHost(hostId, null, assignments.length);
      }

      return {
        success: true,
        hostId,
        campaignsMatched: assignments.length,
        assignments
      };
    } catch (error) {
      console.error('❌ Error processing new host:', error);
      throw error;
    }
  }

  /**
   * Complete a campaign
   * Remove ads from all hosts and mark placements as completed
   */
  async completeCampaign(campaignId: string): Promise<any> {
    try {
      console.log(`🏁 Completing campaign: ${campaignId}`);

      // Update campaign status
      const campaign = await Campaign.findByIdAndUpdate(
        campaignId,
        { status: 'completed' },
        { new: true }
      );

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Find all active placements
      const AdPlacement = (await import('../models')).AdPlacement;
      const placements = await AdPlacement.find({
        campaignId,
        status: 'active'
      });

      // Remove ads from all hosts
      const removals = [];
      for (const placement of placements) {
        try {
          const removal = await farcasterPosting.removeAdFromHost(
            placement.hostId.toString(),
            campaignId
          );
          removals.push(removal);

          console.log(`✅ Ad removed from host ${placement.hostId}`);
        } catch (error) {
          console.error(`❌ Failed to remove ad from host ${placement.hostId}:`, error);
          // Continue with other hosts
        }
      }

      console.log(`🎉 Campaign ${campaignId} completed and removed from ${removals.length} hosts`);

      return {
        success: true,
        campaignId,
        hostsRemoved: removals.length,
        removals
      };
    } catch (error) {
      console.error('❌ Error completing campaign:', error);
      throw error;
    }
  }

  /**
   * Send notification to host about new campaign
   */
  private async notifyHost(hostId: string, campaignId: string | null, count?: number): Promise<void> {
    try {
      // TODO: Implement actual notification system
      // This could be:
      // - Email notification
      // - In-app notification
      // - Farcaster direct cast
      
      if (campaignId) {
        console.log(`📬 Notifying host ${hostId} about campaign ${campaignId}`);
        console.log(`   Message: "New campaign live on your profile! 💰"`);
      } else if (count) {
        console.log(`📬 Notifying host ${hostId} about ${count} new campaigns`);
        console.log(`   Message: "${count} campaigns now live on your profile! 💰"`);
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      // Don't throw - notification failure shouldn't break the flow
    }
  }

  /**
   * Run periodic check for campaign-host matching
   * This can be run as a cron job to ensure all campaigns and hosts are matched
   */
  async runPeriodicMatching(): Promise<any> {
    try {
      console.log(`🔄 Running periodic matching check...`);

      // Find all active campaigns
      const activeCampaigns = await Campaign.find({ status: 'active' });
      
      let totalMatched = 0;
      const results = [];

      for (const campaign of activeCampaigns) {
        try {
          // Find new matches for this campaign
          const matchingHosts = await campaignMatcher.findMatchingHosts(campaign._id.toString());
          
          if (matchingHosts.length > 0) {
            // Assign to all matching hosts
            for (const host of matchingHosts) {
              try {
                const placement = await campaignMatcher.assignCampaignToHost(
                  campaign._id.toString(),
                  host._id.toString()
                );
                
                await farcasterPosting.deployAdToHost(
                  host._id.toString(),
                  campaign._id.toString()
                );

                totalMatched++;
              } catch (error) {
                console.error(`Failed to match campaign ${campaign._id} with host ${host._id}:`, error);
              }
            }
          }

          results.push({
            campaignId: campaign._id,
            newMatches: matchingHosts.length
          });
        } catch (error) {
          console.error(`Error processing campaign ${campaign._id}:`, error);
        }
      }

      console.log(`✅ Periodic matching complete: ${totalMatched} new matches created`);

      return {
        success: true,
        campaignsProcessed: activeCampaigns.length,
        totalNewMatches: totalMatched,
        results
      };
    } catch (error) {
      console.error('❌ Error in periodic matching:', error);
      throw error;
    }
  }
}

export const autoAssignment = new AutoAssignmentService();

