import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  performanceMonitor, 
  recordPageLoad, 
  recordUserInteraction, 
  recordError,
  type PerformanceReport,
  type PerformanceMetric,
  type TransactionMetric,
  type UserInteractionMetric,
  type ErrorMetric
} from '../services/performanceMonitor';

// Hook for page-level performance monitoring
export const usePagePerformance = (pageName?: string) => {
  const location = useLocation();
  const pageLoadStartRef = useRef<number>(Date.now());
  const currentPageName = pageName || location.pathname.replace('/', '') || 'home';

  useEffect(() => {
    // Record page load time
    const loadTime = Date.now() - pageLoadStartRef.current;
    recordPageLoad(currentPageName, loadTime);

    // Record page view interaction
    recordUserInteraction('page_view', 'page', currentPageName);

    // Update page load start time for next navigation
    pageLoadStartRef.current = Date.now();
  }, [location.pathname, currentPageName]);

  // Function to record custom page metrics
  const recordPageMetric = useCallback((name: string, value: number, unit: string = 'ms') => {
    performanceMonitor.recordPageLoad(`${currentPageName}_${name}`, value);
  }, [currentPageName]);

  return {
    recordPageMetric,
    currentPage: currentPageName
  };
};

// Hook for component-level interaction tracking
export const useInteractionTracking = (componentName: string) => {
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'home';

  // Track button clicks
  const trackClick = useCallback((action: string, metadata?: Record<string, any>) => {
    recordUserInteraction('click', componentName, currentPage, undefined, {
      action,
      ...metadata
    });
  }, [componentName, currentPage]);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean, duration?: number) => {
    recordUserInteraction('form_submit', componentName, currentPage, duration, {
      formName,
      success
    });
  }, [componentName, currentPage]);

  // Track input focus/blur
  const trackInputFocus = useCallback((inputName: string) => {
    recordUserInteraction('input_focus', componentName, currentPage, undefined, {
      inputName
    });
  }, [componentName, currentPage]);

  const trackInputBlur = useCallback((inputName: string, duration?: number) => {
    recordUserInteraction('input_blur', componentName, currentPage, duration, {
      inputName
    });
  }, [componentName, currentPage]);

  // Track modal/dialog interactions
  const trackModalOpen = useCallback((modalName: string) => {
    recordUserInteraction('modal_open', componentName, currentPage, undefined, {
      modalName
    });
  }, [componentName, currentPage]);

  const trackModalClose = useCallback((modalName: string, duration?: number) => {
    recordUserInteraction('modal_close', componentName, currentPage, duration, {
      modalName
    });
  }, [componentName, currentPage]);

  // Track scroll events (throttled)
  const trackScroll = useCallback((scrollPosition: number, scrollPercentage: number) => {
    recordUserInteraction('scroll', componentName, currentPage, undefined, {
      scrollPosition,
      scrollPercentage
    });
  }, [componentName, currentPage]);

  // Generic interaction tracker
  const trackInteraction = useCallback((
    action: string, 
    duration?: number, 
    metadata?: Record<string, any>
  ) => {
    recordUserInteraction(action, componentName, currentPage, duration, metadata);
  }, [componentName, currentPage]);

  return {
    trackClick,
    trackFormSubmit,
    trackInputFocus,
    trackInputBlur,
    trackModalOpen,
    trackModalClose,
    trackScroll,
    trackInteraction
  };
};

// Hook for blockchain transaction monitoring
export const useTransactionMonitoring = () => {
  const trackTransactionStart = useCallback((txHash: string, operation: string) => {
    performanceMonitor.recordTransactionStart(txHash, operation);
  }, []);

  const trackTransactionComplete = useCallback((
    txHash: string,
    success: boolean,
    gasUsed?: number,
    blockNumber?: number,
    error?: string
  ) => {
    performanceMonitor.recordTransactionComplete(txHash, success, gasUsed, blockNumber, error);
  }, []);

  const trackTransactionRetry = useCallback((txHash: string) => {
    performanceMonitor.recordTransactionRetry(txHash);
  }, []);

  return {
    trackTransactionStart,
    trackTransactionComplete,
    trackTransactionRetry
  };
};

