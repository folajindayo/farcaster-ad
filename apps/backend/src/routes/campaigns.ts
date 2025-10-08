import express from 'express';
import { Campaign, Advertiser } from '../models';
// import { calculatePlatformFee, calculateHostEarnings } from '@farcaster-ad-rental/shared';
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
const calculatePlatformFee = (amount: string, feePercentage: number = 5): string => ((parseFloat(amount) * feePercentage) / 100).toFixed(6);
const calculateHostEarnings = (amount: string, feePercentage: number = 5): string => (parseFloat(amount) - parseFloat(calculatePlatformFee(amount, feePercentage))).toFixed(6);

const router = express.Router();

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - advertiserId
 *               - title
 *               - budget
 *               - type
 *             properties:
 *               advertiserId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               title:
 *                 type: string
 *                 example: "Summer Sale Campaign"
 *               description:
 *                 type: string
 *                 example: "Promote our summer sale"
 *               budget:
 *                 type: string
 *                 example: "1000.00"
 *               type:
 *                 type: string
 *                 enum: [banner, pinned_cast]
 *                 example: "banner"
 *               targeting:
 *                 type: object
 *                 properties:
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["tech", "crypto"]
 *                   minFollowers:
 *                     type: number
 *                     example: 1000
 *                   maxFollowers:
 *                     type: number
 *                     example: 10000
 *                   regions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["US", "EU"]
 *               creative:
 *                 type: object
 *                 properties:
 *                   bannerImage:
 *                     type: string
 *                     example: "/uploads/banner.jpg"
 *                   pinnedCastText:
 *                     type: string
 *                     example: "Check out our new product!"
 *                   pinnedCastMedia:
 *                     type: string
 *                     example: "/uploads/media.jpg"
 *                   ctaText:
 *                     type: string
 *                     example: "Learn More"
 *                   ctaUrl:
 *                     type: string
 *                     example: "https://example.com"
 *               schedule:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   maxImpressions:
 *                     type: number
 *                     example: 10000
 *                   cpm:
 *                     type: string
 *                     example: "5.00"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaign:
 *                       $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Advertiser not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const {
      advertiserId,
      title,
      description,
      budget,
      type,
      targeting,
      creative,
      schedule,
      // New detailed fields
      objective,
      adType,
      duration,
      durationUnit,
      targetAudience,
      followerRange,
      pricingModel,
      cpm,
      mediaUrl,
      ctaUrl,
      ctaText
    } = req.body;

    // Validate required fields
    if (!advertiserId || !title || !budget || !type) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Verify advertiser exists, create if not
    let advertiser = await Advertiser.findById(advertiserId);
    if (!advertiser) {
      // Create a new advertiser
      advertiser = new Advertiser({
        userId: advertiserId,
        companyName: title || 'Default Company',
        totalSpent: 0,
        activeCampaigns: 0
      });
      await advertiser.save();
    }

    // Calculate pricing based on type and schedule
    const pricing = calculateCampaignPricing(budget, type, schedule);
    
    // Calculate duration in days
    const durationDays = duration ? (durationUnit === 'weeks' ? duration * 7 : duration) : 7;
    
    // Create campaign with enhanced fields
    const campaign = new Campaign({
      advertiserId,
      title,
      name: title,
      description: description || `${objective || 'awareness'} campaign targeting ${targetAudience || 'general audience'}`,
      budget: pricing.totalBudget,
      spent: 0,
      status: 'pending',
      type: adType || type, // Use adType if provided, fallback to type
      targetMetric: pricingModel === 'impression' ? 'impressions' : 'duration',
      targetValue: pricingModel === 'impression' ? 
        Math.floor((parseFloat(budget) / parseFloat(cpm || '5.00')) * 1000) : 
        durationDays,
      startDate: schedule?.startDate ? new Date(schedule.startDate) : new Date(),
      endDate: schedule?.endDate ? new Date(schedule.endDate) : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      targeting: {
        ...targeting,
        audience: targetAudience,
        followerRange: followerRange,
        objective: objective
      },
      creative: {
        ...creative,
        mediaUrl: mediaUrl,
        ctaUrl: ctaUrl,
        ctaText: ctaText
      },
      schedule: {
        ...schedule,
        duration: durationDays,
        durationUnit: durationUnit || 'days',
        pricingModel: pricingModel || 'time',
        cpm: cpm
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        engagements: 0,
        spend: '0',
        ctr: 0,
        cpm: parseFloat(cpm || '5.00')
      }
    });

    await campaign.save();

    // Auto-assign campaign to matching hosts (async, don't wait)
    // This will match, assign, and deploy ads automatically
    (async () => {
      try {
        const { autoAssignment } = await import('../services/autoAssignment');
        console.log(`🚀 Triggering auto-assignment for campaign ${campaign._id}`);
        await autoAssignment.processFundedCampaign(campaign._id.toString());
      } catch (error) {
        console.error('Error in auto-assignment:', error);
        // Don't fail the campaign creation if auto-assignment fails
      }
    })();

    res.status(201).json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          name: campaign.name,
          description: campaign.description,
          budget: campaign.budget,
          pricing,
          status: campaign.status,
          type: campaign.type,
          objective: campaign.targeting?.objective,
          targetAudience: campaign.targeting?.audience,
          duration: campaign.schedule?.duration,
          durationUnit: campaign.schedule?.durationUnit,
          pricingModel: campaign.schedule?.pricingModel,
          cpm: campaign.schedule?.cpm,
          mediaUrl: campaign.creative?.mediaUrl,
          ctaUrl: campaign.creative?.ctaUrl,
          ctaText: campaign.creative?.ctaText,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          createdAt: campaign.createdAt
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

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const { status, advertiserId, limit = 50, offset = 0 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (advertiserId) filter.advertiserId = advertiserId;
    
    const campaigns = await Campaign.find(filter)
      .populate('advertiserId', 'companyName totalSpent')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();
    
    const total = await Campaign.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + campaigns.length < total
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

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('advertiserId', 'companyName totalSpent')
      .lean();

    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { campaign }
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

// Get campaigns by advertiser
router.get('/advertiser/:advertiserId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { advertiserId: req.params.advertiserId };
    if (status) {
      filter.status = status;
    }

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Campaign.countDocuments(filter);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
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

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { title, description, targeting, creative, schedule } = req.body;

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    // Only allow updates to draft campaigns
    if (campaign.status !== 'draft') {
      throw new AppError('Cannot update non-draft campaign', 400, 'INVALID_STATUS');
    }

    // Update fields
    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (targeting) campaign.targeting = targeting;
    if (creative) campaign.creative = creative;
    if (schedule) campaign.schedule = schedule;

    await campaign.save();

    res.json({
      success: true,
      data: { campaign }
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

// Fund campaign (move to funded status)
router.post('/:id/fund', async (req, res) => {
  try {
    const { amount, transactionHash } = req.body;

    if (!amount || !transactionHash) {
      throw new AppError('Missing funding details', 400, 'MISSING_FUNDING_DETAILS');
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    if (campaign.status !== 'draft') {
      throw new AppError('Campaign is not in draft status', 400, 'INVALID_STATUS');
    }

    // Update campaign status to active (funded campaigns are active)
    campaign.status = 'active';
    campaign.budget = amount;
    await campaign.save();

    // TODO: Integrate with smart contract to verify transaction
    // This would typically involve:
    // 1. Verify the transaction hash on-chain
    // 2. Confirm the USDC was transferred to escrow
    // 3. Update campaign status accordingly

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          status: campaign.status,
          budget: campaign.budget,
          fundedAt: new Date()
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

// Helper function to calculate campaign pricing
function calculateCampaignPricing(budget: string, type: string, schedule: any) {
  const baseBudget = parseFloat(budget);
  const platformFee = calculatePlatformFee(budget);
  const hostEarnings = calculateHostEarnings(budget);
  
  // Calculate pricing based on campaign type and duration
  let pricing = {
    baseBudget,
    platformFee: parseFloat(platformFee),
    hostEarnings: parseFloat(hostEarnings),
    totalBudget: baseBudget
  };

  // Add duration-based multipliers
  if (schedule?.duration) {
    const duration = schedule.duration; // in days
    if (duration > 30) {
      // Long-term campaigns get 10% discount
      pricing.totalBudget = baseBudget * 0.9;
    } else if (duration < 7) {
      // Short-term campaigns get 20% premium
      pricing.totalBudget = baseBudget * 1.2;
    }
  }

  // Add impression-based pricing
  if (schedule?.maxImpressions) {
    const cpm = (pricing.totalBudget / schedule.maxImpressions) * 1000;
    // Note: cpm is calculated but not stored in pricing object
  }

  return pricing;
}

export default router;
