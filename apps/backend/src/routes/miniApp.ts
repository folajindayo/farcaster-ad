import express from 'express';
import { getAdForHost, optInHost, optOutHost, generateManifest } from '../services/miniApp';
import { authenticateJWT, authorizeRole } from '../services/farcasterAuth';

const router = express.Router();

/**
 * @swagger
 * /mini-app/manifest:
 *   get:
 *     summary: Get Mini App manifest
 *     tags: [Mini App]
 *     responses:
 *       200:
 *         description: Mini App manifest
 */
router.get('/manifest', (req, res) => {
  try {
    const manifest = generateManifest();
    res.json(manifest);
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ message: 'Failed to generate manifest' });
  }
});

/**
 * @swagger
 * /mini-app/ad:
 *   post:
 *     summary: Get an ad for a host
 *     tags: [Mini App]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotType
 *             properties:
 *               slotType:
 *                 type: string
 *                 enum: [banner, pinned_cast, frame]
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *     responses:
 *       200:
 *         description: Ad response
 *       404:
 *         description: No ad available
 */
router.post('/ad', authenticateJWT, async (req, res) => {
  try {
    const { slotType, dimensions } = req.body;
    
    if (!slotType) {
      return res.status(400).json({ message: 'Slot type is required' });
    }
    
    const ad = await getAdForHost({
      hostId: req.user.userId,
      slotType,
      dimensions
    });
    
    if (!ad) {
      return res.status(404).json({ message: 'No ad available' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Error getting ad:', error);
    res.status(500).json({ message: 'Failed to get ad' });
  }
});

/**
 * @swagger
 * /mini-app/opt-in:
 *   post:
 *     summary: Opt in to the ad network
 *     tags: [Mini App]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slots
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [banner, pinned_cast, frame]
 *     responses:
 *       200:
 *         description: Successfully opted in
 */
router.post('/opt-in', authenticateJWT, async (req, res) => {
  try {
    const { slots } = req.body;
    
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Valid slots array is required' });
    }
    
    const result = await optInHost(req.user.userId, slots);
    res.json(result);
  } catch (error) {
    console.error('Error opting in:', error);
    res.status(500).json({ message: 'Failed to opt in' });
  }
});

/**
 * @swagger
 * /mini-app/opt-out:
 *   post:
 *     summary: Opt out of the ad network
 *     tags: [Mini App]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully opted out
 */
router.post('/opt-out', authenticateJWT, async (req, res) => {
  try {
    const result = await optOutHost(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error opting out:', error);
    res.status(500).json({ message: 'Failed to opt out' });
  }
});

export default router;


