import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { 
  Campaign, 
  Epoch, 
  EpochPayout,
  Host,
  Receipt
} from '../models';
import { MerkleBuilder } from '../services/merkleBuilder';
import { getKeeper } from '../services/keeper';

const router = Router();
const merkleBuilder = new MerkleBuilder();

/**
 * @swagger
 * /api/campaigns/{campaignId}/epochs:
 *   get:
 *     summary: List all epochs for a campaign
 *     tags: [Epochs]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of epochs
 */
router.get('/campaigns/:campaignId/epochs', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    
    const epochs = await Epoch.find({
      where: { campaignId },
      order: [['epoch', 'DESC']],
      include: [{
        model: EpochPayout,
        attributes: ['id', 'hostAddress', 'amount', 'claimed']
      }]
    });

    res.json({
      success: true,
      epochs
    });
  } catch (error) {
    console.error('Error fetching epochs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch epochs' 
    });
  }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/epochs/{epoch}:
 *   get:
 *     summary: Get specific epoch details including payouts
 *     tags: [Epochs]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: epoch
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Epoch details with payouts
 */
router.get('/campaigns/:campaignId/epochs/:epoch', async (req: Request, res: Response) => {
  try {
    const { campaignId, epoch } = req.params;
    const epochId = `${campaignId}_${epoch}`;
    
    const epochData = await Epoch.findById(epochId, {
      include: [{
        model: EpochPayout,
        attributes: ['index', 'hostAddress', 'amount', 'claimed', 'claimedTxHash']
      }]
    });

    if (!epochData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Epoch not found' 
      });
    }

    res.json({
      success: true,
      epoch: epochData
    });
  } catch (error) {
    console.error('Error fetching epoch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch epoch' 
    });
  }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/epochs/{epoch}/proofs:
 *   get:
 *     summary: Get merkle proofs for all payouts in an epoch
 *     tags: [Epochs]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: epoch
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Merkle proofs and payout details
 */
router.get('/campaigns/:campaignId/epochs/:epoch/proofs', async (req: Request, res: Response) => {
  try {
    const { campaignId, epoch } = req.params;
    const epochId = `${campaignId}_${epoch}`;
    
    const epochData = await Epoch.findById(epochId);
    if (!epochData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Epoch not found' 
      });
    }

    const payouts = await EpochPayout.find({
      where: { epochId },
      order: [['index', 'ASC']]
    });

    res.json({
      success: true,
      merkleRoot: epochData.merkleRoot,
      allocatedAmount: epochData.allocatedAmount,
      payouts: payouts.map(p => ({
        index: p.index,
        hostAddress: p.hostAddress,
        amount: p.amount,
        proof: p.proof,
        claimed: p.claimed
      }))
    });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch proofs' 
    });
  }
});

/**
 * @swagger
 * /api/campaigns/{campaignId}/epochs/generate:
 *   post:
 *     summary: Generate merkle tree for an epoch (admin only)
 *     tags: [Epochs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               epoch:
 *                 type: integer
 *                 description: Optional epoch number (defaults to previous hour)
 *     responses:
 *       200:
 *         description: Generated epoch data
 */
router.post('/campaigns/:campaignId/epochs/generate', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { epoch } = req.body;
    
    // TODO: Add admin authentication check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Admin access required' 
    //   });
    // }

    const merkleData = await merkleBuilder.generateEpoch(
      campaignId,
      epoch
    );

    res.json({
      success: true,
      data: {
        root: merkleData.root,
        totalAmount: merkleData.totalAmount,
        numHosts: merkleData.payouts.length
      }
    });
  } catch (error) {
    console.error('Error generating epoch:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate epoch'
    });
  }
});

/**
 * @swagger
 * /api/hosts/{walletAddress}/payouts:
 *   get:
 *     summary: Get pending and historical payouts for a host
 *     tags: [Epochs]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Host payout history
 */
