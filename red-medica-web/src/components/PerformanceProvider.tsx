import React, { useEffect, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor } from '../services/performanceMonitor';
import { usePagePerformance } from '../hooks/usePerformanceMonitor';

// Create context for performance monitoring
const PerformanceContext = createContext<{
  isMonitoringEnabled: boolean;
  toggleMonitoring: (enabled: boolean) => void;
}>({
  isMonitoringEnabled: true,
  toggleMonitoring: () => {}
});

export const usePerformanceContext = () => useContext(PerformanceContext);

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = React.useState(true);
  const location = useLocation();

  // Initialize page performance monitoring
  usePagePerformance();

  useEffect(() => {
    // Set up global error boundary for performance monitoring
    const handleError = (event: ErrorEvent) => {
      if (isMonitoringEnabled) {
        performanceMonitor.recordError({
          type: 'ui',
          message: event.message,
          stack: event.error?.stack,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            page: location.pathname
          }
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMonitoringEnabled) {
        performanceMonitor.recordError({
          type: 'ui',
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          metadata: {
            reason: event.reason,
            page: location.pathname
          }
        });
      }
    };

    // Set up performance observer for web vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              performanceMonitor.recordPageLoad(
                `lcp_${location.pathname.replace('/', '') || 'home'}`,
                entry.startTime
              );
            }
          }
        });

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              performanceMonitor.recordUserInteraction(
                'first_input_delay',
                'performance_observer',
                location.pathname,
                (entry as any).processingStart - entry.startTime
              );
            }
          }
        });

        // Observe Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            performanceMonitor.recordPageLoad(
              `cls_${location.pathname.replace('/', '') || 'home'}`,
              clsValue * 1000 // Convert to ms for consistency
            );
          }
        });

        // Start observing
        try {
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          console.warn('LCP observer not supported');
        }

        try {
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {
          console.warn('FID observer not supported');
        }

        try {
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
          console.warn('CLS observer not supported');
        }

        // Cleanup observers
        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn('Performance observers not fully supported:', error);
      }
    }

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        performanceMonitor.recordUserInteraction(
          'page_hidden',
          'visibility_api',
          location.pathname
        );
      } else {
        performanceMonitor.recordUserInteraction(
          'page_visible',
          'visibility_api',
          location.pathname
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track online/offline status
    const handleOnline = () => {
      performanceMonitor.recordUserInteraction(
        'network_online',
        'network_api',
        location.pathname
      );
    };

    const handleOffline = () => {
      performanceMonitor.recordUserInteraction(
        'network_offline',
        'network_api',
        location.pathname
      );
      
      performanceMonitor.recordError({
        type: 'network',
        message: 'Network connection lost',
        metadata: {
          page: location.pathname,
          timestamp: Date.now()
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMonitoringEnabled, location.pathname]);

  // Track route changes
  useEffect(() => {
    if (isMonitoringEnabled) {
      performanceMonitor.recordUserInteraction(
        'route_change',
        'router',
        location.pathname,
        undefined,
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash
        }
      );
    }
  }, [location, isMonitoringEnabled]);

  const toggleMonitoring = (enabled: boolean) => {
    setIsMonitoringEnabled(enabled);
    performanceMonitor.setEnabled(enabled);
    
    if (enabled) {
      performanceMonitor.recordUserInteraction(
        'monitoring_enabled',
        'performance_provider'
      );
    } else {
      performanceMonitor.recordUserInteraction(
        'monitoring_disabled',
        'performance_provider'
      );
    }
  };

  return (
    <PerformanceContext.Provider value={{ isMonitoringEnabled, toggleMonitoring }}>
      {children}
    </PerformanceContext.Provider>
  );
};

// HOC for wrapping components with performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const location = useLocation();
    
    useEffect(() => {
      const mountTime = Date.now();
      
      // Record component mount
      performanceMonitor.recordUserInteraction(
        'component_mount',
        componentName,
        location.pathname,
        undefined,
        { mountTime }
      );

      return () => {
        // Record component unmount
        const unmountTime = Date.now();
        const mountDuration = unmountTime - mountTime;
        
        performanceMonitor.recordUserInteraction(
          'component_unmount',
          componentName,
          location.pathname,
          mountDuration,
          { mountTime, unmountTime }
        );
      };
    }, [location.pathname]);

    return <Component {...props} ref={ref} />;
  });
};

// Hook for component-level performance tracking
export const useComponentPerformance = (componentName: string) => {
  const location = useLocation();
  
  const trackRender = (renderTime: number) => {
    performanceMonitor.recordUserInteraction(
      'component_render',
      componentName,
      location.pathname,
      renderTime
    );
  };

  const trackInteraction = (action: string, duration?: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordUserInteraction(
      action,
      componentName,
      location.pathname,
      duration,
      metadata
    );
  };

  const trackError = (error: Error, metadata?: Record<string, any>) => {
    performanceMonitor.recordError({
      type: 'ui',
      message: error.message,
      stack: error.stack,
      metadata: {
        component: componentName,
        page: location.pathname,
        ...metadata
      }
    });
  };

  return {
    trackRender,
    trackInteraction,
    trackError
  };
};