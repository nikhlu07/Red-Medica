import { useState, useEffect, useCallback } from 'react';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { blockchainService } from '@/services/blockchain';
import { useAppStore } from '@/lib/store';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  error: string | null;
  isInitialized: boolean;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    accounts: [],
    selectedAccount: null,
    error: null,
    isInitialized: false,
  });

  const { setUser, setIsAuthenticated } = useAppStore();

  // Initialize blockchain service
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      await blockchainService.initialize();
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isConnecting: false 
      }));
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize blockchain service',
        isConnecting: false 
      }));
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      if (!state.isInitialized) {
        await initialize();
      }

      const accounts = await blockchainService.connectWallet();
      
      setState(prev => ({ 
        ...prev, 
        accounts,
        isConnected: true,
        isConnecting: false 
      }));

      return accounts;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false 
      }));
      throw error;
    }
  }, [state.isInitialized, initialize]);

  // Select account
  const selectAccount = useCallback(async (account: InjectedAccountWithMeta) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      blockchainService.setSelectedAccount(account);
      
      // Check if account is authorized manufacturer (with timeout)
      let isManufacturer = false;
      try {
        const authCheckPromise = blockchainService.isAuthorizedManufacturer(account.address);
        const timeoutPromise = new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Authorization check timeout')), 10000)
        );
        
        isManufacturer = await Promise.race([authCheckPromise, timeoutPromise]);
      } catch (authError) {
        console.warn('Failed to check manufacturer authorization:', authError);
        // Continue with consumer role as fallback
        isManufacturer = false;
      }
      
      setState(prev => ({ 
        ...prev, 
        selectedAccount: account 
      }));

      // Update global state with enhanced user information
      setUser({
        address: account.address,
        name: account.meta.name || `Account ${account.address.slice(0, 8)}...`,
        role: isManufacturer ? 'manufacturer' : 'consumer',
      });
      setIsAuthenticated(true);

      console.log(`Account selected: ${account.meta.name || 'Unnamed'} (${account.address.slice(0, 8)}...) - Role: ${isManufacturer ? 'Manufacturer' : 'Consumer'}`);

    } catch (error) {
      console.error('Failed to select account:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to select account' 
      }));
      
      // Clear any partial state on error
      blockchainService.setSelectedAccount(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [setUser, setIsAuthenticated]);

  // Disconnect wallet with enhanced cleanup
  const disconnectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      // Use enhanced disconnection method
      await blockchainService.disconnectWallet();
      
      setState({
        isConnected: false,
        isConnecting: false,
        accounts: [],
        selectedAccount: null,
        error: null,
        isInitialized: state.isInitialized, // Keep initialization state
      });

      // Clear global state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
      
      // Still clear state even if there's an error
      setState({
        isConnected: false,
        isConnecting: false,
        accounts: [],
        selectedAccount: null,
        error: null,
        isInitialized: state.isInitialized,
      });
      
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [state.isInitialized, setUser, setIsAuthenticated]);

  // Check if extension is installed with detailed information
  const isExtensionInstalled = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check for injectedWeb3 (older method)
    const hasInjectedWeb3 = window.injectedWeb3 && Object.keys(window.injectedWeb3).length > 0;
    
    // Check for newer extension detection
    const hasPolkadotExtension = !!(window as any).injectedWeb3?.['polkadot-js'];
    
    return hasInjectedWeb3 || hasPolkadotExtension;
  }, []);

  // Get available extensions information
  const getAvailableExtensions = useCallback(() => {
    if (typeof window === 'undefined' || !window.injectedWeb3) {
      return [];
    }
    
    return Object.keys(window.injectedWeb3).map(name => ({
      name,
      version: window.injectedWeb3[name].version || 'unknown'
    }));
  }, []);

  // Sign transaction with enhanced error handling
  const signTransaction = useCallback(async (transaction: any, options?: { timeout?: number }) => {
    if (!state.selectedAccount) {
      throw new Error('No account selected for signing');
    }

    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      
      // Get injector with timeout
      const injectorPromise = web3FromAddress(state.selectedAccount.address);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Wallet access timeout')), 5000)
      );
      
      const injector = await Promise.race([injectorPromise, timeoutPromise]);
      
      if (!injector || !injector.signer) {
        throw new Error('Unable to access wallet signer');
      }

      // Sign and send with timeout
      const txTimeout = options?.timeout || 60000; // Default 60 seconds
      const txPromise = transaction.signAndSend(state.selectedAccount.address, { signer: injector.signer });
      const txTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction signing timeout')), txTimeout)
      );
      
      return await Promise.race([txPromise, txTimeoutPromise]);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Transaction signing timed out. Please try again.');
        } else if (error.message.includes('User rejected')) {
          throw new Error('Transaction was rejected by user.');
        } else if (error.message.includes('Insufficient')) {
          throw new Error('Insufficient balance to complete transaction.');
        }
      }
      
      throw new Error('Transaction signing failed. Please check your wallet and try again.');
    }
  }, [state.selectedAccount, state.isConnected]);

  // Get account balance (utility method)
  const getAccountBalance = useCallback(async (address?: string) => {
    if (!blockchainService.isConnected()) {
      return null;
    }

    try {
      const accountAddress = address || state.selectedAccount?.address;
      if (!accountAddress) return null;

      // This would require the blockchain service to expose the API
      // For now, return null as balance checking isn't critical for the core functionality
      return null;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return null;
    }
  }, [state.selectedAccount]);

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized && !state.isConnecting) {
      initialize();
    }
  }, [initialize, state.isInitialized, state.isConnecting]);

  // Auto-reconnect if accounts were previously connected
  useEffect(() => {
    const autoReconnect = async () => {
      if (state.isInitialized && !state.isConnected && !state.isConnecting) {
        try {
          // Try to get accounts without showing connection prompt
          const accounts = await blockchainService.connectWallet();
          if (accounts.length > 0) {
            setState(prev => ({ 
              ...prev, 
              accounts,
              isConnected: true 
            }));
          }
        } catch (error) {
          // Silently fail - user needs to manually connect
          console.log('Auto-reconnect failed:', error);
        }
      }
    };

    autoReconnect();
  }, [state.isInitialized, state.isConnected, state.isConnecting]);

  return {
    ...state,
    connectWallet,
    selectAccount,
    disconnectWallet,
    isExtensionInstalled,
    getAvailableExtensions,
    initialize,
    signTransaction,
    getAccountBalance,
  };
};