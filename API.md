# Farcaster Ad Rental API Documentation

## Overview

The Farcaster Ad Rental API enables advertisers to create campaigns, hosts to opt-in for ad placements, and tracks performance metrics for transparent payouts.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API doesn't implement authentication. In production, you would use JWT tokens or similar authentication mechanisms.

## Endpoints

### Campaigns

#### Create Campaign
```http
POST /campaigns
```

**Request Body:**
```json
{
  "advertiserId": "string",
  "title": "string",
  "description": "string",
  "budget": "string",
  "type": "banner" | "pinned_cast",
  "targeting": {
    "categories": ["string"],
    "minFollowers": "number",
    "maxFollowers": "number",
    "regions": ["string"]
  },
  "creative": {
    "bannerImage": "string",
    "pinnedCastText": "string",
    "pinnedCastMedia": "string",
    "ctaText": "string",
    "ctaUrl": "string"
  },
  "schedule": {
    "startDate": "string",
    "endDate": "string",
    "maxImpressions": "number",
    "cpm": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "string",
      "title": "string",
      "budget": "string",
      "pricing": {
        "baseBudget": "number",
        "platformFee": "number",
        "hostEarnings": "number",
        "totalBudget": "number"
      },
      "status": "draft",
      "createdAt": "string"
    }
  }
}
```

#### Get Campaign
```http
GET /campaigns/:id
```

#### Get Campaigns by Advertiser
```http
GET /campaigns/advertiser/:advertiserId?page=1&limit=10&status=active
```

#### Update Campaign
```http
PUT /campaigns/:id
```

#### Fund Campaign
```http
POST /campaigns/:id/fund
```

**Request Body:**
```json
{
  "amount": "string",
  "transactionHash": "string"
}
```

### Hosts

#### Opt-in to Hosting
```http
POST /hosts/opt-in
```

**Request Body:**
```json
{
  "userId": "string",
  "preferences": {
    "categories": ["string"],
    "minPrice": "string",
    "maxCampaigns": "number",
    "autoApprove": "boolean"
  }
}
```

#### Opt-out of Hosting
```http
POST /hosts/opt-out
```

**Request Body:**
```json
{
  "userId": "string"
}
```

#### Get Host Profile
```http
GET /hosts/:hostId
```

#### Get Host by User ID
```http
GET /hosts/user/:userId
```

#### Update Host Preferences
```http
PUT /hosts/:hostId/preferences
```

**Request Body:**
```json
{
  "categories": ["string"],
  "minPrice": "string",
  "maxCampaigns": "number",
  "autoApprove": "boolean"
}
```

#### Get Host Earnings
```http
GET /hosts/:hostId/earnings
```

#### Get Host Inventory
```http
GET /hosts/:hostId/inventory
```

### Tracking

#### Track Impression
```http
POST /tracking/impression
```

**Request Body:**
```json
{
  "placementId": "string",
  "userAgent": "string",
  "ipAddress": "string",
  "referrer": "string"
}
```

#### Track Click
```http
POST /tracking/click
```

**Request Body:**
```json
{
  "placementId": "string",
  "targetUrl": "string",
  "userAgent": "string",
  "ipAddress": "string"
}
```

#### Track Engagement
```http
POST /tracking/engagement
```

**Request Body:**
```json
{
  "placementId": "string",
  "engagementType": "string",
  "userAgent": "string",
  "ipAddress": "string"
}
```

## User Flow Implementation

### 1. Advertiser Flow

1. **Create Campaign**
   ```bash
   curl -X POST http://localhost:3001/api/campaigns \
     -H "Content-Type: application/json" \
     -d '{
       "advertiserId": "advertiser_id",
       "title": "My Campaign",
       "budget": "1000",
       "type": "banner",
       "creative": {
         "bannerImage": "https://example.com/banner.jpg"
       }
     }'
   ```

2. **Fund Campaign**
   ```bash
   curl -X POST http://localhost:3001/api/campaigns/campaign_id/fund \
     -H "Content-Type: application/json" \
     -d '{
       "amount": "1000",
       "transactionHash": "0x..."
     }'
   ```

### 2. Host Flow

1. **Opt-in to Hosting**
   ```bash
   curl -X POST http://localhost:3001/api/hosts/opt-in \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user_id",
       "preferences": {
         "categories": ["tech", "crypto"],
         "minPrice": "10",
         "maxCampaigns": 5,
         "autoApprove": true
       }
     }'
   ```

2. **Check Inventory**
   ```bash
   curl http://localhost:3001/api/hosts/host_id/inventory
   ```

### 3. Tracking Flow

1. **Track Impression**
   ```bash
   curl -X POST http://localhost:3001/api/tracking/impression \
     -H "Content-Type: application/json" \
     -d '{
       "placementId": "placement_id",
       "userAgent": "Mozilla/5.0...",
       "ipAddress": "192.168.1.1"
     }'
   ```

2. **Track Click**
   ```bash
   curl -X POST http://localhost:3001/api/tracking/click \
     -H "Content-Type: application/json" \
     -d '{
       "placementId": "placement_id",
       "targetUrl": "https://example.com",
       "userAgent": "Mozilla/5.0...",
       "ipAddress": "192.168.1.1"
     }'
   ```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `MISSING_FIELDS` - Required fields are missing
- `CAMPAIGN_NOT_FOUND` - Campaign doesn't exist
- `HOST_NOT_FOUND` - Host doesn't exist
- `INVALID_STATUS` - Invalid status for operation
- `ALREADY_HOST` - User is already a host

## Database Management

### Initialize Database
```bash
yarn db:init
```

### Check Database Status
```bash
yarn db:status
```

### Get Database Statistics
```bash
yarn db:stats
```

## Development

### Start Development Server
```bash
yarn dev
```

### Build for Production
```bash
yarn build
yarn start
```

## Next Steps

1. **Authentication**: Implement JWT-based authentication
2. **File Upload**: Add creative asset upload endpoints
3. **Blockchain Integration**: Connect with smart contracts
4. **Neynar Integration**: Add Farcaster API integration
5. **Real-time Updates**: Add WebSocket support for live updates
6. **Analytics Dashboard**: Create comprehensive analytics endpoints


