// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title MerkleDistributor
 * @dev Enables hosts to claim earnings using Merkle proofs
 */
contract MerkleDistributor is ReentrancyGuard, Ownable {
    IERC20 public immutable usdc;
    
    struct PayoutCycle {
        bytes32 merkleRoot;
        uint256 totalAmount;
        uint256 hostCount;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(uint256 => PayoutCycle) public payoutCycles;
    mapping(uint256 => mapping(address => bool)) public claimed;
    
    uint256 public nextPayoutCycleId = 1;
    address public platformWallet;
    uint256 public platformFeePercentage = 5; // 5% platform fee
    
    event PayoutCycleCreated(uint256 indexed cycleId, bytes32 merkleRoot, uint256 totalAmount, uint256 hostCount);
    event EarningsClaimed(uint256 indexed cycleId, address indexed host, uint256 amount);
    event PlatformFeeCollected(uint256 amount);
    
    constructor(address _usdc, address _platformWallet) {
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create a new payout cycle with Merkle root
     */
    function createPayoutCycle(
        bytes32 _merkleRoot,
        uint256 _totalAmount,
        uint256 _hostCount
    ) external onlyOwner {
        uint256 cycleId = nextPayoutCycleId++;
        payoutCycles[cycleId] = PayoutCycle({
            merkleRoot: _merkleRoot,
            totalAmount: _totalAmount,
            hostCount: _hostCount,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit PayoutCycleCreated(cycleId, _merkleRoot, _totalAmount, _hostCount);
    }
    
    /**
     * @dev Claim earnings for a host using Merkle proof
     */
    function claimEarnings(
        uint256 _cycleId,
        uint256 _amount,
        bytes32[] calldata _proof
    ) external nonReentrant {
        PayoutCycle storage cycle = payoutCycles[_cycleId];
        require(cycle.isActive, "Payout cycle is not active");
        require(!claimed[_cycleId][msg.sender], "Already claimed");
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));
        require(MerkleProof.verify(_proof, cycle.merkleRoot, leaf), "Invalid proof");
        
        // Calculate platform fee
        uint256 platformFee = (_amount * platformFeePercentage) / 100;
        uint256 hostAmount = _amount - platformFee;
        
        // Transfer USDC to host
        require(usdc.transfer(msg.sender, hostAmount), "Transfer failed");
        
        // Transfer platform fee to platform wallet
        if (platformFee > 0) {
            require(usdc.transfer(platformWallet, platformFee), "Platform fee transfer failed");
            emit PlatformFeeCollected(platformFee);
        }
        
        // Mark as claimed
        claimed[_cycleId][msg.sender] = true;
        
        emit EarningsClaimed(_cycleId, msg.sender, hostAmount);
    }
    
    /**
     * @dev Batch claim for multiple cycles (gas optimization)
     */
    function batchClaimEarnings(
        uint256[] calldata _cycleIds,
        uint256[] calldata _amounts,
        bytes32[][] calldata _proofs
    ) external nonReentrant {
        require(_cycleIds.length == _amounts.length, "Array length mismatch");
        require(_cycleIds.length == _proofs.length, "Array length mismatch");
        
        uint256 totalClaimed = 0;
        
        for (uint256 i = 0; i < _cycleIds.length; i++) {
            uint256 cycleId = _cycleIds[i];
            uint256 amount = _amounts[i];
            bytes32[] calldata proof = _proofs[i];
            
            PayoutCycle storage cycle = payoutCycles[cycleId];
            require(cycle.isActive, "Payout cycle is not active");
            require(!claimed[cycleId][msg.sender], "Already claimed");
            
            // Verify Merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
            require(MerkleProof.verify(proof, cycle.merkleRoot, leaf), "Invalid proof");
            
            // Calculate platform fee
            uint256 platformFee = (amount * platformFeePercentage) / 100;
            uint256 hostAmount = amount - platformFee;
            
            totalClaimed += hostAmount;
            
            // Mark as claimed
            claimed[cycleId][msg.sender] = true;
            
            emit EarningsClaimed(cycleId, msg.sender, hostAmount);
        }
        
        // Transfer total amount to host
        require(usdc.transfer(msg.sender, totalClaimed), "Transfer failed");
        
        // Transfer platform fees
        uint256 totalPlatformFee = 0;
        for (uint256 i = 0; i < _cycleIds.length; i++) {
            totalPlatformFee += (_amounts[i] * platformFeePercentage) / 100;
        }
        
        if (totalPlatformFee > 0) {
            require(usdc.transfer(platformWallet, totalPlatformFee), "Platform fee transfer failed");
            emit PlatformFeeCollected(totalPlatformFee);
        }
    }
    
    /**
     * @dev Check if a host has claimed for a specific cycle
     */
    function hasClaimed(uint256 _cycleId, address _host) external view returns (bool) {
        return claimed[_cycleId][_host];
    }
    
    /**
     * @dev Get payout cycle details
     */
    function getPayoutCycle(uint256 _cycleId) external view returns (PayoutCycle memory) {
        return payoutCycles[_cycleId];
    }
    
    /**
     * @dev Deactivate a payout cycle (emergency)
     */
    function deactivatePayoutCycle(uint256 _cycleId) external onlyOwner {
        payoutCycles[_cycleId].isActive = false;
    }
    
    /**
     * @dev Update platform fee percentage
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
     * @dev Calculate platform fee for an amount
     */
    function calculatePlatformFee(uint256 _amount) external view returns (uint256) {
        return (_amount * platformFeePercentage) / 100;
    }
    
    /**
     * @dev Calculate host earnings after platform fee
     */
    function calculateHostEarnings(uint256 _amount) external view returns (uint256) {
        uint256 platformFee = (_amount * platformFeePercentage) / 100;
        return _amount - platformFee;
    }
}
