import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AdEscrow, MerkleDistributor } from '../typechain-types';

describe('Farcaster Ad Rental Contracts', function () {
  let adEscrow: AdEscrow;
  let merkleDistributor: MerkleDistributor;
  let owner: any;
  let advertiser: any;
  let host: any;
  let usdc: any;

  beforeEach(async function () {
    [owner, advertiser, host] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    usdc = await MockUSDC.deploy();

    // Deploy AdEscrow contract
    const AdEscrow = await ethers.getContractFactory('AdEscrow');
    adEscrow = await AdEscrow.deploy(usdc.address, owner.address);

    // Deploy MerkleDistributor contract
    const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor');
    merkleDistributor = await MerkleDistributor.deploy(usdc.address, owner.address);

    // Mint USDC to advertiser
    await usdc.mint(advertiser.address, ethers.parseEther('10000'));
  });

  describe('AdEscrow', function () {
    it('Should create a campaign', async function () {
      const budget = ethers.parseEther('100');
      const duration = 86400; // 1 day

      const tx = await adEscrow.connect(advertiser).createCampaign(budget, duration);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;
      
      const campaign = await adEscrow.getCampaign(1);
      expect(campaign.advertiser).to.equal(advertiser.address);
      expect(campaign.budget).to.equal(budget);
    });

    it('Should fund a campaign', async function () {
      const budget = ethers.parseEther('100');
      const duration = 86400;
      const fundAmount = ethers.parseEther('50');

      // Create campaign
      await adEscrow.connect(advertiser).createCampaign(budget, duration);

      // Approve USDC transfer
      await usdc.connect(advertiser).approve(adEscrow.address, fundAmount);

      // Fund campaign
      const tx = await adEscrow.connect(advertiser).fundCampaign(1, fundAmount);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;
      
      const campaign = await adEscrow.getCampaign(1);
      expect(campaign.budget).to.equal(budget + fundAmount);
    });

    it('Should activate a funded campaign', async function () {
      const budget = ethers.parseEther('100');
      const duration = 86400;
      const fundAmount = ethers.parseEther('50');

      // Create and fund campaign
      await adEscrow.connect(advertiser).createCampaign(budget, duration);
      await usdc.connect(advertiser).approve(adEscrow.address, fundAmount);
      await adEscrow.connect(advertiser).fundCampaign(1, fundAmount);

      // Activate campaign
      const tx = await adEscrow.connect(advertiser).activateCampaign(1);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;
      
      const campaign = await adEscrow.getCampaign(1);
      expect(campaign.isActive).to.be.true;
    });
  });

  describe('MerkleDistributor', function () {
    it('Should create a payout cycle', async function () {
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes('test'));
      const totalAmount = ethers.parseEther('1000');
      const hostCount = 10;

      const tx = await merkleDistributor.createPayoutCycle(merkleRoot, totalAmount, hostCount);
      const receipt = await tx.wait();

      expect(receipt).to.not.be.null;
      
      const cycle = await merkleDistributor.getPayoutCycle(1);
      expect(cycle.merkleRoot).to.equal(merkleRoot);
      expect(cycle.totalAmount).to.equal(totalAmount);
      expect(cycle.hostCount).to.equal(hostCount);
    });

    it('Should calculate platform fee correctly', async function () {
      const amount = ethers.parseEther('100');
      const expectedFee = ethers.parseEther('5'); // 5% fee

      const fee = await merkleDistributor.calculatePlatformFee(amount);
      expect(fee).to.equal(expectedFee);
    });

    it('Should calculate host earnings correctly', async function () {
      const amount = ethers.parseEther('100');
      const expectedEarnings = ethers.parseEther('95'); // 100 - 5% fee

      const earnings = await merkleDistributor.calculateHostEarnings(amount);
      expect(earnings).to.equal(expectedEarnings);
    });
  });
});
