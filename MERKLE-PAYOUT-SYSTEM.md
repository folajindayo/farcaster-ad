# Hourly Merkle Tree Payout System

## Overview

The Farcaster Ad Rental platform implements an automated hourly payout system using Merkle trees for efficient and transparent host compensation. This system processes advertising revenue and distributes it to hosts every hour without requiring manual claims.

## Architecture

### Smart Contracts

**CampaignEscrow.sol**
- Manages campaign funds in USDC
- Stores Merkle roots for each hourly epoch
- Processes bulk claims through `bulkClaim` function
- Handles platform fee distribution

### Backend Services

**MerkleBuilder Service**
- Aggregates impression/click data hourly
- Applies fraud detection filters
- Calculates weighted payouts
- Generates Merkle trees and proofs

**Keeper Service**
- Automated cron job running at 5 minutes past every hour
- Finalizes epochs on-chain
- Executes bulk claims in batches
- Monitors transaction status

### Database Schema

```
epochs
├── id (campaignId_epoch)
├── merkleRoot
├── allocatedAmount
├── claimedAmount
├── status (pending/finalized/settled)
└── finalizedAt

epoch_payouts
├── epochId
├── index
├── hostAddress
├── amount
├── proof[]
├── claimed
└── claimedTxHash

receipts
├── campaignId
├── hostAddress
├── timestamp
├── impressions
├── clicks
├── dwellMs
└── processed
```

## How It Works

### 1. Activity Tracking (Continuous)
```javascript
POST /api/receipts/submit
{
  campaignId: 1,
  hostAddress: "0x...",
  impressions: 100,
  clicks: 10,
  dwellMs: 5000
}
```

### 2. Hourly Processing (Automated)

**Step 1: Aggregate Receipts**
- Query receipts for the past hour
- Apply fraud filters (min dwell time, deduplication)
- Cap per-host activity to prevent abuse

**Step 2: Calculate Payouts**
```javascript
score = impressions + (clicks × 10)
payout = (score / totalScore) × hourlyBudget
```

**Step 3: Build Merkle Tree**
```javascript
leaf = keccak256(abi.encodePacked(index, hostAddress, amount))
merkleRoot = MerkleTree(leaves).getRoot()
```

**Step 4: Finalize On-Chain**
```solidity
finalizeEpoch(campaignId, epoch, merkleRoot, allocatedAmount)
```

**Step 5: Bulk Claims**
```solidity
bulkClaim(campaignId, epoch, claims[])
```

## Configuration

### Environment Variables

```env
# Blockchain
CAMPAIGN_ESCROW_ADDRESS=0x...
USDC_ADDRESS=0x...
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_keeper_private_key

# Keeper Configuration
ENABLE_KEEPER=true
KEEPER_BATCH_SIZE=50              # Claims per transaction
KEEPER_GAS_PRICE=5                # In gwei
KEEPER_GAS_LIMIT=8000000          # Max gas per tx
KEEPER_CRON_PATTERN=5 * * * *     # 5 minutes past every hour
```

### Platform Parameters

- **Platform Fee**: 2% (configurable)
- **Minimum Payout**: $0.01 USDC
- **Batch Size**: 50 claims per transaction
- **Epoch Duration**: 1 hour (3600 seconds)
- **Minimum Dwell Time**: 1000ms

## Fraud Prevention

### Implemented Filters

1. **Minimum Dwell Time**: Views < 1000ms are ignored
2. **Deduplication**: Same fingerprint within 30s window
3. **Host Caps**: Max 1000 impressions/hour per host
4. **Click Cap**: Max 100 clicks/hour per host
5. **Anomaly Detection**: Flag unusual traffic spikes

### Weighting Formula

```
Base Score = impressions + (clicks × 10)
Final Payout = (score / totalScore) × hourlyBudget × (1 - platformFee)
```

## API Endpoints

