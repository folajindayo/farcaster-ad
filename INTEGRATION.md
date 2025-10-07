# File Upload & Blockchain Integration Guide

## 🚀 **New Features Implemented**

### 1. **File Upload System**
- ✅ **Creative Asset Upload** for banners and pinned casts
- ✅ **Image Processing** with Sharp for optimization
- ✅ **Multiple Size Generation** (thumb, medium, banner)
- ✅ **File Validation** based on campaign type
- ✅ **Static File Serving** with caching

### 2. **Blockchain Integration**
- ✅ **Campaign Funding** via AdEscrow contract
- ✅ **Campaign Management** (activate, complete, pause)
- ✅ **Spend Tracking** and budget management
- ✅ **Payout Generation** with Merkle trees
- ✅ **USDC Balance** checking
- ✅ **Transaction Status** monitoring

## 📁 **File Upload API**

### Upload Creative Assets
```bash
curl -X POST http://localhost:3001/api/upload/creative \
  -F "assets=@banner.jpg" \
  -F "assets=@logo.png" \
  -F "campaignType=banner"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "uuid",
        "originalName": "banner.jpg",
        "filename": "generated-filename.jpg",
        "url": "/uploads/generated-filename.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "dimensions": { "width": 1200, "height": 400 },
        "optimizedUrls": {
          "thumb": "/uploads/generated-filename_thumb.jpg",
          "medium": "/uploads/generated-filename_medium.jpg",
          "banner": "/uploads/generated-filename_banner.jpg"
        }
      }
    ]
  }
}
```

### Upload Single File
```bash
curl -X POST http://localhost:3001/api/upload/single \
  -F "file=@image.jpg"
```

### Validate File
```bash
curl -X POST http://localhost:3001/api/upload/validate \
  -F "file=@banner.jpg" \
  -F "campaignType=banner"
```

### Delete Files
```bash
curl -X DELETE http://localhost:3001/api/upload/files \
  -H "Content-Type: application/json" \
  -d '{"fileIds": ["uuid1", "uuid2"]}'
```

## ⛓️ **Blockchain API**

### Fund Campaign
```bash
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/fund \
  -H "Content-Type: application/json" \
  -d '{"amount": "1000"}'
```

### Activate Campaign
```bash
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/activate
```

### Record Spend
```bash
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/spend \
  -H "Content-Type: application/json" \
  -d '{"amount": "100"}'
```

### Complete Campaign
```bash
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/complete
```

### Get Campaign Details
```bash
curl http://localhost:3001/api/blockchain/campaigns/campaign_id
```

### Generate Payout Cycle
```bash
curl -X POST http://localhost:3001/api/blockchain/payouts/cycle
```

### Get USDC Balance
```bash
curl http://localhost:3001/api/blockchain/balance/0x1234...
```

### Get Transaction Status
```bash
curl http://localhost:3001/api/blockchain/transactions/0xabc123...
```

## 🔧 **Configuration**

### Environment Variables
```env
# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_here
AD_ESCROW_ADDRESS=0x...
MERKLE_DISTRIBUTOR_ADDRESS=0x...
USDC_ADDRESS=0x...
CHAIN_ID=8453
```

### File Upload Configuration
- **Max File Size**: 10MB
- **Allowed Types**: JPEG, PNG, GIF, WebP, SVG
- **Auto Optimization**: Thumb (150x150), Medium (800x600), Banner (1200x400)
- **Caching**: 1 year cache for static files

### Blockchain Configuration
- **Network**: Base Mainnet (Chain ID: 8453)
- **Contracts**: AdEscrow, MerkleDistributor, USDC
- **Gas Optimization**: Batch operations for payouts
- **Error Handling**: Comprehensive transaction monitoring

## 🎯 **Complete User Flow**

### 1. **Advertiser Creates Campaign**
```bash
# 1. Upload creative assets
curl -X POST http://localhost:3001/api/upload/creative \
  -F "assets=@banner.jpg" \
  -F "campaignType=banner"

# 2. Create campaign with creative URLs
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "advertiserId": "user_id",
    "title": "My Campaign",
    "budget": "1000",
    "type": "banner",
    "creative": {
      "bannerImage": "/uploads/banner.jpg"
    }
  }'

# 3. Fund campaign on blockchain
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/fund \
  -H "Content-Type: application/json" \
  -d '{"amount": "1000"}'
```

