import { BlockchainErrorHandler, ErrorType, ErrorSeverity, type EnhancedError, type ErrorHandlerResult } from '../utils/errorHandler';
import { RetryService } from '../utils/retry';
import { useAppStore } from '../lib/store';
import { NetworkStatus } from '../types/blockchain';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  notifyUser?: boolean;
  logError?: boolean;
  context?: Record<string, any>;
}

export interface ErrorRecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: EnhancedError;
  attempts: number;
  recovered: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorHistory: EnhancedError[] = [];
  private maxHistorySize = 100;

  static getInstance(): ErrorHandlingService {
    if (!this.instance) {
      this.instance = new ErrorHandlingService();
    }
    return this.instance;
  }

  // Handle and recover from blockchain operations
  async handleWithRecovery<T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
  ): Promise<ErrorRecoveryResult<T>> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      notifyUser = true,
      logError = true,
      context = {},
    } = options;

    let lastError: any;
    let attempts = 0;
    let recovered = false;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      attempts = attempt;
      
      try {
        const result = await operation();
        
        // If we succeeded after retries, mark as recovered
        if (attempt > 1) {
          recovered = true;
          if (notifyUser) {
            this.notifyRecovery(attempt - 1);
          }
        }
        
        return {
          success: true,
          data: result,
          attempts,
          recovered,
        };
      } catch (error) {
        lastError = error;
        
        // Handle the error
        const errorResult = BlockchainErrorHandler.handle(error, {
          ...context,
          attempt,
          maxRetries,
        });
        
        // Log error if requested
        if (logError) {
          this.logError(errorResult.error);
        }
        
        // Check if we should retry
        if (attempt <= maxRetries && errorResult.error.canRetry) {
          // Calculate delay
          const delay = exponentialBackoff 
            ? retryDelay * Math.pow(2, attempt - 1)
            : retryDelay;
          
          // Notify user about retry if it's a significant error
          if (notifyUser && errorResult.error.severity !== ErrorSeverity.LOW) {
            this.notifyRetry(attempt, maxRetries, delay, errorResult.error);
          }
          
          // Wait before retry
          await this.delay(delay);
          continue;
        }
        
        // No more retries or error is not retryable
        if (notifyUser && errorResult.shouldNotify) {
          this.notifyError(errorResult.error);
        }
        
        return {
          success: false,
          error: errorResult.error,
          attempts,
          recovered: false,
        };
      }
    }

    // This should never be reached, but just in case
    const errorResult = BlockchainErrorHandler.handle(lastError, context);
    return {
      success: false,
      error: errorResult.error,
            
attempts,
      recovered: false,
    };
  }

  // Network connectivity error handling
  async handleNetworkConnectivity(): Promise<boolean> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        this.notifyNetworkOffline();
        return false;
      }

      // Test actual connectivity with a simple request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Use the actual RPC endpoint for connectivity check instead of non-existent health endpoint
        await fetch('https://rpc.api.moonbase.moonbeam.network', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.warn('Network connectivity check failed, will use demo mode:', fetchError);
        // Don't notify as error since we'll fall back to demo mode
        return false;
      }
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      return false;
    }
  }

  // Contract error recovery
  async recoverFromContractError(
    operation: () => Promise<any>,
    errorType: string,
    context: Record<string, any> = {}
  ): Promise<ErrorRecoveryResult<any>> {
    const maxRetries = this.getRetriesForContractError(errorType);
    const retryDelay = this.getDelayForContractError(errorType);

    return this.handleWithRecovery(operation, {
      maxRetries,
      retryDelay,
      exponentialBackoff: true,
      notifyUser: true,
      logError: true,
      context: { ...context, errorType, contractError: true },
    });
  }

  // Transaction failure recovery with detailed analysis
  async recoverFromTransactionFailure(
    operation: () => Promise<any>,
    txHash?: string,
    error?: any
  ): Promise<ErrorRecoveryResult<any>> {
    const failureReason = this.analyzeTransactionFailure(error);
    
    // Don't retry certain types of failures
    if (failureReason.shouldNotRetry) {
      const errorResult = BlockchainErrorHandler.handle(error, { txHash, failureReason });
      this.notifyError(errorResult.error);
      
      return {
        success: false,
        error: errorResult.error,
        attempts: 1,
        recovered: false,
      };
    }

    return this.handleWithRecovery(operation, {
      maxRetries: failureReason.maxRetries,
      retryDelay: failureReason.retryDelay,
      exponentialBackoff: true,
      notifyUser: true,
      logError: true,
      context: { txHash, failureReason },
    });
  }

  // Enhanced gas estimation error handling
  async handleGasEstimationError(
    operation: () => Promise<any>,
    methodName: string,
    params: any[]
  ): Promise<ErrorRecoveryResult<any>> {
    return this.handleWithRecovery(operation, {
      maxRetries: 2,
      retryDelay: 1000,
      exponentialBackoff: false,
      notifyUser: false, // Don't notify for gas estimation retries
      logError: true,
      context: { methodName, params, gasEstimation: true },
    });
  }

  // Private helper methods
  private getRetriesForContractError(errorType: string): number {
    const retryMap: Record<string, number> = {
      'NotAuthorizedManufacturer': 0, // Don't retry authorization errors
      'ProductNotFound': 1, // Retry once in case of temporary issues
      'ProductAlreadyExists': 0, // Don't retry duplicate errors
      'NotCurrentHolder': 0, // Don't retry ownership errors
      'InsufficientBalance': 0, // Don't retry balance errors
      'InvalidTransfer': 1, // Retry once for validation errors
      'ContractCallFailed': 3, // Retry network-related contract failures
      'default': 2,
    };

    return retryMap[errorType] ?? retryMap.default;
  }

  private getDelayForContractError(errorType: string): number {
    const delayMap: Record<string, number> = {
      'ContractCallFailed': 2000,
      'NetworkError': 3000,
      'RpcError': 1500,
      'default': 1000,
    };

    return delayMap[errorType] ?? delayMap.default;
  }

  private analyzeTransactionFailure(error: any): {
    shouldNotRetry: boolean;
    maxRetries: number;
    retryDelay: number;
    reason: string;
  } {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // User rejection - don't retry
    if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
      return {
        shouldNotRetry: true,
        maxRetries: 0,
        retryDelay: 0,
        reason: 'User rejected transaction',
      };
    }

    // Insufficient balance - don't retry
    if (errorMessage.includes('insufficient')) {
      return {
        shouldNotRetry: true,
        maxRetries: 0,
        retryDelay: 0,
        reason: 'Insufficient balance',
      };
    }

    // Network/connectivity issues - retry with backoff
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return {
        shouldNotRetry: false,
        maxRetries: 3,
        retryDelay: 2000,
        reason: 'Network connectivity issue',
      };
    }

    // Gas estimation failures - retry with shorter delay
    if (errorMessage.includes('gas') || errorMessage.includes('estimate')) {
      return {
        shouldNotRetry: false,
        maxRetries: 2,
        retryDelay: 1000,
        reason: 'Gas estimation issue',
      };
    }

    // Default retry strategy for unknown errors
    return {
      shouldNotRetry: false,
      maxRetries: 2,
      retryDelay: 1500,
      reason: 'Unknown transaction error',
    };
  }

  private notifyRecovery(attempts: number): void {
    useAppStore.getState().addSuccessNotification(
      'Operation Recovered',
      `Successfully completed after ${attempts} ${attempts === 1 ? 'retry' : 'retries'}`
    );
  }

  private notifyRetry(attempt: number, maxRetries: number, delay: number, error: EnhancedError): void {
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      useAppStore.getState().addWarningNotification(
        'Retrying Operation',
        `Attempt ${attempt}/${maxRetries} failed. Retrying in ${Math.round(delay / 1000)} seconds...`
      );
    }
  }

  private notifyError(error: EnhancedError): void {
    const store = useAppStore.getState();
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      store.addErrorNotification(error.title, error.message, true); // Persistent
    } else {
      store.addErrorNotification(error.title, error.message);
    }
  }

  private notifyNetworkOffline(): void {
    useAppStore.getState().addErrorNotification(
      'No Internet Connection',
      'You appear to be offline. Please check your internet connection.',
      true // Persistent until resolved
    );
  }

  private notifyNetworkConnectivityIssue(): void {
    // Only show notification in development mode to avoid spam
    // In production, demo mode fallback handles this gracefully
    if (import.meta.env.DEV) {
      console.warn('Network connectivity issue detected, demo mode fallback will be used');
    }
    
    // Don't show warning notification since demo mode is expected fallback
    // useAppStore.getState().addWarningNotification(
    //   'Network Connectivity Issue',
    //   'Having trouble connecting to the blockchain network. Some features may be limited.'
    // );
  }

  private logError(error: EnhancedError): void {
    this.errorHistory.push(error);
    
    // Keep only the last 100 errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // Log to console with appropriate level
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel](`[${error.type}] ${error.title}:`, {
      message: error.message,
      technicalDetails: error.technicalDetails,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for error history and monitoring
  getErrorHistory(): EnhancedError[] {
    return [...this.errorHistory];
  }

  getRecentErrors(minutes: number = 10): EnhancedError[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errorHistory.filter(error => error.timestamp > cutoff);
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  // Error statistics for monitoring
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recentCount = 0;
    const recentCutoff = Date.now() - (10 * 60 * 1000); // Last 10 minutes

    this.errorHistory.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      if (error.timestamp > recentCutoff) {
        recentCount++;
      }
    });

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recentCount,
    };
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();