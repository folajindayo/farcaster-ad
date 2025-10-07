📄 Product Requirements Document (PRD)

Product: Farcaster Ad Miniapp
Version: 1.0
Author: [Your Name]
Date: [Insert Date]

1. Overview

The Farcaster Ad Miniapp enables advertisers to rent user profile surfaces (banner, pinned cast, profile frame) and pay hosts (users) in USDC for displaying ads.

Key features:

Advertisers create and fund ad campaigns in USDC.

Hosts opt-in to monetize their profiles.

Ads auto-distributed to available inventory.

Impressions and clicks tracked in real-time.

Hosts are paid hourly via Merkle-based batch micro-distributions, with funds sent directly to their Farcaster-linked wallet.

Operator (the network) takes a fee per distribution.

2. Goals & Non-Goals
Goals

Enable microtransactions for hosts seamlessly.

Make payout frictionless & viral (“I got paid just for having ads on my profile!”).

Provide advertisers with self-serve campaign creation.

Ensure scalability (batch settlement, no high gas overhead).

Non-Goals

We are not building a full influencer marketplace (1-to-1 deals).

We are not building creative asset generation (ads come pre-uploaded).

We are not building a full analytics SaaS (only basic ad reporting).

3. User Roles
Advertiser

Creates campaigns (upload creative, set targeting, fund escrow).

Tracks performance and spend.

Host (User)

Installs miniapp and opts-in ad slots.

Ads displayed automatically.

Gets paid hourly.

Operator (Network Admin)

Approves/rejects campaigns.

Runs keeper bot for hourly settlement.

Takes fee from each distribution.

4. Key Features
4.1 Campaign Creation (Advertiser)

Inputs:

Campaign Name

Creative (image, text, CTA link)

Placement type (Banner, Pinned Cast, Profile Frame)

Duration (start, end, or until budget spent)

Pricing Model (CPM – cost per 1000 impressions, or CPC)

Targeting (optional: followers, region, etc.)

Budget (in USDC)

Process:

System calculates estimated impressions.

Advertiser funds escrow in USDC.

Campaign status = Pending Approval.

Outputs:

Campaign ID + Dashboard entry.

4.2 Campaign Approval (Operator)

System auto-approves OR operator reviews.

Approved campaigns enter Ad Pool.

Ads begin serving immediately to opted-in hosts.

4.3 Host Opt-in

Host installs miniapp.

Selects which slots to monetize.

Signs wallet link transaction.

Host status = “Available Inventory.”

4.4 Ad Delivery

Ads are randomly assigned (fair distribution).

Each impression tracked via event logs.

Metrics: Impressions, Clicks, CTR.

4.5 Hourly Payouts (via Merkle Distribution)
Process:

Tracking Service logs impressions per host (offchain database).

Every hour:

Service calculates each host’s earned USDC.

Creates a Merkle tree of (host_address, payout_amount).

Root hash is submitted to smart contract.

Funds for that hour are transferred from escrow to payout contract.

Auto-Claim:

Operator keeper bot executes the batch distribution.

Contract disburses funds directly to each host wallet.

Hosts see hourly deposits in their wallet.

Smart Contract Components:

EscrowContract: Holds advertiser campaign funds.

PayoutContract: Handles hourly Merkle distributions.

OperatorFee: % cut goes to operator wallet each batch.

4.6 Dashboards
Advertiser Dashboard

Active campaigns

Spend to date / Remaining budget

Impressions, clicks, CTR

Cost per impression/click

Host Dashboard

Earnings this hour (real-time)

Lifetime earnings

Next payout countdown

Ad history (campaigns served)

Operator Dashboard

Total campaigns

Total impressions

Settlement logs

Network revenue

5. Technical Architecture
5.1 Onchain

Contracts deployed on Base (low fees, Farcaster-native).

Key contracts:

CampaignEscrow

HourlyMerkleDistributor

OperatorFeeCollector

5.2 Offchain

Tracking service (impression logger).

Merkle tree generator (every hour).

Keeper bot (auto-triggers settlement).

5.3 Data Flow

Advertiser → EscrowContract (funds locked).

Hosts serve ads (impressions logged offchain).

Hourly → Merkle root generated → submitted to contract.

Payout distributed to hosts’ wallets.

6. Success Metrics
of advertisers creating campaigns
of hosts opted in

Total USDC distributed hourly

Avg earnings per host per day

CTR benchmarks (ad performance)