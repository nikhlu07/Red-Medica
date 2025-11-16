import { ethers } from 'ethers';
import type { 
  Product, 
  Transfer, 
  TransactionResult, 
  ProductRegistrationResult 
} from '../types/blockchain';

// Contract configuration from environment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const NETWORK_RPC = import.meta.env.VITE_NETWORK_RPC || 'https://rpc.api.moonbase.moonbeam.network';
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '1287');

// Contract ABI for the deployed Medical Supply Chain contract
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "InvalidTransfer",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAuthorizedManufacturer",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotCurrentHolder",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProductNotFound",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "CustodyTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      }
    ],
    "name": "ManufacturerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "batchNumber",
        "type": "string"
      }
    ],
    "name": "ProductRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      }
    ],
    "name": "authorizeManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedManufacturers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNextProductId",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      }
    ],
    "name": "getProductsByManufacturer",
    "outputs": [
      {
        "internalType": "uint32[]",
        "name": "",
        "type": "uint32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      }
    ],
    "name": "getTransferCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      }
    ],
    "name": "getTransferHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "productId",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "verified",
            "type": "bool"
          }
        ],
        "internalType": "struct MedicalSupplyChain.Transfer[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "isAuthorizedManufacturer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextProductId",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      }
    ],
    "name": "productExistsCheck",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "batchNumber",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "manufacturerName",
        "type": "string"
      },
      {
        "internalType": "uint32",
        "name": "quantity",
        "type": "uint32"
      },
      {
        "internalType": "uint64",
        "name": "mfgDate",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "expiryDate",
        "type": "uint64"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      }
    ],
    "name": "registerProduct",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "transferCustody",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "productId",
        "type": "uint32"
      }
    ],
    "name": "verifyProduct",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "id",
            "type": "uint32"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "batchNumber",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "manufacturer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "manufacturerName",
            "type": "string"
          },
          {
            "internalType": "uint32",
            "name": "quantity",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "mfgDate",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expiryDate",
            "type": "uint64"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "currentHolder",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isAuthentic",
            "type": "bool"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct MedicalSupplyChain.Product",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

import { errorHandlingService } from './errorHandlingService';
import { BlockchainErrorHandler, ErrorType } from '../utils/errorHandler';

class MoonbeamBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private connectedAccount: string | null = null;
  private networkHealthCheckInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    const result = await errorHandlingService.handleWithRecovery(
      async () => {
        console.log('🌐 Initializing Moonbeam blockchain service...');
        console.log('📋 Configuration:', {
          CONTRACT_ADDRESS,
          NETWORK_RPC,
          CHAIN_ID
        });
        
        // Validate configuration
        if (!CONTRACT_ADDRESS) {
          throw new Error('Contract address not configured. Please check your environment variables.');
        }
        
        if (!NETWORK_RPC) {
          throw new Error('Network RPC URL not configured. Please check your environment variables.');
        }

        // Check network connectivity (but don't fail if it's not available)
        const isConnected = await errorHandlingService.handleNetworkConnectivity();
        if (!isConnected) {
          console.warn('Network connectivity check failed, but will attempt MetaMask connection anyway');
        }
        
        console.log('🔗 Initializing provider...');
        // Initialize provider with enhanced error handling
        this.provider = new ethers.JsonRpcProvider(NETWORK_RPC);
        
        console.log('🌐 Testing network connection...');
        // Test connection with enhanced timeout handling
        const network = await this.testNetworkConnection();
        console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Verify we're connecting to the right network
        if (Number(network.chainId) !== CHAIN_ID) {
          console.warn(`⚠️ Network mismatch: Expected ${CHAIN_ID}, got ${network.chainId}`);
        }
        
        console.log('📄 Initializing contract...');
        // Initialize contract (read-only initially)
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
        console.log(`📄 Contract initialized at: ${CONTRACT_ADDRESS}`);
        
        console.log('🔍 Testing contract connection...');
        // Test contract connection with enhanced error handling
        await this.testContractConnection();
        
        // Start network health monitoring
        this.startNetworkHealthMonitoring();
        
        console.log('✅ Moonbeam service initialization complete');
        return true;
      },
      {
        maxRetries: 3,
        retryDelay: 2000,
        exponentialBackoff: true,
        notifyUser: true,
        logError: true,
        context: { service: 'MoonbeamBlockchain', operation: 'initialize' },
      }
    );

    if (!result.success) {
      throw result.error || new Error('Failed to initialize Moonbeam blockchain service');
    }
  }

  private async testNetworkConnection(): Promise<any> {
    return errorHandlingService.handleWithRecovery(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const network = await this.provider!.getNetwork();
          clearTimeout(timeoutId);
          return network;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true,
        notifyUser: false,
        logError: true,
        context: { operation: 'networkConnection' },
      }
    ).then(result => {
      if (!result.success) {
        throw result.error || new Error('Network connection test failed');
      }
      return result.data;
    });
  }

  private async testContractConnection(): Promise<void> {
    return errorHandlingService.recoverFromContractError(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const nextProductId = await this.contract!.getNextProductId();
          clearTimeout(timeoutId);
          console.log(`✅ Contract test successful - Next product ID: ${nextProductId}`);
          return nextProductId;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      'ContractCallFailed',
      { operation: 'contractTest' }
    ).then(result => {
      if (!result.success) {
        console.warn('⚠️ Contract test failed, but continuing with initialization');
        // Don't throw here - we can still proceed with wallet connection
      }
    });
  }

  private startNetworkHealthMonitoring(): void {
    // Check network health every 30 seconds
    this.networkHealthCheckInterval = setInterval(async () => {
      try {
        if (this.provider) {
          await this.provider.getBlockNumber();
        }
      } catch (error) {
        console.warn('Network health check failed:', error);
        // Could trigger reconnection logic here if needed
      }
    }, 30000);
  }

  private stopNetworkHealthMonitoring(): void {
    if (this.networkHealthCheckInterval) {
      clearInterval(this.networkHealthCheckInterval);
      this.networkHealthCheckInterval = null;
    }
  }

  async connectWallet(): Promise<string[]> {
    const result = await errorHandlingService.handleWithRecovery(
      async () => {
        console.log('🔍 Checking for MetaMask...');
        if (!window.ethereum) {
          const error = new Error('MetaMask not found. Please install MetaMask extension.');
          error.name = 'MetaMaskNotFound';
          throw error;
        }

        console.log('📞 Requesting account access...');
        // Request account access with timeout
        const accounts = await this.requestAccountAccess();

        console.log('📋 Received accounts:', accounts);
        if (accounts.length === 0) {
          throw new Error('No accounts found. Please create an account in MetaMask.');
        }

        console.log('🔄 Switching to Moonbase Alpha...');
        // Switch to Moonbase Alpha with enhanced error handling
        await this.switchToMoonbaseAlphaWithRetry();

        console.log('🔗 Setting up signer...');
        // Set up signer with error handling
        await this.setupSignerWithErrorHandling();

        console.log('📄 Updating contract with signer...');
        // Update contract with signer for transactions
        if (this.contract && this.signer) {
          this.contract = this.contract.connect(this.signer);
          console.log('✅ Contract connected with signer');
        } else {
          console.warn('⚠️ Contract or signer not available');
        }

        console.log(`✅ Wallet connected: ${this.connectedAccount}`);
        return accounts;
      },
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: false,
        notifyUser: true,
        logError: true,
        context: { service: 'MoonbeamBlockchain', operation: 'connectWallet' },
      }
    );

    if (!result.success) {
      // Handle specific wallet errors
      const error = result.error;
      if (error?.type === ErrorType.WALLET_EXTENSION_NOT_FOUND) {
        throw new Error('MetaMask extension not found. Please install MetaMask and refresh the page.');
      } else if (error?.type === ErrorType.WALLET_TRANSACTION_REJECTED) {
        throw new Error('Connection rejected by user. Please approve the connection in MetaMask.');
      }
      
      throw result.error || new Error('Failed to connect wallet');
    }

    return result.data;
  }

  private async requestAccountAccess(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Account access request timeout. Please check MetaMask.'));
      }, 30000); // 30 second timeout

      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts: string[]) => {
          clearTimeout(timeout);
          resolve(accounts);
        })
        .catch((error: any) => {
          clearTimeout(timeout);
          if (error.code === 4001) {
            const rejectionError = new Error('Connection rejected by user. Please approve the connection in MetaMask.');
            rejectionError.name = 'UserRejectedRequest';
            reject(rejectionError);
          } else if (error.code === -32002) {
            reject(new Error('MetaMask is already processing a request. Please check MetaMask and try again.'));
          } else {
            reject(error);
          }
        });
    });
  }

  private async setupSignerWithErrorHandling(): Promise<void> {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await browserProvider.getSigner();
      this.connectedAccount = await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to setup signer:', error);
      throw new Error('Failed to setup transaction signer. Please ensure MetaMask is unlocked.');
    }
  }

  private async switchToMoonbaseAlphaWithRetry(): Promise<void> {
    return errorHandlingService.handleWithRecovery(
      () => this.switchToMoonbaseAlpha(),
      {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: false,
        notifyUser: false,
        logError: true,
        context: { operation: 'networkSwitch' },
      }
    ).then(result => {
      if (!result.success) {
        throw result.error || new Error('Failed to switch to Moonbase Alpha network');
      }
    });
  }

  private async switchToMoonbaseAlpha(): Promise<void> {
    try {
      console.log('🌐 Configuring Moonbase Alpha network...');
      
      // Moonbase Alpha network configuration
      const moonbaseAlpha = {
        chainId: '0x507', // 1287 in hex
        chainName: 'Moonbase Alpha',
        nativeCurrency: {
          name: 'DEV',
          symbol: 'DEV',
          decimals: 18,
        },
        rpcUrls: [NETWORK_RPC],
        blockExplorerUrls: ['https://moonbase.moonscan.io/'],
      };

      console.log('🔄 Attempting to switch to Moonbase Alpha...');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: moonbaseAlpha.chainId }],
        });
        console.log('✅ Successfully switched to existing Moonbase Alpha network');
      } catch (switchError: any) {
        console.log('⚠️ Network not found, attempting to add...', switchError.code);
        
        if (switchError.code === 4902) {
          console.log('➕ Adding Moonbase Alpha network to MetaMask...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [moonbaseAlpha],
          });
          console.log('✅ Successfully added and switched to Moonbase Alpha network');
        } else if (switchError.code === 4001) {
          throw new Error('Network switch rejected by user. Please approve the network switch in MetaMask.');
        } else {
          console.error('❌ Unexpected network switch error:', switchError);
          throw new Error(`Failed to switch network: ${switchError.message || 'Unknown error'}`);
        }
      }

      // Verify we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔍 Current chain ID:', chainId);
      
      if (chainId !== moonbaseAlpha.chainId) {
        throw new Error(`Network switch failed. Expected chain ID ${moonbaseAlpha.chainId}, got ${chainId}`);
      }

      console.log('✅ Successfully connected to Moonbase Alpha network');
    } catch (error: any) {
      console.error('❌ Failed to switch network:', error);
      
      if (error.message?.includes('rejected')) {
        throw error; // Re-throw user rejection errors as-is
      } else {
        throw new Error(`Network configuration failed: ${error.message || 'Unknown error'}`);
      }
    }
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
    const result = await errorHandlingService.recoverFromTransactionFailure(
      async () => {
        if (!this.contract || !this.signer) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        console.log('📝 Registering product:', { name, batchNumber, manufacturerName });

        // Check if user is authorized manufacturer with retry
        const authResult = await errorHandlingService.recoverFromContractError(
          () => this.contract!.isAuthorizedManufacturer(this.connectedAccount!),
          'AuthorizationCheck'
        );

        if (!authResult.success || !authResult.data) {
          const error = new Error('You are not authorized as a manufacturer. Please contact the administrator.');
          error.name = 'NotAuthorizedManufacturer';
          throw error;
        }

        // Estimate gas with enhanced error handling
        const gasEstimate = await errorHandlingService.handleGasEstimationError(
          () => this.contract!.registerProduct.estimateGas(
            name,
            batchNumber,
            manufacturerName,
            quantity,
            mfgDate,
            expiryDate,
            category
          ),
          'registerProduct',
          [name, batchNumber, manufacturerName, quantity, mfgDate, expiryDate, category]
        );

        if (!gasEstimate.success) {
          throw gasEstimate.error || new Error('Gas estimation failed');
        }

        // Execute transaction with enhanced monitoring
        const tx = await this.executeTransactionWithMonitoring(
          () => this.contract!.registerProduct(
            name,
            batchNumber,
            manufacturerName,
            quantity,
            mfgDate,
            expiryDate,
            category,
            {
              gasLimit: Math.floor(Number(gasEstimate.data) * 1.2), // Add 20% buffer
            }
          ),
          'Product Registration'
        );

        console.log('⏳ Transaction submitted:', tx.hash);

        // Wait for confirmation with timeout
        const receipt = await this.waitForTransactionWithTimeout(tx, 120000); // 2 minutes timeout
        
        if (receipt.status === 1) {
          // Parse events to get product ID
          const productId = this.parseProductRegistrationEvent(receipt);

          console.log('✅ Product registered successfully:', { productId, txHash: tx.hash });

          return {
            success: true,
            productId,
            txHash: tx.hash,
            message: `Product "${name}" registered successfully${productId ? ` with ID: ${productId}` : ''}`,
          };
        } else {
          throw new Error('Transaction failed - receipt status indicates failure');
        }
      }
    );

    if (!result.success) {
      console.error('❌ Failed to register product:', result.error);
      
      let errorMessage = 'Failed to register product';
      const error = result.error;
      
      if (error?.type === ErrorType.CONTRACT_UNAUTHORIZED) {
        errorMessage = 'You are not authorized as a manufacturer. Please contact the administrator.';
      } else if (error?.type === ErrorType.WALLET_TRANSACTION_REJECTED) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error?.type === ErrorType.WALLET_INSUFFICIENT_BALANCE) {
        errorMessage = 'Insufficient balance to complete transaction';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        technicalError: error?.technicalDetails,
      };
    }

    return result.data;
  }

  private async executeTransactionWithMonitoring(
    transactionFn: () => Promise<any>,
    operationName: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const tx = await transactionFn();
      
      console.log(`⏳ ${operationName} transaction submitted:`, {
        hash: tx.hash,
        gasLimit: tx.gasLimit?.toString(),
        gasPrice: tx.gasPrice?.toString(),
      });
      
      return tx;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operationName} transaction failed after ${duration}ms:`, error);
      throw error;
    }
  }

  private async waitForTransactionWithTimeout(tx: any, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transaction timeout after ${timeoutMs / 1000} seconds. Transaction may still be processing.`));
      }, timeoutMs);

      tx.wait()
        .then((receipt: any) => {
          clearTimeout(timeout);
          resolve(receipt);
        })
        .catch((error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private parseProductRegistrationEvent(receipt: any): number | null {
    try {
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'ProductRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract!.interface.parseLog(event);
        return Number(parsed?.args[0]);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to parse product registration event:', error);
      return null;
    }
  }

  async verifyProduct(productId: number): Promise<Product | null> {
    const result = await errorHandlingService.recoverFromContractError(
      async () => {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }

        if (!productId || productId <= 0) {
          throw new Error('Invalid product ID provided');
        }

        console.log('🔍 Verifying product:', productId);

        // Add timeout to prevent hanging queries
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const productData = await this.contract.verifyProduct(productId);
          clearTimeout(timeoutId);
          
          if (productData && Number(productData.id) > 0) {
            const product: Product = {
              id: Number(productData.id),
              name: productData.name,
              batchNumber: productData.batchNumber,
              manufacturer: productData.manufacturer,
              manufacturerName: productData.manufacturerName,
              quantity: Number(productData.quantity),
              mfgDate: Number(productData.mfgDate),
              expiryDate: Number(productData.expiryDate),
              category: productData.category,
              currentHolder: productData.currentHolder,
              isAuthentic: productData.isAuthentic,
              createdAt: Number(productData.createdAt),
            };

            console.log('✅ Product verified:', product);
            return product;
          }

          // Product not found
          console.log('⚠️ Product not found:', productId);
          return null;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      'ProductVerification',
      { productId, operation: 'verifyProduct' }
    );

    if (!result.success) {
      console.error('❌ Failed to verify product:', result.error);
      
      // Don't throw error for product verification - return null to indicate not found
      // This allows the UI to show appropriate "product not found" messages
      if (result.error?.type === ErrorType.PRODUCT_NOT_FOUND) {
        return null;
      }
      
      // For other errors, we still return null but log the issue
      console.warn('Product verification failed due to technical error:', result.error?.message);
      return null;
    }

    return result.data;
  }

  async transferCustody(
    productId: number,
    toAddress: string,
    location: string
  ): Promise<TransactionResult> {
    const result = await errorHandlingService.recoverFromTransactionFailure(
      async () => {
        if (!this.contract || !this.signer) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        // Validate inputs
        if (!productId || productId <= 0) {
          throw new Error('Invalid product ID provided');
        }

        if (!toAddress || !ethers.isAddress(toAddress)) {
          throw new Error('Invalid recipient address provided');
        }

        if (!location || location.trim().length === 0) {
          throw new Error('Location is required for custody transfer');
        }

        console.log('🔄 Transferring custody:', { productId, toAddress, location });

        // Verify current ownership before attempting transfer
        const ownershipResult = await errorHandlingService.recoverFromContractError(
          async () => {
            const product = await this.contract!.verifyProduct(productId);
            if (!product || Number(product.id) === 0) {
              throw new Error('Product not found');
            }
            
            if (product.currentHolder.toLowerCase() !== this.connectedAccount!.toLowerCase()) {
              throw new Error('You are not the current holder of this product');
            }
            
            return product;
          },
          'OwnershipVerification',
          { productId, currentAccount: this.connectedAccount }
        );

        if (!ownershipResult.success) {
          throw ownershipResult.error || new Error('Failed to verify product ownership');
        }

        // Estimate gas with enhanced error handling
        const gasEstimate = await errorHandlingService.handleGasEstimationError(
          () => this.contract!.transferCustody.estimateGas(productId, toAddress, location),
          'transferCustody',
          [productId, toAddress, location]
        );

        if (!gasEstimate.success) {
          throw gasEstimate.error || new Error('Gas estimation failed');
        }

        // Execute transaction with enhanced monitoring
        const tx = await this.executeTransactionWithMonitoring(
          () => this.contract!.transferCustody(
            productId,
            toAddress,
            location,
            {
              gasLimit: Math.floor(Number(gasEstimate.data) * 1.2),
            }
          ),
          'Custody Transfer'
        );

        console.log('⏳ Transfer transaction submitted:', tx.hash);

        // Wait for confirmation with timeout
        const receipt = await this.waitForTransactionWithTimeout(tx, 120000);
        
        if (receipt.status === 1) {
          console.log('✅ Custody transferred successfully');

          return {
            success: true,
            txHash: tx.hash,
            message: `Custody transferred successfully to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
          };
        } else {
          throw new Error('Transaction failed - receipt status indicates failure');
        }
      }
    );

    if (!result.success) {
      console.error('❌ Failed to transfer custody:', result.error);
      
      let errorMessage = 'Failed to transfer custody';
      const error = result.error;
      
      if (error?.message?.includes('NotCurrentHolder') || error?.message?.includes('not the current holder')) {
        errorMessage = 'You are not the current holder of this product';
      } else if (error?.type === ErrorType.WALLET_TRANSACTION_REJECTED) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error?.type === ErrorType.WALLET_INSUFFICIENT_BALANCE) {
        errorMessage = 'Insufficient balance to complete transaction';
      } else if (error?.type === ErrorType.PRODUCT_NOT_FOUND) {
        errorMessage = 'Product not found or invalid product ID';
      } else if (error?.message?.includes('Invalid')) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        technicalError: error?.technicalDetails,
      };
    }

    return result.data;
  }

  async getTransferHistory(productId: number): Promise<Transfer[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log('📋 Getting transfer history for product:', productId);

      const transfers = await this.contract.getTransferHistory(productId);
      
      return transfers.map((transfer: any) => ({
        productId: Number(transfer.productId),
        from: transfer.from,
        to: transfer.to,
        timestamp: Number(transfer.timestamp),
        location: transfer.location,
        verified: transfer.verified,
      }));

    } catch (error) {
      console.error('❌ Failed to get transfer history:', error);
      return [];
    }
  }

  async isAuthorizedManufacturer(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        return false;
      }

      return await this.contract.isAuthorizedManufacturer(address);
    } catch (error) {
      console.error('❌ Failed to check manufacturer status:', error);
      return false;
    }
  }

  // Utility methods
  isConnected(): boolean {
    return !!this.provider;
  }

  isWalletConnected(): boolean {
    return !!this.signer && !!this.connectedAccount;
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  getNetworkEndpoint(): string {
    return NETWORK_RPC;
  }

  getConnectedAccount(): string | null {
    return this.connectedAccount;
  }

  async getNextProductId(): Promise<number> {
    const result = await errorHandlingService.recoverFromContractError(
      async () => {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }

        const nextId = await this.contract.getNextProductId();
        return Number(nextId);
      },
      'ContractQuery',
      { operation: 'getNextProductId' }
    );

    if (!result.success) {
      console.error('❌ Failed to get next product ID:', result.error);
      return 1; // Default fallback
    }

    return result.data;
  }

  // Cleanup method for proper service termination
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up Moonbeam blockchain service...');
      
      // Stop network health monitoring
      this.stopNetworkHealthMonitoring();
      
      // Clear references
      this.provider = null;
      this.signer = null;
      this.contract = null;
      this.connectedAccount = null;
      
      console.log('✅ Moonbeam service cleanup complete');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    provider: boolean;
    contract: boolean;
    wallet: boolean;
    network: boolean;
  }> {
    const health = {
      provider: false,
      contract: false,
      wallet: false,
      network: false,
    };

    try {
      // Check provider
      if (this.provider) {
        await this.provider.getBlockNumber();
        health.provider = true;
        health.network = true;
      }

      // Check contract
      if (this.contract) {
        await this.contract.getNextProductId();
        health.contract = true;
      }

      // Check wallet
      if (this.signer && this.connectedAccount) {
        await this.signer.getAddress();
        health.wallet = true;
      }
    } catch (error) {
      console.warn('Health check failed:', error);
    }

    return health;
  }
}

// Create singleton instance
const moonbeamService = new MoonbeamBlockchainService();

// Export for use in hooks
export const moonbeamBlockchainService = moonbeamService;
export default moonbeamService;