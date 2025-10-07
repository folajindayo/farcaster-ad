import { Router, Request, Response } from 'express';
import { HostManager } from '../services/hostManager';
import { HostProfile, AdPlacement } from '../models';
import { authenticateJWT } from '../services/farcasterAuth';
import HourlyPayoutService from '../services/hourlyPayout';

const router = Router();

/**
 * @swagger
 * /api/host/onboard:
 *   post:
 *     summary: Complete host onboarding
 *     tags: [Host]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fid
 *               - username
 *               - displayName
 *               - walletAddress
 *               - selectedSlots
 *             properties:
 *               fid:
 *                 type: number
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               followerCount:
 *                 type: number
 *               selectedSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [banner, pinned_cast, frame]
 *               preferences:
 *                 type: object
 *               referralCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Host onboarded successfully
 */
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.fid || !data.username || !data.walletAddress || !data.selectedSlots) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const host = await HostManager.onboardHost(data);

    // Process referral if provided
    if (data.referralCode) {
      await HostManager.processReferral(host.id, data.referralCode);
    }

    res.status(201).json({
      success: true,
      host: {
        id: host.id,
        fid: host.fid,
        username: host.username,
        walletAddress: host.walletAddress,
        status: host.status,
        slots: host.slots,
        referralCode: host.referralCode
      }
    });
  } catch (error) {
    console.error('Host onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Onboarding failed'
    });
  }
});

/**
 * @swagger
 * /api/host/profile:
 *   get:
 *     summary: Get host profile
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host profile data
 */
router.get('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const host = await HostProfile.findById(req.user.hostId);
    
    if (!host) {
      return res.status(404).json({
        success: false,
        error: 'Host profile not found'
      });
    }

    res.json({
      success: true,
      profile: host
    });
  } catch (error) {
    console.error('Error fetching host profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * @swagger
 * /api/host/profile:
 *   put:
 *     summary: Update host profile
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               selectedSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferences:
 *                 type: object
 *               profileCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    
    const host = await HostManager.updateHostProfile(req.user.hostId, updates);

    res.json({
      success: true,
      profile: host
    });
  } catch (error) {
    console.error('Error updating host profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * @swagger
 * /api/host/opt-in:
 *   post:
 *     summary: Toggle opt-in status
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - optIn
 *             properties:
 *               optIn:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Opt-in status updated
 */
router.post('/opt-in', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { optIn } = req.body;
    
    const host = await HostManager.toggleOptIn(req.user.hostId, optIn);

    res.json({
      success: true,
      status: host.status,
      isOptedIn: host.isOptedIn
    });
  } catch (error) {
    console.error('Error toggling opt-in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update opt-in status'
    });
  }
});

/**
 * @swagger
 * /api/host/slots/{slotType}:
 *   put:
 *     summary: Update slot configuration
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [banner, pinned_cast, frame]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               minCPM:
 *                 type: number
 *               maxAdsPerDay:
 *                 type: number
 *               blockedCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Slot configuration updated
 */
router.put('/slots/:slotType', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { slotType } = req.params;
    const config = req.body;
    
    const host = await HostManager.updateSlotConfig(
      req.user.hostId,
      slotType,
      config
    );

    res.json({
      success: true,
      slots: host.slots
    });
  } catch (error) {
    console.error('Error updating slot config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update slot configuration'
    });
  }
});

/**
 * @swagger
 * /api/host/earnings:
 *   get:
 *     summary: Get host earnings data
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 */
router.get('/earnings', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const earnings = await HostManager.getHostEarnings(req.user.hostId);

    res.json({
      success: true,
      earnings
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings'
    });
  }
});

/**
 * @swagger
 * /api/host/performance:
 *   get:
 *     summary: Get host performance analytics
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *     responses:
 *       200:
 *         description: Performance data
 */
router.get('/performance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    const performance = await HostManager.getHostPerformance(
      req.user.hostId,
      days
    );

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data'
    });
  }
});

