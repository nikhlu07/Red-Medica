import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorHandlingService } from '../services/errorHandlingService';
import { ErrorType, ErrorSeverity } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to our error handling service
    const enhancedError = {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      title: 'Application Error',
      message: error.message || 'An unexpected error occurred in the application',
      technicalDetails: this.formatErrorDetails(error, errorInfo),
      userAction: 'Try refreshing the page or contact support if the problem persists',
      canRetry: true,
      timestamp: Date.now(),
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.retryCount,
      },
    };

    // Log to error service
    errorHandlingService['logError'](enhancedError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error tracking service if available
    this.reportToExternalService(error, errorInfo, enhancedError);
  }

  private formatErrorDetails(error: Error, errorInfo: ErrorInfo): string {
    const details = [];
    
    if (error.name) {
      details.push(`Error Type: ${error.name}`);
    }
    
    if (error.message) {
      details.push(`Message: ${error.message}`);
    }
    
    if (error.stack) {
      details.push(`Stack Trace:\n${error.stack}`);
    }
    
    if (errorInfo.componentStack) {
      details.push(`Component Stack:${errorInfo.componentStack}`);
    }
    
    return details.join('\n\n');
  }

  private reportToExternalService(error: Error, errorInfo: ErrorInfo, enhancedError: any): void {
    try {
      // Here you could integrate with services like Sentry, LogRocket, etc.
      console.error('Error Boundary caught error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        enhancedError,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    } catch (reportingError) {
      console.error('Failed to report error to external service:', reportingError);
    }
  }

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    } else {
      // Max retries reached, suggest page reload
      window.location.reload();
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReportBug = (): void => {
    const { error, errorInfo, errorId } = this.state;
    
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // Create mailto link with bug report
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Application Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Error Details:
${JSON.stringify(bugReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@redmedica.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error!,
          this.state.errorInfo!,
          this.handleRetry
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h1>
                <p className="text-sm text-gray-600">
                  An unexpected error occurred in the application
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.errorId && (
                <p className="text-xs text-red-600 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {this.retryCount < this.maxRetries ? (
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              ) : (
                <Button 
                  onClick={this.handleReload} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              )}

              <Button 
                onClick={this.handleGoHome} 
                className="w-full"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>

              <Button 
                onClick={this.handleReportBug} 
                className="w-full"
                variant="outline"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Bug
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                  <pre className="whitespace-pre-wrap">
                    {this.formatErrorDetails(this.state.error!, this.state.errorInfo!)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;