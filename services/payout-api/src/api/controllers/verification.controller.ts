import { Request, Response } from 'express';
import { prisma } from '../../shared/database';
import {
  isValidBankCode,
  isValidWalletCode,
  isValidAccountNumber,
  getAccountTitle,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../shared/utils';
import { MerchantRequest, VerifyAccountRequest, VerifyAccountResponse } from '../../shared/types';

/**
 * Verify account details
 */
export async function verifyAccount(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const body: VerifyAccountRequest = req.body;

    // Validation
    if (!body.destType || !body.accountNumber) {
      res.status(400).json(formatErrorResponse('Missing required fields', 'VALIDATION_ERROR'));
      return;
    }

    if (!isValidAccountNumber(body.accountNumber)) {
      res.status(400).json(formatErrorResponse('Invalid account number format', 'VALIDATION_ERROR'));
      return;
    }

    if (body.destType === 'BANK') {
      if (!body.bankCode || !isValidBankCode(body.bankCode)) {
        res.status(400).json(formatErrorResponse('Invalid or missing bank code', 'VALIDATION_ERROR'));
        return;
      }

      // Check if bank exists in directory
      const bank = await prisma.bankDirectory.findUnique({
        where: { code: body.bankCode.toUpperCase() },
      });

      if (!bank || !bank.isActive) {
        res.status(400).json(formatErrorResponse('Bank not found or inactive', 'VALIDATION_ERROR'));
        return;
      }
    }

    if (body.destType === 'WALLET') {
      if (!body.walletCode || !isValidWalletCode(body.walletCode)) {
        res.status(400).json(formatErrorResponse('Invalid or missing wallet code', 'VALIDATION_ERROR'));
        return;
      }

      // Check if wallet exists in directory
      const wallet = await prisma.walletDirectory.findUnique({
        where: { code: body.walletCode.toUpperCase() },
      });

      if (!wallet || !wallet.isActive) {
        res.status(400).json(formatErrorResponse('Wallet not found or inactive', 'VALIDATION_ERROR'));
        return;
      }
    }

    // Mock verification - use test scenarios
    const accountSuffix = body.accountNumber.slice(-4);
    let isValid = true;
    let accountTitle = 'Account Holder';
    let message = 'Account verified successfully';

    // Test scenarios
    if (accountSuffix === '0003' || accountSuffix === '0005') {
      isValid = false;
      message = accountSuffix === '0003' 
        ? 'Account validation failed' 
        : 'Account is blocked or restricted';
    } else {
      accountTitle = getAccountTitle(body.accountNumber);
    }

    const response: VerifyAccountResponse = {
      isValid,
      accountTitle: isValid ? accountTitle : undefined,
      message,
    };

    res.json(formatSuccessResponse(response));
  } catch (error) {
    console.error('Verify account error:', error);
    res.status(500).json(formatErrorResponse('Failed to verify account', 'INTERNAL_ERROR'));
  }
}

