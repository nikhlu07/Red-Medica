import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';
import { blockchainService } from '../services/blockchain';

// Mock Polkadot extension
const mockAccounts = [
  {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    meta: {
      name: 'Test Account 1',
      source: 'polkadot-js'
    },
    type: 'sr25519'
  },
  {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    meta: {
      name: 'Test Account 2',
      source: 'polkadot-js'
    },
    type: 'sr25519'
  }
];

// Mock blockchain service
vi.mock('../services/blockchain', () => ({
  blockchainService: {
    initialize: vi.fn(),
    connectWallet: vi.fn(),
    setSelectedAccount: vi.fn(),
    clearWalletConnection: vi.fn(),
    disconnectWallet: vi.fn(),
    isAuthorizedManufacturer: vi.fn(),
    isConnected: vi.fn(),
    getWalletStatus: vi.fn(),
  }
}));

// Mock Polkadot extension
vi.mock('@polkadot/extension-dapp', () => ({
  web3Enable: vi.fn(),
  web3Accounts: vi.fn(),
  web3FromAddress: vi.fn(),
}));

// Mock store
vi.mock('../lib/store', () => ({
  useAppStore: () => ({
    setUser: vi.fn(),
    setIsAuthenticated: vi.fn(),
  })
}));

describe('useWallet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(blockchainService.initialize).mockResolvedValue(undefined);
    vi.mocked(blockchainService.connectWallet).mockResolvedValue(mockAccounts);
    vi.mocked(blockchainService.isAuthorizedManufacturer).mockResolvedValue(false);
    vi.mocked(blockchainService.isConnected).mockReturnValue(true);
    vi.mocked(blockchainService.getWalletStatus).mockReturnValue({
      connected: false,
      accountCount: 0,
      selectedAccount: null,
      hasSelectedAccount: false,
    });

    // Mock window.injectedWeb3
    Object.defineProperty(window, 'injectedWeb3', {
      value: {
        'polkadot-js': {
          version: '0.44.1'
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.accounts).toEqual([]);
      expect(result.current.selectedAccount).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isInitialized).toBe(false);
    });

    it('should initialize blockchain service on mount', async () => {
      renderHook(() => useWallet());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(blockchainService.initialize).toHaveBeenCalled();
      });
    });
  });

  describe('Extension Detection', () => {
    it('should detect installed Polkadot extension', () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.isExtensionInstalled()).toBe(true);
    });

    it('should return false when no extension is installed', () => {
      // Remove injectedWeb3
      delete (window as any).injectedWeb3;

      const { result } = renderHook(() => useWallet());

      expect(result.current.isExtensionInstalled()).toBe(false);
    });

    it('should get available extensions information', () => {
      const { result } = renderHook(() => useWallet());

      const extensions = result.current.getAvailableExtensions();
      expect(extensions).toEqual([
        { name: 'polkadot-js', version: '0.44.1' }
      ]);
    });
  });

  describe('Wallet Connection', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useWallet());

      await act(async () => {
        const accounts = await result.current.connectWallet();
        expect(accounts).toEqual(mockAccounts);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.accounts).toEqual(mockAccounts);
      expect(blockchainService.connectWallet).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const errorMessage = 'Connection failed';
      vi.mocked(blockchainService.connectWallet).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        try {
          await result.current.connectWallet();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Account Selection', () => {
    it('should select account successfully', async () => {
      const { result } = renderHook(() => useWallet());

      // First connect wallet
      await act(async () => {
        await result.current.connectWallet();
      });

      // Then select account
      await act(async () => {
        await result.current.selectAccount(mockAccounts[0]);
      });

      expect(result.current.selectedAccount).toEqual(mockAccounts[0]);
      expect(blockchainService.setSelectedAccount).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should check manufacturer authorization when selecting account', async () => {
      vi.mocked(blockchainService.isAuthorizedManufacturer).mockResolvedValue(true);

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.connectWallet();
        await result.current.selectAccount(mockAccounts[0]);
      });

      expect(blockchainService.isAuthorizedManufacturer).toHaveBeenCalledWith(mockAccounts[0].address);
    });

    it('should handle authorization check timeout', async () => {
      vi.mocked(blockchainService.isAuthorizedManufacturer).mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      );

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.connectWallet();
        await result.current.selectAccount(mockAccounts[0]);
      });

      // Should still select account with consumer role as fallback
      expect(result.current.selectedAccount).toEqual(mockAccounts[0]);
    });
  });

  describe('Wallet Disconnection', () => {
    it('should disconnect wallet successfully', async () => {
      const { result } = renderHook(() => useWallet());

      // First connect and select account
      await act(async () => {
        await result.current.connectWallet();
        await result.current.selectAccount(mockAccounts[0]);
      });

      // Then disconnect
      await act(async () => {
        await result.current.disconnectWallet();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.accounts).toEqual([]);
      expect(result.current.selectedAccount).toBe(null);
      expect(blockchainService.disconnectWallet).toHaveBeenCalled();
    });

    it('should handle disconnection errors gracefully', async () => {
      vi.mocked(blockchainService.disconnectWallet).mockRejectedValue(new Error('Disconnect failed'));

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.connectWallet();
        await result.current.disconnectWallet();
      });

      // Should still clear state even if disconnection fails
      expect(result.current.isConnected).toBe(false);
      expect(result.current.accounts).toEqual([]);
      expect(result.current.selectedAccount).toBe(null);
    });
  });

  describe('Transaction Signing', () => {
    const mockTransaction = {
      signAndSend: vi.fn()
    };

    beforeEach(() => {
      // Mock web3FromAddress
      const mockInjector = {
        signer: {
          signPayload: vi.fn(),
          signRaw: vi.fn()
        }
      };

      vi.doMock('@polkadot/extension-dapp', () => ({
        web3FromAddress: vi.fn().mockResolvedValue(mockInjector)
      }));
    });

    it('should sign transaction successfully', async () => {
      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.connectWallet();
        await result.current.selectAccount(mockAccounts[0]);
      });

      mockTransaction.signAndSend.mockResolvedValue('transaction-hash');

      await act(async () => {
        const txResult = await result.current.signTransaction(mockTransaction);
        expect(txResult).toBe('transaction-hash');
      });

      expect(mockTransaction.signAndSend).toHaveBeenCalled();
    });

    it('should handle signing errors', async () => {
      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.connectWallet();
        await result.current.selectAccount(mockAccounts[0]);
      });

      mockTransaction.signAndSend.mockRejectedValue(new Error('User rejected'));

      await act(async () => {
        try {
          await result.current.signTransaction(mockTransaction);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('rejected');
        }
      });
    });

    it('should require selected account for signing', async () => {
      const { result } = renderHook(() => useWallet());

      await act(async () => {
        try {
          await result.current.signTransaction(mockTransaction);
        } catch (error) {
          expect((error as Error).message).toBe('No account selected for signing');
        }
      });
    });
  });

  describe('Account Balance', () => {
    it('should return null when not connected', async () => {
      const { result } = renderHook(() => useWallet());

      const balance = await result.current.getAccountBalance();
      expect(balance).toBe(null);
    });

    it('should return null when no account selected', async () => {
      vi.mocked(blockchainService.isConnected).mockReturnValue(true);

      const { result } = renderHook(() => useWallet());

      const balance = await result.current.getAccountBalance();
      expect(balance).toBe(null);
    });
  });
});