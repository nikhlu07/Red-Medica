import { 
  performanceMonitor, 
  recordTransactionStart, 
  recordTransactionComplete, 
  recordError 
} from './performanceMonitor';
import blockchainService from './blockchain';
import type { 
  Product, 
  Transfer, 
  TransactionResult, 
  ProductRegistrationResult 
} from '../types/blockchain';

// Enhanced blockchain service with performance monitoring
// Since we can't extend the class directly, we'll create a wrapper
class BlockchainServiceWithMonitoring {
  private blockchainService = blockchainService;
  
  // Wrap registerProduct to add performance monitoring
  async registerProduct(
    name: string,
    batchNumber: string,
    manufacturerName: string,
    quantity: number,
    mfgDate: number,
    expiryDate: number,
    category: string
  ): Promise<ProductRegistrationResult> {
    const operationStart = Date.now();
    const operationId = `register-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Record operation start
      performanceMonitor.recordUserInteraction(
        'register_product_start',
        'blockchain_service',
        undefined,
        undefined,
        { name, batchNumber, quantity, category }
      );

      // Call wrapped method
      const result = await this.blockchainService.registerProduct(
        name, 
        batchNumber, 
        manufacturerName, 
        quantity, 
        mfgDate, 
        expiryDate, 
        category
      );

      const operationDuration = Date.now() - operationStart;

      if (result.success && result.txHash) {
        // Record transaction start
        recordTransactionStart(result.txHash, 'register_product');
        
        // Record successful operation
        performanceMonitor.recordUserInteraction(
          'register_product_success',
          'blockchain_service',
          undefined,
          operationDuration,
          { 
            txHash: result.txHash, 
            productId: result.productId,
            gasUsed: result.gasUsed,
            blockNumber: result.blockNumber
          }
        );

        // If we have transaction completion info, record it
        if (result.blockNumber) {
          recordTransactionComplete(
            result.txHash,
            true,
            result.gasUsed,
            result.blockNumber
          );
        }
      } else {
        // Record failed operation
        performanceMonitor.recordUserInteraction(
          'register_product_failed',
          'blockchain_service',
          undefined,
          operationDuration,
          { error: result.error }
        );

        // Record error
        recordError({
          type: 'blockchain',
          message: `Product registration failed: ${result.error}`,
          metadata: {
            operation: 'register_product',
            duration: operationDuration,
            name,
            batchNumber,
            quantity
          }
        });
      }

      return result;
    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'blockchain',
        message: `Product registration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'register_product',
          duration: operationDuration,
          name,
          batchNumber,
          quantity
        }
      });

      // Record failed interaction
      performanceMonitor.recordUserInteraction(
        'register_product_error',
        'blockchain_service',
        undefined,
        operationDuration,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  // Wrap verifyProduct to add performance monitoring
  async verifyProduct(productId: number): Promise<Product | null> {
    const operationStart = Date.now();
    
    try {
      // Record operation start
      performanceMonitor.recordUserInteraction(
        'verify_product_start',
        'blockchain_service',
        undefined,
        undefined,
        { productId }
      );

      // Call wrapped method
      const result = await this.blockchainService.verifyProduct(productId);
      const operationDuration = Date.now() - operationStart;

      if (result) {
        // Record successful verification
        performanceMonitor.recordUserInteraction(
          'verify_product_success',
          'blockchain_service',
          undefined,
          operationDuration,
          { 
            productId, 
            productName: result.name,
            manufacturer: result.manufacturer,
            isAuthentic: result.isAuthentic
          }
        );
      } else {
        // Record product not found (could be counterfeit)
        performanceMonitor.recordUserInteraction(
          'verify_product_not_found',
          'blockchain_service',
          undefined,
          operationDuration,
          { productId }
        );

        // This might indicate a counterfeit product, record as warning
        recordError({
          type: 'validation',
          message: `Product verification failed - product not found: ${productId}`,
          metadata: {
            operation: 'verify_product',
            duration: operationDuration,
            productId,
            possibleCounterfeit: true
          }
        });
      }

      return result;
    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'blockchain',
        message: `Product verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'verify_product',
          duration: operationDuration,
          productId
        }
      });

      // Record failed interaction
      performanceMonitor.recordUserInteraction(
        'verify_product_error',
        'blockchain_service',
        undefined,
        operationDuration,
        { productId, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  // Wrap transferCustody to add performance monitoring
  async transferCustody(
    productId: number,
    toAddress: string,
    location: string
  ): Promise<TransactionResult> {
    const operationStart = Date.now();
    
    try {
      // Record operation start
      performanceMonitor.recordUserInteraction(
        'transfer_custody_start',
        'blockchain_service',
        undefined,
        undefined,
        { productId, toAddress, location }
      );

      // Call wrapped method
      const result = await this.blockchainService.transferCustody(productId, toAddress, location);
      const operationDuration = Date.now() - operationStart;

      if (result.success && result.txHash) {
        // Record transaction start
        recordTransactionStart(result.txHash, 'transfer_custody');
        
        // Record successful operation
        performanceMonitor.recordUserInteraction(
          'transfer_custody_success',
          'blockchain_service',
          undefined,
          operationDuration,
          { 
            txHash: result.txHash, 
            productId,
            toAddress,
            location,
            gasUsed: result.gasUsed,
            blockNumber: result.blockNumber
          }
        );

        // If we have transaction completion info, record it
        if (result.blockNumber) {
          recordTransactionComplete(
            result.txHash,
            true,
            result.gasUsed,
            result.blockNumber
          );
        }
      } else {
        // Record failed operation
        performanceMonitor.recordUserInteraction(
          'transfer_custody_failed',
          'blockchain_service',
          undefined,
          operationDuration,
          { productId, toAddress, error: result.error }
        );

        // Record error
        recordError({
          type: 'blockchain',
          message: `Custody transfer failed: ${result.error}`,
          metadata: {
            operation: 'transfer_custody',
            duration: operationDuration,
            productId,
            toAddress,
            location
          }
        });
      }

      return result;
    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'blockchain',
        message: `Custody transfer error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'transfer_custody',
          duration: operationDuration,
          productId,
          toAddress,
          location
        }
      });

      // Record failed interaction
      performanceMonitor.recordUserInteraction(
        'transfer_custody_error',
        'blockchain_service',
        undefined,
        operationDuration,
        { productId, toAddress, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  // Wrap connectWallet to add performance monitoring
  async connectWallet(): Promise<any> {
    const operationStart = Date.now();
    
    try {
      // Record operation start
      performanceMonitor.recordUserInteraction(
        'connect_wallet_start',
        'blockchain_service'
      );

      // Call wrapped method
      const result = await this.blockchainService.connectWallet();
      const operationDuration = Date.now() - operationStart;

      // Record successful connection
      performanceMonitor.recordUserInteraction(
        'connect_wallet_success',
        'blockchain_service',
        undefined,
        operationDuration,
        { accountCount: result.length }
      );

      return result;
    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'blockchain',
        message: `Wallet connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'connect_wallet',
          duration: operationDuration
        }
      });

      // Record failed interaction
      performanceMonitor.recordUserInteraction(
        'connect_wallet_error',
        'blockchain_service',
        undefined,
        operationDuration,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  // Wrap initialize to add performance monitoring
  async initialize(): Promise<void> {
    const operationStart = Date.now();
    
    try {
      // Record operation start
      performanceMonitor.recordUserInteraction(
        'blockchain_initialize_start',
        'blockchain_service'
      );

      // Call wrapped method
      await this.blockchainService.initialize();
      const operationDuration = Date.now() - operationStart;

      // Record successful initialization
      performanceMonitor.recordUserInteraction(
        'blockchain_initialize_success',
        'blockchain_service',
        undefined,
        operationDuration
      );

    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'network',
        message: `Blockchain initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'blockchain_initialize',
          duration: operationDuration
        }
      });

      // Record failed interaction
      performanceMonitor.recordUserInteraction(
        'blockchain_initialize_error',
        'blockchain_service',
        undefined,
        operationDuration,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      throw error;
    }
  }

  // Add method to track transaction retries
  async retryTransaction(txHash: string, operation: string): Promise<void> {
    performanceMonitor.recordTransactionRetry(txHash);
    
    performanceMonitor.recordUserInteraction(
      'transaction_retry',
      'blockchain_service',
      undefined,
      undefined,
      { txHash, operation }
    );
  }

  // Add method to track network status changes
  onNetworkStatusChange(status: string, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserInteraction(
      'network_status_change',
      'blockchain_service',
      undefined,
      undefined,
      { status, ...metadata }
    );

    // Record network errors
    if (status === 'error' || status === 'disconnected') {
      recordError({
        type: 'network',
        message: `Network status changed to: ${status}`,
        metadata: {
          operation: 'network_monitoring',
          status,
          ...metadata
        }
      });
    }
  }

  // Add method to track gas estimation performance
  async estimateGasWithMonitoring(
    method: string,
    args: any[],
    fromAddress: string
  ): Promise<any> {
    const operationStart = Date.now();
    
    try {
      // Call wrapped method (if it exists)
      const result = await (this.blockchainService as any).estimateGas?.(method, args, fromAddress);
      const operationDuration = Date.now() - operationStart;

      // Record successful gas estimation
      performanceMonitor.recordUserInteraction(
        'gas_estimation_success',
        'blockchain_service',
        undefined,
        operationDuration,
        { method, gasEstimate: result }
      );

      return result;
    } catch (error) {
      const operationDuration = Date.now() - operationStart;
      
      // Record error
      recordError({
        type: 'blockchain',
        message: `Gas estimation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        metadata: {
          operation: 'gas_estimation',
          duration: operationDuration,
          method,
          fromAddress
        }
      });

      throw error;
    }
  }

  // Delegate other methods to the wrapped service
  get isConnected() {
    return (this.blockchainService as any).isConnected?.() || false;
  }

  get networkInfo() {
    return (this.blockchainService as any).networkInfo || { status: 'DISCONNECTED' };
  }

  setSelectedAccount(account: any) {
    return this.blockchainService.setSelectedAccount?.(account);
  }

  getSelectedAccount() {
    return this.blockchainService.getSelectedAccount?.();
  }

  clearWalletConnection() {
    return this.blockchainService.clearWalletConnection?.();
  }

  async disconnectWallet() {
    return this.blockchainService.disconnectWallet?.();
  }

  // Add method to get performance metrics for this service
  getPerformanceMetrics(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageOperationTime: number;
    transactionSuccessRate: number;
  } {
    const interactions = performanceMonitor.getUserInteractions()
      .filter(i => i.component === 'blockchain_service');
    
    const transactions = performanceMonitor.getTransactionMetrics();
    
    const totalOperations = interactions.length;
    const successfulOperations = interactions.filter(i => 
      i.action.includes('_success')
    ).length;
    const failedOperations = interactions.filter(i => 
      i.action.includes('_failed') || i.action.includes('_error')
    ).length;
    
    const operationsWithDuration = interactions.filter(i => i.duration !== undefined);
    const averageOperationTime = operationsWithDuration.length > 0 
      ? operationsWithDuration.reduce((sum, i) => sum + (i.duration || 0), 0) / operationsWithDuration.length
      : 0;
    
    const completedTransactions = transactions.filter(t => t.status !== 'pending');
    const successfulTransactions = transactions.filter(t => t.status === 'success');
    const transactionSuccessRate = completedTransactions.length > 0 
      ? (successfulTransactions.length / completedTransactions.length) * 100
      : 0;

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTime,
      transactionSuccessRate
    };
  }
}

// Create and export singleton instance
export const blockchainServiceWithMonitoring = new BlockchainServiceWithMonitoring();

// Export the class for testing
export { BlockchainServiceWithMonitoring };