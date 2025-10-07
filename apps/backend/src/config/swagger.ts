import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farcaster Ad Rental API',
      version: '1.0.0',
      description: 'A decentralized advertising platform that enables Farcaster users to monetize their profile surfaces by renting them to advertisers.',
      contact: {
        name: 'Farcaster Ad Rental Team',
        email: 'support@farcaster-ad-rental.com',
        url: 'https://farcaster-ad-rental.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.farcaster-ad-rental.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Base64'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            farcasterId: { type: 'string', example: '12345' },
            walletAddress: { type: 'string', example: '0x1234567890123456789012345678901234567890' },
            username: { type: 'string', example: 'alice' },
            displayName: { type: 'string', example: 'Alice Smith' },
            pfpUrl: { type: 'string', example: 'https://example.com/pfp.jpg' },
            bannerUrl: { type: 'string', example: 'https://example.com/banner.jpg' },
            isHost: { type: 'boolean', example: true },
            isAdvertiser: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Campaign: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            advertiserId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            title: { type: 'string', example: 'Summer Sale Campaign' },
            description: { type: 'string', example: 'Promote our summer sale' },
            budget: { type: 'string', example: '1000.00' },
            spent: { type: 'string', example: '250.50' },
            status: { 
              type: 'string', 
              enum: ['draft', 'funded', 'active', 'paused', 'completed', 'cancelled'],
              example: 'active'
            },
            type: { 
              type: 'string', 
              enum: ['banner', 'pinned_cast'],
              example: 'banner'
            },
            targeting: {
              type: 'object',
              properties: {
                categories: { type: 'array', items: { type: 'string' }, example: ['tech', 'crypto'] },
                minFollowers: { type: 'number', example: 1000 },
                maxFollowers: { type: 'number', example: 10000 },
                regions: { type: 'array', items: { type: 'string' }, example: ['US', 'EU'] }
              }
            },
            creative: {
              type: 'object',
              properties: {
                bannerImage: { type: 'string', example: '/uploads/banner.jpg' },
                pinnedCastText: { type: 'string', example: 'Check out our new product!' },
                pinnedCastMedia: { type: 'string', example: '/uploads/media.jpg' },
                ctaText: { type: 'string', example: 'Learn More' },
                ctaUrl: { type: 'string', example: 'https://example.com' }
              }
            },
            schedule: {
              type: 'object',
              properties: {
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                maxImpressions: { type: 'number', example: 10000 },
                cpm: { type: 'string', example: '5.00' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                impressions: { type: 'number', example: 1500 },
                clicks: { type: 'number', example: 75 },
                engagements: { type: 'number', example: 25 },
                spend: { type: 'string', example: '250.50' },
                ctr: { type: 'number', example: 5.0 },
                cpm: { type: 'number', example: 3.33 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Host: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            isActive: { type: 'boolean', example: true },
            preferences: {
              type: 'object',
              properties: {
                categories: { type: 'array', items: { type: 'string' }, example: ['tech', 'crypto'] },
                minPrice: { type: 'string', example: '10.00' },
                maxCampaigns: { type: 'number', example: 5 },
                autoApprove: { type: 'boolean', example: true }
              }
            },
            totalEarnings: { type: 'number', example: 500.25 },
            pendingEarnings: { type: 'number', example: 75.50 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AdPlacement: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            campaignId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            hostId: { type: 'string', example: '507f1f77bcf86cd799439013' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'active', 'paused', 'completed', 'cancelled'],
              example: 'active'
            },
            approvedAt: { type: 'string', format: 'date-time' },
            startedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'object',
              properties: {
                impressions: { type: 'number', example: 500 },
                clicks: { type: 'number', example: 25 },
                engagements: { type: 'number', example: 10 },
                earnings: { type: 'string', example: '50.25' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UploadedFile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            originalName: { type: 'string', example: 'banner.jpg' },
            filename: { type: 'string', example: 'generated-filename.jpg' },
            url: { type: 'string', example: '/uploads/generated-filename.jpg' },
            size: { type: 'number', example: 1024000 },
            mimeType: { type: 'string', example: 'image/jpeg' },
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number', example: 1200 },
                height: { type: 'number', example: 400 }
              }
            },
            optimizedUrls: {
              type: 'object',
              properties: {
                thumb: { type: 'string', example: '/uploads/generated-filename_thumb.jpg' },
                medium: { type: 'string', example: '/uploads/generated-filename_medium.jpg' },
                banner: { type: 'string', example: '/uploads/generated-filename_banner.jpg' }
              }
            }
          }
        },
        BlockchainTransaction: {
          type: 'object',
          properties: {
            hash: { type: 'string', example: '0x1234567890abcdef...' },
            status: { type: 'string', example: 'success' },
            blockNumber: { type: 'number', example: 12345678 },
            gasUsed: { type: 'string', example: '21000' },
            effectiveGasPrice: { type: 'string', example: '20000000000' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 100 },
                totalPages: { type: 'number', example: 10 }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Campaigns',
        description: 'Campaign management endpoints'
      },
      {
        name: 'Hosts',
        description: 'Host management endpoints'
      },
      {
        name: 'Upload',
        description: 'File upload endpoints'
      },
      {
        name: 'Blockchain',
        description: 'Blockchain integration endpoints'
      },
      {
        name: 'Tracking',
        description: 'Analytics and tracking endpoints'
      },
      {
        name: 'Health',
        description: 'System health endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/index.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  console.log('🔧 Setting up Swagger...');
  console.log('📄 Specs keys:', Object.keys(specs));
  console.log('📄 Specs paths:', (specs as any).paths ? Object.keys((specs as any).paths) : 'No paths found');
  
  // Add a test route first
  app.get('/api-docs-test', (req, res) => {
    res.json({ 
      message: 'Swagger test route works', 
      specs: Object.keys(specs),
      paths: (specs as any).paths ? Object.keys((specs as any).paths) : 'No paths',
      hasPaths: !!(specs as any).paths
    });
  });
  
  // Simple Swagger setup
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', (req, res, next) => {
    console.log('🔍 Swagger route accessed');
    swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #3b82f6; font-size: 2.5rem; font-weight: 700 }
      .swagger-ui .info .description { font-size: 1.1rem; color: #6b7280; margin: 10px 0 }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0 }
      .swagger-ui .opblock { border-radius: 8px; margin: 10px 0 }
      .swagger-ui .opblock.opblock-post { border-color: #10b981 }
      .swagger-ui .opblock.opblock-get { border-color: #3b82f6 }
      .swagger-ui .opblock.opblock-put { border-color: #f59e0b }
      .swagger-ui .opblock.opblock-delete { border-color: #ef4444 }
      .swagger-ui .btn { border-radius: 6px; font-weight: 500 }
      .swagger-ui .btn.execute { background: #3b82f6; border-color: #3b82f6 }
      .swagger-ui .btn.execute:hover { background: #2563eb }
      .swagger-ui .response-col_status { font-weight: 600 }
      .swagger-ui .response-col_status-200 { color: #10b981 }
      .swagger-ui .response-col_status-400 { color: #f59e0b }
      .swagger-ui .response-col_status-500 { color: #ef4444 }
    `,
    customSiteTitle: 'Farcaster Ad Rental API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2
    }
  })(req, res, next);
  });
};

export default specs;
