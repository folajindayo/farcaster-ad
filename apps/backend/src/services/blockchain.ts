import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Campaign, AdPlacement, Host } from '../models';
// import { PayoutMerkleTree } from '@farcaster-ad-rental/shared';

export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddresses: {
    adEscrow: string;
    merkleDistributor: string;
    usdc: string;
  };
  chainId: number;
}

export interface CampaignFunding {
  campaignId: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface PayoutData {
  hostId: string;
  amount: string;
  merkleProof: string[];
}

export class BlockchainService {
  private static config: BlockchainConfig;
  private static publicClient: any;
  private static walletClient: any;

  /**
   * Get public client for reading blockchain data
   */
  static getPublicClient() {
    return this.publicClient;
  }

  /**
   * Initialize blockchain service
   */
  static initialize(config: BlockchainConfig): void {
    this.config = config;
    
    // Create public client for reading
    this.publicClient = createPublicClient({
      chain: config.chainId === 8453 ? base : baseSepolia,
      transport: http(config.rpcUrl)
    });

    // Create wallet client for transactions
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);
    this.walletClient = createWalletClient({
      account,
      chain: config.chainId === 8453 ? base : baseSepolia,
      transport: http(config.rpcUrl)
    });
  }

  /**
   * Fund campaign in escrow contract
   */
  static async fundCampaign(campaignId: string, amount: string): Promise<CampaignFunding> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Convert amount to wei (USDC has 6 decimals)
      const amountWei = parseEther(amount);

