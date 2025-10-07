import express from 'express';
import { processHourlyPayouts } from '../services/hourlyPayout';
import { authenticateJWT, authorizeRole } from '../services/farcasterAuth';
import { Settlement, User } from '../models';

const router = express.Router();

/**
 * @swagger
 * /payouts/trigger-hourly:
 *   post:
 *     summary: Trigger hourly payouts (operator only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hourly payouts processed
 *       403:
 *         description: Unauthorized
 */
router.post('/trigger-hourly', authenticateJWT, authorizeRole(['operator']), async (req, res) => {
  try {
    await processHourlyPayouts();
    res.json({ message: 'Hourly payouts processed successfully' });
  } catch (error) {
    console.error('Error processing hourly payouts:', error);
    res.status(500).json({ message: 'Failed to process hourly payouts' });
  }
});

/**
 * @swagger
 * /payouts/host:
 *   get:
 *     summary: Get host payouts
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host payouts
 */
router.get('/host', authenticateJWT, authorizeRole(['host']), async (req, res) => {
  try {
    // Get host's settlements
    const settlements = await Settlement.find({
      'hostPayouts.hostId': req.user.userId,
      status: { $in: ['distributed', 'completed'] }
    });
    
    // Get host's claimable balance
    const host = await User.findById(req.user.userId);
    
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }
    
    // Format response
    const payouts = settlements.map(settlement => {
      const hostPayout = settlement.hostPayouts.find(
        p => p.hostId.toString() === req.user.userId
      );
      
      return {
        settlementId: settlement._id,
        campaignId: settlement.campaignId,
        amount: hostPayout?.amount || 0,
        isClaimed: hostPayout?.isClaimed || false,
        claimedAt: hostPayout?.claimedAt,
        createdAt: settlement.createdAt
      };
    });
    
    res.json({
      payouts,
      totalEarnings: host.totalEarnings || 0,
      claimableBalance: host.claimableBalance || 0
    });
  } catch (error) {
    console.error('Error getting host payouts:', error);
    res.status(500).json({ message: 'Failed to get host payouts' });
  }
});

/**
 * @swagger
 * /payouts/claim:
 *   post:
 *     summary: Claim host payouts
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts claimed successfully
 */
router.post('/claim', authenticateJWT, authorizeRole(['host']), async (req, res) => {
  try {
    // Get host's claimable balance
    const host = await User.findById(req.user.userId);
    
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }
    
    if (!host.claimableBalance || host.claimableBalance <= 0) {
      return res.status(400).json({ message: 'No claimable balance' });
    }
    
    // In a real implementation, this would trigger an on-chain transaction
    // For now, we'll just reset the claimable balance
    const claimedAmount = host.claimableBalance;
    host.claimableBalance = 0;
    await host.save();
    
    res.json({
      message: 'Payouts claimed successfully',
      claimedAmount,
      newClaimableBalance: 0
    });
  } catch (error) {
    console.error('Error claiming payouts:', error);
    res.status(500).json({ message: 'Failed to claim payouts' });
  }
});

/**
 * @swagger
 * /payouts/operator:
 *   get:
 *     summary: Get operator payouts (operator only)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operator payouts
 *       403:
 *         description: Unauthorized
 */
router.get('/operator', authenticateJWT, authorizeRole(['operator']), async (req, res) => {
  try {
    // Get all settlements
    const settlements = await Settlement.find({
      status: { $in: ['distributed', 'completed'] }
    });
    
    // Calculate total operator fees
    const totalOperatorFees = settlements.reduce(
      (sum, settlement) => sum + (settlement.operatorFee || 0),
      0
    );
    
    // Format response
    const payouts = settlements.map(settlement => {
      return {
        settlementId: settlement._id,
        campaignId: settlement.campaignId,
        operatorFee: settlement.operatorFee,
        totalAmount: settlement.totalAmount,
        hostPayoutsCount: settlement.hostPayouts.length,
        createdAt: settlement.createdAt
      };
    });
    
    res.json({
      payouts,
      totalOperatorFees
    });
  } catch (error) {
    console.error('Error getting operator payouts:', error);
    res.status(500).json({ message: 'Failed to get operator payouts' });
  }
});

export default router;


