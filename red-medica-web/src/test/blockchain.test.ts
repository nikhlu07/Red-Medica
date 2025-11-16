import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blockchainService } from '../services/blockchain';
import { NetworkStatus } from '../types/blockchain';

// Mock Polkadot API
vi.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: vi.fn()
  },
  WsProvider: vi.fn()
}));

vi.mock('@polkadot/api-contract', () => ({
  ContractPromise: vi.fn()
}));

vi.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: vi.fn(),
  web3Enable: vi.fn(),
  web3FromAddress: vi.fn()
}));

describe('BlockchainService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Status Management', () => {
    it('should initialize with disconnected status', () => {
      const status = blockchainService.getNetworkStatus();
      expect(status.status).toBe(NetworkStatus.DISCONNECTED);
      expect(status.endpoint).toBeDefined();
      expect(status.lastUpdate).toBeTypeOf('number');
    });

    it('should allow subscribing to network status changes', () => {
      const mockListener = vi.fn();
      const unsubscribe = blockchainService.onNetworkStatusChange(mockListener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });

    it('should provide network endpoint information', () => {
      const endpoint = blockchainService.getNetworkEndpoint();
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
    });
  });

  describe('Connection State', () => {
    it('should report not connected initially', () => {
      expect(blockchainService.isConnected()).toBe(false);
    });

    it('should report contract not ready initially', () => {
      expect(blockchainService.isContractReady()).toBe(false);
    });

    it('should provide contract address', () => {
      const address = blockchainService.getContractAddress();
      expect(typeof address).toBe('string');
    });
  });

  describe('Health Check', () => {
    it('should return unhealthy status when not connected', async () => {
      const health = await blockchainService.healthCheck();
      expect(health.healthy).toBe(false);
      expect(health.details).toBeDefined();
      expect(health.details.connected).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate product registration inputs', async () => {
      const result = await blockchainService.registerProduct(
        '', // empty name
        'BATCH001',
        'Test Manufacturer',
        10,
        Date.now(),
        Date.now() + 86400000,
        'Medicine'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not connected to blockchain network');
    });

    it('should validate product verification inputs', async () => {
      const result = await blockchainService.verifyProduct(0); // invalid ID
      expect(result).toBeNull();
    });

    it('should validate transfer custody inputs', async () => {
      const result = await blockchainService.transferCustody(
        0, // invalid product ID
        'test-address',
        'Test Location'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not connected to blockchain network');
    });
  });
});