      // Call fundCampaign on AdEscrow contract
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'fundCampaign',
        args: [BigInt(campaignId), amountWei]
      });

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      const funding: CampaignFunding = {
        campaignId,
        amount,
        transactionHash: hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString()
      };

      // Update campaign status
      campaign.status = 'active';
      await campaign.save();

      return funding;

    } catch (error) {
      console.error('Campaign funding failed:', error);
      throw error;
    }
  }

  /**
   * Activate campaign
   */
  static async activateCampaign(campaignId: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'activateCampaign',
        args: [BigInt(campaignId)]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Update campaign status
      await Campaign.findByIdAndUpdate(campaignId, { status: 'active' });

      return hash;

    } catch (error) {
      console.error('Campaign activation failed:', error);
      throw error;
    }
  }

  /**
   * Record campaign spend
   */
  static async recordSpend(campaignId: string, amount: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'recordSpend',
        args: [BigInt(campaignId), parseEther(amount)]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Update campaign spent amount
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        campaign.spent = (parseFloat(campaign.spent || '0') + parseFloat(amount)).toString();
        await campaign.save();
      }

      return hash;

    } catch (error) {
      console.error('Spend recording failed:', error);
      throw error;
    }
  }

  /**
   * Complete campaign and process refunds
   */
  static async completeCampaign(campaignId: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'completeCampaign',
        args: [BigInt(campaignId)]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Update campaign status
      await Campaign.findByIdAndUpdate(campaignId, { status: 'completed' });

      return hash;

    } catch (error) {
      console.error('Campaign completion failed:', error);
      throw error;
    }
  }

  /**
   * Generate payout cycle with Merkle tree
   */
  static async generatePayoutCycle(): Promise<{
    cycleId: string;
    merkleRoot: string;
    totalAmount: string;
    hostCount: number;
  }> {
    try {
      // Get all hosts with pending earnings
      const hosts = await Host.find({
        pendingEarnings: { $gt: 0 }
      });

      if (hosts.length === 0) {
        throw new Error('No pending payouts');
      }

      // Create payout data for Merkle tree
      const payouts = hosts.map(host => ({
        hostId: host._id.toString(),
        amount: host.pendingEarnings.toString()
      }));

      // Generate Merkle tree (placeholder)
      // const merkleTree = new PayoutMerkleTree(payouts);
      const merkleRoot = '0x' + '0'.repeat(64); // Placeholder

      // Create payout cycle on blockchain
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddresses.merkleDistributor as `0x${string}`,
        abi: this.getMerkleDistributorABI(),
        functionName: 'createPayoutCycle',
        args: [
          merkleRoot as `0x${string}`,
          parseEther(payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0).toString()),
          BigInt(hosts.length)
        ]
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Get cycle ID from events
      const cycleId = receipt.logs[0]?.topics[1] || '0';

      return {
        cycleId,
        merkleRoot,
        totalAmount: payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0).toString(),
        hostCount: hosts.length
      };

    } catch (error) {
      console.error('Payout cycle generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Merkle proof for host payout
   */
  static async generatePayoutProof(hostId: string, amount: string): Promise<PayoutData> {
    try {
      // Get all hosts with pending earnings
      const hosts = await Host.find({
        pendingEarnings: { $gt: 0 }
      });

      const payouts = hosts.map(host => ({
        hostId: host._id.toString(),
        amount: host.pendingEarnings.toString()
      }));

      // Generate Merkle tree (placeholder)
      // const merkleTree = new PayoutMerkleTree(payouts);
      // const merkleProof = merkleTree.getProof(hostId, amount);
      const merkleProof: string[] = []; // Placeholder

      return {
        hostId,
        amount,
        merkleProof
      };

    } catch (error) {
      console.error('Payout proof generation failed:', error);
      throw error;
    }
  }

  /**
   * Get campaign details from blockchain
   */
  static async getCampaignDetails(campaignId: string): Promise<any> {
    try {
      const campaign = await this.publicClient.readContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'getCampaign',
        args: [BigInt(campaignId)]
      });

      return {
        advertiser: campaign.advertiser,
        budget: formatEther(campaign.budget),
        spent: formatEther(campaign.spent),
        startTime: new Date(Number(campaign.startTime) * 1000),
        endTime: new Date(Number(campaign.endTime) * 1000),
        isActive: campaign.isActive,
        isCompleted: campaign.isCompleted
      };

    } catch (error) {
      console.error('Failed to get campaign details:', error);
      throw error;
    }
  }

  /**
   * Check if campaign is expired
   */
  static async isCampaignExpired(campaignId: string): Promise<boolean> {
    try {
      const isExpired = await this.publicClient.readContract({
        address: this.config.contractAddresses.adEscrow as `0x${string}`,
        abi: this.getAdEscrowABI(),
        functionName: 'isCampaignExpired',
        args: [BigInt(campaignId)]
      });

      return isExpired;

    } catch (error) {
      console.error('Failed to check campaign expiration:', error);
      return false;
    }
  }

  /**
   * Get USDC balance for address
   */
  static async getUSDCBalance(address: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.config.contractAddresses.usdc as `0x${string}`,
        abi: this.getUSDCABI(),
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });

      return formatEther(balance);

    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      return '0';
    }
  }

  /**
   * Get AdEscrow contract ABI
   */
  private static getAdEscrowABI(): any[] {
    return [
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}, {"name": "amount", "type": "uint256"}],
        "name": "fundCampaign",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}],
        "name": "activateCampaign",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}, {"name": "amount", "type": "uint256"}],
        "name": "recordSpend",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}],
        "name": "completeCampaign",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}],
        "name": "getCampaign",
        "outputs": [{"components": [{"name": "advertiser", "type": "address"}, {"name": "budget", "type": "uint256"}, {"name": "spent", "type": "uint256"}, {"name": "startTime", "type": "uint256"}, {"name": "endTime", "type": "uint256"}, {"name": "isActive", "type": "bool"}, {"name": "isCompleted", "type": "bool"}], "name": "", "type": "tuple"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "campaignId", "type": "uint256"}],
        "name": "isCampaignExpired",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  /**
   * Get MerkleDistributor contract ABI
   */
  private static getMerkleDistributorABI(): any[] {
    return [
      {
        "inputs": [{"name": "merkleRoot", "type": "bytes32"}, {"name": "totalAmount", "type": "uint256"}, {"name": "hostCount", "type": "uint256"}],
        "name": "createPayoutCycle",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "cycleId", "type": "uint256"}, {"name": "amount", "type": "uint256"}, {"name": "proof", "type": "bytes32[]"}],
        "name": "claimEarnings",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  /**
   * Get USDC contract ABI
   */
  private static getUSDCABI(): any[] {
    return [
      {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }
}
