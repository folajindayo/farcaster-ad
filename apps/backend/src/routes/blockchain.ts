import express from 'express';
import { BlockchainService } from '../services/blockchain';
// import { AppError, handleError } from '@farcaster-ad-rental/shared';
// Temporary inline implementations
class AppError extends Error {
  constructor(message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}
const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, 500, 'INTERNAL_ERROR');
  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
};

const router = express.Router();

/**
 * @swagger
 * /blockchain/campaigns/{id}/fund:
 *   post:
 *     summary: Fund campaign on blockchain
 *     tags: [Blockchain]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: string
 *                 example: "1000.00"
 *                 description: Amount in USDC to fund the campaign
 *     responses:
 *       200:
 *         description: Campaign funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     campaignId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     amount:
 *                       type: string
 *                       example: "1000.00"
 *                     transactionHash:
 *                       type: string
 *                       example: "0x1234567890abcdef..."
 *                     blockNumber:
 *                       type: number
 *                       example: 12345678
 *                     gasUsed:
 *                       type: string
 *                       example: "21000"
 *       400:
 *         description: Invalid amount or campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Blockchain transaction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Fund campaign
router.post('/campaigns/:id/fund', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      throw new AppError('Amount is required', 400, 'MISSING_AMOUNT');
    }

    const funding = await BlockchainService.fundCampaign(id, amount);

    res.json({
      success: true,
      data: {
        campaignId: id,
        amount,
        transactionHash: funding.transactionHash,
        blockNumber: funding.blockNumber,
        gasUsed: funding.gasUsed
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Activate campaign
router.post('/campaigns/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const transactionHash = await BlockchainService.activateCampaign(id);

    res.json({
      success: true,
      data: {
        campaignId: id,
        transactionHash,
        status: 'active'
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Record spend
router.post('/campaigns/:id/spend', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      throw new AppError('Amount is required', 400, 'MISSING_AMOUNT');
    }

    const transactionHash = await BlockchainService.recordSpend(id, amount);

    res.json({
      success: true,
      data: {
        campaignId: id,
        amount,
        transactionHash
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Complete campaign
router.post('/campaigns/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const transactionHash = await BlockchainService.completeCampaign(id);

    res.json({
      success: true,
      data: {
        campaignId: id,
        transactionHash,
        status: 'completed'
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get campaign details from blockchain
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const details = await BlockchainService.getCampaignDetails(id);

    res.json({
      success: true,
      data: { campaign: details }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Check if campaign is expired
router.get('/campaigns/:id/expired', async (req, res) => {
  try {
    const { id } = req.params;

    const isExpired = await BlockchainService.isCampaignExpired(id);

    res.json({
      success: true,
      data: { isExpired }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Generate payout cycle
router.post('/payouts/cycle', async (req, res) => {
  try {
    const cycle = await BlockchainService.generatePayoutCycle();

    res.json({
      success: true,
      data: {
        cycleId: cycle.cycleId,
        merkleRoot: cycle.merkleRoot,
        totalAmount: cycle.totalAmount,
        hostCount: cycle.hostCount
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Generate payout proof for host
router.post('/payouts/proof', async (req, res) => {
  try {
    const { hostId, amount } = req.body;

    if (!hostId || !amount) {
      throw new AppError('Host ID and amount are required', 400, 'MISSING_PARAMS');
    }

    const proof = await BlockchainService.generatePayoutProof(hostId, amount);

    res.json({
      success: true,
      data: { proof }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get USDC balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Address is required', 400, 'MISSING_ADDRESS');
    }

    const balance = await BlockchainService.getUSDCBalance(address);

    res.json({
      success: true,
      data: {
        address,
        balance,
        currency: 'USDC'
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

// Get transaction status
router.get('/transactions/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      throw new AppError('Transaction hash is required', 400, 'MISSING_HASH');
    }

    // Get transaction receipt
    const receipt = await BlockchainService.getPublicClient().getTransactionReceipt({
      hash: hash as `0x${string}`
    });

    res.json({
      success: true,
      data: {
        hash,
        status: receipt.status,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      }
    });

  } catch (error) {
    const appError = handleError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: appError.message,
      code: appError.code
    });
  }
});

export default router;