// Hook for error tracking
export const useErrorTracking = () => {
  const trackError = useCallback((
    type: ErrorMetric['type'],
    message: string,
    stack?: string,
    metadata?: Record<string, any>
  ) => {
    recordError({ type, message, stack, metadata });
  }, []);

  const trackBlockchainError = useCallback((message: string, metadata?: Record<string, any>) => {
    trackError('blockchain', message, undefined, metadata);
  }, [trackError]);

  const trackNetworkError = useCallback((message: string, metadata?: Record<string, any>) => {
    trackError('network', message, undefined, metadata);
  }, [trackError]);

  const trackValidationError = useCallback((message: string, metadata?: Record<string, any>) => {
    trackError('validation', message, undefined, metadata);
  }, [trackError]);

  const trackUIError = useCallback((message: string, metadata?: Record<string, any>) => {
    trackError('ui', message, undefined, metadata);
  }, [trackError]);

  return {
    trackError,
    trackBlockchainError,
    trackNetworkError,
    trackValidationError,
    trackUIError
  };
};

// Hook for performance reporting
export const usePerformanceReporting = () => {
  const generateReport = useCallback((timeRange?: { start: number; end: number }) => {
    return performanceMonitor.generateReport(timeRange);
  }, []);

  const getMetrics = useCallback((category?: PerformanceMetric['category']) => {
    return performanceMonitor.getMetrics(category);
  }, []);

  const getTransactionMetrics = useCallback(() => {
    return performanceMonitor.getTransactionMetrics();
  }, []);

  const getUserInteractions = useCallback(() => {
    return performanceMonitor.getUserInteractions();
  }, []);

  const getErrors = useCallback(() => {
    return performanceMonitor.getErrors();
  }, []);

  const exportMetrics = useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
  }, []);

  return {
    generateReport,
    getMetrics,
    getTransactionMetrics,
    getUserInteractions,
    getErrors,
    exportMetrics,
    clearMetrics
  };
};

// Hook for real-time performance monitoring
export const useRealTimePerformance = (interval: number = 30000) => {
  const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const generateCurrentReport = () => {
      const report = performanceMonitor.generateReport({
        start: Date.now() - interval,
        end: Date.now()
      });
      setCurrentReport(report);
    };

    // Generate initial report
    generateCurrentReport();

    // Set up interval for updates
    const intervalId = setInterval(generateCurrentReport, interval);

    return () => clearInterval(intervalId);
  }, [isMonitoring, interval]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setCurrentReport(null);
  }, []);

  return {
    currentReport,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// Hook for performance alerts
export const usePerformanceAlerts = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
  }>>([]);

  useEffect(() => {
    const checkPerformance = () => {
      const report = performanceMonitor.generateReport({
        start: Date.now() - (5 * 60 * 1000), // Last 5 minutes
        end: Date.now()
      });

      const newAlerts: typeof alerts = [];

      // Check page load performance
      if (report.metrics.pageLoad.average > 3000) {
        newAlerts.push({
          id: `page-load-${Date.now()}`,
          type: 'warning',
          message: `Page load time is high: ${Math.round(report.metrics.pageLoad.average)}ms`,
          timestamp: Date.now(),
          resolved: false
        });
      }

      // Check transaction success rate
      if (report.metrics.blockchain.transactionSuccessRate < 90 && report.metrics.blockchain.totalTransactions > 0) {
        newAlerts.push({
          id: `tx-success-${Date.now()}`,
          type: 'critical',
          message: `Transaction success rate is low: ${Math.round(report.metrics.blockchain.transactionSuccessRate)}%`,
          timestamp: Date.now(),
          resolved: false
        });
      }

      // Check error rate
      if (report.metrics.errors.totalErrors > 10) {
        newAlerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'warning',
          message: `High error rate: ${report.metrics.errors.totalErrors} errors in last 5 minutes`,
          timestamp: Date.now(),
          resolved: false
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 19)]); // Keep max 20 alerts
      }
    };

    // Check performance every minute
    const intervalId = setInterval(checkPerformance, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    resolveAlert,
    clearAlerts
  };
};

// Import useState for real-time hooks
import { useState } from 'react';