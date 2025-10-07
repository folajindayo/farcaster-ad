# Database Setup - MongoDB

This project uses MongoDB as the primary database. The database schema is defined using Mongoose ODM with TypeScript.

## Database Structure

The database contains the following collections:

- **users** - User accounts and profiles
- **hosts** - Ad space hosts (users who rent out their profile space)
- **advertisers** - Companies/brands running ad campaigns
- **campaigns** - Advertising campaigns
- **ad_placements** - Specific ad placements on host profiles
- **payouts** - Host earnings and payout records
- **payout_cycles** - Batch payout processing cycles
- **impression_events** - Ad impression tracking
- **click_events** - Ad click tracking

## Setup Instructions

### 1. Install MongoDB

**Local Development:**
```bash
# macOS with Homebrew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

**Docker (Alternative):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Environment Configuration

Copy the environment file and configure MongoDB:
```bash
cp env.example .env
```

Update the MongoDB URI in your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/farcaster_ad_rental
```

### 3. Database Initialization

The database will be automatically initialized when you start the backend server. The application will:

1. Connect to MongoDB
2. Create collections if they don't exist
3. Create necessary indexes for performance
4. Set up proper relationships between documents

### 4. Development Commands

```bash
# Start the backend (auto-initializes database)
yarn dev

# Build and start production
yarn build
yarn start
```

## Database Models

All models are defined in `apps/backend/src/models/` with TypeScript interfaces and Mongoose schemas:

- **User** - Core user information and Farcaster integration
- **Host** - Ad space hosting capabilities and earnings
- **Advertiser** - Campaign management and spending tracking
- **Campaign** - Ad campaign configuration and targeting
- **AdPlacement** - Individual ad placements and performance
- **Payout** - Earnings and payment processing
- **PayoutCycle** - Batch payout management
- **ImpressionEvent** - Ad impression analytics
- **ClickEvent** - Ad click analytics

## Indexes

The following indexes are automatically created for optimal performance:

- User: `farcasterId`, `walletAddress`
- Host: `userId`
- Advertiser: `userId`
- Campaign: `advertiserId`, `status`
- AdPlacement: `campaignId`, `hostId`, `status`
- Payout: `hostId`, `status`
- Events: `placementId`, `timestamp`

## Data Relationships

```
User (1) ←→ (1) Host
User (1) ←→ (1) Advertiser
Advertiser (1) ←→ (N) Campaign
Campaign (1) ←→ (N) AdPlacement
Host (1) ←→ (N) AdPlacement
Host (1) ←→ (N) Payout
AdPlacement (1) ←→ (N) ImpressionEvent
AdPlacement (1) ←→ (N) ClickEvent
```

## Migration from SQL

The original PostgreSQL schema has been converted to MongoDB with the following changes:

- UUIDs → MongoDB ObjectIds
- Foreign keys → ObjectId references
- JSONB → Mixed schema types
- Timestamps → Mongoose timestamps
- Triggers → Mongoose middleware

## Production Considerations

For production deployment:

1. **Connection Pooling**: Configured with maxPoolSize: 10
2. **Timeouts**: Server selection and socket timeouts configured
3. **Indexes**: All performance-critical indexes created
4. **Validation**: Mongoose schema validation enabled
5. **Monitoring**: Connection state monitoring included

## Backup and Recovery

```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/farcaster_ad_rental" --out=./backup

# Restore database
mongorestore --uri="mongodb://localhost:27017/farcaster_ad_rental" ./backup/farcaster_ad_rental
```


