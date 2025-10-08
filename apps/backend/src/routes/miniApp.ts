import express from 'express';
import { getAdForHost, optInHost, optOutHost, generateManifest } from '../services/miniApp';
import { authenticateJWT, authorizeRole } from '../services/farcasterAuth';
import { User, Host } from '../models';

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

/**
 * @swagger
 * /mini-app/permissions/{fid}:
 *   get:
 *     summary: Check if a host has granted Mini App permissions
 *     tags: [Mini App]
 *     parameters:
 *       - in: path
 *         name: fid
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Permission status
 */
router.get('/permissions/:fid', async (req, res) => {
  try {
    const { fid } = req.params;
    
    // Find user by FID
    const user = await User.findOne({ farcasterId: parseInt(fid) });
    if (!user) {
      return res.json({ permissionsGranted: false });
    }
    
    // Check if they have a host profile with permissions
    const host = await Host.findOne({ userId: user._id });
    if (!host) {
      return res.json({ permissionsGranted: false });
    }
    
    res.json({
      permissionsGranted: host.miniAppPermissionsGranted || false,
      grantedAt: host.miniAppGrantedAt,
      allowedAdTypes: host.allowedAdTypes,
      maxAdsPerDay: host.maxAdsPerDay,
      minCpm: host.minCpm
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
});

/**
 * @swagger
 * /mini-app/grant-permissions:
 *   post:
 *     summary: Grant Mini App permissions for a host
 *     tags: [Mini App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fid
 *             properties:
 *               fid:
 *                 type: number
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permissions granted successfully
 */
router.post('/grant-permissions', async (req, res) => {
  try {
    const { fid, username, displayName } = req.body;
    
    if (!fid) {
      return res.status(400).json({ error: 'FID is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ farcasterId: fid });
    if (!user) {
      user = await User.create({
        farcasterId: fid,
        username: username || `user${fid}`,
        displayName: displayName || username || `User ${fid}`,
        role: 'host'
      });
      console.log('✅ Created new user for FID:', fid);
    }
    
    // Find or create host profile
    let host = await Host.findOne({ userId: user._id });
    if (!host) {
      host = await Host.create({
        userId: user._id,
        isActive: true,
        miniAppPermissionsGranted: true,
        miniAppGrantedAt: new Date(),
        allowedAdTypes: ['pinned_cast', 'banner'],
        maxAdsPerDay: 5,
        minCpm: 1.0
      });
      console.log('✅ Created new host profile with permissions');
    } else {
      // Update existing host
      host.miniAppPermissionsGranted = true;
      host.miniAppGrantedAt = new Date();
      host.isActive = true;
      await host.save();
      console.log('✅ Updated host permissions');
    }
    
    res.json({
      success: true,
      message: 'Permissions granted successfully',
      host: {
        permissionsGranted: host.miniAppPermissionsGranted,
        grantedAt: host.miniAppGrantedAt,
        allowedAdTypes: host.allowedAdTypes,
        maxAdsPerDay: host.maxAdsPerDay,
        minCpm: host.minCpm
      }
    });
  } catch (error) {
    console.error('Error granting permissions:', error);
    res.status(500).json({ error: 'Failed to grant permissions' });
  }
});

/**
 * @swagger
 * /mini-app/revoke-permissions:
 *   post:
 *     summary: Revoke Mini App permissions for a host
 *     tags: [Mini App]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fid
 *             properties:
 *               fid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Permissions revoked successfully
 */
router.post('/revoke-permissions', async (req, res) => {
  try {
    const { fid } = req.body;
    
    if (!fid) {
      return res.status(400).json({ error: 'FID is required' });
    }
    
    // Find user
    const user = await User.findOne({ farcasterId: fid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find host profile
    const host = await Host.findOne({ userId: user._id });
    if (!host) {
      return res.status(404).json({ error: 'Host profile not found' });
    }
    
    // Revoke permissions
    host.miniAppPermissionsGranted = false;
    host.isActive = false;
    await host.save();
    
    console.log('🔒 Revoked permissions for FID:', fid);
    
    res.json({
      success: true,
      message: 'Permissions revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking permissions:', error);
    res.status(500).json({ error: 'Failed to revoke permissions' });
  }
});

export default router;


