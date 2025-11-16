import { describe, it, expect, vi, beforeEach } from 'vitest';
import { blockchainService } from '../services/blockchain';
import type { ProductRegistrationResult } from '../types/blockchain';

// Mock Polkadot API
vi.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: vi.fn(),
  },
  WsProvider: vi.fn(),
}));

vi.mock('@polkadot/api-contract', () => ({
  ContractPromise: vi.fn(),
}));

vi.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: vi.fn(),
  web3Enable: vi.fn(),
  web3FromAddress: vi.fn(),
}));

describe('Product Registration Service', () => {
  const mockAccount = {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: { name: 'Test Account' },
  };

  const validProductData = {
    name: 'Test Medicine',
    batchNumber: 'BATCH-001',
    manufacturerName: 'Test Pharma Inc',
    quantity: 100,
    mfgDate: Date.now() - 86400000, // 1 day ago
    expiryDate: Date.now() + 31536000000, // 1 year from now
    category: 'Prescription',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock blockchain service methods
    vi.spyOn(blockchainService, 'isConnected').mockReturnValue(true);
    vi.spyOn(blockchainService, 'isContractReady').mockReturnValue(true);
    vi.spyOn(blockchainService, 'getSelectedAccount').mockReturnValue(mockAccount);
    vi.spyOn(blockchainService, 'isAuthorizedManufacturer').mockResolvedValue(true);
  });

  describe('Input Validation', () => {
    it('should reject empty product name', async () => {
      const result = await blockchainService.registerProduct(
        '', // empty name
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Product name is required');
    });

    it('should reject empty batch number', async () => {
      const result = await blockchainService.registerProduct(
        validProductData.name,
        '', // empty batch number
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch number is required');
    });

    it('should reject invalid quantity', async () => {
      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        0, // invalid quantity
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be greater than 0');
    });

    it('should reject expiry date before manufacturing date', async () => {
      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        Date.now(), // mfg date now
        Date.now() - 86400000, // expiry date in past
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expiry date must be after manufacturing date');
    });

    it('should reject manufacturing date too far in past', async () => {
      const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        twoYearsAgo, // too far in past
        Date.now() + 31536000000,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Manufacturing date cannot be more than 1 year in the past');
    });

    it('should reject invalid batch number format', async () => {
      const result = await blockchainService.registerProduct(
        validProductData.name,
        'BATCH@001!', // invalid characters
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch number can only contain letters, numbers, hyphens, and underscores');
    });

    it('should accept valid product data', async () => {
      // Mock successful transaction
      const mockTx = {
        signAndSend: vi.fn().mockImplementation((address, options, callback) => {
          // Simulate successful transaction
          setTimeout(() => {
            callback({
              status: { isInBlock: true, asInBlock: { toString: () => '0x123' } },
              events: [
                {
                  event: {
                    method: 'ContractEmitted',
                    data: [null, { some: 'event data' }]
                  },
                  phase: { toString: () => 'ApplyExtrinsic(1)' }
                }
              ],
              txHash: { toString: () => '0x456' }
            });
          }, 10);
          return Promise.resolve();
        })
      };

      // Mock contract and API
      const mockContract = {
        tx: { registerProduct: vi.fn().mockReturnValue(mockTx) },
        query: { registerProduct: vi.fn().mockResolvedValue({ result: { isOk: true } }) },
        abi: { decodeEvent: vi.fn().mockReturnValue({ 
          event: { identifier: 'ProductRegistered' },
          args: [{ toNumber: () => 123 }]
        }) }
      };

      const mockApi = {
        registry: {
          createType: vi.fn().mockReturnValue({}),
          findMetaError: vi.fn()
        }
      };

      // Mock private properties
      Object.defineProperty(blockchainService, 'contract', {
        value: mockContract,
        writable: true
      });
      Object.defineProperty(blockchainService, 'api', {
        value: mockApi,
        writable: true
      });

      // Mock web3FromAddress
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      vi.mocked(web3FromAddress).mockResolvedValue({
        signer: { signPayload: vi.fn() }
      } as any);

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(true);
      expect(result.productId).toBe(123);
      expect(result.txHash).toBeDefined();
    });
  });

  describe('Authorization Checks', () => {
    it('should reject registration from unauthorized manufacturer', async () => {
      vi.spyOn(blockchainService, 'isAuthorizedManufacturer').mockResolvedValue(false);

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authorized as a manufacturer');
    });

    it('should reject registration when no account selected', async () => {
      vi.spyOn(blockchainService, 'getSelectedAccount').mockReturnValue(null);

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No account selected');
    });
  });

  describe('Connection Checks', () => {
    it('should reject registration when not connected to blockchain', async () => {
      vi.spyOn(blockchainService, 'isConnected').mockReturnValue(false);

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not connected to blockchain network');
    });

    it('should reject registration when contract not ready', async () => {
      vi.spyOn(blockchainService, 'isContractReady').mockReturnValue(false);

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Smart contract not available');
    });
  });

  describe('Error Handling', () => {
    it('should handle wallet signing errors gracefully', async () => {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      vi.mocked(web3FromAddress).mockRejectedValue(new Error('Wallet locked'));

      const result = await blockchainService.registerProduct(
        validProductData.name,
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to access wallet');
    });

    it('should provide user-friendly error messages', async () => {
      const result = await blockchainService.registerProduct(
        '', // This will trigger validation error
        validProductData.batchNumber,
        validProductData.manufacturerName,
        validProductData.quantity,
        validProductData.mfgDate,
        validProductData.expiryDate,
        validProductData.category
      );

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('undefined');
      expect(result.error).not.toContain('null');
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });
  });
});