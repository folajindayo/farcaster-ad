import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { database } from './config/database';
import { migration } from './utils/migration';
import { BlockchainService } from './services/blockchain';
import { FileUploadService } from './services/fileUpload';
import { setupSwagger } from './config/swagger-simple';

// Import routers
import campaignsRouter from './routes/campaigns';
import hostsRouter from './routes/hosts';
import uploadRouter from './routes/upload';
import blockchainRouter from './routes/blockchain';
import authRouter from './routes/auth';
import miniAppRouter from './routes/miniApp';
import payoutsRouter from './routes/payouts';
import epochsRouter from './routes/epochs';
import hostDashboardRouter from './routes/hostDashboard';
import adsRouter from './routes/ads';
import trackingRouter from './routes/tracking';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 service:
 *                   type: string
 *                   example: "farcaster-ad-rental-backend"
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'farcaster-ad-rental-backend',
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Farcaster Ad Rental API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     campaigns:
 *                       type: string
 *                       example: "/api/campaigns"
 *                     hosts:
 *                       type: string
 *                       example: "/api/hosts"
 *                     upload:
 *                       type: string
 *                       example: "/api/upload"
 *                     blockchain:
 *                       type: string
 *                       example: "/api/blockchain"
 *                     tracking:
 *                       type: string
 *                       example: "/api/tracking"
 */
// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Farcaster Ad Rental API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      campaigns: '/api/campaigns',
      hosts: '/api/hosts',
      upload: '/api/upload',
      blockchain: '/api/blockchain',
      tracking: '/api/tracking',
      auth: '/api/auth',
      miniApp: '/api/mini-app',
      payouts: '/api/payouts',
      epochs: '/api/epochs',
      keeper: '/api/keeper',
    },
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API test route works' });
});

// Mount route handlers
console.log('🔗 Registering routes...');
app.use('/api/campaigns', campaignsRouter);
console.log('✅ Campaigns router registered');
app.use('/api/hosts', hostsRouter);
console.log('✅ Hosts router registered');
app.use('/api/host', hostDashboardRouter); // Host dashboard routes
console.log('✅ Host dashboard router registered');
app.use('/api/upload', uploadRouter);
console.log('✅ Upload router registered');
app.use('/api/blockchain', blockchainRouter);
console.log('✅ Blockchain router registered');
app.use('/api/auth', authRouter);
console.log('✅ Auth router registered');
app.use('/api/mini-app', miniAppRouter);
console.log('✅ Mini-app router registered');
app.use('/api/payouts', payoutsRouter);
console.log('✅ Payouts router registered');
app.use('/api/ads', adsRouter); // Ad serving routes
console.log('✅ Ads router registered');
app.use('/api/tracking', trackingRouter); // Tracking routes
console.log('✅ Tracking router registered');
app.use('/api', epochsRouter); // Epochs routes are mounted at root /api level
console.log('✅ Epochs router registered');

