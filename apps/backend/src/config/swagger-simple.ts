import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farcaster Ad Rental API',
      version: '1.0.0',
      description: 'API for Farcaster Ad Rental Platform',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  console.log('🔧 Setting up Swagger...');
  
  try {
    // Basic Swagger UI setup - most simple approach
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log('✅ Swagger middleware registered');
    
    // Add a test route to verify the setup
    app.get('/api-docs-test', (req, res) => {
      res.json({ message: 'Swagger setup working', specs: Object.keys(specs) });
    });
    
    console.log('✅ Swagger documentation initialized');
  } catch (error) {
    console.error('❌ Swagger setup failed:', error);
  }
}

export default specs;
