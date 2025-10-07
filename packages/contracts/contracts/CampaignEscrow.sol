// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title CampaignEscrow
 * @notice Manages advertising campaigns with hourly Merkle tree-based payouts
 */
contract CampaignEscrow is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Campaign {
        address advertiser;
        uint256 fundedAmount;
        uint256 remainingAmount;
        uint256 createdAt;
        bool active;
    }

    struct Epoch {
        bytes32 merkleRoot;
        uint256 allocatedAmount;
        uint256 claimedAmount;
        uint256 finalizedAt;
        bool finalized;
    }

    struct Claim {
        uint256 index;
        address account;
        uint256 amount;
        bytes32[] proof;
    }

    // ============ State Variables ============

    IERC20 public immutable paymentToken; // USDC
    uint256 public nextCampaignId;
    uint256 public platformFeeRate = 200; // 2% in basis points
    address public feeCollector;
    uint256 public maxBatchSize = 100;
    uint256 public constant EPOCH_DURATION = 1 hours;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => Epoch)) public epochs; // campaignId => epoch => Epoch
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) public claimed; // campaignId => epoch => index => claimed

    // ============ Events ============

    event CampaignCreated(uint256 indexed campaignId, address indexed advertiser, uint256 fundedAmount);
    event CampaignFunded(uint256 indexed campaignId, uint256 amount);
    event EpochFinalized(uint256 indexed campaignId, uint256 indexed epoch, bytes32 merkleRoot, uint256 allocatedAmount);
    event BulkClaimed(uint256 indexed campaignId, uint256 indexed epoch, uint256 numClaims, uint256 totalPaid);
    event Claimed(uint256 indexed campaignId, uint256 indexed epoch, uint256 index, address account, uint256 amount);
    event SurplusWithdrawn(uint256 indexed campaignId, uint256 amount, address to);
    event PlatformFeeUpdated(uint256 newRate);
    event FeeCollectorUpdated(address newCollector);
    event MaxBatchSizeUpdated(uint256 newSize);

    // ============ Errors ============

    error InvalidAmount();
    error CampaignNotActive();
    error InsufficientFunds();
    error EpochAlreadyFinalized();
    error EpochNotFinalized();
    error InvalidProof();
    error AlreadyClaimed();
    error BatchSizeTooLarge();
    error InvalidEpoch();
    error UnauthorizedCaller();
    error InvalidFeeRate();
    error InvalidAddress();

    // ============ Constructor ============

    constructor(address _paymentToken, address _feeCollector) {
        if (_paymentToken == address(0) || _feeCollector == address(0)) revert InvalidAddress();
        paymentToken = IERC20(_paymentToken);
        feeCollector = _feeCollector;
    }

    // ============ Campaign Management ============

    /**
     * @notice Create and fund a new campaign
     * @param amount Initial funding amount
     * @return campaignId The ID of the created campaign
     */
    function createAndFundCampaign(uint256 amount) external returns (uint256 campaignId) {
        if (amount == 0) revert InvalidAmount();

        campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            advertiser: msg.sender,
            fundedAmount: amount,
            remainingAmount: amount,
            createdAt: block.timestamp,
            active: true
        });

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        emit CampaignCreated(campaignId, msg.sender, amount);
    }

    /**
     * @notice Fund an existing campaign
     * @param campaignId Campaign to fund
     * @param amount Amount to add
     */
    function fundCampaign(uint256 campaignId, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        Campaign storage campaign = campaigns[campaignId];
        if (!campaign.active) revert CampaignNotActive();
        if (campaign.advertiser != msg.sender) revert UnauthorizedCaller();

        campaign.fundedAmount += amount;
        campaign.remainingAmount += amount;

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        emit CampaignFunded(campaignId, amount);
    }

    // ============ Epoch Management ============

    /**
     * @notice Finalize an epoch with merkle root and allocated amount
     * @param campaignId Campaign ID
     * @param epoch Epoch number (hour-based)
     * @param merkleRoot Merkle root of payouts
     * @param allocatedAmount Total amount allocated for this epoch
     */
    function finalizeEpoch(
        uint256 campaignId,
        uint256 epoch,
        bytes32 merkleRoot,
        uint256 allocatedAmount
    ) external onlyOwner {
        Campaign storage campaign = campaigns[campaignId];
        if (!campaign.active) revert CampaignNotActive();
        
        Epoch storage epochData = epochs[campaignId][epoch];
        if (epochData.finalized) revert EpochAlreadyFinalized();
        if (allocatedAmount > campaign.remainingAmount) revert InsufficientFunds();

        // Calculate platform fee
        uint256 platformFee = (allocatedAmount * platformFeeRate) / 10000;
        uint256 netAmount = allocatedAmount - platformFee;

        // Update campaign remaining amount
        campaign.remainingAmount -= allocatedAmount;

        // Store epoch data
        epochData.merkleRoot = merkleRoot;
        epochData.allocatedAmount = netAmount;
        epochData.finalizedAt = block.timestamp;
        epochData.finalized = true;

        // Transfer platform fee
        if (platformFee > 0 && feeCollector != address(0)) {
            paymentToken.safeTransfer(feeCollector, platformFee);
        }

        emit EpochFinalized(campaignId, epoch, merkleRoot, netAmount);
    }

    // ============ Claiming ============

    /**
     * @notice Process multiple claims in a single transaction
     * @param campaignId Campaign ID
     * @param epoch Epoch number
     * @param claims Array of claims to process
     */
    function bulkClaim(
        uint256 campaignId,
        uint256 epoch,
        Claim[] calldata claims
    ) external nonReentrant whenNotPaused {
        if (claims.length > maxBatchSize) revert BatchSizeTooLarge();
        
        Epoch storage epochData = epochs[campaignId][epoch];
        if (!epochData.finalized) revert EpochNotFinalized();

        uint256 totalPaid = 0;
        
        for (uint256 i = 0; i < claims.length; i++) {
            Claim calldata claimData = claims[i];
            
            // Skip if already claimed
            if (claimed[campaignId][epoch][claimData.index]) continue;
            
            // Verify merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(claimData.index, claimData.account, claimData.amount));
            if (!MerkleProof.verify(claimData.proof, epochData.merkleRoot, leaf)) {
                revert InvalidProof();
            }
            
            // Mark as claimed
            claimed[campaignId][epoch][claimData.index] = true;
            
            // Transfer payment
            paymentToken.safeTransfer(claimData.account, claimData.amount);
            totalPaid += claimData.amount;
            
            emit Claimed(campaignId, epoch, claimData.index, claimData.account, claimData.amount);
        }
        
        epochData.claimedAmount += totalPaid;
        emit BulkClaimed(campaignId, epoch, claims.length, totalPaid);
    }

    /**
     * @notice Single claim for backward compatibility
     */
    function claim(
        uint256 campaignId,
        uint256 epoch,
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata proof
    ) external nonReentrant whenNotPaused {
        Epoch storage epochData = epochs[campaignId][epoch];
        if (!epochData.finalized) revert EpochNotFinalized();
        if (claimed[campaignId][epoch][index]) revert AlreadyClaimed();

        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        if (!MerkleProof.verify(proof, epochData.merkleRoot, leaf)) {
            revert InvalidProof();
        }

        // Mark as claimed
        claimed[campaignId][epoch][index] = true;
        epochData.claimedAmount += amount;

        // Transfer payment
        paymentToken.safeTransfer(account, amount);
        
        emit Claimed(campaignId, epoch, index, account, amount);
    }

    // ============ Campaign Withdrawal ============

    /**
     * @notice Withdraw surplus funds from a campaign
     * @param campaignId Campaign ID
     * @param to Recipient address
     */
    function withdrawSurplus(uint256 campaignId, address to) external {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.advertiser != msg.sender) revert UnauthorizedCaller();
        
        uint256 surplus = campaign.remainingAmount;
        if (surplus == 0) revert InvalidAmount();
        
        campaign.remainingAmount = 0;
        campaign.active = false;
        
        paymentToken.safeTransfer(to, surplus);
        emit SurplusWithdrawn(campaignId, surplus, to);
    }

    // ============ Admin Functions ============

    function setPlatformFeeRate(uint256 _rate) external onlyOwner {
        if (_rate > 1000) revert InvalidFeeRate(); // Max 10%
        platformFeeRate = _rate;
        emit PlatformFeeUpdated(_rate);
    }

    function setFeeCollector(address _collector) external onlyOwner {
        if (_collector == address(0)) revert InvalidAddress();
        feeCollector = _collector;
        emit FeeCollectorUpdated(_collector);
    }

    function setMaxBatchSize(uint256 _size) external onlyOwner {
        if (_size == 0 || _size > 500) revert InvalidAmount();
        maxBatchSize = _size;
        emit MaxBatchSizeUpdated(_size);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getCurrentEpoch() public view returns (uint256) {
        return block.timestamp / EPOCH_DURATION;
    }

    function getEpochStartTime(uint256 epoch) public pure returns (uint256) {
        return epoch * EPOCH_DURATION;
    }

    function isClaimed(uint256 campaignId, uint256 epoch, uint256 index) public view returns (bool) {
        return claimed[campaignId][epoch][index];
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function getEpoch(uint256 campaignId, uint256 epoch) external view returns (Epoch memory) {
        return epochs[campaignId][epoch];
    }
}
