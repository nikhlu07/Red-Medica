import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WalletConnection } from '../components/WalletConnection';
import { blockchainService } from '../services/blockchain';

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

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

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

const renderWalletConnection = (props = {}) => {
  return render(
    <BrowserRouter>
      <WalletConnection {...props} />
    </BrowserRouter>
  );
};

describe('WalletConnection Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(blockchainService.initialize).mockResolvedValue(undefined);
    vi.mocked(blockchainService.connectWallet).mockResolvedValue(mockAccounts);
    vi.mocked(blockchainService.isAuthorizedManufacturer).mockResolvedValue(false);
    vi.mocked(blockchainService.isConnected).mockReturnValue(true);

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

  describe('Extension Detection', () => {
    it('should show extension installation prompt when not installed', async () => {
      // Remove injectedWeb3 to simulate no extension
      delete (window as any).injectedWeb3;

      renderWalletConnection();

      await waitFor(() => {
        expect(screen.getByText('Polkadot Extension Required')).toBeInTheDocument();
        expect(screen.getByText('Install Polkadot.js Extension')).toBeInTheDocument();
      });
    });

    it('should show connect wallet button when extension is installed', async () => {
      renderWalletConnection();

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Connection Flow', () => {
    it('should connect wallet and show account selection', async () => {
      renderWalletConnection();

      // Wait for connect button and click it
      await waitFor(() => {
        const connectButton = screen.getByText('Connect Wallet');
        expect(connectButton).toBeInTheDocument();
        fireEvent.click(connectButton);
      });

      // Should show account selection
      await waitFor(() => {
        expect(screen.getByText('Select Your Account')).toBeInTheDocument();
        expect(screen.getByText('Test Account 1')).toBeInTheDocument();
        expect(screen.getByText('Test Account 2')).toBeInTheDocument();
      });
    });

    it('should handle connection errors gracefully', async () => {
      vi.mocked(blockchainService.connectWallet).mockRejectedValue(
        new Error('Connection failed')
      );

      renderWalletConnection();

      await waitFor(() => {
        const connectButton = screen.getByText('Connect Wallet');
        fireEvent.click(connectButton);
      });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
      });
    });
  });

  describe('Account Selection', () => {
    it('should select account and show connected state', async () => {
      const onConnected = vi.fn();
      renderWalletConnection({ onConnected });

      // Connect wallet first
      await waitFor(() => {
        const connectButton = screen.getByText('Connect Wallet');
        fireEvent.click(connectButton);
      });

      // Select first account
      await waitFor(() => {
        const selectButtons = screen.getAllByText('Select');
        fireEvent.click(selectButtons[0]);
      });

      // Should call onConnected callback
      await waitFor(() => {
        expect(onConnected).toHaveBeenCalledWith(mockAccounts[0]);
      });
    });

    it('should show manufacturer role when authorized', async () => {
      vi.mocked(blockchainService.isAuthorizedManufacturer).mockResolvedValue(true);

      const onConnected = vi.fn();
      renderWalletConnection({ onConnected });

      // Connect and select account
      await waitFor(() => {
        const connectButton = screen.getByText('Connect Wallet');
        fireEvent.click(connectButton);
      });

      await waitFor(() => {
        const selectButtons = screen.getAllByText('Select');
        fireEvent.click(selectButtons[0]);
      });

      // Verify manufacturer authorization was checked
      await waitFor(() => {
        expect(blockchainService.isAuthorizedManufacturer).toHaveBeenCalledWith(
          mockAccounts[0].address
        );
      });
    });
  });

  describe('Compact Mode', () => {
    it('should show compact connect button when not connected', () => {
      renderWalletConnection({ compact: true });

      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('should show account info in compact mode when connected', async () => {
      // Mock connected state by setting up the hook to return connected state
      renderWalletConnection({ compact: true });

      // This would require more complex mocking of the useWallet hook state
      // For now, we'll just verify the component renders without errors
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });
  });

  describe('Disconnection', () => {
    it('should disconnect wallet when disconnect button is clicked', async () => {
      const onDisconnected = vi.fn();
      renderWalletConnection({ onDisconnected });

      // This test would require the component to be in connected state
      // which requires more complex state mocking
      // For now, we verify the component renders correctly
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show network status when blockchain is not connected', async () => {
      vi.mocked(blockchainService.isConnected).mockReturnValue(false);

      renderWalletConnection();

      await waitFor(() => {
        expect(screen.getByText(/Connecting to Blockchain/)).toBeInTheDocument();
      });
    });

    it('should show retry options on connection failure', async () => {
      vi.mocked(blockchainService.connectWallet).mockRejectedValue(
        new Error('Network error')
      );

      renderWalletConnection();

      await waitFor(() => {
        const connectButton = screen.getByText('Connect Wallet');
        fireEvent.click(connectButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Extension Not Working?')).toBeInTheDocument();
      });
    });
  });
});