import express from 'express';
import { Host, User, AdPlacement } from '../models';
// import { AppError, handleError } from '@farcaster-ad-rental/shared';
// Temporary inline implementations
class AppError extends Error {
  constructor(message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}
const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, 500, 'INTERNAL_ERROR');
  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
};

const router = express.Router();

// Host onboarding (new flow with auto-assignment)
router.post('/onboard', async (req, res) => {
  try {
    const { farcasterId, username, displayName, followerCount, preferences } = req.body;

    if (!farcasterId || !username) {
      throw new AppError('Farcaster ID and username are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Get user from token or find by farcasterId
    const user = await User.findOne({ farcasterId });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user is already a host
    let host = await Host.findOne({ farcasterId });
    
    if (host) {
      // Update existing host
      host.username = username;
      host.displayName = displayName || username;
      host.followerCount = followerCount || 0;
      host.status = 'active';
      host.acceptingCampaigns = preferences?.autoAcceptCampaigns !== false;
      host.adTypes = preferences?.adTypes || ['banner', 'pinned_cast'];
      host.categories = preferences?.categories || [];
      host.minimumCPM = preferences?.minimumCPM || 0;
      host.miniAppPermissionsGranted = true;
      host.lastPermissionUpdate = new Date();
      await host.save();
    } else {
      // Create new host
      host = new Host({
        userId: user._id,
        farcasterId,
        username,
        displayName: displayName || username,
        followerCount: followerCount || 0,
        status: 'active',
        acceptingCampaigns: preferences?.autoAcceptCampaigns !== false,
        adTypes: preferences?.adTypes || ['banner', 'pinned_cast'],
        categories: preferences?.categories || [],
        minimumCPM: preferences?.minimumCPM || 0,
        miniAppPermissionsGranted: true,
        lastPermissionUpdate: new Date(),
        isActive: true,
        totalEarnings: 0,
        pendingEarnings: 0
      });
      await host.save();
    }

    // Update user role to host
    user.role = 'host';
    user.isHost = true;
    await user.save();

    // Trigger auto-assignment for this new host
    (async () => {
      try {
        const { autoAssignment } = await import('../services/autoAssignment');
        console.log(`🚀 Triggering auto-assignment for new host ${host._id}`);
        await autoAssignment.processNewHost(host._id.toString());
      } catch (error) {
        console.error('Error in auto-assignment for new host:', error);
        // Don't fail the onboarding if auto-assignment fails
      }
    })();

    res.status(201).json({
      success: true,
      data: {
        host: {
          id: host._id,
          farcasterId: host.farcasterId,
          username: host.username,
          displayName: host.displayName,
          followerCount: host.followerCount,
          status: host.status,
          acceptingCampaigns: host.acceptingCampaigns,
          preferences: {
            adTypes: host.adTypes,
            categories: host.categories,
            minimumCPM: host.minimumCPM,
            autoAcceptCampaigns: host.acceptingCampaigns
          }
        },
        message: 'Host onboarded successfully! Campaigns will be auto-assigned.'
      }
    });
  } catch (error) {
    const err = handleError(error);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Opt-in to hosting (install miniapp) - LEGACY
router.post('/opt-in', async (req, res) => {
  try {
    const { userId, preferences } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user is already a host
    const existingHost = await Host.findOne({ userId });
    if (existingHost) {
      throw new AppError('User is already a host', 400, 'ALREADY_HOST');
    }

    // Create host profile
    const host = new Host({
      userId,
      isActive: true,
      preferences: preferences || {
        categories: [],
        minPrice: '0',
        maxCampaigns: 5,
        autoApprove: false
      },
      totalEarnings: 0,
      pendingEarnings: 0
    });

    await host.save();

    // Update user to mark as host
    user.isHost = true;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        host: {
          id: host._id,
          userId: host.userId,
          isActive: host.isActive,
          preferences: host.preferences,
          totalEarnings: host.totalEarnings,
          pendingEarnings: host.pendingEarnings,
          createdAt: host.createdAt
        }
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Opt-out of hosting (uninstall miniapp)
router.post('/opt-out', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_USER_ID');
    }

    // Find and deactivate host
    const host = await Host.findOne({ userId });
    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    // Deactivate host
    host.isActive = false;
    await host.save();

    // Update user
    const user = await User.findById(userId);
    if (user) {
      user.isHost = false;
      await user.save();
    }

    // Cancel any pending placements
    await AdPlacement.updateMany(
      { hostId: host._id, status: 'pending' },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      data: {
        message: 'Successfully opted out of hosting',
        host: {
          id: host._id,
          isActive: host.isActive,
          optedOutAt: new Date()
        }
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get all hosts
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    
    const hosts = await Host.find(filter)
      .populate('userId', 'username displayName pfpUrl bannerUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();
    
    const total = await Host.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        hosts,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + hosts.length < total
        }
      }
    });
  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get host profile
router.get('/:hostId', async (req, res) => {
  try {
    const host = await Host.findById(req.params.hostId)
      .populate('userId', 'username displayName pfpUrl bannerUrl')
      .lean();

    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { host }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get host by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.params.userId })
      .populate('userId', 'username displayName pfpUrl bannerUrl')
      .lean();

    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { host }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Update host preferences
router.put('/:hostId/preferences', async (req, res) => {
  try {
    const { categories, minPrice, maxCampaigns, autoApprove } = req.body;

    const host = await Host.findById(req.params.hostId);
    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    // Update preferences
    if (categories !== undefined) host.preferences.categories = categories;
    if (minPrice !== undefined) host.preferences.minPrice = minPrice;
    if (maxCampaigns !== undefined) host.preferences.maxCampaigns = maxCampaigns;
    if (autoApprove !== undefined) host.preferences.autoApprove = autoApprove;

    await host.save();

    res.json({
      success: true,
      data: {
        host: {
          id: host._id,
          preferences: host.preferences,
          updatedAt: host.updatedAt
        }
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get host earnings
router.get('/:hostId/earnings', async (req, res) => {
  try {
    const host = await Host.findById(req.params.hostId);
    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    // Get recent placements for earnings breakdown
    const placements = await AdPlacement.find({ hostId: host._id })
      .populate('campaignId', 'title budget spent')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const earnings = {
      totalEarnings: host.totalEarnings,
      pendingEarnings: host.pendingEarnings,
      recentPlacements: placements.map(p => ({
        id: p._id,
        campaignTitle: (p.campaignId as any)?.title,
        status: p.status,
        earnings: p.metrics?.earnings || '0',
        createdAt: p.createdAt
      }))
    };

    res.json({
      success: true,
      data: { earnings }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get available inventory slots
router.get('/:hostId/inventory', async (req, res) => {
  try {
    const host = await Host.findById(req.params.hostId);
    if (!host) {
      throw new AppError('Host not found', 404, 'HOST_NOT_FOUND');
    }

    // Get current active placements
    const activePlacements = await AdPlacement.find({
      hostId: host._id,
      status: { $in: ['active', 'approved'] }
    }).populate('campaignId', 'title type creative');

    // Calculate available slots
    const maxCampaigns = host.preferences.maxCampaigns || 5;
    const availableSlots = Number(maxCampaigns) - activePlacements.length;

    const inventory = {
      maxSlots: maxCampaigns,
      activeSlots: activePlacements.length,
      availableSlots,
      activePlacements: activePlacements.map(p => ({
        id: p._id,
        campaignTitle: (p.campaignId as any)?.title,
        type: (p.campaignId as any)?.type,
        status: p.status,
        startedAt: p.startedAt,
        creative: (p.campaignId as any)?.creative
      }))
    };

    res.json({
      success: true,
      data: { inventory }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

export default router;
