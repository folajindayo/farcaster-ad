import express from 'express';
import { generateNonce, verifyFarcasterAuth, authenticateJWT } from '../services/farcasterAuth';
import { User } from '../models';

const router = express.Router();

/**
 * @swagger
 * /auth/nonce:
 *   get:
 *     summary: Generate a nonce for Farcaster authentication
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully generated nonce
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 */
router.get('/nonce', (req, res) => {
  try {
    const nonce = generateNonce();
    res.json({ nonce });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ message: 'Failed to generate nonce' });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify Farcaster authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - signature
 *               - fid
 *             properties:
 *               message:
 *                 type: string
 *               signature:
 *                 type: string
 *               fid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Authentication failed
 */
router.post('/verify', async (req, res) => {
  try {
    const { 
      message, 
      signature, 
      fid, 
      username, 
      displayName, 
      pfpUrl, 
      custody, 
      verifications 
    } = req.body;

    if (!message || !signature || !fid) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await verifyFarcasterAuth(
      message, 
      signature, 
      fid,
      username,
      displayName,
      pfpUrl,
      custody,
      verifications
    );
    res.json(result);
  } catch (error) {
    console.error('Error verifying auth:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
});

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/user', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /auth/update-role:
 *   post:
 *     summary: Update user role (switch between advertiser, host, operator)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - farcasterId
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [advertiser, host, operator]
 *               farcasterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/update-role', async (req, res) => {
  try {
    const { role, farcasterId } = req.body;

    if (!farcasterId || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['advertiser', 'host', 'operator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ farcasterId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    // Generate new token with updated role
    const token = Buffer.from(`${user._id}:${user.farcasterId}:${user.role}`).toString('base64');

    res.json({ 
      message: 'Role updated successfully', 
      user,
      token 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

export default router;


