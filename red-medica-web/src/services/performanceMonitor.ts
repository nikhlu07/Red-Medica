import { useAppStore } from '../lib/store';

// Performance metrics interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'page_load' | 'blockchain' | 'user_interaction' | 'api_call' | 'error';
  metadata?: Record<string, any>;
}

export interface TransactionMetric {
  txHash: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: number;
  blockNumber?: number;
  error?: string;
  retryCount?: number;
}

export interface UserInteractionMetric {
  id: string;
  action: string;
  component: string;
  page: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  id: string;
  type: 'blockchain' | 'network' | 'validation' | 'ui' | 'unknown';
  message: string;
  stack?: string;
  timestamp: number;
  page: string;
  userAgent: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
}

export interface PerformanceReport {
  timeRange: {
    start: number;
    end: number;
  };
  metrics: {
    pageLoad: {
      average: number;
      p95: number;
      p99: number;
      count: number;
    };
    blockchain: {
      transactionSuccessRate: number;
      averageTransactionTime: number;
      totalTransactions: number;
      failedTransactions: number;
    };
    userInteractions: {
      totalInteractions: number;
      averageSessionDuration: number;
      mostUsedFeatures: Array<{ feature: string; count: number }>;
    };
    errors: {
      totalErrors: number;
      errorsByType: Record<string, number>;
      criticalErrors: number;
    };
  };
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private transactionMetrics: Map<string, TransactionMetric> = new Map();
  private userInteractions: UserInteractionMetric[] = [];
  private errors: ErrorMetric[] = [];
  private sessionStart: number = Date.now();
  private currentPage: string = '';
  private performanceObserver: PerformanceObserver | null = null;
  private isEnabled: boolean = true;
  private maxMetricsCount: number = 1000; // Limit memory usage

  constructor() {
    this.initializePerformanceObserver();
    this.setupErrorHandling();
    this.setupPageVisibilityHandling();
    this.startPeriodicReporting();
  }

  // Initialize performance observer for web vitals
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Observe navigation timing
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      const observeTypes = ['navigation', 'measure', 'paint', 'largest-contentful-paint'];
      
