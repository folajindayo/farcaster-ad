import { farcasterConfig, adSlotTypes } from '../config/farcaster';
import { User, Campaign, AdPlacement } from '../models';
import axios from 'axios';
import mongoose from 'mongoose';

// Interface for ad placement request
interface AdPlacementRequest {
  hostId: string;
  slotType: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Interface for ad response
interface AdResponse {
  adId: string;
  campaignId: string;
  creativeUrl: string;
  targetUrl?: string;
  castText?: string;
  impressionTrackingUrl: string;
  clickTrackingUrl: string;
}

/**
 * Get an ad for a specific host and slot
 */
export const getAdForHost = async (req: AdPlacementRequest): Promise<AdResponse | null> => {
  try {
    // Check if host exists and is opted in
    const host = await User.findById(req.hostId);
    
    if (!host || !host.isOptedIn) {
      console.log(`Host ${req.hostId} not found or not opted in`);
      return null;
    }
    
    // Find active campaigns that match the slot type
    const activeCampaigns = await Campaign.find({
      status: 'active',
      type: req.slotType,
      approvalFlag: true,
      // Ensure campaign has budget left
      $expr: { $lt: ['$spent', '$budget'] }
    }).sort({ 'createdAt': 1 }); // Oldest campaigns first (FIFO)
    
    if (activeCampaigns.length === 0) {
      console.log(`No active campaigns found for slot type ${req.slotType}`);
      return null;
    }
    
    // Select a campaign (simple round-robin for now)
    // In a production system, you'd implement more sophisticated ad selection
    const campaign = activeCampaigns[0];
    
    // Check if this host already has an ad placement for this campaign
    const existingPlacement = await AdPlacement.findOne({
      campaignId: campaign._id,
      hostId: new mongoose.Types.ObjectId(req.hostId),
      active: true
    });
    
    if (existingPlacement) {
      // Return existing placement
      return formatAdResponse(existingPlacement, campaign);
    }
    
    // Create new ad placement
    const adPlacement = await AdPlacement.create({
      campaignId: campaign._id,
      hostId: new mongoose.Types.ObjectId(req.hostId),
      slotType: req.slotType,
      dimensions: req.dimensions,
      impressions: 0,
      clicks: 0,
      active: true
    });
    
    return formatAdResponse(adPlacement, campaign);
  } catch (error) {
    console.error('Error getting ad for host:', error);
    return null;
  }
};

/**
 * Format ad response from placement and campaign
 */
const formatAdResponse = (placement: any, campaign: any): AdResponse => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
  
  // Determine creative URL based on slot type
  let creativeUrl = '';
  if (campaign.creativeAssets) {
    if (placement.slotType === adSlotTypes.BANNER && campaign.creativeAssets.imageUrl) {
      creativeUrl = campaign.creativeAssets.imageUrl;
    } else if (placement.slotType === adSlotTypes.FRAME && campaign.creativeAssets.frameUrl) {
      creativeUrl = campaign.creativeAssets.frameUrl;
    }
  }
  
  return {
    adId: placement._id.toString(),
    campaignId: campaign._id.toString(),
    creativeUrl,
    targetUrl: campaign.creativeAssets?.externalUrl,
    castText: campaign.creativeAssets?.castText,
    impressionTrackingUrl: `${baseUrl}/tracking/impression/${placement._id}`,
    clickTrackingUrl: `${baseUrl}/tracking/click/${placement._id}`
  };
};

/**
 * Opt in a host to the ad network
 */
export const optInHost = async (hostId: string, slots: string[]) => {
  try {
    // Validate slot types
    const validSlots = slots.filter(slot => 
      Object.values(adSlotTypes).includes(slot as any)
    );
    
    if (validSlots.length === 0) {
      throw new Error('No valid slot types provided');
    }
    
    // Update host
    const host = await User.findById(hostId);
    
    if (!host) {
      throw new Error('Host not found');
    }
    
    host.isOptedIn = true;
    await host.save();
    
    // Return success
    return {
      success: true,
      message: 'Successfully opted in to ad network',
      slots: validSlots
    };
  } catch (error) {
    console.error('Error opting in host:', error);
    throw error;
  }
};

/**
 * Opt out a host from the ad network
 */
export const optOutHost = async (hostId: string) => {
  try {
    // Update host
    const host = await User.findById(hostId);
    
    if (!host) {
      throw new Error('Host not found');
    }
    
    host.isOptedIn = false;
    await host.save();
    
    // Deactivate all active ad placements
    await AdPlacement.updateMany(
      { hostId: new mongoose.Types.ObjectId(hostId), active: true },
      { active: false }
    );
    
    // Return success
    return {
      success: true,
      message: 'Successfully opted out of ad network'
    };
  } catch (error) {
    console.error('Error opting out host:', error);
    throw error;
  }
};

/**
 * Generate Mini App manifest
 */
export const generateManifest = () => {
  return {
    name: farcasterConfig.miniAppName,
    description: farcasterConfig.miniAppDescription,
    icon: farcasterConfig.miniAppIcon,
    url: farcasterConfig.appUrl,
    capabilities: {
      // Permissions required by the Mini App
      'farcaster:read': {
        description: 'Read your Farcaster profile'
      },
      'farcaster:write:cast': {
        description: 'Create casts on your behalf for pinned ads'
      },
      'farcaster:write:profile': {
        description: 'Update your profile to display banner ads'
      },
      'ethereum:wallet:read': {
        description: 'Read your wallet address for payments'
      }
    }
  };
};

export default {
  getAdForHost,
  optInHost,
  optOutHost,
  generateManifest
};