/**
 * @swagger
 * /api/host/preferences:
 *   put:
 *     summary: Update host preferences
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoApproveAds:
 *                 type: boolean
 *               minPayoutThreshold:
 *                 type: number
 *               payoutFrequency:
 *                 type: string
 *                 enum: [hourly, daily, weekly]
 *               allowAdultContent:
 *                 type: boolean
 *               allowPoliticalAds:
 *                 type: boolean
 *               allowCryptoAds:
 *                 type: boolean
 *               timezone:
 *                 type: string
 *               notifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const host = await HostProfile.findById(req.user.hostId);
    
    if (!host) {
      return res.status(404).json({
        success: false,
        error: 'Host not found'
      });
    }

    const preferences = {
      ...host.preferences,
      ...req.body
    };

    await host.save({ preferences });

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * @swagger
 * /api/host/available:
 *   get:
 *     summary: Get available hosts for campaign
 *     tags: [Host]
 *     parameters:
 *       - in: query
 *         name: minFollowers
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxFollowers
 *         schema:
 *           type: number
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *       - in: query
 *         name: slotType
 *         schema:
 *           type: string
 *           enum: [banner, pinned_cast, frame]
 *     responses:
 *       200:
 *         description: Available hosts
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    const filters = {
      minFollowers: req.query.minFollowers ? parseInt(req.query.minFollowers as string) : undefined,
      maxFollowers: req.query.maxFollowers ? parseInt(req.query.maxFollowers as string) : undefined,
      categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
      slotType: req.query.slotType as string
    };

    const hosts = await HostProfile.findActiveHosts(filters);

    res.json({
      success: true,
      count: hosts.length,
      hosts: hosts.map(h => ({
        id: h.id,
        username: h.username,
        displayName: h.displayName,
        followerCount: h.followerCount,
        isVerified: h.isVerified,
        slots: h.getActiveSlots(),
        reputation: h.reputation.score,
        categories: h.profileCategories
      }))
    });
  } catch (error) {
    console.error('Error fetching available hosts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hosts'
    });
  }
});

/**
 * @swagger
 * /api/host/stats:
 *   get:
 *     summary: Get host statistics
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host statistics
 */
router.get('/stats', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const host = await HostProfile.findById(req.user.hostId, {
      include: [
        {
          model: AdPlacement,
          as: 'placements',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    if (!host) {
      return res.status(404).json({
        success: false,
        error: 'Host not found'
      });
    }

    const stats = {
      profile: {
        username: host.username,
        followerCount: host.followerCount,
        reputation: host.reputation.score,
        memberSince: host.createdAt
      },
      slots: {
        total: host.slots.length,
        active: host.getActiveSlots().length,
        placements: host.placements?.length || 0
      },
      earnings: {
        total: host.metrics.totalEarnings,
        pending: host.metrics.pendingEarnings,
        lastPayout: host.metrics.lastPayoutDate
      },
      performance: {
        totalImpressions: host.metrics.totalImpressions,
        totalClicks: host.metrics.totalClicks,
        averageCTR: host.metrics.averageCTR,
        averageCPM: host.metrics.averageCPM
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * @swagger
 * /api/host/referral-code:
 *   get:
 *     summary: Get host referral code
 *     tags: [Host]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral code
 */
router.get('/referral-code', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const host = await HostProfile.findById(req.user.hostId);
    
    if (!host) {
      return res.status(404).json({
        success: false,
        error: 'Host not found'
      });
    }

    res.json({
      success: true,
      referralCode: host.referralCode,
      referralLink: `${process.env.APP_URL}/join?ref=${host.referralCode}`
    });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch referral code'
    });
  }
});

/**
 * @swagger
 * /api/host/earnings/current-hour:
 *   get:
 *     summary: Get current hour earnings (PRD Section 4.6)
 *     tags: [Host]
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current hour earnings
 */
router.get('/earnings/current-hour', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const earnings = await HourlyPayoutService.getCurrentHourEarnings(walletAddress as string);

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error fetching current hour earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current hour earnings'
    });
  }
});

/**
 * @swagger
 * /api/host/earnings/lifetime:
 *   get:
 *     summary: Get lifetime earnings (PRD Section 4.6)
 *     tags: [Host]
 *     parameters:
 *       - in: query
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lifetime earnings
 */
router.get('/earnings/lifetime', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const earnings = await HourlyPayoutService.getLifetimeEarnings(walletAddress as string);

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error fetching lifetime earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lifetime earnings'
    });
  }
});

/**
 * @swagger
 * /api/host/earnings/next-payout:
 *   get:
 *     summary: Get next payout countdown (PRD Section 4.6)
 *     tags: [Host]
 *     responses:
 *       200:
 *         description: Next payout information
 */
router.get('/earnings/next-payout', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0, 0, 0);
    
    const minutesUntilPayout = Math.ceil((nextHour.getTime() - now.getTime()) / 60000);

    res.json({
      success: true,
      data: {
        nextPayoutTime: nextHour.toISOString(),
        minutesUntilPayout,
        message: `Next payout in ${minutesUntilPayout} minutes`
      }
    });
  } catch (error) {
    console.error('Error calculating next payout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate next payout'
    });
  }
});

export default router;
