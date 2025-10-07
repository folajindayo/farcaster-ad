# 🎨 Farcaster Ad Rental API - Swagger Documentation Guide

## 📚 Overview

This guide covers the comprehensive Swagger documentation system for the Farcaster Ad Rental API. The documentation provides a beautiful, interactive interface for exploring and testing all API endpoints.

## 🚀 Quick Start

### Running the Server

```bash
# Simple server (recommended for development)
cd apps/backend
yarn dev:simple

# Full server with database integration
yarn dev
```

### Accessing Documentation

- **Swagger UI**: http://localhost:3001/api-docs
- **API Info**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🎨 Design Features

### Enhanced Visual Design

The Swagger documentation includes:

- **Custom CSS Styling**: Modern, clean interface with blue color scheme
- **Responsive Layout**: Works on desktop and mobile devices
- **Interactive Elements**: Hover effects and smooth transitions
- **Color-Coded Endpoints**: Different colors for GET, POST, PUT, DELETE operations
- **Professional Typography**: Clean fonts and proper spacing

### Key Design Elements

```css
/* Custom styling applied */
.swagger-ui .info .title { 
  color: #3b82f6; 
  font-size: 2.5rem; 
  font-weight: 700 
}

.swagger-ui .opblock.opblock-post { 
  border-color: #10b981 
}

.swagger-ui .opblock.opblock-get { 
  border-color: #3b82f6 
}
```

## 📋 API Endpoints Documentation

### Core Endpoints

#### 🏥 Health & Status
- `GET /health` - Service health check
- `GET /api` - API information and endpoint list

#### 🎯 Campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/{id}` - Get campaign details
- `PUT /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign

#### 🏠 Hosts
- `POST /api/hosts/opt-in` - Opt-in to hosting
- `POST /api/hosts/opt-out` - Opt-out from hosting
- `GET /api/hosts/inventory` - Get host inventory

#### 📁 File Upload
- `POST /api/upload/creative` - Upload creative assets
- `GET /api/upload/{id}` - Get uploaded file info
- `DELETE /api/upload/{id}` - Delete uploaded file

#### ⛓️ Blockchain
- `POST /api/blockchain/campaigns/{id}/fund` - Fund campaign
- `POST /api/blockchain/campaigns/{id}/activate` - Activate campaign
- `GET /api/blockchain/balance/{address}` - Check USDC balance

#### 📊 Tracking
- `POST /api/tracking/impression` - Track ad impression
- `POST /api/tracking/click` - Track ad click
- `POST /api/tracking/engagement` - Track user engagement

## 🔧 Configuration

### Swagger Setup

The Swagger configuration is defined in `src/config/swagger.ts`:

```typescript
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
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};
```

### Custom Styling

The documentation includes extensive custom CSS for:

- **Brand Colors**: Blue (#3b82f6) primary, green (#10b981) for success
- **Typography**: Clean, readable fonts with proper hierarchy
- **Layout**: Responsive design with proper spacing
- **Interactive Elements**: Hover effects and smooth transitions

## 📝 Documentation Standards

### Endpoint Documentation

Each endpoint includes:

```typescript
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
 *             properties:
 *               advertiserId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               title:
 *                 type: string
 *                 example: "Summer Sale Campaign"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
```

### Schema Definitions

Common schemas are defined in the components section:

```typescript
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
}
```

## 🎯 Features

### Interactive Testing

- **Try It Out**: Test endpoints directly from the documentation
- **Request/Response Examples**: See real request and response formats
- **Parameter Validation**: Built-in validation for required fields
- **Authentication**: Support for API key and OAuth authentication

### Advanced Features

- **Filtering**: Search and filter endpoints by tag or method
- **Persistence**: Authorization tokens persist across sessions
- **Request Duration**: Display request timing information
- **Model Expansion**: Expandable schema definitions

## 🚀 Development Workflow

### Adding New Endpoints

1. **Create Route Handler**:
```typescript
app.post('/api/new-endpoint', (req, res) => {
  // Implementation
});
```

2. **Add Swagger Documentation**:
```typescript
/**
 * @swagger
 * /api/new-endpoint:
 *   post:
 *     summary: New endpoint description
 *     tags: [NewTag]
 *     // ... rest of documentation
 */
```

3. **Test in Swagger UI**: Visit http://localhost:3001/api-docs

### Updating Documentation

- **Schema Changes**: Update component schemas
- **New Tags**: Add tags for endpoint organization
- **Examples**: Update request/response examples
- **Descriptions**: Improve endpoint descriptions

## 🔍 Troubleshooting

### Common Issues

1. **Server Not Starting**:
   ```bash
   # Check for TypeScript errors
   yarn build
   
   # Use simple server for development
   yarn dev:simple
   ```

2. **Swagger UI Not Loading**:
   - Check server is running on port 3001
   - Verify `/api-docs` endpoint is accessible
   - Check browser console for errors

3. **Documentation Not Updating**:
   - Restart the server after making changes
   - Clear browser cache
   - Check file paths in swagger configuration

### Debug Mode

Enable debug logging:

```typescript
const swaggerOptions = {
  // ... existing config
  apis: ['./src/routes/*.ts', './src/index.ts'],
  // Add debug flag
  debug: true,
};
```

## 📚 Additional Resources

- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI Documentation**: https://swagger.io/tools/swagger-ui/
- **API Design Best Practices**: https://swagger.io/resources/articles/best-practices-in-api-design/

## 🎉 Success!

Your Farcaster Ad Rental API now has:

✅ **Beautiful Swagger Documentation**  
✅ **Interactive API Testing**  
✅ **Comprehensive Endpoint Coverage**  
✅ **Professional Design**  
✅ **Development-Ready Setup**  

Visit http://localhost:3001/api-docs to explore your API documentation!


