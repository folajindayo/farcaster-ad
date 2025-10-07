import express from 'express';
import { TrackingService } from '../services/tracking';

const router = express.Router();

// Track impression
router.post('/impression', async (req, res) => {
  try {
    const { campaignId, placementId, placementType, timestamp, userAgent, referrer } = req.body;
    
    if (!campaignId || !placementId || !placementType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Track impression
    await TrackingService.trackImpression({
      campaignId,
      placementId,
      placementType,
      timestamp: timestamp || new Date().toISOString(),
      ipAddress,
      userAgent,
      referrer
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

// Track click
router.post('/click', async (req, res) => {
  try {
    const { campaignId, placementId, placementType, timestamp, userAgent, referrer } = req.body;
    
    if (!campaignId || !placementId || !placementType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Track click
    await TrackingService.trackClick({
      campaignId,
      placementId,
      placementType,
      timestamp: timestamp || new Date().toISOString(),
      ipAddress,
      userAgent,
      referrer
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Track interaction
router.post('/interaction', async (req, res) => {
  try {
    const { campaignId, placementId, placementType, interactionType, timestamp } = req.body;
    
    if (!campaignId || !placementId || !placementType || !interactionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Track interaction
    await TrackingService.trackInteraction({
      campaignId,
      placementId,
      placementType,
      interactionType,
      timestamp: timestamp || new Date().toISOString(),
      ipAddress
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

export default router;