### 2. **Campaign Goes Live**
```bash
# Activate campaign
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/activate
```

### 3. **Track Performance**
```bash
# Track impressions
curl -X POST http://localhost:3001/api/tracking/impression \
  -H "Content-Type: application/json" \
  -d '{
    "placementId": "placement_id",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }'

# Track clicks
curl -X POST http://localhost:3001/api/tracking/click \
  -H "Content-Type: application/json" \
  -d '{
    "placementId": "placement_id",
    "targetUrl": "https://example.com",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }'
```

### 4. **Settlement & Payouts**
```bash
# Complete campaign
curl -X POST http://localhost:3001/api/blockchain/campaigns/campaign_id/complete

# Generate payout cycle
curl -X POST http://localhost:3001/api/blockchain/payouts/cycle

# Get payout proof for host
curl -X POST http://localhost:3001/api/blockchain/payouts/proof \
  -H "Content-Type: application/json" \
  -d '{"hostId": "host_id", "amount": "100"}'
```

## 🛠️ **Development Setup**

### 1. **Install Dependencies**
```bash
cd apps/backend
yarn install
```

### 2. **Configure Environment**
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. **Start Development Server**
```bash
yarn dev
```

### 4. **Test File Upload**
```bash
# Create uploads directory
mkdir -p uploads

# Test file upload
curl -X POST http://localhost:3001/api/upload/single \
  -F "file=@test-image.jpg"
```

### 5. **Test Blockchain Integration**
```bash
# Check USDC balance
curl http://localhost:3001/api/blockchain/balance/0x1234...

# Test campaign funding (requires configured contracts)
curl -X POST http://localhost:3001/api/blockchain/campaigns/1/fund \
  -H "Content-Type: application/json" \
  -d '{"amount": "100"}'
```

## 📊 **Performance Features**

### File Upload Optimizations
- **Image Compression**: Automatic quality optimization
- **Multiple Sizes**: Generated for different use cases
- **Caching**: Long-term caching for static files
- **Validation**: Type and dimension validation

### Blockchain Optimizations
- **Batch Operations**: Multiple payouts in single transaction
- **Gas Estimation**: Automatic gas calculation
- **Error Recovery**: Comprehensive error handling
- **Transaction Monitoring**: Real-time status tracking

## 🔒 **Security Features**

### File Upload Security
- **Type Validation**: Only allowed image types
- **Size Limits**: Maximum file size enforcement
- **Path Sanitization**: Secure file naming
- **Access Control**: Proper file serving headers

### Blockchain Security
- **Private Key Management**: Secure key handling
- **Transaction Validation**: Pre-transaction checks
- **Error Handling**: Safe failure modes
- **Audit Trail**: Complete transaction logging

## 🚀 **Production Deployment**

### File Storage
- **Local Storage**: For development
- **Cloud Storage**: AWS S3, Google Cloud Storage
- **CDN Integration**: CloudFront, CloudFlare
- **Backup Strategy**: Automated backups

### Blockchain Deployment
- **Mainnet**: Base network for production
- **Testnet**: Base Sepolia for testing
- **Monitoring**: Transaction monitoring
- **Alerting**: Failed transaction alerts

## 📈 **Monitoring & Analytics**

### File Upload Metrics
- **Upload Volume**: Files uploaded per day
- **Storage Usage**: Total storage consumed
- **Error Rates**: Failed uploads
- **Performance**: Upload speeds

### Blockchain Metrics
- **Transaction Volume**: Daily transactions
- **Gas Usage**: Average gas consumption
- **Success Rates**: Transaction success rates
- **Cost Analysis**: Transaction costs

Your Farcaster Ad Rental platform now has **complete file upload and blockchain integration**! The system is ready for production deployment with comprehensive error handling, security features, and performance optimizations.


