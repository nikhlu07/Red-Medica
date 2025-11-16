import { NetworkStatus } from '../types/blockchain';

// Error types for better categorization
export enum ErrorType {
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WALLET_EXTENSION_NOT_FOUND = 'WALLET_EXTENSION_NOT_FOUND',
  WALLET_ACCOUNT_NOT_SELECTED = 'WALLET_ACCOUNT_NOT_SELECTED',
  WALLET_TRANSACTION_REJECTED = 'WALLET_TRANSACTION_REJECTED',
  WALLET_INSUFFICIENT_BALANCE = 'WALLET_INSUFFICIENT_BALANCE',
  
  // Blockchain errors
  BLOCKCHAIN_NOT_CONNECTED = 'BLOCKCHAIN_NOT_CONNECTED',
  BLOCKCHAIN_CONNECTION_FAILED = 'BLOCKCHAIN_CONNECTION_FAILED',
  BLOCKCHAIN_NETWORK_ERROR = 'BLOCKCHAIN_NETWORK_ERROR',
  BLOCKCHAIN_RPC_ERROR = 'BLOCKCHAIN_RPC_ERROR',
  BLOCKCHAIN_TIMEOUT = 'BLOCKCHAIN_TIMEOUT',
  
  // Contract errors
  CONTRACT_NOT_AVAILABLE = 'CONTRACT_NOT_AVAILABLE',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  CONTRACT_TRANSACTION_FAILED = 'CONTRACT_TRANSACTION_FAILED',
  CONTRACT_UNAUTHORIZED = 'CONTRACT_UNAUTHORIZED',
  CONTRACT_INVALID_INPUT = 'CONTRACT_INVALID_INPUT',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_INSUFFICIENT_GAS = 'TRANSACTION_INSUFFICIENT_GAS',
  TRANSACTION_NONCE_ERROR = 'TRANSACTION_NONCE_ERROR',
  
  // Product errors
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS = 'PRODUCT_ALREADY_EXISTS',
  PRODUCT_VALIDATION_FAILED = 'PRODUCT_VALIDATION_FAILED',
  PRODUCT_UNAUTHORIZED_ACCESS = 'PRODUCT_UNAUTHORIZED_ACCESS',
  
  // Network errors
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_LOST = 'NETWORK_CONNECTION_LOST',
  NETWORK_RATE_LIMITED = 'NETWORK_RATE_LIMITED',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_INVALID_ADDRESS = 'VALIDATION_INVALID_ADDRESS',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  technicalDetails?: string;
  userAction?: string;
  canRetry: boolean;
  retryDelay?: number;
  helpUrl?: string;
  context?: Record<string, any>;
  timestamp: number;
}

// Recovery action interface
export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

// Error handler result
export interface ErrorHandlerResult {
  error: EnhancedError;
  recoveryActions: RecoveryAction[];
  shouldNotify: boolean;
  shouldLog: boolean;
}

