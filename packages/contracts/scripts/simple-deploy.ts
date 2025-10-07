import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying Farcaster Ad Rental contracts...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    throw new Error('No deployer account found. Please check your network configuration.');
  }
  
  console.log('📝 Deploying contracts with account:', deployer.address);
  console.log('💰 Account balance:', (await deployer.provider.getBalance(deployer.address)).toString());

  // USDC address on Base
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const PLATFORM_WALLET = deployer.address;

  console.log('💰 USDC Address:', USDC_ADDRESS);
  console.log('🏢 Platform Wallet:', PLATFORM_WALLET);

  // Deploy AdEscrow contract
  console.log('📦 Deploying AdEscrow...');
  const AdEscrow = await ethers.getContractFactory('AdEscrow');
  const adEscrow = await AdEscrow.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await adEscrow.waitForDeployment();
  const adEscrowAddress = await adEscrow.getAddress();
  console.log('✅ AdEscrow deployed to:', adEscrowAddress);

  // Deploy CampaignEscrow contract
  console.log('📦 Deploying CampaignEscrow...');
  const CampaignEscrow = await ethers.getContractFactory('CampaignEscrow');
  const campaignEscrow = await CampaignEscrow.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await campaignEscrow.waitForDeployment();
  const campaignEscrowAddress = await campaignEscrow.getAddress();
  console.log('✅ CampaignEscrow deployed to:', campaignEscrowAddress);

  // Deploy MerkleDistributor contract
  console.log('📦 Deploying MerkleDistributor...');
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor');
  const merkleDistributor = await MerkleDistributor.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await merkleDistributor.waitForDeployment();
  const merkleDistributorAddress = await merkleDistributor.getAddress();
  console.log('✅ MerkleDistributor deployed to:', merkleDistributorAddress);

  console.log('📋 Deployment Summary:');
  console.log('AdEscrow:', adEscrowAddress);
  console.log('CampaignEscrow:', campaignEscrowAddress);
  console.log('MerkleDistributor:', merkleDistributorAddress);
  console.log('USDC:', USDC_ADDRESS);
  console.log('Platform Wallet:', PLATFORM_WALLET);

  console.log('🎉 Deployment completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });


