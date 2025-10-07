import express from 'express';
import { Campaign, AdPlacement, HostProfile } from '../models';
import { TrackingService } from '../services/tracking';

const router = express.Router();

// Get banner ad for host
router.get('/banner', async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: 'Host ID is required' });
    }

    // Find active banner placements for this host
    const placements = await AdPlacement.find({
      hostId,
      type: 'banner',
      status: 'active'
    }).populate('campaignId');

    if (placements.length === 0) {
      return res.status(404).json({ error: 'No banner ads available' });
    }

    // Select random placement
    const randomPlacement = placements[Math.floor(Math.random() * placements.length)];
    const campaign = randomPlacement.campaignId;

    // Get host profile for targeting
    const host = await HostProfile.findOne({ userId: hostId });
    if (!host) {
      return res.status(404).json({ error: 'Host profile not found' });
    }

    // Check targeting criteria
    if ((campaign as any).targeting && typeof (campaign as any).targeting === 'object') {
      const { minFollowers, maxFollowers, categories, regions } = (campaign as any).targeting;

      if (minFollowers && host.followerCount < minFollowers) {
        return res.status(404).json({ error: 'No matching ads' });
      }

      if (maxFollowers && host.followerCount > maxFollowers) {
        return res.status(404).json({ error: 'No matching ads' });
      }

      if (categories && categories.length > 0) {
        const hostCategories = (host.preferences as any)?.categories || [];
        const hasMatchingCategory = categories.some((cat: any) => hostCategories.includes(cat));
        if (!hasMatchingCategory) {
          return res.status(404).json({ error: 'No matching ads' });
        }
      }
    }

    // Format ad response
    const ad = {
      id: randomPlacement._id,
      campaignId: campaign._id,
      campaignName: (campaign as any).name,
      creative: (campaign as any).creative,
      advertiser: {
        name: (campaign as any).advertiserId?.name || 'Unknown',
        logo: (campaign as any).advertiserId?.logo || null
      },
      metrics: {
        impressions: randomPlacement.impressions || 0,
        clicks: randomPlacement.clicks || 0,
        ctr: randomPlacement.clicks && randomPlacement.impressions 
          ? (randomPlacement.clicks / randomPlacement.impressions * 100) 
          : 0,
        likes: randomPlacement.likes || 0,
        recasts: randomPlacement.recasts || 0,
        replies: randomPlacement.replies || 0
      },
      targeting: (campaign as any).targeting || {}
    };

    res.json({ ad });
  } catch (error) {
    console.error('Error fetching banner ad:', error);
    res.status(500).json({ error: 'Failed to fetch banner ad' });
  }
});

// Get pinned cast ad for host
router.get('/pinned-cast', async (req, res) => {
  try {
    const { hostId } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: 'Host ID is required' });
    }

    // Find active pinned cast placements for this host
    const placements = await AdPlacement.find({
      hostId,
      type: 'pinned_cast',
      status: 'active'
    }).populate('campaignId');

    if (placements.length === 0) {
      return res.status(404).json({ error: 'No pinned cast ads available' });
    }

    // Select random placement
    const randomPlacement = placements[Math.floor(Math.random() * placements.length)];
    const campaign = randomPlacement.campaignId;

    // Get host profile for targeting
    const host = await HostProfile.findOne({ userId: hostId });
    if (!host) {
      return res.status(404).json({ error: 'Host profile not found' });
    }

    // Check targeting criteria (same as banner)
    if ((campaign as any).targeting) {
      const { minFollowers, maxFollowers, categories, regions } = (campaign as any).targeting;

      if (minFollowers && host.followerCount < minFollowers) {
        return res.status(404).json({ error: 'No matching ads' });
      }

      if (maxFollowers && host.followerCount > maxFollowers) {
        return res.status(404).json({ error: 'No matching ads' });
      }

      if (categories && categories.length > 0) {
        const hostCategories = (host.preferences as any)?.categories || [];
        const hasMatchingCategory = categories.some((cat: any) => hostCategories.includes(cat));
        if (!hasMatchingCategory) {
          return res.status(404).json({ error: 'No matching ads' });
        }
      }
    }

    // Format ad response
    const ad = {
      id: randomPlacement._id,
      campaignId: campaign._id,
      campaignName: (campaign as any).name,
      creative: (campaign as any).creative,
      advertiser: {
        name: (campaign as any).advertiserId?.name || 'Unknown',
        handle: (campaign as any).advertiserId?.handle || 'unknown',
        logo: (campaign as any).advertiserId?.logo || null
      },
      metrics: {
        impressions: randomPlacement.impressions || 0,
        clicks: randomPlacement.clicks || 0,
        ctr: randomPlacement.clicks && randomPlacement.impressions 
          ? (randomPlacement.clicks / randomPlacement.impressions * 100) 
          : 0,
        likes: randomPlacement.likes || 0,
        recasts: randomPlacement.recasts || 0,
        replies: randomPlacement.replies || 0
      },
      targeting: (campaign as any).targeting || {},
      timestamp: randomPlacement.createdAt.toISOString()
    };

    res.json({ ad });
  } catch (error) {
    console.error('Error fetching pinned cast ad:', error);
    res.status(500).json({ error: 'Failed to fetch pinned cast ad' });
  }
});

// Get frame ad for campaign
router.get('/frame/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(404).json({ error: 'Campaign not active' });
    }

    // Format ad response
    const ad = {
      id: campaign._id,
      campaignId: campaign._id,
      campaignName: (campaign as any).name,
      creative: (campaign as any).creative,
      advertiser: {
        name: (campaign as any).advertiserId?.name || 'Unknown',
        logo: (campaign as any).advertiserId?.logo || null
      },
      metrics: {
        impressions: campaign.metrics?.impressions || 0,
        clicks: campaign.metrics?.clicks || 0,
        ctr: campaign.metrics?.clicks && campaign.metrics?.impressions 
          ? (campaign.metrics.clicks / campaign.metrics.impressions * 100) 
          : 0
      },
      targeting: (campaign as any).targeting || {}
    };

    res.json({ ad });
  } catch (error) {
    console.error('Error fetching frame ad:', error);
    res.status(500).json({ error: 'Failed to fetch frame ad' });
  }
});

export default router;