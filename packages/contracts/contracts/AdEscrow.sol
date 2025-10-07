// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdEscrow
 * @dev Handles USDC deposits for campaigns and releases funds when campaigns complete
 */
contract AdEscrow is ReentrancyGuard, Ownable {
    IERC20 public immutable usdc;
    
    struct Campaign {
        address advertiser;
        uint256 budget;
        uint256 spent;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isCompleted;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint256) public advertiserBalances;
    
    uint256 public nextCampaignId = 1;
    uint256 public platformFeePercentage = 5; // 5% platform fee
    address public platformWallet;
    
    event CampaignCreated(uint256 indexed campaignId, address indexed advertiser, uint256 budget);
    event CampaignFunded(uint256 indexed campaignId, uint256 amount);
    event CampaignSpent(uint256 indexed campaignId, uint256 amount);
    event CampaignCompleted(uint256 indexed campaignId, uint256 refundAmount);
    event PlatformFeeCollected(uint256 amount);
    
    constructor(address _usdc, address _platformWallet) {
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create a new campaign
     */
    function createCampaign(
        uint256 _budget,
        uint256 _duration
    ) external returns (uint256) {
        require(_budget > 0, "Budget must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign({
            advertiser: msg.sender,
            budget: _budget,
            spent: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: false,
            isCompleted: false
        });
        
        emit CampaignCreated(campaignId, msg.sender, _budget);
        return campaignId;
    }
    
    /**
     * @dev Fund a campaign with USDC
     */
    function fundCampaign(uint256 _campaignId, uint256 _amount) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.advertiser == msg.sender, "Only advertiser can fund campaign");
        require(!campaign.isCompleted, "Campaign is completed");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC from advertiser to contract
        require(usdc.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        campaign.budget += _amount;
        advertiserBalances[msg.sender] += _amount;
        
        emit CampaignFunded(_campaignId, _amount);
    }
    
    /**
     * @dev Activate a campaign (only after funding)
     */
    function activateCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.advertiser == msg.sender, "Only advertiser can activate campaign");
        require(campaign.budget > 0, "Campaign must be funded");
        require(!campaign.isActive, "Campaign is already active");
        require(!campaign.isCompleted, "Campaign is completed");
        
        campaign.isActive = true;
    }
    
    /**
     * @dev Record campaign spend (only callable by platform)
     */
    function recordSpend(uint256 _campaignId, uint256 _amount) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(!campaign.isCompleted, "Campaign is completed");
        require(campaign.spent + _amount <= campaign.budget, "Exceeds budget");
        
        campaign.spent += _amount;
        emit CampaignSpent(_campaignId, _amount);
    }
    
    /**
     * @dev Complete a campaign and handle refunds
     */
    function completeCampaign(uint256 _campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(!campaign.isCompleted, "Campaign is already completed");
        
        campaign.isActive = false;
        campaign.isCompleted = true;
        
        uint256 refundAmount = campaign.budget - campaign.spent;
        if (refundAmount > 0) {
            require(usdc.transfer(campaign.advertiser, refundAmount), "Refund transfer failed");
        }
        
        emit CampaignCompleted(_campaignId, refundAmount);
    }
    
    /**
     * @dev Emergency pause for a campaign
     */
    function pauseCampaign(uint256 _campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        
        campaign.isActive = false;
    }
    
    /**
     * @dev Resume a paused campaign
     */
    function resumeCampaign(uint256 _campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.isActive && !campaign.isCompleted, "Campaign is active or completed");
        require(block.timestamp < campaign.endTime, "Campaign has expired");
        
        campaign.isActive = true;
    }
    
    /**
     * @dev Calculate platform fee for a spend amount
     */
    function calculatePlatformFee(uint256 _amount) public view returns (uint256) {
        return (_amount * platformFeePercentage) / 100;
    }
    
    /**
     * @dev Update platform fee percentage (only owner)
     */
    function setPlatformFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 20, "Fee cannot exceed 20%");
        platformFeePercentage = _feePercentage;
    }
    
    /**
     * @dev Update platform wallet address
     */
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Get campaign details
     */
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
    
    /**
     * @dev Check if campaign is expired
     */
    function isCampaignExpired(uint256 _campaignId) external view returns (bool) {
        return block.timestamp > campaigns[_campaignId].endTime;
    }
}