      observeTypes.forEach(type => {
        try {
          this.performanceObserver?.observe({ type, buffered: true });
        } catch (e) {
          // Some browsers might not support all types
          console.warn(`Performance observer type '${type}' not supported`);
        }
      });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  // Handle performance entries from observer
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: entry.name,
      value: entry.duration || entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: this.categorizePerformanceEntry(entry),
      metadata: {
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
      }
    };

    this.addMetric(metric);
  }

  // Categorize performance entries
  private categorizePerformanceEntry(entry: PerformanceEntry): PerformanceMetric['category'] {
    if (entry.entryType === 'navigation' || entry.entryType === 'paint') {
      return 'page_load';
    }
    if (entry.name.includes('blockchain') || entry.name.includes('transaction')) {
      return 'blockchain';
    }
    return 'api_call';
  }

  // Setup global error handling
  private setupErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'unknown',
        message: event.message,
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'unknown',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        metadata: {
          reason: event.reason,
        }
      });
    });
  }

  // Setup page visibility handling
  private setupPageVisibilityHandling(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordUserInteraction('page_hidden', 'document', this.currentPage);
      } else {
        this.recordUserInteraction('page_visible', 'document', this.currentPage);
      }
    });
  }

  // Start periodic reporting
  private startPeriodicReporting(): void {
    // Report metrics every 5 minutes
    setInterval(() => {
      this.generateReport();
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);
  }

  // Public methods for recording metrics

  // Record page load performance
  recordPageLoad(page: string, loadTime: number): void {
    this.currentPage = page;
    
    const metric: PerformanceMetric = {
      id: `page-load-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `page_load_${page}`,
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'page_load',
      metadata: { page }
    };

    this.addMetric(metric);
  }

  // Record blockchain transaction start
  recordTransactionStart(txHash: string, operation: string): void {
    const metric: TransactionMetric = {
      txHash,
      operation,
      startTime: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    this.transactionMetrics.set(txHash, metric);
    
    // Also record as general metric
    this.addMetric({
      id: `tx-start-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `transaction_start_${operation}`,
      value: 0,
      unit: 'count',
      timestamp: Date.now(),
      category: 'blockchain',
      metadata: { txHash, operation }
    });
  }

  // Record blockchain transaction completion
  recordTransactionComplete(
    txHash: string, 
    success: boolean, 
    gasUsed?: number, 
    blockNumber?: number,
    error?: string
  ): void {
    const metric = this.transactionMetrics.get(txHash);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    // Update transaction metric
    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = success ? 'success' : 'failed';
    metric.gasUsed = gasUsed;
    metric.blockNumber = blockNumber;
    metric.error = error;

    // Record completion metric
    this.addMetric({
      id: `tx-complete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `transaction_${success ? 'success' : 'failed'}_${metric.operation}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'blockchain',
      metadata: { 
        txHash, 
        operation: metric.operation, 
        gasUsed, 
        blockNumber,
        success,
        error 
      }
    });

    // Record error if transaction failed
    if (!success && error) {
      this.recordError({
        type: 'blockchain',
        message: `Transaction failed: ${error}`,
        metadata: {
          txHash,
          operation: metric.operation,
          duration,
          gasUsed,
          blockNumber
        }
      });
    }
  }

  // Record transaction retry
  recordTransactionRetry(txHash: string): void {
    const metric = this.transactionMetrics.get(txHash);
    if (metric) {
      metric.retryCount = (metric.retryCount || 0) + 1;
    }

    this.addMetric({
      id: `tx-retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `transaction_retry_${metric?.operation || 'unknown'}`,
      value: metric?.retryCount || 1,
      unit: 'count',
      timestamp: Date.now(),
      category: 'blockchain',
      metadata: { txHash, retryCount: metric?.retryCount }
    });
  }

  // Record user interaction
  recordUserInteraction(
    action: string, 
    component: string, 
    page?: string, 
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const interaction: UserInteractionMetric = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      component,
      page: page || this.currentPage,
      timestamp: Date.now(),
      duration,
      metadata
    };

    this.userInteractions.push(interaction);

    // Also record as general metric
    this.addMetric({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `user_${action}_${component}`,
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: Date.now(),
      category: 'user_interaction',
      metadata: { action, component, page: page || this.currentPage, ...metadata }
    });

    // Limit memory usage
    if (this.userInteractions.length > this.maxMetricsCount) {
      this.userInteractions = this.userInteractions.slice(-this.maxMetricsCount / 2);
    }
  }

  // Record error
  recordError(error: {
    type: ErrorMetric['type'];
    message: string;
    stack?: string;
    metadata?: Record<string, any>;
  }): void {
    const errorMetric: ErrorMetric = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: error.type,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      page: this.currentPage,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      metadata: error.metadata,
      resolved: false
    };

    this.errors.push(errorMetric);

    // Also record as general metric
    this.addMetric({
      id: `error-metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `error_${error.type}`,
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      category: 'error',
      metadata: {
        message: error.message,
        page: this.currentPage,
        ...error.metadata
      }
    });

    // Send error notification to store
    const store = useAppStore.getState();
    if (error.type === 'blockchain' || error.type === 'network') {
      store.addErrorNotification(
        'System Error',
        error.message,
        true // persistent for critical errors
      );
    }

    // Limit memory usage
    if (this.errors.length > this.maxMetricsCount) {
      this.errors = this.errors.slice(-this.maxMetricsCount / 2);
    }
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Limit memory usage
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount / 2);
    }
  }

  // Generate performance report
  generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const now = Date.now();
    const range = timeRange || {
      start: now - (24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    // Filter metrics by time range
    const filteredMetrics = this.metrics.filter(
      m => m.timestamp >= range.start && m.timestamp <= range.end
    );

    const filteredTransactions = Array.from(this.transactionMetrics.values()).filter(
      t => t.startTime >= range.start && t.startTime <= range.end
    );

    const filteredInteractions = this.userInteractions.filter(
      i => i.timestamp >= range.start && i.timestamp <= range.end
    );

    const filteredErrors = this.errors.filter(
      e => e.timestamp >= range.start && e.timestamp <= range.end
    );

    // Calculate page load metrics
    const pageLoadMetrics = filteredMetrics.filter(m => m.category === 'page_load');
    const pageLoadTimes = pageLoadMetrics.map(m => m.value).sort((a, b) => a - b);
    
    // Calculate blockchain metrics
    const successfulTx = filteredTransactions.filter(t => t.status === 'success');
    const failedTx = filteredTransactions.filter(t => t.status === 'failed');
    const completedTx = filteredTransactions.filter(t => t.duration !== undefined);
    
    // Calculate user interaction metrics
    const featureCounts = filteredInteractions.reduce((acc, interaction) => {
      const feature = `${interaction.component}_${interaction.action}`;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    // Calculate error metrics
    const errorsByType = filteredErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const report: PerformanceReport = {
      timeRange: range,
      metrics: {
        pageLoad: {
          average: pageLoadTimes.length > 0 ? 
            pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length : 0,
          p95: pageLoadTimes.length > 0 ? 
            pageLoadTimes[Math.floor(pageLoadTimes.length * 0.95)] : 0,
          p99: pageLoadTimes.length > 0 ? 
            pageLoadTimes[Math.floor(pageLoadTimes.length * 0.99)] : 0,
          count: pageLoadTimes.length
        },
        blockchain: {
          transactionSuccessRate: filteredTransactions.length > 0 ? 
            (successfulTx.length / filteredTransactions.length) * 100 : 0,
          averageTransactionTime: completedTx.length > 0 ? 
            completedTx.reduce((sum, tx) => sum + (tx.duration || 0), 0) / completedTx.length : 0,
          totalTransactions: filteredTransactions.length,
          failedTransactions: failedTx.length
        },
        userInteractions: {
          totalInteractions: filteredInteractions.length,
          averageSessionDuration: filteredInteractions.length > 0 ? 
            (range.end - range.start) / filteredInteractions.length : 0,
          mostUsedFeatures
        },
        errors: {
          totalErrors: filteredErrors.length,
          errorsByType,
          criticalErrors: filteredErrors.filter(e => 
            e.type === 'blockchain' || e.type === 'network'
          ).length
        }
      }
    };

    // Log report for debugging
    console.log('Performance Report:', report);

    return report;
  }

  // Get current metrics
  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  // Get transaction metrics
  getTransactionMetrics(): TransactionMetric[] {
    return Array.from(this.transactionMetrics.values());
  }

  // Get user interactions
  getUserInteractions(): UserInteractionMetric[] {
    return [...this.userInteractions];
  }

  // Get errors
  getErrors(): ErrorMetric[] {
    return [...this.errors];
  }

  // Clean up old metrics to prevent memory leaks
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // Keep 7 days

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.userInteractions = this.userInteractions.filter(i => i.timestamp > cutoff);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);

    // Clean up completed transactions older than cutoff
    for (const [txHash, metric] of this.transactionMetrics.entries()) {
      if (metric.startTime < cutoff && metric.status !== 'pending') {
        this.transactionMetrics.delete(txHash);
      }
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.transactionMetrics.clear();
    this.userInteractions = [];
    this.errors = [];
  }

  // Export metrics for external analysis
  exportMetrics(): {
    metrics: PerformanceMetric[];
    transactions: TransactionMetric[];
    interactions: UserInteractionMetric[];
    errors: ErrorMetric[];
  } {
    return {
      metrics: this.getMetrics(),
      transactions: this.getTransactionMetrics(),
      interactions: this.getUserInteractions(),
      errors: this.getErrors()
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitorService();

// Export convenience functions
export const recordPageLoad = (page: string, loadTime: number) => 
  performanceMonitor.recordPageLoad(page, loadTime);

export const recordTransactionStart = (txHash: string, operation: string) => 
  performanceMonitor.recordTransactionStart(txHash, operation);

export const recordTransactionComplete = (
  txHash: string, 
  success: boolean, 
  gasUsed?: number, 
  blockNumber?: number,
  error?: string
) => performanceMonitor.recordTransactionComplete(txHash, success, gasUsed, blockNumber, error);

export const recordUserInteraction = (
  action: string, 
  component: string, 
  page?: string, 
  duration?: number,
  metadata?: Record<string, any>
) => performanceMonitor.recordUserInteraction(action, component, page, duration, metadata);

export const recordError = (error: {
  type: ErrorMetric['type'];
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}) => performanceMonitor.recordError(error);

export const generatePerformanceReport = (timeRange?: { start: number; end: number }) => 
  performanceMonitor.generateReport(timeRange);