/**
 * @swagger
 * /api/tracking/impression:
 *   post:
 *     summary: Track ad impression
 *     tags: [Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placementId
 *             properties:
 *               placementId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: Ad placement ID
 *               userAgent:
 *                 type: string
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *                 description: User agent string
 *               ipAddress:
 *                 type: string
 *                 example: "192.168.1.1"
 *                 description: IP address of the user
 *               referrer:
 *                 type: string
 *                 example: "https://farcaster.xyz"
 *                 description: Referrer URL
 *     responses:
 *       200:
 *         description: Impression tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing placement ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Tracking failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Tracking endpoints
app.post('/api/tracking/impression', async (req, res) => {
  try {
    const { placementId, userAgent, ipAddress, referrer } = req.body;
    
    if (!placementId) {
      return res.status(400).json({
        success: false,
        error: 'Placement ID is required',
      });
    }

    const { TrackingService } = await import('./services/tracking');
    await TrackingService.trackImpression(
      placementId,
      userAgent,
      ipAddress,
      referrer
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Impression tracking failed',
    });
  }
});

app.post('/api/tracking/click', async (req, res) => {
  try {
    const { placementId, targetUrl, userAgent, ipAddress } = req.body;
    
    if (!placementId || !targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Placement ID and target URL are required',
      });
    }

    const { TrackingService } = await import('./services/tracking');
    await TrackingService.trackClick(
      placementId,
      targetUrl,
      userAgent,
      ipAddress
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Click tracking failed',
    });
  }
});

app.post('/api/tracking/engagement', async (req, res) => {
  try {
    const { placementId, engagementType, userAgent, ipAddress } = req.body;
    
    if (!placementId || !engagementType) {
      return res.status(400).json({
        success: false,
        error: 'Placement ID and engagement type are required',
      });
    }

    const { TrackingService } = await import('./services/tracking');
    await TrackingService.trackEngagement(
      placementId,
      engagementType,
      userAgent,
      ipAddress
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Engagement tracking failed',
    });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Something went wrong!',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal server error',
    });
  }
);

// Note: 404 handler moved to after Swagger setup

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || '';

    console.log('🔍 Environment check:');
    console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('Using URI:', mongoUri);

    await database.connect({ uri: mongoUri });

    // Initialize database schema
    const migrationResult = await migration.initializeDatabase();
    if (migrationResult.success) {
      console.log('✅ Database initialized successfully');
    } else {
      console.warn(
        '⚠️ Database initialization warning:',
        migrationResult.message
      );
    }

    // Initialize blockchain service
    const blockchainConfig = {
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      privateKey: process.env.PRIVATE_KEY || '',
      contractAddresses: {
        adEscrow: process.env.AD_ESCROW_ADDRESS || '',
        merkleDistributor: process.env.MERKLE_DISTRIBUTOR_ADDRESS || '',
        usdc: process.env.USDC_ADDRESS || '',
      },
      chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 8453,
    };

    if (
      blockchainConfig.privateKey &&
      blockchainConfig.contractAddresses.adEscrow
    ) {
      BlockchainService.initialize(blockchainConfig);
      console.log('✅ Blockchain service initialized');
    } else {
      console.warn(
        '⚠️ Blockchain service not initialized - missing configuration'
      );
    }

    // Setup file serving
    FileUploadService.setupStaticFileServing(app);
    console.log('✅ File upload service initialized');

    // Setup Swagger documentation
    console.log('🔧 About to setup Swagger...');
    try {
      setupSwagger(app);
      console.log('✅ Swagger documentation initialized');
      
      // Add a direct test route to verify
      app.get('/swagger-test', (req, res) => {
        res.json({ message: 'Direct route working' });
      });
      console.log('✅ Direct test route added');
    } catch (error) {
      console.error('❌ Swagger setup failed:', error);
    }

    // Initialize Integration Bridge (CRITICAL - connects tracking to payouts)
    const { IntegrationBridge } = await import('./services/integrationBridge');
    await IntegrationBridge.initialize();
    console.log(
      '✅ Integration Bridge initialized - tracking connected to payouts'
    );
    
    // Add 404 handler AFTER all routes are set up
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Initialize Keeper service for automated payouts
    if (process.env.ENABLE_KEEPER === 'true' && blockchainConfig.privateKey) {
      const { initKeeper } = await import('./services/keeper');
      const keeperConfig = {
        rpcUrl: blockchainConfig.rpcUrl,
        privateKey: blockchainConfig.privateKey,
        contractAddress:
          process.env.CAMPAIGN_ESCROW_ADDRESS ||
          blockchainConfig.contractAddresses.adEscrow,
        batchSize: parseInt(process.env.KEEPER_BATCH_SIZE || '50'),
        gasPrice: process.env.KEEPER_GAS_PRICE,
        gasLimit: process.env.KEEPER_GAS_LIMIT,
        cronPattern: process.env.KEEPER_CRON_PATTERN || '5 * * * *', // 5 minutes past every hour
      };

      const keeper = initKeeper(keeperConfig);
      keeper.start();
      console.log('✅ Keeper service initialized and started');
    } else {
      console.warn(
        '⚠️ Keeper service not initialized - set ENABLE_KEEPER=true to enable'
      );
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API docs: http://localhost:${PORT}/api`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log(`🗄️ Database: ${database.getConnectionState()}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop keeper if running
  const { getKeeper } = await import('./services/keeper');
  const keeper = getKeeper();
  if (keeper) {
    keeper.stop();
  }

  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Stop keeper if running
  const { getKeeper } = await import('./services/keeper');
  const keeper = getKeeper();
  if (keeper) {
    keeper.stop();
  }

  await database.disconnect();
  process.exit(0);
});

startServer();

export default app;