export class BlockchainErrorHandler {
  private static errorMappings: Record<string, Partial<EnhancedError>> = {
    // Wallet errors
    'MetaMask not found': {
      type: ErrorType.WALLET_EXTENSION_NOT_FOUND,
      severity: ErrorSeverity.HIGH,
      title: 'MetaMask Not Found',
      message: 'MetaMask extension is not installed. Please install MetaMask to continue.',
      userAction: 'Install MetaMask extension and refresh the page',
      canRetry: true,
      helpUrl: 'https://metamask.io/download/',
    },
    'No Polkadot extension found': {
      type: ErrorType.WALLET_EXTENSION_NOT_FOUND,
      severity: ErrorSeverity.HIGH,
      title: 'Polkadot Extension Not Found',
      message: 'Polkadot.js extension is not installed. Please install the extension to continue.',
      userAction: 'Install Polkadot.js extension and refresh the page',
      canRetry: true,
      helpUrl: 'https://polkadot.js.org/extension/',
    },
    'User rejected the request': {
      type: ErrorType.WALLET_TRANSACTION_REJECTED,
      severity: ErrorSeverity.MEDIUM,
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet.',
      userAction: 'Try again and approve the transaction in your wallet',
      canRetry: true,
    },
    'insufficient funds': {
      type: ErrorType.WALLET_INSUFFICIENT_BALANCE,
      severity: ErrorSeverity.HIGH,
      title: 'Insufficient Balance',
      message: 'Your account does not have enough funds to complete this transaction.',
      userAction: 'Add funds to your account and try again',
      canRetry: true,
    },
    
    // Blockchain connection errors
    'WebSocket connection failed': {
      type: ErrorType.BLOCKCHAIN_CONNECTION_FAILED,
      severity: ErrorSeverity.HIGH,
      title: 'Blockchain Connection Failed',
      message: 'Unable to connect to the blockchain network. Please check your internet connection.',
      userAction: 'Check your internet connection and try again',
      canRetry: true,
      retryDelay: 3000,
    },
    'RPC error': {
      type: ErrorType.BLOCKCHAIN_RPC_ERROR,
      severity: ErrorSeverity.MEDIUM,
      title: 'Network Communication Error',
      message: 'Error communicating with the blockchain network.',
      userAction: 'This is usually temporary. Please try again in a moment.',
      canRetry: true,
      retryDelay: 2000,
    },
    
    // Contract errors
    'Contract not found': {
      type: ErrorType.CONTRACT_NOT_AVAILABLE,
      severity: ErrorSeverity.CRITICAL,
      title: 'Smart Contract Unavailable',
      message: 'The smart contract is not available or not deployed on this network.',
      userAction: 'Please contact support or try switching networks',
      canRetry: false,
    },
    'NotAuthorizedManufacturer': {
      type: ErrorType.CONTRACT_UNAUTHORIZED,
      severity: ErrorSeverity.HIGH,
      title: 'Not Authorized',
      message: 'You are not authorized as a manufacturer. Only authorized manufacturers can register products.',
      userAction: 'Contact the administrator to get manufacturer authorization',
      canRetry: false,
    },
    'ProductNotFound': {
      type: ErrorType.PRODUCT_NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      title: 'Product Not Found',
      message: 'The requested product could not be found. It may be counterfeit or the ID is incorrect.',
      userAction: 'Verify the product ID or QR code and try again',
      canRetry: true,
    },
    'ProductAlreadyExists': {
      type: ErrorType.PRODUCT_ALREADY_EXISTS,
      severity: ErrorSeverity.MEDIUM,
      title: 'Product Already Exists',
      message: 'A product with this batch number already exists.',
      userAction: 'Use a unique batch number for your product',
      canRetry: true,
    },
    
    // Network errors
    'Network request failed': {
      type: ErrorType.NETWORK_CONNECTION_LOST,
      severity: ErrorSeverity.MEDIUM,
      title: 'Network Error',
      message: 'Network request failed. Please check your internet connection.',
      userAction: 'Check your internet connection and try again',
      canRetry: true,
      retryDelay: 2000,
    },
    'timeout': {
      type: ErrorType.NETWORK_TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      userAction: 'The network may be congested. Please try again.',
      canRetry: true,
      retryDelay: 5000,
    },
  };

  static handle(error: any, context?: Record<string, any>): ErrorHandlerResult {
    const enhancedError = this.enhanceError(error, context);
    const recoveryActions = this.getRecoveryActions(enhancedError);
    
    return {
      error: enhancedError,
      recoveryActions,
      shouldNotify: enhancedError.severity !== ErrorSeverity.LOW,
      shouldLog: true,
    };
  }

  private static enhanceError(error: any, context?: Record<string, any>): EnhancedError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code;
    
    // Try to match error message to known patterns
    let enhancedError: Partial<EnhancedError> | undefined;
    