### Campaign Management
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/fund` - Fund campaign

### Epoch Queries
- `GET /api/campaigns/:id/epochs` - List epochs
- `GET /api/campaigns/:id/epochs/:epoch` - Epoch details
- `GET /api/campaigns/:id/epochs/:epoch/proofs` - Merkle proofs

### Host Payouts
- `GET /api/hosts/:wallet/payouts` - Payout history
- `POST /api/receipts/submit` - Submit activity

### Admin/Keeper
- `POST /api/campaigns/:id/epochs/generate` - Manual epoch generation
- `POST /api/keeper/batch-claim` - Trigger bulk claims
- `GET /api/keeper/status` - Keeper service status

## Deployment

### 1. Deploy Smart Contracts

```bash
cd packages/contracts
npx hardhat run scripts/deploy-campaign-escrow.ts --network base
```

### 2. Configure Backend

```bash
# Update .env with contract addresses
CAMPAIGN_ESCROW_ADDRESS=<deployed_address>
ENABLE_KEEPER=true
```

### 3. Start Services

```bash
# Backend with keeper
cd apps/backend
yarn dev

# Frontend
cd apps/frontend
yarn dev
```

## Gas Optimization

### Estimated Costs (Base L2)
- **Per Claim**: ~50-80k gas
- **Bulk Claim (50)**: ~2.5-4M gas
- **Finalize Epoch**: ~150k gas

### Batching Strategy
```javascript
if (totalHosts <= 50) {
  // Single transaction
  bulkClaim(allClaims)
} else {
  // Multiple batches
  while (claims.length > 0) {
    batch = claims.splice(0, 50)
    bulkClaim(batch)
    await delay(2000) // Prevent nonce issues
  }
}
```

## Security Considerations

### Trust Model
- **Operator Trust**: Controls epoch finalization
- **Merkle Proofs**: Ensure payout integrity
- **Time Locks**: Optional delay between finalize and claim
- **Public Proofs**: All proofs available via API for verification

### Best Practices
1. Use multisig for owner account
2. Implement emergency pause
3. Monitor gas prices
4. Set reasonable batch limits
5. Audit fraud detection rules

## Monitoring

### Key Metrics
- Epochs finalized per hour
- Average payout per host
- Gas costs per epoch
- Failed transactions
- Unclaimed funds

### Alerts
```javascript
// Alert conditions
if (epoch.status === 'pending' && age > 2 hours) {
  alert("Epoch finalization delayed")
}
if (gasPrice > threshold) {
  alert("High gas prices detected")
}
if (unclaimedRatio > 0.1) {
  alert("High unclaimed funds")
}
```

## Testing

### Unit Tests
```bash
cd packages/contracts
npx hardhat test test/CampaignEscrow.test.ts
```

### Integration Tests
```bash
cd apps/backend
yarn test:integration
```

### Testnet Deployment
1. Deploy to Base Goerli
2. Use mock USDC for testing
3. Run keeper with accelerated schedule (every 5 minutes)
4. Monitor gas usage and optimize batch sizes

## Troubleshooting

### Common Issues

**Epoch Not Finalizing**
- Check keeper service is running
- Verify contract has owner permissions
- Ensure sufficient ETH for gas

**Claims Failing**
- Verify merkle proofs are correct
- Check USDC balance in contract
- Ensure epoch is finalized

**High Gas Costs**
- Reduce batch size
- Optimize during low-traffic hours
- Consider L2 solutions

## Future Improvements

1. **Decentralized Keepers**: Use Chainlink Automation
2. **Cross-chain Support**: Deploy on multiple L2s
3. **Dynamic Batch Sizing**: Adjust based on gas prices
4. **ZK Proofs**: Further gas optimization
5. **Streaming Payouts**: Real-time micro-payments

## Support

For issues or questions:
- GitHub: [issues](https://github.com/your-repo/issues)
- Discord: [community](https://discord.gg/your-server)
- Docs: [documentation](https://docs.your-site.com)




