# Swagger API Documentation

## 📚 **Swagger Documentation Setup Complete**

Your Farcaster Ad Rental API now has comprehensive Swagger documentation with all endpoints documented.

### 🚀 **Access Swagger UI**

Once your server is running, you can access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

### 📋 **Documented Endpoints**

#### **1. Health & Info**
- `GET /health` - Health check endpoint
- `GET /api` - API information and available endpoints

#### **2. Campaigns** (`/api/campaigns`)
- `POST /` - Create a new campaign
- `GET /:id` - Get campaign by ID
- `GET /advertiser/:advertiserId` - Get campaigns by advertiser
- `PUT /:id` - Update campaign
- `POST /:id/fund` - Fund campaign

#### **3. Hosts** (`/api/hosts`)
- `POST /opt-in` - Opt-in to hosting
- `POST /opt-out` - Opt-out of hosting
- `GET /:hostId` - Get host profile
- `GET /user/:userId` - Get host by user ID
- `PUT /:hostId/preferences` - Update host preferences
- `GET /:hostId/earnings` - Get host earnings
- `GET /:hostId/inventory` - Get host inventory

#### **4. File Upload** (`/api/upload`)
- `POST /creative` - Upload creative assets
- `POST /single` - Upload single file
- `POST /validate` - Validate file
- `GET /info/:filename` - Get file information
- `DELETE /files` - Delete files

#### **5. Blockchain** (`/api/blockchain`)
- `POST /campaigns/:id/fund` - Fund campaign on blockchain
- `POST /campaigns/:id/activate` - Activate campaign
- `POST /campaigns/:id/spend` - Record spend
- `POST /campaigns/:id/complete` - Complete campaign
- `GET /campaigns/:id` - Get campaign details from blockchain
- `GET /campaigns/:id/expired` - Check if campaign is expired
- `POST /payouts/cycle` - Generate payout cycle
- `POST /payouts/proof` - Generate payout proof
- `GET /balance/:address` - Get USDC balance
- `GET /transactions/:hash` - Get transaction status

#### **6. Tracking** (`/api/tracking`)
- `POST /impression` - Track ad impression
- `POST /click` - Track ad click
- `POST /engagement` - Track engagement

### 🎯 **Key Features**

#### **Interactive Documentation**
- **Try it out** functionality for all endpoints
- **Request/Response examples** for each endpoint
- **Schema validation** with detailed error messages
- **Authentication** support (ready for JWT implementation)

#### **Comprehensive Schemas**
- **User** - User profile and Farcaster integration
- **Campaign** - Campaign management and targeting
- **Host** - Host preferences and earnings
- **AdPlacement** - Ad placement tracking
- **UploadedFile** - File upload metadata
- **BlockchainTransaction** - Transaction details
- **ApiResponse** - Standardized API responses
- **PaginatedResponse** - Paginated data responses

#### **Request/Response Examples**
- **Real-world examples** for all endpoints
- **Error responses** with proper HTTP status codes
- **Validation rules** and required fields
- **Data types** and format specifications

### 🛠️ **Development Usage**

#### **1. Start the Server**
```bash
cd apps/backend
yarn dev
```

#### **2. Access Swagger UI**
Open your browser and navigate to:
```
http://localhost:3001/api-docs
```

#### **3. Test Endpoints**
- Use the **"Try it out"** button on any endpoint
- Fill in the required parameters
- Click **"Execute"** to test the API
- View the response and status code

#### **4. Explore Schemas**
- Click on any schema to see detailed structure
- View required fields and data types
- Understand the complete data model

### 📊 **API Testing Workflow**

#### **1. Health Check**
```bash
GET /health
```

#### **2. Create Campaign**
```bash
POST /api/campaigns
{
  "advertiserId": "507f1f77bcf86cd799439012",
  "title": "Summer Sale Campaign",
  "budget": "1000.00",
  "type": "banner",
  "creative": {
    "bannerImage": "/uploads/banner.jpg"
  }
}
```

#### **3. Upload Creative Assets**
```bash
POST /api/upload/creative
Content-Type: multipart/form-data
- assets: [file]
- campaignType: "banner"
```

#### **4. Fund Campaign**
```bash
POST /api/blockchain/campaigns/campaign_id/fund
{
  "amount": "1000"
}
```

#### **5. Host Opt-in**
```bash
POST /api/hosts/opt-in
{
  "userId": "507f1f77bcf86cd799439012",
  "preferences": {
    "categories": ["tech", "crypto"],
    "minPrice": "10.00",
    "maxCampaigns": 5,
    "autoApprove": true
  }
}
```

#### **6. Track Performance**
```bash
POST /api/tracking/impression
{
  "placementId": "507f1f77bcf86cd799439011",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

### 🔧 **Customization**

#### **Swagger Configuration**
The Swagger configuration is in `src/config/swagger.ts`:

```typescript
// Customize the API documentation
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farcaster Ad Rental API',
      version: '1.0.0',
      description: 'Your API description'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ]
  }
};
```

#### **Adding New Endpoints**
To add Swagger documentation to new endpoints:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   post:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "value"
 *     responses:
 *       200:
 *         description: Success response
 */
```

### 📈 **Production Deployment**

#### **Environment Configuration**
```env
# Swagger will be available at:
# https://your-domain.com/api-docs
```

#### **Security Considerations**
- **Authentication**: Add JWT authentication to protected endpoints
- **Rate Limiting**: Implement rate limiting for API calls
- **CORS**: Configure CORS for production domains
- **HTTPS**: Use HTTPS in production

### 🎉 **Benefits**

#### **For Developers**
- **Interactive Testing** - Test APIs directly from the browser
- **Complete Documentation** - All endpoints documented with examples
- **Schema Validation** - Understand data structures
- **Error Handling** - See all possible error responses

#### **For API Consumers**
- **Clear Documentation** - Easy to understand API structure
- **Request Examples** - Copy-paste ready examples
- **Response Schemas** - Know exactly what to expect
- **Try Before Integrate** - Test endpoints before implementation

### 🚀 **Next Steps**

1. **Start the server** and access Swagger UI
2. **Test all endpoints** using the interactive interface
3. **Customize documentation** for your specific needs
4. **Add authentication** for protected endpoints
5. **Deploy to production** with proper security

Your Farcaster Ad Rental API now has **professional-grade documentation** that makes it easy for developers to understand, test, and integrate with your platform!


