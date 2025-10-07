# Farcaster Ad Rental Miniapp

A decentralized advertising platform that enables Farcaster users to monetize their profile surfaces (banner images, pinned casts) by renting them to advertisers. Advertisers pay in USDC on Base for time-based or impression-based ad slots, with hosts receiving hourly payouts via Merkle-based batch distributions.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend** (`apps/frontend`): Next.js app with Frames.js for Farcaster integration
- **Backend** (`apps/backend`): Node.js/Express API with MongoDB
- **Contracts** (`packages/contracts`): Smart contracts on Base (Campaign Escrow + Merkle Distributor)
- **Shared** (`packages/shared`): Common utilities and Merkle tree logic
- **Types** (`packages/types`): TypeScript type definitions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image uploads)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd farcaster-ad-rental

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables (see below)
```

### Environment Variables

#### Backend (`apps/backend/.env.local`)

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farcaster-ad-rental

# Cloudinary Configuration (for image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Blockchain Configuration
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_here
CAMPAIGN_ESCROW_ADDRESS=your_contract_address
MERKLE_DISTRIBUTOR_ADDRESS=your_distributor_address

# API Keys
FARCASTER_API_KEY=your_farcaster_api_key
JWT_SECRET=your_jwt_secret_here

# App Configuration
PORT=3001
PLATFORM_FEE_PERCENTAGE=5

# Keeper Service (Hourly Payouts)
ENABLE_KEEPER=false
KEEPER_INTERVAL=3600000

# Development
NODE_ENV=development
```

#### Frontend (`apps/frontend/.env.local`)

```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Farcaster
NEXT_PUBLIC_FARCASTER_HUB_URL=https://hub.farcaster.xyz
```

### Development

```bash
# Start backend server
cd apps/backend
npm run dev

# Start frontend (in another terminal)
cd apps/frontend
npm run dev

# Frontend will be available at http://localhost:3000
# Backend API at http://localhost:3001
# API docs at http://localhost:3001/api-docs
```

### Building for Production

```bash
# Build backend
cd apps/backend
npm run build

# Build frontend
cd apps/frontend
npm run build

# Deploy smart contracts
cd packages/contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network base
```

## 📁 Project Structure

```
farcaster-ad-rental/
├── apps/
│   ├── frontend/              # Next.js + Frames.js app
│   │   ├── src/
│   │   │   ├── app/          # Next.js app router pages
│   │   │   ├── components/   # React components
│   │   │   └── lib/          # Utilities
│   │   └── package.json
│   └── backend/              # Express API server
│       ├── src/
│       │   ├── models/       # MongoDB models
│       │   ├── routes/       # API routes
│       │   ├── services/     # Business logic
│       │   └── index.ts      # Server entry
│       └── package.json
├── packages/
│   ├── contracts/            # Smart contracts (Hardhat)
│   │   ├── contracts/        # Solidity contracts
│   │   ├── scripts/          # Deployment scripts
│   │   └── test/             # Contract tests
│   ├── shared/              # Shared utilities
│   └── types/               # TypeScript types
└── package.json             # Root package.json
```

## 🔧 Smart Contracts

### CampaignEscrow.sol
- Holds advertiser USDC deposits for campaigns
- Releases funds hourly for host payouts
- Handles refunds for unused budget
- Deducts platform fees

### MerkleDistributor.sol
- Stores Merkle roots for hourly payout cycles
- Enables batch distribution to multiple hosts
- Verifies Merkle proofs for each host claim
- Prevents double-claiming

## 🎯 Key Features

### For Advertisers
- ✅ Create campaigns with creative assets (images via Cloudinary)
- ✅ Set budget, duration, and targeting preferences
- ✅ Fund campaigns with USDC on Base
- ✅ Track performance analytics (impressions, clicks, CTR)
- ✅ View real-time spend and remaining budget
- 🚧 Pause/resume campaigns
- 🚧 Campaign approval workflow

### For Hosts (Users)
- 🚧 Opt into ad rental via miniapp
- 🚧 Select which profile surfaces to monetize (banner, pinned cast)
- 🚧 Approve/reject specific ad placements
- 🚧 View real-time earnings (updated hourly)
- 🚧 Automatic hourly payouts to wallet
- 🚧 Set preferences (categories, minimum price)

