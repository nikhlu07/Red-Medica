interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

export class RetryService {
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = () => true,
      onRetry,
    } = options;

    let lastError: any;
    let attempts = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attempts = attempt;
      
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts,
        };
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!retryCondition(error)) {
          break;
        }

        // Don't wait after the last attempt
        if (attempt < maxAttempts) {
          const delay = Math.min(
            baseDelay * Math.pow(backoffFactor, attempt - 1),
            maxDelay
          );
          
          if (onRetry) {
            onRetry(attempt, error);
          }
          
          console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`);
          await this.delay(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
    };
  }

  static async withLinearBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      retryCondition = () => true,
      onRetry,
    } = options;

    let lastError: any;
    let attempts = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attempts = attempt;
      
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts,
        };
      } catch (error) {
        lastError = error;
        
        if (!retryCondition(error)) {
          break;
        }

        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * attempt, maxDelay);
          
          if (onRetry) {
            onRetry(attempt, error);
          }
          
          console.log(`Linear retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`);
          await this.delay(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Predefined retry conditions for common scenarios
  static retryConditions = {
    // Retry on network errors
    networkErrors: (error: any): boolean => {
      const message = error?.message?.toLowerCase() || '';
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('fetch') ||
        error?.code === 'NETWORK_ERROR'
      );
    },

    // Retry on blockchain connection errors
    blockchainErrors: (error: any): boolean => {
      const message = error?.message?.toLowerCase() || '';
      return (
        message.includes('websocket') ||
        message.includes('rpc') ||
        message.includes('provider') ||
        message.includes('disconnected') ||
        message.includes('not connected')
      );
    },

    // Retry on temporary server errors (5xx)
    serverErrors: (error: any): boolean => {
      const status = error?.response?.status || error?.status;
      return status >= 500 && status < 600;
    },

    // Don't retry on client errors (4xx) or authentication errors
    notClientErrors: (error: any): boolean => {
      const status = error?.response?.status || error?.status;
      const message = error?.message?.toLowerCase() || '';
      
      // Don't retry on client errors
      if (status >= 400 && status < 500) {
        return false;
      }
      
      // Don't retry on authentication/authorization errors
      if (
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('authentication') ||
        message.includes('permission')
      ) {
        return false;
      }
      
      return true;
    },
  };
}

// Convenience functions for common retry patterns
export const retryBlockchainOperation = <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> => {
  return RetryService.withExponentialBackoff(operation, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: RetryService.retryConditions.blockchainErrors,
    onRetry: (attempt, error) => {
      console.log(`Blockchain operation retry ${attempt}:`, error.message);
    },
    ...options,
  });
};

export const retryNetworkOperation = <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> => {
  return RetryService.withExponentialBackoff(operation, {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    retryCondition: RetryService.retryConditions.networkErrors,
    onRetry: (attempt, error) => {
      console.log(`Network operation retry ${attempt}:`, error.message);
    },
    ...options,
  });
};