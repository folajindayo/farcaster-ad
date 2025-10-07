# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Database Configuration
```bash
MONGODB_URI=mongodb+srv://zoracle:usezoracle2025@cluster0.yiolv35.mongodb.net/
REDIS_URL=redis://localhost:6379
```

### Blockchain Configuration
```bash
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_here
AD_ESCROW_ADDRESS=your_ad_escrow_contract_address
CAMPAIGN_ESCROW_ADDRESS=your_campaign_escrow_contract_address
MERKLE_DISTRIBUTOR_ADDRESS=your_merkle_distributor_contract_address
USDC_ADDRESS=your_usdc_contract_address
CHAIN_ID=8453
```

### Keeper Service (Automated Hourly Payouts)
```bash
ENABLE_KEEPER=false
KEEPER_BATCH_SIZE=50
KEEPER_GAS_PRICE=5
KEEPER_GAS_LIMIT=8000000
KEEPER_CRON_PATTERN=5 * * * *
```

### API Keys & Security
```bash
FARCASTER_API_KEY=your_farcaster_api_key
```

### Application Configuration
```bash
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
PLATFORM_FEE_PERCENTAGE=5
```

### Farcaster Configuration
```bash
FARCASTER_APP_BASE_URL=https://farcaster-ad-rental.vercel.app
```

## Quick Setup Commands

1. **Copy the example file:**
   ```bash
   cp env.example .env.local
   ```

2. **Edit the environment file:**
   ```bash
   nano .env.local
   # or
   code .env.local
   ```

3. **Update the MongoDB URI** (already set in your case):
   ```bash
   MONGODB_URI=mongodb+srv://zoracle:usezoracle2025@cluster0.yiolv35.mongodb.net/
   ```

## Current Status

✅ **Already Configured:**
- MongoDB URI is set and working
- Database connection is successful

⚠️ **Needs Configuration:**
- Blockchain private key and contract addresses
- Farcaster API key
- Keeper service configuration (optional)

## Development vs Production

- **Development**: Most blockchain features can be disabled
- **Production**: All blockchain and API keys must be properly configured

## Testing the Setup

1. Start the backend server:
   ```bash
   cd apps/backend && yarn dev
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. Access Swagger docs:
   ```bash
   open http://localhost:3001/api-docs
   ```