### For Platform Operator
- 🚧 Campaign approval/rejection dashboard
- 🚧 Automated hourly settlement via keeper bot
- 🚧 Merkle tree generation for batch payouts
- 🚧 Platform fee collection (5% default)
- 🚧 Fraud detection and prevention
- 🚧 Network analytics and monitoring

### Current Implementation Status

**✅ Completed:**
- Campaign creation with image upload (Cloudinary)
- Campaign listing and dashboard
- MongoDB integration with Mongoose models
- Backend API with Express and Swagger docs
- Frontend with Next.js and cyberpunk UI theme
- Success notifications after campaign creation

**🚧 In Progress:**
- Smart contract deployment and integration
- Farcaster authentication
- Host onboarding flow
- Impression tracking system
- Hourly payout mechanism with Merkle trees
- Keeper bot for automated settlements

**📋 Planned:**
- Campaign approval workflow
- Host earnings dashboard
- Real-time analytics
- Fraud prevention system
- Profile surface ad rendering

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, NativeWind, Wagmi, Viem
- **Backend**: Node.js, Express, MongoDB (Mongoose), Cloudinary
- **Blockchain**: Solidity, Hardhat, Base network, USDC
- **Infrastructure**: npm/pnpm workspaces, TypeScript, ESLint, Prettier

## 📊 Hourly Payout System

The platform uses a Merkle-based batch distribution system for efficient, low-cost payouts:

1. **Tracking**: Impressions and clicks logged offchain in MongoDB
2. **Hourly Calculation**: Keeper service calculates each host's earnings
3. **Merkle Tree**: Generate tree of `(host_address, payout_amount)` pairs
4. **Root Submission**: Submit Merkle root to smart contract
5. **Batch Distribution**: Contract disburses funds to all hosts in one transaction
6. **Platform Fee**: Operator takes configurable percentage (default 5%)

### Benefits
- ⚡ Low gas costs (single transaction for multiple payouts)
- 🔒 Transparent and verifiable (Merkle proofs)
- 💰 Micro-payments viable (hourly distributions)
- 🚀 Scalable to thousands of hosts

## 🔒 Security

- Smart contracts deployed on Base (auditing recommended before mainnet)
- Fraud prevention with rate limits and anomaly detection
- Transparent payouts via Merkle proofs
- Secure wallet integration with Farcaster
- Environment variables for sensitive data

## 📊 Success Metrics

- Number of active hosts opted in
- Average host earnings per day
- Advertiser spend (daily/weekly/monthly)
- Platform fee revenue
- Impression quality and fraud rate
- User retention (repeat advertisers & hosts)
- Campaign CTR benchmarks

## 🚀 API Documentation

The backend API is documented with Swagger/OpenAPI:

- **Local**: http://localhost:3001/api-docs
- **Interactive Docs**: Test endpoints directly in browser
- **OpenAPI Spec**: Available at `/api-docs.json`

Key endpoints:
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns` - List all campaigns
- `POST /api/upload` - Upload campaign images
- `POST /api/hosts/opt-in` - Host opt-in
- `GET /api/payouts/history` - Payout history
- `POST /api/tracking/impression` - Log impression

## 🧪 Testing

```bash
# Run backend tests
cd apps/backend
npm test

# Run contract tests
cd packages/contracts
npx hardhat test

# Run frontend tests
cd apps/frontend
npm test
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Verify database user permissions

### Cloudinary Upload Errors
- Verify API credentials in `.env.local`
- Check file size limits (default 5MB)
- Ensure HTTPS is enabled in Cloudinary settings

### Smart Contract Issues
- Ensure sufficient Base ETH for gas
- Verify contract addresses in environment
- Check RPC endpoint is responding

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

## 📧 Support

For issues and questions:
- Open a GitHub issue
- Check the [PRD](./PRD.md) for product requirements
- Review [API documentation](./API.md)

---

**Status**: Active Development 🚧

**Version**: 1.0.0-beta

**Last Updated**: January 2025