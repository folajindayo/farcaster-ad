import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying Farcaster Ad Rental contracts...');

  // Get the contract factories
  const AdEscrow = await ethers.getContractFactory('AdEscrow');
  const CampaignEscrow = await ethers.getContractFactory('CampaignEscrow');
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);

  // USDC address on Base (replace with actual USDC address)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  
  // Platform wallet (replace with actual platform wallet)
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;

  console.log('💰 USDC Address:', USDC_ADDRESS);
  console.log('🏢 Platform Wallet:', PLATFORM_WALLET);

  // Deploy AdEscrow contract
  console.log('📦 Deploying AdEscrow...');
  const adEscrow = await AdEscrow.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await adEscrow.waitForDeployment();
  const adEscrowAddress = await adEscrow.getAddress();
  console.log('✅ AdEscrow deployed to:', adEscrowAddress);

  // Deploy CampaignEscrow contract
  console.log('📦 Deploying CampaignEscrow...');
  const campaignEscrow = await CampaignEscrow.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await campaignEscrow.waitForDeployment();
  const campaignEscrowAddress = await campaignEscrow.getAddress();
  console.log('✅ CampaignEscrow deployed to:', campaignEscrowAddress);

  // Deploy MerkleDistributor contract
  console.log('📦 Deploying MerkleDistributor...');
  const merkleDistributor = await MerkleDistributor.deploy(USDC_ADDRESS, PLATFORM_WALLET);
  await merkleDistributor.waitForDeployment();
  const merkleDistributorAddress = await merkleDistributor.getAddress();
  console.log('✅ MerkleDistributor deployed to:', merkleDistributorAddress);

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    adEscrow: {
      address: adEscrowAddress,
      abi: AdEscrow.interface.format('json')
    },
    campaignEscrow: {
      address: campaignEscrowAddress,
      abi: CampaignEscrow.interface.format('json')
    },
    merkleDistributor: {
      address: merkleDistributorAddress,
      abi: MerkleDistributor.interface.format('json')
    },
    usdc: USDC_ADDRESS,
    platformWallet: PLATFORM_WALLET,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log('📋 Deployment Summary:');
  console.log('Network:', deploymentInfo.network.name, `(${deploymentInfo.network.chainId})`);
  console.log('AdEscrow:', adEscrowAddress);
  console.log('CampaignEscrow:', campaignEscrowAddress);
  console.log('MerkleDistributor:', merkleDistributorAddress);
  console.log('USDC:', USDC_ADDRESS);
  console.log('Platform Wallet:', PLATFORM_WALLET);

  // Verify contracts if on mainnet/testnet
  if (deploymentInfo.network.chainId !== 31337n) {
    console.log('🔍 Verifying contracts...');
    try {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      await hre.run('verify:verify', {
        address: adEscrowAddress,
        constructorArguments: [USDC_ADDRESS, PLATFORM_WALLET],
      });
      console.log('✅ AdEscrow verified');
    } catch (error) {
      console.log('❌ AdEscrow verification failed:', error);
    }

    try {
      await hre.run('verify:verify', {
        address: campaignEscrowAddress,
        constructorArguments: [USDC_ADDRESS, PLATFORM_WALLET],
      });
      console.log('✅ CampaignEscrow verified');
    } catch (error) {
      console.log('❌ CampaignEscrow verification failed:', error);
    }

    try {
      await hre.run('verify:verify', {
        address: merkleDistributorAddress,
        constructorArguments: [USDC_ADDRESS, PLATFORM_WALLET],
      });
      console.log('✅ MerkleDistributor verified');
    } catch (error) {
      console.log('❌ MerkleDistributor verification failed:', error);
    }
  }

  console.log('🎉 Deployment completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
