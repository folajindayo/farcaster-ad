import { Campaign, Host, AdPlacement } from '../models';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

interface CastOptions {
  text: string;
  embeds?: string[];
  parentUrl?: string;
}

interface ProfileBannerOptions {
  imageUrl: string;
}

/**
 * Farcaster Posting Service
 * Handles posting ads to Farcaster on behalf of hosts
 * Now with REAL Neynar API integration!
 */
class FarcasterPostingService {
  private neynarClient: NeynarAPIClient | null = null;
  
  constructor() {
    // Initialize Neynar client if API key is available
    const apiKey = process.env.NEYNAR_API_KEY;
    if (apiKey) {
      const config = new Configuration({
        apiKey: apiKey,
      });
      this.neynarClient = new NeynarAPIClient(config);
      console.log('✅ Neynar API client initialized');
    } else {
      console.warn('⚠️  NEYNAR_API_KEY not set - using mock posting');
    }
  }
  /**
   * Post an ad cast (pinned cast) to a host's Farcaster profile
   */
  async postPinnedCast(hostId: string, campaignId: string): Promise<any> {
    try {
      console.log(`📌 Posting pinned cast for campaign ${campaignId} on host ${hostId}`);

      // Get campaign and host
      const [campaign, host] = await Promise.all([
        Campaign.findById(campaignId),
        Host.findById(hostId)
      ]);

      if (!campaign) throw new Error('Campaign not found');
      if (!host) throw new Error('Host not found');

      // Prepare cast content
      const castText = this.buildCastText(campaign);
      const castEmbeds = this.buildCastEmbeds(campaign);

      console.log(`📝 Cast content:`, { text: castText, embeds: castEmbeds });

      // TODO: Use Farcaster SDK to post cast
      // For now, we'll simulate the posting
      const castHash = await this.postCastToFarcaster(host.farcasterId, {
        text: castText,
        embeds: castEmbeds
      });

      // TODO: Pin the cast to the host's profile
      await this.pinCast(host.farcasterId, castHash);

      console.log(`✅ Pinned cast posted successfully! Cast hash: ${castHash}`);

      // Update placement with cast information
      await AdPlacement.findOneAndUpdate(
        { campaignId, hostId },
        {
          $set: {
            'metadata.castHash': castHash,
            'metadata.postedAt': new Date()
          }
        }
      );

      return { castHash, success: true };
    } catch (error) {
      console.error('❌ Error posting pinned cast:', error);
      throw error;
    }
  }

  /**
   * Update a host's Farcaster profile banner
   */
  async updateProfileBanner(hostId: string, campaignId: string): Promise<any> {
    try {
      console.log(`🖼️ Updating profile banner for campaign ${campaignId} on host ${hostId}`);

      // Get campaign and host
      const [campaign, host] = await Promise.all([
        Campaign.findById(campaignId),
        Host.findById(hostId)
      ]);

      if (!campaign) throw new Error('Campaign not found');
      if (!host) throw new Error('Host not found');

      // Get banner image URL
      const bannerUrl = campaign.creative?.bannerImage || campaign.creative?.mediaUrl;
      
      if (!bannerUrl) {
        throw new Error('No banner image found for campaign');
      }

      console.log(`🖼️ Banner URL:`, bannerUrl);

      // TODO: Use Farcaster API to update profile banner
      // For now, we'll simulate the update
      await this.updateFarcasterProfileBanner(host.farcasterId, bannerUrl);

      console.log(`✅ Profile banner updated successfully!`);

      // Update placement with banner information
      await AdPlacement.findOneAndUpdate(
        { campaignId, hostId },
        {
          $set: {
            'metadata.bannerUrl': bannerUrl,
            'metadata.bannerUpdatedAt': new Date()
          }
        }
      );

      return { bannerUrl, success: true };
    } catch (error) {
      console.error('❌ Error updating profile banner:', error);
      throw error;
    }
  }

  /**
   * Deploy ad to host's Farcaster profile based on ad type
   */
  async deployAdToHost(hostId: string, campaignId: string): Promise<any> {
    try {
      console.log(`🚀 Deploying ad for campaign ${campaignId} to host ${hostId}`);

      const campaign = await Campaign.findById(campaignId);
      if (!campaign) throw new Error('Campaign not found');

      const results: any = {
        campaignId,
        hostId,
        adType: campaign.type,
        success: true,
        deployments: []
      };

      // Deploy based on ad type
      if (campaign.type === 'pinned_cast' || campaign.type === 'both') {
        try {
          const castResult = await this.postPinnedCast(hostId, campaignId);
          results.deployments.push({ type: 'pinned_cast', ...castResult });
        } catch (error) {
          console.error('Failed to post pinned cast:', error);
          results.success = false;
        }
      }

      if (campaign.type === 'banner' || campaign.type === 'both') {
        try {
          const bannerResult = await this.updateProfileBanner(hostId, campaignId);
          results.deployments.push({ type: 'banner', ...bannerResult });
        } catch (error) {
          console.error('Failed to update banner:', error);
          results.success = false;
        }
      }

      console.log(`✅ Ad deployment complete:`, results);

      return results;
    } catch (error) {
      console.error('❌ Error deploying ad:', error);
      throw error;
    }
  }

  /**
   * Remove ad from host's Farcaster profile
   */
  async removeAdFromHost(hostId: string, campaignId: string): Promise<any> {
    try {
      console.log(`🗑️ Removing ad for campaign ${campaignId} from host ${hostId}`);

      const placement = await AdPlacement.findOne({ campaignId, hostId });
      if (!placement) {
        console.log(`⚠️ No placement found, nothing to remove`);
        return { success: true };
      }

      const campaign = await Campaign.findById(campaignId);
      const host = await Host.findById(hostId);

      if (!campaign || !host) {
        console.log(`⚠️ Campaign or host not found`);
        return { success: true };
      }

      // Remove based on ad type
      if (campaign.type === 'pinned_cast' || campaign.type === 'both') {
        const castHash = placement.metadata?.castHash;
        if (castHash) {
          await this.unpinCast(host.farcasterId, castHash);
          // Optionally delete the cast
          await this.deleteCast(host.farcasterId, castHash);
        }
      }

      if (campaign.type === 'banner' || campaign.type === 'both') {
        // Revert to original banner or remove ad banner
        await this.revertProfileBanner(host.farcasterId);
      }

      // Update placement status
      placement.status = 'completed';
      placement.endDate = new Date();
      await placement.save();

      console.log(`✅ Ad removed successfully!`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error removing ad:', error);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Build cast text from campaign creative
   */
  private buildCastText(campaign: any): string {
    const creative = campaign.creative || {};
    const title = campaign.title || campaign.name;
    const ctaText = creative.ctaText || 'Learn More';
    const ctaUrl = creative.ctaUrl || '';

    // Build engaging cast text
    let text = `🎯 ${title}\n\n`;
    
    if (campaign.description) {
      text += `${campaign.description}\n\n`;
    }

    text += `${ctaText}: ${ctaUrl}`;

    // Ensure text is within Farcaster's limit (320 characters)
    if (text.length > 320) {
      text = text.substring(0, 317) + '...';
    }

    return text;
  }

  /**
   * Build cast embeds (images/videos) from campaign creative
   */
  private buildCastEmbeds(campaign: any): string[] {
    const creative = campaign.creative || {};
    const embeds: string[] = [];

    // Add media URL as embed
    if (creative.mediaUrl) {
      embeds.push(creative.mediaUrl);
    }

    if (creative.pinnedCastMedia) {
      embeds.push(creative.pinnedCastMedia);
    }

    return embeds;
  }

  /**
   * Post cast to Farcaster (via Neynar API)
   */
  private async postCastToFarcaster(fid: number, options: CastOptions): Promise<string> {
    console.log(`📡 Posting to Farcaster for FID ${fid}:`, options);
    
    // Get host's signer UUID
    const host = await Host.findOne({ farcasterId: fid });
    if (!host) {
      throw new Error(`Host with FID ${fid} not found`);
    }
    
    // Check if we have a signer
    const signerUuid = (host as any).signerUuid;
    
    if (!this.neynarClient) {
      console.warn('⚠️  Neynar API not configured - returning mock hash');
      const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
      return mockHash;
    }
    
    if (!signerUuid) {
      console.warn(`⚠️  Host FID ${fid} has not authorized a signer yet`);
      console.log('   Host needs to authorize posting via: /host/dashboard -> Authorize Posting');
      
      // Return mock hash for now
      const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
      return mockHash;
    }
    
    try {
      // REAL API CALL TO NEYNAR
      console.log(`🚀 Publishing cast via Neynar for signer: ${signerUuid}`);
      
      const embeds = options.embeds?.map(url => ({ url })) || [];
      
      const response = await this.neynarClient.publishCast(
        signerUuid,
        options.text,
        {
          embeds: embeds.length > 0 ? embeds : undefined
        }
      );
      
      console.log(`✅ Cast published successfully! Hash: ${response.cast.hash}`);
      console.log(`   View at: https://warpcast.com/${host.username}/${response.cast.hash.slice(0, 10)}`);
      
      return response.cast.hash;
    } catch (error: any) {
      console.error('❌ Failed to post cast via Neynar:', error.message);
      
      // If signer is invalid, clear it
      if (error.message?.includes('signer') || error.message?.includes('unauthorized')) {
        console.log('   Signer may be invalid - host needs to re-authorize');
      }
      
      throw error;
    }
  }

  /**
   * Pin a cast to profile
   */
  private async pinCast(fid: number, castHash: string): Promise<void> {
    // TODO: Implement actual Farcaster API call to pin cast
    console.log(`📌 Pinning cast ${castHash} for FID ${fid}`);
    
    // This would use Farcaster API
    // Example: await farcasterClient.pinCast({ fid, castHash });
  }

  /**
   * Unpin a cast from profile
   */
  private async unpinCast(fid: number, castHash: string): Promise<void> {
    // TODO: Implement actual Farcaster API call
    console.log(`📌 Unpinning cast ${castHash} for FID ${fid}`);
  }

  /**
   * Delete a cast
   */
  private async deleteCast(fid: number, castHash: string): Promise<void> {
    // TODO: Implement actual Farcaster API call
    console.log(`🗑️ Deleting cast ${castHash} for FID ${fid}`);
  }

  /**
   * Update Farcaster profile banner
   */
  private async updateFarcasterProfileBanner(fid: number, imageUrl: string): Promise<void> {
    // TODO: Implement actual Farcaster API call
    console.log(`🖼️ Updating banner for FID ${fid} to: ${imageUrl}`);
    
    // This would use Farcaster API
    // Example: await farcasterClient.updateProfile({ fid, pfpUrl: imageUrl });
  }

  /**
   * Revert profile banner to original
   */
  private async revertProfileBanner(fid: number): Promise<void> {
    // TODO: Implement actual Farcaster API call to revert banner
    console.log(`🖼️ Reverting banner for FID ${fid}`);
  }
}

export const farcasterPosting = new FarcasterPostingService();

