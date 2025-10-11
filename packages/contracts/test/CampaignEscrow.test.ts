import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CampaignEscrow, MockUSDC } from "../typechain-types";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("CampaignEscrow", function () {
  let campaignEscrow: CampaignEscrow;
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let advertiser: SignerWithAddress;
  let host1: SignerWithAddress;
  let host2: SignerWithAddress;
  let host3: SignerWithAddress;
  let feeCollector: SignerWithAddress;

  const INITIAL_FUND = ethers.utils.parseUnits("1000", 6); // 1000 USDC
  const EPOCH_ALLOCATION = ethers.utils.parseUnits("100", 6); // 100 USDC per epoch

  beforeEach(async function () {
    [owner, advertiser, host1, host2, host3, feeCollector] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();

    // Deploy CampaignEscrow
    const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow");
    campaignEscrow = await CampaignEscrow.deploy(mockUSDC.address, feeCollector.address);
    await campaignEscrow.deployed();

    // Mint USDC to advertiser
    await mockUSDC.mint(advertiser.address, ethers.utils.parseUnits("10000", 6));
    
    // Approve CampaignEscrow to spend advertiser's USDC
    await mockUSDC.connect(advertiser).approve(campaignEscrow.address, ethers.constants.MaxUint256);
  });

  describe("Campaign Management", function () {
    it("Should create and fund a campaign", async function () {
      const tx = await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === "CampaignCreated");
      expect(event).to.not.be.undefined;
      
      const campaignId = event!.args!.campaignId;
      expect(campaignId).to.equal(0);

      const campaign = await campaignEscrow.getCampaign(campaignId);
      expect(campaign.advertiser).to.equal(advertiser.address);
      expect(campaign.fundedAmount).to.equal(INITIAL_FUND);
      expect(campaign.remainingAmount).to.equal(INITIAL_FUND);
      expect(campaign.active).to.be.true;
    });

    it("Should allow funding an existing campaign", async function () {
      await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      
      const additionalFund = ethers.utils.parseUnits("500", 6);
      await campaignEscrow.connect(advertiser).fundCampaign(0, additionalFund);
      
      const campaign = await campaignEscrow.getCampaign(0);
      expect(campaign.fundedAmount).to.equal(INITIAL_FUND.add(additionalFund));
      expect(campaign.remainingAmount).to.equal(INITIAL_FUND.add(additionalFund));
    });
  });

  describe("Epoch Management", function () {
    let campaignId: number;
    let merkleTree: MerkleTree;
    let payouts: { index: number; account: string; amount: ethers.BigNumber }[];

    beforeEach(async function () {
      // Create campaign
      const tx = await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      const receipt = await tx.wait();
      campaignId = receipt.events![0].args!.campaignId.toNumber();

      // Setup payouts
      payouts = [
        { index: 0, account: host1.address, amount: ethers.utils.parseUnits("50", 6) },
        { index: 1, account: host2.address, amount: ethers.utils.parseUnits("30", 6) },
        { index: 2, account: host3.address, amount: ethers.utils.parseUnits("20", 6) },
      ];

      // Build merkle tree
      const leaves = payouts.map(p => 
        keccak256(ethers.utils.solidityPack(
          ["uint256", "address", "uint256"],
          [p.index, p.account, p.amount]
        ))
      );
      merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    });

    it("Should finalize an epoch", async function () {
      const epoch = 1;
      const root = merkleTree.getHexRoot();
      const allocatedAmount = EPOCH_ALLOCATION;

      await campaignEscrow.connect(owner).finalizeEpoch(
        campaignId,
        epoch,
        root,
        allocatedAmount
      );

      const epochData = await campaignEscrow.getEpoch(campaignId, epoch);
      expect(epochData.merkleRoot).to.equal(root);
      expect(epochData.finalized).to.be.true;

      // Check platform fee was deducted
      const platformFee = allocatedAmount.mul(200).div(10000); // 2%
      const netAmount = allocatedAmount.sub(platformFee);
      expect(epochData.allocatedAmount).to.equal(netAmount);
    });

    it("Should prevent double finalization", async function () {
      const epoch = 1;
      const root = merkleTree.getHexRoot();

      await campaignEscrow.connect(owner).finalizeEpoch(
        campaignId,
        epoch,
        root,
        EPOCH_ALLOCATION
      );

      await expect(
        campaignEscrow.connect(owner).finalizeEpoch(
          campaignId,
          epoch,
          root,
          EPOCH_ALLOCATION
        )
      ).to.be.revertedWithCustomError(campaignEscrow, "EpochAlreadyFinalized");
    });
  });

  describe("Claiming", function () {
    let campaignId: number;
    let epoch: number;
    let merkleTree: MerkleTree;
    let payouts: { index: number; account: string; amount: ethers.BigNumber }[];
    let leaves: Buffer[];

    beforeEach(async function () {
      // Create and finalize epoch
      const tx = await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      const receipt = await tx.wait();
      campaignId = receipt.events![0].args!.campaignId.toNumber();
      epoch = 1;

      // Setup payouts
      payouts = [
        { index: 0, account: host1.address, amount: ethers.utils.parseUnits("50", 6) },
        { index: 1, account: host2.address, amount: ethers.utils.parseUnits("30", 6) },
        { index: 2, account: host3.address, amount: ethers.utils.parseUnits("20", 6) },
      ];

      // Build merkle tree
      leaves = payouts.map(p => 
        keccak256(ethers.utils.solidityPack(
          ["uint256", "address", "uint256"],
          [p.index, p.account, p.amount]
        ))
      );
      merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      // Finalize epoch
      await campaignEscrow.connect(owner).finalizeEpoch(
        campaignId,
        epoch,
        merkleTree.getHexRoot(),
        EPOCH_ALLOCATION
      );
    });

    it("Should allow single claim with valid proof", async function () {
      const payout = payouts[0];
      const proof = merkleTree.getHexProof(leaves[0]);

      const balanceBefore = await mockUSDC.balanceOf(host1.address);
      
      await campaignEscrow.claim(
        campaignId,
        epoch,
        payout.index,
        payout.account,
        payout.amount,
        proof
      );

      const balanceAfter = await mockUSDC.balanceOf(host1.address);
      expect(balanceAfter.sub(balanceBefore)).to.equal(payout.amount);

      // Check claimed status
      expect(await campaignEscrow.isClaimed(campaignId, epoch, payout.index)).to.be.true;
    });

    it("Should allow bulk claims", async function () {
      const claims = payouts.map((p, i) => ({
        index: p.index,
        account: p.account,
        amount: p.amount,
        proof: merkleTree.getHexProof(leaves[i])
      }));

      const balancesBefore = await Promise.all([
        mockUSDC.balanceOf(host1.address),
        mockUSDC.balanceOf(host2.address),
        mockUSDC.balanceOf(host3.address),
      ]);

      await campaignEscrow.bulkClaim(campaignId, epoch, claims);

      const balancesAfter = await Promise.all([
        mockUSDC.balanceOf(host1.address),
        mockUSDC.balanceOf(host2.address),
        mockUSDC.balanceOf(host3.address),
      ]);

      expect(balancesAfter[0].sub(balancesBefore[0])).to.equal(payouts[0].amount);
      expect(balancesAfter[1].sub(balancesBefore[1])).to.equal(payouts[1].amount);
      expect(balancesAfter[2].sub(balancesBefore[2])).to.equal(payouts[2].amount);

      // Check all are claimed
      expect(await campaignEscrow.isClaimed(campaignId, epoch, 0)).to.be.true;
      expect(await campaignEscrow.isClaimed(campaignId, epoch, 1)).to.be.true;
      expect(await campaignEscrow.isClaimed(campaignId, epoch, 2)).to.be.true;
    });

    it("Should prevent double claiming", async function () {
      const payout = payouts[0];
      const proof = merkleTree.getHexProof(leaves[0]);

      await campaignEscrow.claim(
        campaignId,
        epoch,
        payout.index,
        payout.account,
        payout.amount,
        proof
      );

      await expect(
        campaignEscrow.claim(
          campaignId,
          epoch,
          payout.index,
          payout.account,
          payout.amount,
          proof
        )
      ).to.be.revertedWithCustomError(campaignEscrow, "AlreadyClaimed");
    });

    it("Should reject invalid proof", async function () {
      const payout = payouts[0];
      const wrongProof = merkleTree.getHexProof(leaves[1]); // Using wrong proof

      await expect(
        campaignEscrow.claim(
          campaignId,
          epoch,
          payout.index,
          payout.account,
          payout.amount,
          wrongProof
        )
      ).to.be.revertedWithCustomError(campaignEscrow, "InvalidProof");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await campaignEscrow.connect(owner).setPlatformFeeRate(500); // 5%
      expect(await campaignEscrow.platformFeeRate()).to.equal(500);
    });

    it("Should prevent non-owner from updating platform fee", async function () {
      await expect(
        campaignEscrow.connect(advertiser).setPlatformFeeRate(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to pause contract", async function () {
      await campaignEscrow.connect(owner).pause();
      expect(await campaignEscrow.paused()).to.be.true;

      // Claims should fail when paused
      await expect(
        campaignEscrow.bulkClaim(0, 0, [])
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to update batch size", async function () {
      await campaignEscrow.connect(owner).setMaxBatchSize(200);
      expect(await campaignEscrow.maxBatchSize()).to.equal(200);
    });
  });

  describe("Withdrawal", function () {
    it("Should allow advertiser to withdraw surplus", async function () {
      const tx = await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      const receipt = await tx.wait();
      const campaignId = receipt.events![0].args!.campaignId.toNumber();

      const balanceBefore = await mockUSDC.balanceOf(advertiser.address);
      
      await campaignEscrow.connect(advertiser).withdrawSurplus(campaignId, advertiser.address);
      
      const balanceAfter = await mockUSDC.balanceOf(advertiser.address);
      expect(balanceAfter.sub(balanceBefore)).to.equal(INITIAL_FUND);

      const campaign = await campaignEscrow.getCampaign(campaignId);
      expect(campaign.remainingAmount).to.equal(0);
      expect(campaign.active).to.be.false;
    });

    it("Should prevent non-advertiser from withdrawing", async function () {
      const tx = await campaignEscrow.connect(advertiser).createAndFundCampaign(INITIAL_FUND);
      const receipt = await tx.wait();
      const campaignId = receipt.events![0].args!.campaignId.toNumber();

      await expect(
        campaignEscrow.connect(host1).withdrawSurplus(campaignId, host1.address)
      ).to.be.revertedWithCustomError(campaignEscrow, "UnauthorizedCaller");
    });
  });
});




