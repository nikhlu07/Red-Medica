import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ethers } from 'ethers';
import contractMetadata from '../contracts/medical_supply_chain.json';
import { productCache, transferCache, authCache } from './cache';
import { connectionPool } from './connectionPool';
import { retryBlockchainOperation } from '../utils/retry';
import { errorHandlingService } from './errorHandlingService';
import { 
  NetworkStatus, 
  type NetworkInfo, 
  type Product, 
  type Transfer, 
  type TransactionResult, 
  type ProductRegistrationResult,
  type HealthCheckResult 
} from '../types/blockchain';

// Contract configuration
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const WS_PROVIDER = import.meta.env.VITE_POLKADOT_WS || 'wss://wss.api.moonbase.moonbeam.network';

// Re-export types for convenience
export type { NetworkStatus, NetworkInfo, Product, Transfer, TransactionResult, ProductRegistrationResult, HealthCheckResult };

class BlockchainService {
  private api: ApiPromise | null = null;
  private contract: ContractPromise | null = null;
  private accounts: InjectedAccountWithMeta[] = [];
  private selectedAccount: InjectedAccountWithMeta | null = null;
  private wsProvider: WsProvider | null = null;
  private networkInfo: NetworkInfo = {
    status: NetworkStatus.DISCONNECTED,
    endpoint: WS_PROVIDER,
    lastUpdate: Date.now()
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private statusListeners: ((info: NetworkInfo) => void)[] = [];
  private blockSubscription: any = null;

  async initialize(): Promise<void> {
    try {
      this.updateNetworkStatus(NetworkStatus.CONNECTING);
      
      // Use connection pool for better connection management
      this.wsProvider = await connectionPool.getConnection();
      
      // Set up connection event handlers
      this.setupConnectionHandlers();
      
      // Connect to Polkadot node with retry logic
      const result = await retryBlockchainOperation(async () => {
        return await ApiPromise.create({ 
          provider: this.wsProvider,
          throwOnConnect: false,
          throwOnUnknown: false
        });
      });

      if (!result.success) {
        throw new Error(`Failed to create API instance: ${result.error?.message}`);
      }

      this.api = result.data;
      
      // Wait for API to be ready
      await this.api.isReady;
      
      // Get chain information
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version()
      ]);
      
      // Initialize contract if address is provided
      if (CONTRACT_ADDRESS && contractMetadata) {
        this.contract = new ContractPromise(this.api, contractMetadata, CONTRACT_ADDRESS);
      }
      
      // Start network monitoring
      this.startNetworkMonitoring();
      
      // Start contract event listening if contract is available
      if (this.contract) {
        this.startContractEventListening();
      }
      
      this.updateNetworkStatus(NetworkStatus.CONNECTED, {
        chainName: chain.toString(),
        blockNumber: (await this.api.rpc.chain.getHeader()).number.toNumber()
      });
      
      console.log(`Blockchain service initialized - Chain: ${chain}, Node: ${nodeName} v${nodeVersion}`);
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      this.updateNetworkStatus(NetworkStatus.ERROR, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async connectWallet(): Promise<InjectedAccountWithMeta[]> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in browser environment');
      }

      // Try MetaMask first (for Moonbeam compatibility)
      if ((window as any).ethereum) {
        return await this.connectMetaMask();
      }

      // Fallback to Polkadot.js extension
      return await this.connectPolkadotWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.accounts = [];
      throw error;
    }
  }

  private async connectMetaMask(): Promise<InjectedAccountWithMeta[]> {
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found. Please create an account in MetaMask.');
      }

      // Switch to Moonbase Alpha testnet
      await this.switchToMoonbaseAlpha();

      // Convert MetaMask accounts to InjectedAccountWithMeta format
      this.accounts = accounts.map((address: string, index: number) => ({
        address,
        meta: {
          name: `MetaMask Account ${index + 1}`,
          source: 'metamask',
        },
        type: 'ethereum',
      }));

      console.log(`Connected to MetaMask with ${this.accounts.length} account(s)`);
      return this.accounts;
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      throw error;
    }
  }

  private async switchToMoonbaseAlpha(): Promise<void> {
    try {
      const ethereum = (window as any).ethereum;
      
      // Moonbase Alpha network configuration
      const moonbaseAlpha = {
        chainId: '0x507', // 1287 in decimal
        chainName: 'Moonbase Alpha',
        nativeCurrency: {
          name: 'DEV',
          symbol: 'DEV',
          decimals: 18,
        },
        rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
        blockExplorerUrls: ['https://moonbase.moonscan.io/'],
      };

      try {
        // Try to switch to the network
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: moonbaseAlpha.chainId }],
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [moonbaseAlpha],
          });
        } else {
          throw switchError;
        }
      }

      console.log('Switched to Moonbase Alpha network');
    } catch (error) {
      console.error('Failed to switch to Moonbase Alpha:', error);
      throw new Error('Failed to switch to Moonbase Alpha network. Please switch manually in MetaMask.');
    }
  }

  private async connectPolkadotWallet(): Promise<InjectedAccountWithMeta[]> {
    try {
      // Enable Polkadot extension with proper app name and icon
      const extensions = await web3Enable('Red Médica');
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install Polkadot.js extension or use MetaMask.');
      }

      console.log(`Found ${extensions.length} Polkadot extension(s):`, extensions.map(ext => ext.name));

      // Get accounts from all available extensions
      this.accounts = await web3Accounts();
      if (this.accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in Polkadot.js extension.');
      }

      console.log(`Found ${this.accounts.length} account(s) across all extensions`);

      // Filter out accounts that don't have proper metadata
      this.accounts = this.accounts.filter(account => {
        const hasValidAddress = account.address && account.address.length > 0;
        const hasValidMeta = account.meta && typeof account.meta === 'object';
        return hasValidAddress && hasValidMeta;
      });

      if (this.accounts.length === 0) {
        throw new Error('No valid accounts found. Please ensure your accounts are properly configured.');
      }

      return this.accounts;
    } catch (error) {
      console.error('Failed to connect Polkadot wallet:', error);
      throw error;
    }
  }

  private async getMetaMaskSigner(): Promise<any> {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('MetaMask not available');
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Create a wrapper that mimics Polkadot.js signer interface
      return {
        signPayload: async (payload: any) => {
          // For MetaMask, we'll need to adapt the payload
          const message = JSON.stringify(payload);
          const signature = await signer.signMessage(message);
          return { signature };
        },
        signRaw: async (raw: any) => {
          const signature = await signer.signMessage(raw.data);
          return { signature };
        }
      };
    } catch (error) {
      console.error('Failed to get MetaMask signer:', error);
      throw error;
    }
  }

  setSelectedAccount(account: InjectedAccountWithMeta | null): void {
    this.selectedAccount = account;
    if (account) {
      console.log(`Selected account: ${account.meta.name || 'Unnamed'} (${account.address.slice(0, 8)}...)`);
    } else {
      console.log('Account deselected');
    }
  }

  getSelectedAccount(): InjectedAccountWithMeta | null {
    return this.selectedAccount;
  }

  clearWalletConnection(): void {
    this.accounts = [];
    this.selectedAccount = null;
    console.log('Wallet connection cleared');
  }

  // Enhanced wallet disconnection with cleanup
  async disconnectWallet(): Promise<void> {
    try {
      // Clear accounts and selected account
      this.clearWalletConnection();
      
      // Note: We don't disconnect the blockchain API as other parts of the app might need it
      // Only clear wallet-specific state
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
      // Still clear the state even if there's an error
      this.clearWalletConnection();
    }
  }

  // Check if wallet is connected (has accounts)
  isWalletConnected(): boolean {
    return this.accounts.length > 0;
  }

  // Get wallet connection status
  getWalletStatus(): {
    connected: boolean;
    accountCount: number;
    selectedAccount: string | null;
    hasSelectedAccount: boolean;
  } {
    return {
      connected: this.isWalletConnected(),
      accountCount: this.accounts.length,
      selectedAccount: this.selectedAccount?.address || null,
      hasSelectedAccount: !!this.selectedAccount,
    };
  }

  async registerProduct(
    name: string,
    batchNumber: string,
    manufacturerName: string,
    quantity: number,
    mfgDate: number,
    expiryDate: number,
    category: string
  ): Promise<ProductRegistrationResult> {
    try {
      // Enhanced validation
      if (!this.isConnected()) {
        throw new Error('Not connected to blockchain network. Please check your connection and try again.');
      }
      
      if (!this.isContractReady()) {
        throw new Error('Smart contract not available. Please ensure the contract is deployed and accessible.');
      }
      
      if (!this.selectedAccount) {
        throw new Error('No account selected. Please connect your wallet and select an account.');
      }

      // Comprehensive input validation using helper
      const validationErrors = this.validateProductRegistrationData({
        name,
        batchNumber,
        manufacturerName,
        quantity,
        mfgDate,
        expiryDate,
        category,
      });
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check manufacturer authorization
      const isAuthorized = await this.isAuthorizedManufacturer(this.selectedAccount.address);
      if (!isAuthorized) {
        throw new Error('You are not authorized as a manufacturer. Please contact the administrator to get manufacturer privileges.');
      }

      // Get injector for signing with enhanced error handling
      let injector;
      try {
        injector = await web3FromAddress(this.selectedAccount.address);
        if (!injector || !injector.signer) {
          throw new Error('Failed to get transaction signer from wallet');
        }
      } catch (error) {
        throw new Error('Unable to access wallet for transaction signing. Please ensure your wallet is unlocked and try again.');
      }

      // Enhanced gas estimation using helper method
      const gasLimit = await this.estimateGas(
        'registerProduct',
        [name, batchNumber, manufacturerName, quantity, mfgDate, expiryDate, category],
        this.selectedAccount.address
      );

      console.log('Gas estimation completed for product registration');

      // Create transaction
      const tx = this.contract.tx.registerProduct(
        {
          gasLimit,
          storageDepositLimit: null,
        },
        name,
        batchNumber,
        manufacturerName,
        quantity,
        mfgDate,
        expiryDate,
        category
      );

      // Enhanced transaction execution with detailed progress tracking
      const result = await new Promise<ProductRegistrationResult>((resolve, reject) => {
        let isResolved = false;
        let transactionHash: string | null = null;
        
        // Set timeout for transaction (2 minutes for complex operations)
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            reject(new Error('Transaction timeout after 2 minutes. The transaction may still be processing. Please check your transaction history.'));
          }
        }, 120000);

        console.log('Submitting product registration transaction...');

        tx.signAndSend(this.selectedAccount!.address, { signer: injector.signer }, (result) => {
          if (isResolved) return;

          try {
            // Track transaction hash as soon as available
            if (result.txHash && !transactionHash) {
              transactionHash = result.txHash.toString();
              console.log('Transaction submitted with hash:', transactionHash);
            }

            if (result.status.isReady) {
              console.log('Transaction is ready for processing');
            } else if (result.status.isBroadcast) {
              console.log('Transaction broadcasted to network');
            } else if (result.status.isInBlock) {
              console.log('Transaction included in block:', result.status.asInBlock.toString());
              
              // Use enhanced event parsing helper
              const eventData = this.parseContractEvents(result.events, 'ProductRegistered');
              
              if (eventData.hasFailure) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: false,
                  error: 'Transaction failed during execution. Please check your account balance and contract permissions.',
                  txHash: transactionHash || result.status.asInBlock.toString(),
                });
                return;
              }

              // Transaction successful - resolve with event data
              const hasProductRegisteredEvent = eventData.contractEvents.some(
                event => event.identifier === 'ProductRegistered'
              );

              isResolved = true;
              clearTimeout(timeout);
              resolve({
                success: true,
                productId: eventData.productId,
                txHash: transactionHash || result.status.asInBlock.toString(),
                message: hasProductRegisteredEvent && eventData.productId
                  ? `Product registered successfully with ID: ${eventData.productId}`
                  : 'Product registration transaction completed successfully',
              });
              
            } else if (result.status.isFinalized) {
              console.log('Transaction finalized in block:', result.status.asFinalized.toString());
              // Note: We should have already resolved when isInBlock, but this is a safety net
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: true,
                  txHash: transactionHash || result.status.asFinalized.toString(),
                  message: 'Product registration completed and finalized',
                });
              }
            } else if (result.isError) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: false,
                  error: 'Transaction failed due to network error. Please check your connection and try again.',
                  txHash: transactionHash,
                });
              }
            } else if (result.dispatchError) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                
                let errorMessage = 'Transaction failed';
                let userFriendlyMessage = 'Transaction failed due to a contract error.';
                
                if (result.dispatchError.isModule) {
                  try {
                    const decoded = this.api.registry.findMetaError(result.dispatchError.asModule);
                    errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                    
                    // Provide user-friendly error messages
                    if (decoded.name === 'NotAuthorizedManufacturer') {
                      userFriendlyMessage = 'You are not authorized as a manufacturer. Please contact the administrator.';
                    } else if (decoded.name === 'ProductAlreadyExists') {
                      userFriendlyMessage = 'A product with this batch number already exists. Please use a unique batch number.';
                    } else if (decoded.name === 'InsufficientBalance') {
                      userFriendlyMessage = 'Insufficient balance to complete the transaction. Please add funds to your account.';
                    } else {
                      userFriendlyMessage = `Contract error: ${decoded.docs.join(' ') || decoded.name}`;
                    }
                  } catch (decodeError) {
                    console.error('Failed to decode dispatch error:', decodeError);
                  }
                } else if (result.dispatchError.isBadOrigin) {
                  userFriendlyMessage = 'Transaction origin is invalid. Please check your account permissions.';
                } else if (result.dispatchError.isCannotLookup) {
                  userFriendlyMessage = 'Account lookup failed. Please check your account address.';
                }
                
                console.error('Dispatch error:', errorMessage);
                
                resolve({
                  success: false,
                  error: userFriendlyMessage,
                  txHash: transactionHash,
                  technicalError: errorMessage,
                });
              }
            }
          } catch (processingError) {
            console.error('Error processing transaction result:', processingError);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve({
                success: false,
                error: 'Error processing transaction result. Please check the transaction manually.',
                txHash: transactionHash,
              });
            }
          }
        }).catch((signError) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            
            let userMessage = 'Failed to sign transaction.';
            if (signError.message?.includes('Cancelled')) {
              userMessage = 'Transaction was cancelled by user.';
            } else if (signError.message?.includes('rejected')) {
              userMessage = 'Transaction was rejected by wallet.';
            } else if (signError.message?.includes('insufficient')) {
              userMessage = 'Insufficient balance to complete transaction.';
            }
            
            console.error('Transaction signing error:', signError);
            reject(new Error(userMessage));
          }
        });
      });

      return result;
    } catch (error) {
      console.error('Failed to register product:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to register product.';
      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          userMessage = error.message;
        } else if (error.message.includes('not authorized')) {
          userMessage = error.message;
        } else if (error.message.includes('wallet')) {
          userMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          userMessage = 'Network connection error. Please check your internet connection and try again.';
        } else {
          userMessage = `Registration failed: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: userMessage,
        technicalError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyProduct(productId: number): Promise<Product | null> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to blockchain network');
      }
      
      if (!this.isContractReady()) {
        throw new Error('Smart contract not available');
      }

      if (!productId || productId <= 0) {
        throw new Error('Invalid product ID');
      }

      // Check cache first for performance optimization
      const cacheKey = `product_${productId}`;
      const cachedProduct = productCache.get<Product>(cacheKey);
      if (cachedProduct) {
        console.log(`Product ${productId} retrieved from cache`);
        return cachedProduct;
      }

      // Use retry logic with exponential backoff
      const result = await retryBlockchainOperation(async () => {
        // Optimized gas limits
        const gasLimit = this.api.registry.createType('WeightV2', {
          refTime: 3000000000, // Reduced for queries
          proofSize: 131072,
        });

        const { result, output } = await this.contract.query.verifyProduct(
          this.selectedAccount?.address || '',
          {
            gasLimit,
            storageDepositLimit: null,
          },
          productId
        );

        if (result.isOk && output) {
          const productData = output.toHuman() as any;
          if (productData && productData.Ok) {
            const product = productData.Ok;
            const parsedProduct = {
              id: parseInt(product.id.replace(/,/g, '')),
              name: product.name,
              batchNumber: product.batchNumber,
              manufacturer: product.manufacturer,
              manufacturerName: product.manufacturerName,
              quantity: parseInt(product.quantity.replace(/,/g, '')),
              mfgDate: parseInt(product.mfgDate.replace(/,/g, '')),
              expiryDate: parseInt(product.expiryDate.replace(/,/g, '')),
              category: product.category,
              currentHolder: product.currentHolder,
              isAuthentic: product.isAuthentic,
              createdAt: parseInt(product.createdAt.replace(/,/g, '')),
            };

            // Cache the result for 10 minutes
            productCache.set(cacheKey, parsedProduct, 10 * 60 * 1000);
            
            return parsedProduct;
          }
        }

        return null;
      });

      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to verify product:', error);
      return null;
    }
  }

  async transferCustody(
    productId: number,
    toAddress: string,
    location: string
  ): Promise<TransactionResult> {
    try {
      // Enhanced validation
      if (!this.isConnected()) {
        throw new Error('Not connected to blockchain network. Please check your connection and try again.');
      }
      
      if (!this.isContractReady()) {
        throw new Error('Smart contract not available. Please ensure the contract is deployed and accessible.');
      }
      
      if (!this.selectedAccount) {
        throw new Error('No account selected. Please connect your wallet and select an account.');
      }

      // Comprehensive input validation
      const validationErrors = this.validateTransferData({
        productId,
        toAddress,
        location,
      });
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Enhanced authorization checks
      const authorizationResult = await this.validateTransferAuthorization(productId, this.selectedAccount.address);
      if (!authorizationResult.authorized) {
        throw new Error(authorizationResult.error || 'You are not authorized to transfer this product.');
      }

      // Get signer based on wallet type
      let signer;
      try {
        if (this.selectedAccount.meta.source === 'metamask') {
          signer = await this.getMetaMaskSigner();
        } else {
          const injector = await web3FromAddress(this.selectedAccount.address);
          if (!injector || !injector.signer) {
            throw new Error('Failed to get transaction signer from wallet');
          }
          signer = injector.signer;
        }
      } catch (error) {
        throw new Error('Unable to access wallet for transaction signing. Please ensure your wallet is unlocked and try again.');
      }

      // Enhanced gas estimation
      const gasLimit = await this.estimateGas(
        'transferCustody',
        [productId, toAddress, location],
        this.selectedAccount.address
      );

      console.log('Gas estimation completed for custody transfer');

      // Create transaction
      const tx = this.contract.tx.transferCustody(
        {
          gasLimit,
          storageDepositLimit: null,
        },
        productId,
        toAddress,
        location
      );

      // Enhanced transaction execution with detailed progress tracking
      const result = await new Promise<TransactionResult>((resolve, reject) => {
        let isResolved = false;
        let transactionHash: string | null = null;
        
        // Set timeout for transaction (2 minutes)
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            reject(new Error('Transaction timeout after 2 minutes. The transaction may still be processing. Please check your transaction history.'));
          }
        }, 120000);

        console.log('Submitting custody transfer transaction...');

        tx.signAndSend(this.selectedAccount!.address, { signer }, (result) => {
          if (isResolved) return;

          try {
            // Track transaction hash as soon as available
            if (result.txHash && !transactionHash) {
              transactionHash = result.txHash.toString();
              console.log('Transfer transaction submitted with hash:', transactionHash);
            }

            if (result.status.isReady) {
              console.log('Transfer transaction is ready for processing');
            } else if (result.status.isBroadcast) {
              console.log('Transfer transaction broadcasted to network');
            } else if (result.status.isInBlock) {
              console.log('Transfer transaction included in block:', result.status.asInBlock.toString());
              
              // Use enhanced event parsing helper
              const eventData = this.parseContractEvents(result.events, 'CustodyTransferred');
              
              if (eventData.hasFailure) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: false,
                  error: 'Transaction failed during execution. Please check your account balance and transfer permissions.',
                  txHash: transactionHash || result.status.asInBlock.toString(),
                });
                return;
              }

              // Transaction successful - emit events for real-time UI updates
              this.emitTransferEvents(productId, this.selectedAccount!.address, toAddress, location, transactionHash || result.status.asInBlock.toString());

              // Update local state after successful transfer
              this.updateLocalStateAfterTransfer(productId, toAddress);

              isResolved = true;
              clearTimeout(timeout);
              resolve({
                success: true,
                txHash: transactionHash || result.status.asInBlock.toString(),
                message: `Custody transferred successfully to ${toAddress.slice(0, 8)}...`,
              });
              
            } else if (result.status.isFinalized) {
              console.log('Transfer transaction finalized in block:', result.status.asFinalized.toString());
              // Note: We should have already resolved when isInBlock, but this is a safety net
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: true,
                  txHash: transactionHash || result.status.asFinalized.toString(),
                  message: 'Custody transfer completed and finalized',
                });
              }
            } else if (result.isError) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: false,
                  error: 'Transaction failed due to network error. Please check your connection and try again.',
                  txHash: transactionHash,
                });
              }
            } else if (result.dispatchError) {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                
                let errorMessage = 'Transaction failed';
                let userFriendlyMessage = 'Transaction failed due to a contract error.';
                
                if (result.dispatchError.isModule) {
                  try {
                    const decoded = this.api.registry.findMetaError(result.dispatchError.asModule);
                    errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                    
                    // Provide user-friendly error messages
                    if (decoded.name === 'ProductNotFound') {
                      userFriendlyMessage = 'Product not found. Please verify the product ID and try again.';
                    } else if (decoded.name === 'NotCurrentHolder') {
                      userFriendlyMessage = 'You are not the current holder of this product. Only the current holder can transfer custody.';
                    } else if (decoded.name === 'InvalidTransfer') {
                      userFriendlyMessage = 'Invalid transfer. Please check the recipient address and try again.';
                    } else if (decoded.name === 'InsufficientBalance') {
                      userFriendlyMessage = 'Insufficient balance to complete the transaction. Please add funds to your account.';
                    } else {
                      userFriendlyMessage = `Contract error: ${decoded.docs.join(' ') || decoded.name}`;
                    }
                  } catch (decodeError) {
                    console.error('Failed to decode dispatch error:', decodeError);
                  }
                } else if (result.dispatchError.isBadOrigin) {
                  userFriendlyMessage = 'Transaction origin is invalid. Please check your account permissions.';
                } else if (result.dispatchError.isCannotLookup) {
                  userFriendlyMessage = 'Account lookup failed. Please check the recipient address.';
                }
                
                console.error('Transfer dispatch error:', errorMessage);
                
                resolve({
                  success: false,
                  error: userFriendlyMessage,
                  txHash: transactionHash,
                  technicalError: errorMessage,
                });
              }
            }
          } catch (processingError) {
            console.error('Error processing transfer transaction result:', processingError);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve({
                success: false,
                error: 'Error processing transaction result. Please check the transaction manually.',
                txHash: transactionHash,
              });
            }
          }
        }).catch((signError) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            
            let userMessage = 'Failed to sign transaction.';
            if (signError.message?.includes('Cancelled')) {
              userMessage = 'Transaction was cancelled by user.';
            } else if (signError.message?.includes('rejected')) {
              userMessage = 'Transaction was rejected by wallet.';
            } else if (signError.message?.includes('insufficient')) {
              userMessage = 'Insufficient balance to complete transaction.';
            }
            
            console.error('Transfer transaction signing error:', signError);
            reject(new Error(userMessage));
          }
        });
      });

      return result;
    } catch (error) {
      console.error('Failed to transfer custody:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to transfer custody.';
      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          userMessage = error.message;
        } else if (error.message.includes('not authorized') || error.message.includes('not the current holder')) {
          userMessage = error.message;
        } else if (error.message.includes('wallet')) {
          userMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          userMessage = 'Network connection error. Please check your internet connection and try again.';
        } else {
          userMessage = `Transfer failed: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: userMessage,
        technicalError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTransferHistory(productId: number): Promise<Transfer[]> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to blockchain network');
      }
      
      if (!this.isContractReady()) {
        throw new Error('Smart contract not available');
      }

      if (!productId || productId <= 0) {
        throw new Error('Invalid product ID');
      }

      // Check cache first for performance optimization
      const cacheKey = `transfers_${productId}`;
      const cachedTransfers = transferCache.get<Transfer[]>(cacheKey);
      if (cachedTransfers) {
        console.log(`Transfer history for product ${productId} retrieved from cache`);
        return cachedTransfers;
      }

      // Use retry logic with exponential backoff
      const result = await retryBlockchainOperation(async () => {
        // Optimized gas limits
        const gasLimit = this.api.registry.createType('WeightV2', {
          refTime: 3000000000, // Reduced for queries
          proofSize: 131072,
        });

        const { result, output } = await this.contract.query.getTransferHistory(
          this.selectedAccount?.address || '',
          {
            gasLimit,
            storageDepositLimit: null,
          },
          productId
        );

        if (result.isOk && output) {
          const transfersData = output.toHuman() as any[];
          const transfers = transfersData.map((transfer: any) => ({
            productId: parseInt(transfer.productId.replace(/,/g, '')),
            from: transfer.from,
            to: transfer.to,
            timestamp: parseInt(transfer.timestamp.replace(/,/g, '')),
            location: transfer.location,
            verified: transfer.verified,
          }));

          // Cache the result for 5 minutes
          transferCache.set(cacheKey, transfers, 5 * 60 * 1000);
          
          return transfers;
        }

        return [];
      });

      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Failed to get transfer history:', error);
      return [];
    }
  }

  async isAuthorizedManufacturer(address: string): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.isContractReady()) {
        return false;
      }

      if (!address?.trim()) {
        return false;
      }

      // Check cache first for performance optimization
      const cacheKey = `auth_${address}`;
      const cachedAuth = authCache.get<boolean>(cacheKey);
      if (cachedAuth !== null) {
        console.log(`Authorization for ${address} retrieved from cache`);
        return cachedAuth;
      }

      // Use retry logic with exponential backoff
      const result = await retryBlockchainOperation(async () => {
        // Optimized gas limits
        const gasLimit = this.api.registry.createType('WeightV2', {
          refTime: 3000000000, // Reduced for queries
          proofSize: 131072,
        });

        const { result, output } = await this.contract.query.isAuthorizedManufacturer(
          address,
          {
            gasLimit,
            storageDepositLimit: null,
          },
          address
        );

        if (result.isOk && output) {
          const isAuthorized = output.toHuman() as boolean;
          
          // Cache the result for 30 minutes
          authCache.set(cacheKey, isAuthorized, 30 * 60 * 1000);
          
          return isAuthorized;
        }

        return false;
      });

      return result.success ? result.data || false : false;
    } catch (error) {
      console.error('Failed to check manufacturer authorization:', error);
      return false;
    }
  }

  // Performance optimization methods
  
  // Batch product verification for better performance
  async verifyProductsBatch(productIds: number[]): Promise<Map<number, Product | null>> {
    const results = new Map<number, Product | null>();
    const uncachedIds: number[] = [];

    // Check cache for each product
    for (const productId of productIds) {
      const cacheKey = `product_${productId}`;
      const cachedProduct = productCache.get<Product>(cacheKey);
      
      if (cachedProduct) {
        results.set(productId, cachedProduct);
      } else {
        uncachedIds.push(productId);
      }
    }

    // Fetch uncached products in parallel (limited concurrency)
    if (uncachedIds.length > 0) {
      const batchSize = 5; // Limit concurrent requests to avoid overwhelming the network
      const batches = [];
      
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        batches.push(uncachedIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (productId) => {
          const product = await this.verifyProduct(productId);
          results.set(productId, product);
        });

        await Promise.all(batchPromises);
      }
    }

    return results;
  }

  // Cache invalidation methods
  invalidateProductCache(productId: number): void {
    productCache.delete(`product_${productId}`);
    transferCache.delete(`transfers_${productId}`);
    console.log(`Cache invalidated for product ${productId}`);
  }

  invalidateAuthCache(address: string): void {
    authCache.delete(`auth_${address}`);
    console.log(`Auth cache invalidated for address ${address}`);
  }

  clearAllCaches(): void {
    productCache.clear();
    transferCache.clear();
    authCache.clear();
    console.log('All caches cleared');
  }

  // Performance monitoring
  getPerformanceStats(): {
    cacheStats: any;
    connectionStats: any;
    networkInfo: NetworkInfo;
  } {
    return {
      cacheStats: {
        products: productCache.getStats(),
        transfers: transferCache.getStats(),
        auth: authCache.getStats(),
      },
      connectionStats: connectionPool.getStats(),
      networkInfo: this.getNetworkStatus(),
    };
  }

  // Enhanced health check
  async performHealthCheck(): Promise<HealthCheckResult> {
    try {
      const isConnected = this.isConnected();
      const isContractReady = this.isContractReady();
      const poolHealthy = await connectionPool.healthCheck();
      
      // Test a simple query to verify functionality
      let queryTest = false;
      if (isConnected && isContractReady) {
        try {
          // Try to query a non-existent product (should return null without error)
          await this.verifyProduct(999999);
          queryTest = true;
        } catch (error) {
          console.warn('Query test failed:', error);
        }
      }

      const overall = isConnected && isContractReady && poolHealthy && queryTest;

      return {
        overall,
        details: {
          apiConnected: isConnected,
          contractReady: isContractReady,
          connectionPoolHealthy: poolHealthy,
          queryTest,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        overall: false,
        details: {
          apiConnected: false,
          contractReady: false,
          connectionPoolHealthy: false,
          queryTest: false,
        },
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Connection management methods
  private setupConnectionHandlers(): void {
    if (!this.wsProvider) return;

    this.wsProvider.on('connected', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.wsProvider.on('disconnected', () => {
      console.log('WebSocket disconnected');
      this.updateNetworkStatus(NetworkStatus.DISCONNECTED);
      this.scheduleReconnect();
    });

    this.wsProvider.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.updateNetworkStatus(NetworkStatus.ERROR, { error: error.message });
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateNetworkStatus(NetworkStatus.ERROR, { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    this.updateNetworkStatus(NetworkStatus.RECONNECTING);
    
    setTimeout(async () => {
      try {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await this.initialize();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff, max 30s
        this.scheduleReconnect();
      }
    }, this.reconnectDelay);
  }

  private startNetworkMonitoring(): void {
    if (!this.api) return;

    // Subscribe to new block headers for network status monitoring
    this.blockSubscription = this.api.rpc.chain.subscribeNewHeads((header) => {
      this.updateNetworkStatus(NetworkStatus.CONNECTED, {
        blockNumber: header.number.toNumber()
      });
    });
  }

  private updateNetworkStatus(status: NetworkStatus, updates?: Partial<NetworkInfo>): void {
    this.networkInfo = {
      ...this.networkInfo,
      status,
      lastUpdate: Date.now(),
      ...updates
    };

    // Notify all listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(this.networkInfo);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Public methods for network status monitoring
  getNetworkStatus(): NetworkInfo {
    return { ...this.networkInfo };
  }

  onNetworkStatusChange(listener: (info: NetworkInfo) => void): () => void {
    this.statusListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  // Real-time event listening for contract events
  private contractEventSubscription: any = null;

  startContractEventListening(): void {
    if (!this.api || !this.contract || this.contractEventSubscription) {
      return;
    }

    try {
      // Subscribe to contract events
      this.contractEventSubscription = this.api.query.system.events((events) => {
        events.forEach((record) => {
          const { event } = record;
          
          if (event.method === 'ContractEmitted') {
            try {
              const contractEvent = event.data[1];
              const decoded = this.contract!.abi.decodeEvent(contractEvent as any);
              
              if (decoded) {
                this.handleContractEvent(decoded);
              }
            } catch (error) {
              console.error('Error decoding contract event:', error);
            }
          }
        });
      });

      console.log('Contract event listening started');
    } catch (error) {
      console.error('Failed to start contract event listening:', error);
    }
  }

  stopContractEventListening(): void {
    if (this.contractEventSubscription) {
      this.contractEventSubscription();
      this.contractEventSubscription = null;
      console.log('Contract event listening stopped');
    }
  }

  private handleContractEvent(event: any): void {
    try {
      const eventName = event.identifier;
      const eventData = event.args;

      console.log('Contract event received:', eventName, eventData);

      switch (eventName) {
        case 'CustodyTransferred':
          this.handleCustodyTransferredEvent(eventData);
          break;
        case 'ProductRegistered':
          this.handleProductRegisteredEvent(eventData);
          break;
        default:
          console.log('Unhandled contract event:', eventName);
      }
    } catch (error) {
      console.error('Error handling contract event:', error);
    }
  }

  private handleCustodyTransferredEvent(eventData: any): void {
    try {
      const productId = eventData[0]?.toNumber?.() || eventData[0];
      const from = eventData[1]?.toString?.() || eventData[1];
      const to = eventData[2]?.toString?.() || eventData[2];
      const location = eventData[3]?.toString?.() || eventData[3];

      // Emit custom event for UI updates
      const transferEvent = new CustomEvent('blockchainCustodyTransferred', {
        detail: {
          productId,
          from,
          to,
          location,
          timestamp: Date.now(),
        },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(transferEvent);
      }

      console.log('Custody transferred event processed:', { productId, from, to, location });
    } catch (error) {
      console.error('Error handling custody transferred event:', error);
    }
  }

  private handleProductRegisteredEvent(eventData: any): void {
    try {
      const productId = eventData[0]?.toNumber?.() || eventData[0];
      const manufacturer = eventData[1]?.toString?.() || eventData[1];
      const name = eventData[2]?.toString?.() || eventData[2];
      const batchNumber = eventData[3]?.toString?.() || eventData[3];

      // Emit custom event for UI updates
      const registrationEvent = new CustomEvent('blockchainProductRegistered', {
        detail: {
          productId,
          manufacturer,
          name,
          batchNumber,
          timestamp: Date.now(),
        },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(registrationEvent);
      }

      console.log('Product registered event processed:', { productId, manufacturer, name, batchNumber });
    } catch (error) {
      console.error('Error handling product registered event:', error);
    }
  }

  async reconnect(): Promise<void> {
    if (this.api) {
      await this.disconnect();
    }
    this.reconnectAttempts = 0;
    await this.initialize();
  }

  async disconnect(): Promise<void> {
    try {
      // Stop contract event listening
      this.stopContractEventListening();

      // Unsubscribe from block updates
      if (this.blockSubscription) {
        this.blockSubscription();
        this.blockSubscription = null;
      }

      // Disconnect API
      if (this.api) {
        await this.api.disconnect();
        this.api = null;
      }

      // Disconnect WebSocket provider
      if (this.wsProvider) {
        await this.wsProvider.disconnect();
        this.wsProvider = null;
      }

      this.contract = null;
      this.updateNetworkStatus(NetworkStatus.DISCONNECTED);
      
      console.log('Blockchain service disconnected');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  // Gas estimation helper method
  private async estimateGas(
    contractMethod: string,
    args: any[],
    caller?: string
  ): Promise<any> {
    try {
      if (!this.contract || !this.api) {
        throw new Error('Contract or API not available');
      }

      const callerAddress = caller || this.selectedAccount?.address || '';
      
      // Create a query with high gas limits for estimation
      const estimationGasLimit = this.api.registry.createType('WeightV2', {
        refTime: 50000000000,
        proofSize: 1048576,
      });

      // Perform dry run
      const queryResult = await (this.contract.query as any)[contractMethod](
        callerAddress,
        {
          gasLimit: estimationGasLimit,
          storageDepositLimit: null,
        },
        ...args
      );

      if (queryResult.result.isErr) {
        throw new Error(`Gas estimation failed: ${queryResult.result.asErr.toString()}`);
      }

      // Return gas with safety buffer
      const estimatedGas = queryResult.gasRequired;
      return this.api.registry.createType('WeightV2', {
        refTime: estimatedGas.refTime.toBn().muln(2), // 2x buffer
        proofSize: estimatedGas.proofSize.toBn().muln(2),
      });
    } catch (error) {
      console.warn(`Gas estimation failed for ${contractMethod}:`, error);
      // Return conservative fallback gas limits
      return this.api!.registry.createType('WeightV2', {
        refTime: 20000000000,
        proofSize: 262144,
      });
    }
  }

  // Transfer validation helper
  private validateTransferData(data: {
    productId: number;
    toAddress: string;
    location: string;
  }): string[] {
    const errors: string[] = [];

    if (!data.productId || data.productId <= 0) {
      errors.push('Invalid product ID');
    }

    if (!data.toAddress?.trim()) {
      errors.push('Recipient address is required');
    } else {
      // Basic address format validation
      if (data.toAddress.length < 47 || data.toAddress.length > 48) {
        errors.push('Invalid recipient address format');
      }
    }

    if (!data.location?.trim()) {
      errors.push('Location is required');
    } else if (data.location.trim().length < 3) {
      errors.push('Location must be at least 3 characters long');
    }

    return errors;
  }

  // Enhanced authorization validation for transfers
  private async validateTransferAuthorization(
    productId: number,
    fromAddress: string
  ): Promise<{ authorized: boolean; error?: string }> {
    try {
      // First, verify the product exists
      const product = await this.verifyProduct(productId);
      if (!product) {
        return {
          authorized: false,
          error: 'Product not found. Please verify the product ID.',
        };
      }

      // Check if the caller is the current holder
      if (product.currentHolder !== fromAddress) {
        return {
          authorized: false,
          error: 'You are not the current holder of this product. Only the current holder can transfer custody.',
        };
      }

      // Additional checks can be added here (e.g., product not expired, not recalled, etc.)
      const now = Date.now();
      if (product.expiryDate && product.expiryDate < now) {
        return {
          authorized: false,
          error: 'Cannot transfer expired product. Please check the expiry date.',
        };
      }

      return { authorized: true };
    } catch (error) {
      console.error('Error validating transfer authorization:', error);
      return {
        authorized: false,
        error: 'Unable to validate transfer authorization. Please try again.',
      };
    }
  }

  // Emit events for real-time UI updates
  private emitTransferEvents(
    productId: number,
    fromAddress: string,
    toAddress: string,
    location: string,
    txHash: string
  ): void {
    try {
      // Create custom events for the frontend to listen to
      const transferEvent = new CustomEvent('custodyTransferred', {
        detail: {
          productId,
          from: fromAddress,
          to: toAddress,
          location,
          timestamp: Date.now(),
          txHash,
        },
      });

      const statusUpdateEvent = new CustomEvent('productStatusUpdate', {
        detail: {
          productId,
          newHolder: toAddress,
          txHash,
          timestamp: Date.now(),
        },
      });

      // Dispatch events to the window for global listening
      if (typeof window !== 'undefined') {
        window.dispatchEvent(transferEvent);
        window.dispatchEvent(statusUpdateEvent);
      }

      console.log('Transfer events emitted for real-time UI updates');
    } catch (error) {
      console.error('Error emitting transfer events:', error);
    }
  }

  // Update local state after successful transfer
  private updateLocalStateAfterTransfer(productId: number, newHolder: string): void {
    try {
      // This method can be used to update any local caches or state
      // For now, we'll just log the update
      console.log(`Local state updated: Product ${productId} transferred to ${newHolder}`);
      
      // In a more complex implementation, you might:
      // 1. Update a local product cache
      // 2. Invalidate related queries
      // 3. Update UI state directly
      // 4. Trigger notifications
      
      // Example of triggering a notification event
      const notificationEvent = new CustomEvent('transferNotification', {
        detail: {
          type: 'success',
          title: 'Transfer Successful',
          message: `Product ${productId} has been transferred to ${newHolder.slice(0, 8)}...`,
          timestamp: Date.now(),
        },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(notificationEvent);
      }
    } catch (error) {
      console.error('Error updating local state after transfer:', error);
    }
  }

  // Enhanced event parsing helper
  private parseContractEvents(events: any[], expectedEventName?: string): {
    contractEvents: any[];
    hasFailure: boolean;
    productId?: number;
  } {
    const contractEvents: any[] = [];
    let hasFailure = false;
    let productId: number | undefined;

    events.forEach(({ event, phase }) => {
      // Check for transaction failure
      if (event.method === 'ExtrinsicFailed') {
        hasFailure = true;
        console.error('Transaction failed:', event.data.toString());
        return;
      }

      // Parse contract events
      if (event.method === 'ContractEmitted') {
        try {
          const contractEvent = event.data[1];
          const decoded = this.contract!.abi.decodeEvent(contractEvent as any);
          
          contractEvents.push({
            identifier: decoded.event.identifier,
            args: decoded.args,
            phase: phase.toString(),
          });

          // Extract product ID from ProductRegistered event
          if (decoded.event.identifier === 'ProductRegistered') {
            productId = decoded.args[0].toNumber();
          }

          console.log('Contract event decoded:', {
            identifier: decoded.event.identifier,
            args: decoded.args.map((arg: any) => arg.toString()),
            phase: phase.toString(),
          });
        } catch (decodeError) {
          console.warn('Failed to decode contract event:', decodeError);
        }
      }
    });

    return {
      contractEvents,
      hasFailure,
      productId,
    };
  }

  // Product registration validation helper
  private validateProductRegistrationData(data: {
    name: string;
    batchNumber: string;
    manufacturerName: string;
    quantity: number;
    mfgDate: number;
    expiryDate: number;
    category: string;
  }): string[] {
    const errors: string[] = [];
    const { name, batchNumber, manufacturerName, quantity, mfgDate, expiryDate, category } = data;

    // Required field validation
    if (!name?.trim()) errors.push('Product name is required');
    if (!batchNumber?.trim()) errors.push('Batch number is required');
    if (!manufacturerName?.trim()) errors.push('Manufacturer name is required');
    if (!category?.trim()) errors.push('Product category is required');

    // Length validation
    if (name && name.length > 100) errors.push('Product name cannot exceed 100 characters');
    if (batchNumber && batchNumber.length > 50) errors.push('Batch number cannot exceed 50 characters');
    if (manufacturerName && manufacturerName.length > 100) errors.push('Manufacturer name cannot exceed 100 characters');
    if (category && category.length > 50) errors.push('Category cannot exceed 50 characters');

    // Quantity validation
    if (quantity <= 0) errors.push('Quantity must be greater than 0');
    if (quantity > 1000000) errors.push('Quantity cannot exceed 1,000,000 units');
    if (!Number.isInteger(quantity)) errors.push('Quantity must be a whole number');

    // Date validation
    if (mfgDate <= 0) errors.push('Manufacturing date is required');
    if (expiryDate <= 0) errors.push('Expiry date is required');
    if (mfgDate >= expiryDate) errors.push('Expiry date must be after manufacturing date');

    // Reasonable date range validation
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const tenYearsFromNow = now + (10 * 365 * 24 * 60 * 60 * 1000);

    if (mfgDate < oneYearAgo) errors.push('Manufacturing date cannot be more than 1 year in the past');
    if (expiryDate > tenYearsFromNow) errors.push('Expiry date cannot be more than 10 years in the future');

    // Batch number format validation (alphanumeric with hyphens/underscores)
    if (batchNumber && !/^[a-zA-Z0-9_-]+$/.test(batchNumber)) {
      errors.push('Batch number can only contain letters, numbers, hyphens, and underscores');
    }

    return errors;
  }

  // Enhanced utility methods
  isConnected(): boolean {
    return this.api !== null && this.networkInfo.status === NetworkStatus.CONNECTED;
  }

  isContractReady(): boolean {
    return this.contract !== null && this.isConnected();
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  getNetworkEndpoint(): string {
    return WS_PROVIDER;
  }

  getChainInfo(): { name?: string; blockNumber?: number } {
    return {
      name: this.networkInfo.chainName,
      blockNumber: this.networkInfo.blockNumber
    };
  }

  // Get transaction status and details
  async getTransactionStatus(txHash: string): Promise<{
    isFinalized: boolean;
    isInBlock: boolean;
    blockHash?: string;
    events?: any[];
    error?: string;
  }> {
    try {
      if (!this.api || !this.isConnected()) {
        throw new Error('Not connected to blockchain');
      }

      // Get transaction details
      const signedBlock = await this.api.rpc.chain.getBlock(txHash);
      const blockHash = signedBlock.block.header.hash.toString();
      
      // Get block events
      const events = await this.api.query.system.events.at(blockHash);
      
      return {
        isFinalized: true,
        isInBlock: true,
        blockHash,
        events: events.toHuman(),
      };
    } catch (error) {
      return {
        isFinalized: false,
        isInBlock: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Enhanced method to check if a product exists before registration
  async checkProductExists(batchNumber: string, manufacturerAddress: string): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.isContractReady()) {
        return false;
      }

      // This would require a contract method to check by batch number
      // For now, we'll implement this as a placeholder
      // In a real implementation, you'd add a contract method like `getProductByBatch`
      
      console.log(`Checking if product exists: batch ${batchNumber}, manufacturer ${manufacturerAddress}`);
      return false; // Placeholder - always return false for now
    } catch (error) {
      console.error('Error checking product existence:', error);
      return false;
    }
  }

  // Health check method
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      if (!this.api || !this.isConnected()) {
        return {
          healthy: false,
          details: {
            api: !!this.api,
            connected: this.isConnected(),
            status: this.networkInfo.status,
            error: this.networkInfo.error
          }
        };
      }

      // Test basic API functionality
      const [health, chain, blockNumber] = await Promise.all([
        this.api.rpc.system.health(),
        this.api.rpc.system.chain(),
        this.api.rpc.chain.getHeader().then(h => h.number.toNumber())
      ]);

      return {
        healthy: true,
        details: {
          peers: health.peers.toNumber(),
          isSyncing: health.isSyncing.toHuman(),
          shouldHavePeers: health.shouldHavePeers.toHuman(),
          chain: chain.toString(),
          blockNumber,
          contractReady: this.isContractReady(),
          networkStatus: this.networkInfo
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          networkStatus: this.networkInfo
        }
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;