import express from 'express';
import { generateNonce, verifyFarcasterAuth } from '../services/farcasterAuth';
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
    const { message, signature, fid } = req.body;

    if (!message || !signature || !fid) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await verifyFarcasterAuth(message, signature, fid);
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
 *     summary: Update user role
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [advertiser, host, operator]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/update-role', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.body;

    if (!['advertiser', 'host', 'operator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Role updated successfully', user });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

export default router;


