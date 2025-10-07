import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying CampaignEscrow contract...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // Contract addresses - update these based on your network
  // Base Mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  // Base Testnet (Goerli) USDC: 0x07865c6E87B9F70255377e024ace6630C1Eaa37F
  const USDC_ADDRESS = process.env.USDC_ADDRESS || 
    (network.chainId === 8453 ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" : 
     network.chainId === 84531 ? "0x07865c6E87B9F70255377e024ace6630C1Eaa37F" : 
     "");

  if (!USDC_ADDRESS) {
    // Deploy mock USDC for testing
    console.log("No USDC address provided, deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
    console.log("MockUSDC deployed to:", mockUSDC.address);
    
    // Use mock USDC address
    const usdcAddress = mockUSDC.address;
    
    // Deploy CampaignEscrow
    const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow");
    const campaignEscrow = await CampaignEscrow.deploy(
      usdcAddress,
      deployer.address // Fee collector
    );
    await campaignEscrow.deployed();
    console.log("CampaignEscrow deployed to:", campaignEscrow.address);

    // Save deployment info
    const deployment = {
      network: network.name,
      chainId: network.chainId,
      contracts: {
        MockUSDC: mockUSDC.address,
        CampaignEscrow: campaignEscrow.address,
      },
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
    };

    // Save to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentPath = path.join(
      deploymentsDir,
      `${network.chainId}-latest.json`
    );
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);

    // Mint some USDC to deployer for testing
    if (mockUSDC) {
      console.log("Minting 10,000 USDC to deployer for testing...");
      const mintAmount = ethers.utils.parseUnits("10000", 6); // 10,000 USDC
      const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
      await mintTx.wait();
      console.log("Minted successfully");
    }

  } else {
    // Deploy with real USDC address
    console.log("Using USDC at:", USDC_ADDRESS);
    
    const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow");
    const campaignEscrow = await CampaignEscrow.deploy(
      USDC_ADDRESS,
      deployer.address // Fee collector
    );
    await campaignEscrow.deployed();
    console.log("CampaignEscrow deployed to:", campaignEscrow.address);

    // Save deployment info
    const deployment = {
      network: network.name,
      chainId: network.chainId,
      contracts: {
        USDC: USDC_ADDRESS,
        CampaignEscrow: campaignEscrow.address,
      },
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
    };

    // Save to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentPath = path.join(
      deploymentsDir,
      `${network.chainId}-latest.json`
    );
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);
  }

  // Verify on Etherscan if API key is provided
  if (process.env.BASESCAN_API_KEY && network.chainId === 8453) {
    console.log("Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    console.log("Verifying contract on BaseScan...");
    try {
      await ethers.run("verify:verify", {
        address: campaignEscrow.address,
        constructorArguments: [USDC_ADDRESS, deployer.address],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }

  console.log("\n✅ Deployment complete!");
  console.log("=====================================");
  console.log("Add these to your .env file:");
  console.log(`CAMPAIGN_ESCROW_ADDRESS=${campaignEscrow.address}`);
  console.log(`USDC_ADDRESS=${USDC_ADDRESS}`);
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


