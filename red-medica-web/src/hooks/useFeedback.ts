import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';

interface FeedbackOptions {
  title: string;
  message: string;
  persistent?: boolean;
  txHash?: string;
  blockExplorerUrl?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

interface LoadingOptions {
  type?: 'global' | 'wallet' | 'products' | 'registration' | 'verification' | 'transfer' | 'blockchain';
  message?: string;
}

interface ErrorOptions extends FeedbackOptions {
  technicalDetails?: string;
  canRetry?: boolean;
}

/**
 * Comprehensive feedback hook for managing notifications, loading states, and errors
 */
export function useFeedback() {
  const {
    addNotification,
    addSuccessNotification,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
    setLoading,
    setError,
    clearError,
    clearAllErrors,
    addPendingTransaction,
    removePendingTransaction,
  } = useAppStore();

  // Success feedback
  const showSuccess = useCallback((options: FeedbackOptions) => {
    const notification = {
      id: `success-${Date.now()}-${Math.random()}`,
      type: 'success' as const,
      title: options.title,
      message: options.message,
      persistent: options.persistent,
      txHash: options.txHash,
      blockExplorerUrl: options.blockExplorerUrl,
      action: options.onAction && options.actionLabel ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
    };

    addNotification(notification);
  }, [addNotification]);

  // Error feedback
  const showError = useCallback((options: ErrorOptions) => {
    const notification = {
      id: `error-${Date.now()}-${Math.random()}`,
      type: 'error' as const,
      title: options.title,
      message: options.message,
      persistent: options.persistent || true, // Errors are persistent by default
      txHash: options.txHash,
      blockExplorerUrl: options.blockExplorerUrl,
      canRetry: options.canRetry,
      onRetry: options.onRetry,
      action: options.onAction && options.actionLabel ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
    };

    addNotification(notification);
  }, [addNotification]);

  // Warning feedback
  const showWarning = useCallback((options: FeedbackOptions) => {
    const notification = {
      id: `warning-${Date.now()}-${Math.random()}`,
      type: 'warning' as const,
      title: options.title,
      message: options.message,
      persistent: options.persistent,
      txHash: options.txHash,
      blockExplorerUrl: options.blockExplorerUrl,
      action: options.onAction && options.actionLabel ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
    };

    addNotification(notification);
  }, [addNotification]);

  // Info feedback
  const showInfo = useCallback((options: FeedbackOptions) => {
    const notification = {
      id: `info-${Date.now()}-${Math.random()}`,
      type: 'info' as const,
      title: options.title,
      message: options.message,
      persistent: options.persistent,
      txHash: options.txHash,
      blockExplorerUrl: options.blockExplorerUrl,
      action: options.onAction && options.actionLabel ? {
        label: options.actionLabel,
        onClick: options.onAction,
      } : undefined,
    };

    addNotification(notification);
  }, [addNotification]);

  // Loading state management
  const startLoading = useCallback((options: LoadingOptions = {}) => {
    const type = options.type || 'global';
    setLoading(type, true);
    
    if (options.message) {
      showInfo({
        title: 'Loading',
        message: options.message,
      });
    }
  }, [setLoading, showInfo]);

  const stopLoading = useCallback((type: LoadingOptions['type'] = 'global') => {
    setLoading(type, false);
  }, [setLoading]);

  // Transaction feedback
  const trackTransaction = useCallback((txHash: string, description: string) => {
    addPendingTransaction(txHash);
    
    showInfo({
      title: 'Transaction Submitted',
      message: `${description} - Transaction is being processed`,
      txHash,
      persistent: true,
    });
  }, [addPendingTransaction, showInfo]);

  const confirmTransaction = useCallback((txHash: string, description: string, productId?: string) => {
    removePendingTransaction(txHash);
    
    showSuccess({
      title: 'Transaction Confirmed',
      message: `${description} completed successfully`,
      txHash,
      ...(productId && { 
        onAction: () => window.location.href = `/products/${productId}`,
        actionLabel: 'View Product'
      }),
    });
  }, [removePendingTransaction, showSuccess]);

  const failTransaction = useCallback((txHash: string, description: string, error: string, onRetry?: () => void) => {
    removePendingTransaction(txHash);
    
    showError({
      title: 'Transaction Failed',
      message: `${description} failed: ${error}`,
      txHash,
      canRetry: !!onRetry,
      onRetry,
    });
  }, [removePendingTransaction, showError]);

  // Blockchain operation feedback
  const handleBlockchainOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingType?: LoadingOptions['type'];
      loadingMessage?: string;
      successTitle: string;
      successMessage: string;
      errorTitle: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    try {
      startLoading({
        type: options.loadingType,
        message: options.loadingMessage,
      });

      const result = await operation();

      stopLoading(options.loadingType);
      
      showSuccess({
        title: options.successTitle,
        message: options.successMessage,
      });

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      stopLoading(options.loadingType);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showError({
        title: options.errorTitle,
        message: errorMessage,
        technicalDetails: error instanceof Error ? error.stack : undefined,
        canRetry: true,
        onRetry: () => handleBlockchainOperation(operation, options),
      });

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }

      return null;
    }
  }, [startLoading, stopLoading, showSuccess, showError]);

  // Product registration feedback
  const handleProductRegistration = useCallback(async (
    registrationFn: () => Promise<{ success: boolean; productId?: number; txHash?: string; error?: string }>
  ) => {
    return handleBlockchainOperation(
      registrationFn,
      {
        loadingType: 'registration',
        loadingMessage: 'Registering product on blockchain...',
        successTitle: 'Product Registered',
        successMessage: 'Your product has been successfully registered on the blockchain',
        errorTitle: 'Registration Failed',
        onSuccess: (result) => {
          if (result.productId) {
            showSuccess({
              title: 'Product Registered',
              message: `Product ID ${result.productId} has been registered successfully`,
              txHash: result.txHash,
              onAction: () => window.location.href = `/products/${result.productId}`,
              actionLabel: 'View Product',
            });
          }
        },
      }
    );
  }, [handleBlockchainOperation, showSuccess]);

  // Product verification feedback
  const handleProductVerification = useCallback(async (
    verificationFn: () => Promise<any>
  ) => {
    return handleBlockchainOperation(
      verificationFn,
      {
        loadingType: 'verification',
        loadingMessage: 'Verifying product authenticity...',
        successTitle: 'Product Verified',
        successMessage: 'Product authenticity has been confirmed',
        errorTitle: 'Verification Failed',
      }
    );
  }, [handleBlockchainOperation]);

  // Custody transfer feedback
  const handleCustodyTransfer = useCallback(async (
    transferFn: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  ) => {
    return handleBlockchainOperation(
      transferFn,
      {
        loadingType: 'transfer',
        loadingMessage: 'Transferring product custody...',
        successTitle: 'Custody Transferred',
        successMessage: 'Product custody has been successfully transferred',
        errorTitle: 'Transfer Failed',
      }
    );
  }, [handleBlockchainOperation]);

  // Wallet connection feedback
  const handleWalletConnection = useCallback(async (
    connectionFn: () => Promise<any>
  ) => {
    return handleBlockchainOperation(
      connectionFn,
      {
        loadingType: 'wallet',
        loadingMessage: 'Connecting to wallet...',
        successTitle: 'Wallet Connected',
        successMessage: 'Your wallet has been successfully connected',
        errorTitle: 'Connection Failed',
      }
    );
  }, [handleBlockchainOperation]);

  return {
    // Basic feedback methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Loading management
    startLoading,
    stopLoading,
    
    // Transaction tracking
    trackTransaction,
    confirmTransaction,
    failTransaction,
    
    // High-level operation handlers
    handleBlockchainOperation,
    handleProductRegistration,
    handleProductVerification,
    handleCustodyTransfer,
    handleWalletConnection,
    
    // Error management
    setError,
    clearError,
    clearAllErrors,
  };
}

export default useFeedback;