    for (const [pattern, mapping] of Object.entries(this.errorMappings)) {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase()) || 
          errorCode === pattern) {
        enhancedError = mapping;
        break;
      }
    }
    
    // If no specific mapping found, create a generic error
    if (!enhancedError) {
      enhancedError = this.createGenericError(error);
    }
    
    // Merge with default values
    const result: EnhancedError = {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      title: 'Error',
      message: errorMessage,
      canRetry: false,
      timestamp: Date.now(),
      ...enhancedError,
      technicalDetails: this.formatTechnicalDetails(error),
      context,
    };
    
    return result;
  }

  private static createGenericError(error: any): Partial<EnhancedError> {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Categorize based on error characteristics
    if (errorMessage.includes('wallet') || errorMessage.includes('account')) {
      return {
        type: ErrorType.WALLET_CONNECTION_FAILED,
        severity: ErrorSeverity.HIGH,
        title: 'Wallet Error',
        message: 'There was an issue with your wallet connection.',
        userAction: 'Please check your wallet and try again',
        canRetry: true,
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        type: ErrorType.NETWORK_CONNECTION_LOST,
        severity: ErrorSeverity.MEDIUM,
        title: 'Network Error',
        message: 'Network connection issue occurred.',
        userAction: 'Check your internet connection and try again',
        canRetry: true,
        retryDelay: 3000,
      };
    }
    
    if (errorMessage.includes('transaction') || errorMessage.includes('tx')) {
      return {
        type: ErrorType.TRANSACTION_FAILED,
        severity: ErrorSeverity.HIGH,
        title: 'Transaction Failed',
        message: 'The blockchain transaction could not be completed.',
        userAction: 'Please try the transaction again',
        canRetry: true,
        retryDelay: 5000,
      };
    }
    
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      title: 'Unexpected Error',
      message: 'An unexpected error occurred.',
      userAction: 'Please try again or contact support if the problem persists',
      canRetry: true,
    };
  }

  private static formatTechnicalDetails(error: any): string {
    const details: string[] = [];
    
    if (error?.message) {
      details.push(`Message: ${error.message}`);
    }
    
    if (error?.code) {
      details.push(`Code: ${error.code}`);
    }
    
    if (error?.stack) {
      details.push(`Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    
    if (error?.name) {
      details.push(`Type: ${error.name}`);
    }
    
    return details.join('\n');
  }

  private static getRecoveryActions(error: EnhancedError): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    
    // Add retry action if error is retryable
    if (error.canRetry) {
      actions.push({
        label: 'Retry',
        action: () => {
          // This will be handled by the calling component
          console.log('Retry action triggered');
        },
        primary: true,
      });
    }
    
    // Add specific recovery actions based on error type
    switch (error.type) {
      case ErrorType.WALLET_EXTENSION_NOT_FOUND:
        if (error.helpUrl) {
          actions.push({
            label: 'Install Extension',
            action: () => window.open(error.helpUrl, '_blank'),
          });
        }
        break;
        
      case ErrorType.WALLET_INSUFFICIENT_BALANCE:
        actions.push({
          label: 'Check Balance',
          action: () => {
            // Navigate to wallet or balance page
            console.log('Navigate to balance page');
          },
        });
        break;
        
      case ErrorType.BLOCKCHAIN_CONNECTION_FAILED:
        actions.push({
          label: 'Check Network',
          action: () => {
            // Navigate to network status page
            console.log('Navigate to network status');
          },
        });
        break;
        
      case ErrorType.CONTRACT_UNAUTHORIZED:
        actions.push({
          label: 'Contact Support',
          action: () => {
            // Open support contact
            window.open('/help#contact', '_blank');
          },
        });
        break;
    }
    
    // Always add a dismiss action
    actions.push({
      label: 'Dismiss',
      action: () => {
        console.log('Error dismissed');
      },
    });
    
    return actions;
  }

  // Network status error handling
  static handleNetworkError(networkStatus: NetworkStatus, error?: string): ErrorHandlerResult {
    let enhancedError: EnhancedError;
    
    switch (networkStatus) {
      case NetworkStatus.DISCONNECTED:
        enhancedError = {
          type: ErrorType.BLOCKCHAIN_NOT_CONNECTED,
          severity: ErrorSeverity.HIGH,
          title: 'Blockchain Disconnected',
          message: 'Not connected to the blockchain network.',
          userAction: 'Click to reconnect to the blockchain',
          canRetry: true,
          timestamp: Date.now(),
        };
        break;
        
      case NetworkStatus.ERROR:
        enhancedError = {
          type: ErrorType.BLOCKCHAIN_CONNECTION_FAILED,
          severity: ErrorSeverity.HIGH,
          title: 'Connection Error',
          message: error || 'Failed to connect to the blockchain network.',
          userAction: 'Check your internet connection and try again',
          canRetry: true,
          retryDelay: 3000,
          timestamp: Date.now(),
        };
        break;
        
      case NetworkStatus.CONNECTING:
      case NetworkStatus.RECONNECTING:
        enhancedError = {
          type: ErrorType.BLOCKCHAIN_CONNECTION_FAILED,
          severity: ErrorSeverity.MEDIUM,
          title: 'Connecting...',
          message: 'Attempting to connect to the blockchain network.',
          userAction: 'Please wait while we establish the connection',
          canRetry: false,
          timestamp: Date.now(),
        };
        break;
        
      default:
        enhancedError = {
          type: ErrorType.UNKNOWN_ERROR,
          severity: ErrorSeverity.MEDIUM,
          title: 'Network Status Unknown',
          message: 'Unknown network status.',
          userAction: 'Please refresh the page',
          canRetry: true,
          timestamp: Date.now(),
        };
    }
    
    return {
      error: enhancedError,
      recoveryActions: this.getRecoveryActions(enhancedError),
      shouldNotify: true,
      shouldLog: true,
    };
  }

  // Transaction failure recovery
  static handleTransactionFailure(
    txHash?: string, 
    error?: any, 
    context?: Record<string, any>
  ): ErrorHandlerResult {
    const baseError = error ? this.handle(error, context) : null;
    
    const enhancedError: EnhancedError = {
      type: ErrorType.TRANSACTION_FAILED,
      severity: ErrorSeverity.HIGH,
      title: 'Transaction Failed',
      message: baseError?.error.message || 'The blockchain transaction could not be completed.',
      technicalDetails: baseError?.error.technicalDetails,
      userAction: 'Please try the transaction again',
      canRetry: true,
      retryDelay: 5000,
      timestamp: Date.now(),
      context: {
        ...context,
        txHash,
      },
    };
    
    const recoveryActions: RecoveryAction[] = [
      {
        label: 'Retry Transaction',
        action: () => console.log('Retry transaction'),
        primary: true,
      },
    ];
    
    if (txHash) {
      recoveryActions.push({
        label: 'View Transaction',
        action: () => {
          const explorerUrl = `https://moonbase.moonscan.io/tx/${txHash}`;
          window.open(explorerUrl, '_blank');
        },
      });
    }
    
    recoveryActions.push({
      label: 'Get Help',
      action: () => window.open('/help#transactions', '_blank'),
    });
    
    return {
      error: enhancedError,
      recoveryActions,
      shouldNotify: true,
      shouldLog: true,
    };
  }
}

// Utility functions for common error scenarios
export const createValidationError = (field: string, message: string): EnhancedError => ({
  type: ErrorType.VALIDATION_REQUIRED_FIELD,
  severity: ErrorSeverity.LOW,
  title: 'Validation Error',
  message: `${field}: ${message}`,
  userAction: 'Please correct the highlighted fields',
  canRetry: false,
  timestamp: Date.now(),
});

export const createNetworkOfflineError = (): EnhancedError => ({
  type: ErrorType.NETWORK_OFFLINE,
  severity: ErrorSeverity.HIGH,
  title: 'No Internet Connection',
  message: 'You appear to be offline. Please check your internet connection.',
  userAction: 'Check your internet connection and try again',
  canRetry: true,
  timestamp: Date.now(),
});

export const createTimeoutError = (operation: string): EnhancedError => ({
  type: ErrorType.NETWORK_TIMEOUT,
  severity: ErrorSeverity.MEDIUM,
  title: 'Operation Timeout',
  message: `${operation} took too long to complete.`,
  userAction: 'The network may be congested. Please try again.',
  canRetry: true,
  retryDelay: 5000,
  timestamp: Date.now(),
});