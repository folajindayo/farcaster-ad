import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farcaster Ad Rental API',
      version: '1.0.0',
      description: 'A decentralized advertising platform for Farcaster users',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Health check endpoint
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
 *                 service:
 *                   type: string
 *                   example: "farcaster-ad-rental-backend"
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'farcaster-ad-rental-backend',
  });
});

// API info endpoint
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
 */
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
      docs: '/api-docs',
    },
  });
});

// Campaign endpoints
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
 *               budget:
 *                 type: string
 *                 example: "1000.00"
 *               type:
 *                 type: string
 *                 enum: [banner, pinned_cast]
 *                 example: "banner"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.post('/api/campaigns', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Campaign creation endpoint - implementation in progress',
      campaign: {
        id: '507f1f77bcf86cd799439011',
        title: req.body.title || 'Sample Campaign',
        budget: req.body.budget || '1000.00',
        status: 'draft',
      },
    },
  });
});

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.get('/api/campaigns/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      campaign: {
        id: req.params.id,
        title: 'Sample Campaign',
        budget: '1000.00',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    },
  });
});

// Host endpoints
/**
 * @swagger
 * /api/hosts/opt-in:
 *   post:
 *     summary: Opt-in to hosting
 *     tags: [Hosts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               preferences:
 *                 type: object
 *                 properties:
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["tech", "crypto"]
 *                   minPrice:
 *                     type: string
 *                     example: "10.00"
 *     responses:
 *       201:
 *         description: Successfully opted in to hosting
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.post('/api/hosts/opt-in', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Successfully opted in to hosting',
      host: {
        id: '507f1f77bcf86cd799439011',
        userId: req.body.userId,
        isActive: true,
        preferences: req.body.preferences || {},
        createdAt: new Date().toISOString(),
      },
    },
  });
});

// Tracking endpoints
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
 *               userAgent:
 *                 type: string
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *               ipAddress:
 *                 type: string
 *                 example: "192.168.1.1"
 *     responses:
 *       200:
 *         description: Impression tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.post('/api/tracking/impression', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Impression tracked successfully',
      placementId: req.body.placementId,
      timestamp: new Date().toISOString(),
    },
  });
});

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6; font-size: 2.5rem; font-weight: 700 }
    .swagger-ui .info .description { font-size: 1.1rem; color: #6b7280; margin: 10px 0 }
    .swagger-ui .opblock { border-radius: 8px; margin: 10px 0 }
    .swagger-ui .opblock.opblock-post { border-color: #10b981 }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6 }
    .swagger-ui .btn { border-radius: 6px; font-weight: 500 }
    .swagger-ui .btn.execute { background: #3b82f6; border-color: #3b82f6 }
    .swagger-ui .btn.execute:hover { background: #2563eb }
  `,
  customSiteTitle: 'Farcaster Ad Rental API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: 'list',
  },
}));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} was not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`🗄️ Database: MongoDB (not connected in simple mode)`);
});

export default app;