router.get('/hosts/:walletAddress/payouts', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    const payouts = await EpochPayout.find({
      where: { 
        hostAddress: walletAddress.toLowerCase() 
      },
      order: [['epoch', 'DESC']],
      include: [{
        model: Epoch,
        attributes: ['status', 'finalizedAt']
      }]
    });

    const pending = payouts.filter(p => !p.claimed);
    const claimed = payouts.filter(p => p.claimed);
    
    const totalPending = pending.reduce(
      (sum, p) => sum + parseFloat(p.amount), 
      0
    );
    const totalClaimed = claimed.reduce(
      (sum, p) => sum + parseFloat(p.amount), 
      0
    );

    res.json({
      success: true,
      summary: {
        totalPending: totalPending.toFixed(6),
        totalClaimed: totalClaimed.toFixed(6),
        pendingCount: pending.length,
        claimedCount: claimed.length
      },
      pending: pending.slice(0, 10), // Latest 10 pending
      recent: claimed.slice(0, 20) // Latest 20 claimed
    });
  } catch (error) {
    console.error('Error fetching host payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payouts' 
    });
  }
});

/**
 * @swagger
 * /api/keeper/batch-claim:
 *   post:
 *     summary: Trigger keeper to process batch claims (internal use)
 *     tags: [Keeper]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *             properties:
 *               campaignId:
 *                 type: string
 *               epoch:
 *                 type: integer
 *                 description: Optional epoch number
 *     responses:
 *       200:
 *         description: Batch claim initiated
 */
router.post('/keeper/batch-claim', async (req: Request, res: Response) => {
  try {
    const { campaignId, epoch } = req.body;
    
    // TODO: Add authentication check
    
    const keeper = getKeeper();
    if (!keeper) {
      return res.status(503).json({ 
        success: false, 
        error: 'Keeper service not initialized' 
      });
    }

    await keeper.processEpochManual(campaignId, epoch);

    res.json({
      success: true,
      message: 'Batch claim processing initiated'
    });
  } catch (error) {
    console.error('Error initiating batch claim:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate batch claim' 
    });
  }
});

/**
 * @swagger
 * /api/keeper/status:
 *   get:
 *     summary: Get keeper service status
 *     tags: [Keeper]
 *     responses:
 *       200:
 *         description: Keeper status
 */
router.get('/keeper/status', async (req: Request, res: Response) => {
  try {
    const keeper = getKeeper();
    
    if (!keeper) {
      return res.json({
        success: true,
        status: {
          running: false,
          initialized: false
        }
      });
    }

    res.json({
      success: true,
      status: keeper.getStatus()
    });
  } catch (error) {
    console.error('Error getting keeper status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get keeper status' 
    });
  }
});

/**
 * @swagger
 * /api/receipts/submit:
 *   post:
 *     summary: Submit activity receipts from hosts
 *     tags: [Receipts]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - hostAddress
 *               - impressions
 *               - clicks
 *             properties:
 *               campaignId:
 *                 type: string
 *               hostAddress:
 *                 type: string
 *               impressions:
 *                 type: integer
 *               clicks:
 *                 type: integer
 *               dwellMs:
 *                 type: integer
 *               viewerFingerprint:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receipt submitted
 */
router.post('/receipts/submit', async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      hostAddress,
      impressions,
      clicks,
      dwellMs,
      viewerFingerprint,
      signature
    } = req.body;

    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ 
        success: false, 
        error: 'Campaign not found' 
      });
    }

    // Create receipt
    const receipt = await Receipt.create({
      campaignId,
      hostAddress: hostAddress.toLowerCase(),
      timestamp: new Date(),
      impressions: impressions || 0,
      clicks: clicks || 0,
      dwellMs,
      viewerFingerprint,
      signature,
      processed: false
    });

    res.json({
      success: true,
      receipt: {
        id: receipt.id,
        timestamp: receipt.timestamp
      }
    });
  } catch (error) {
    console.error('Error submitting receipt:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit receipt' 
    });
  }
});

export default router;


