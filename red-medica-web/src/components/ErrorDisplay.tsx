import React from 'react';
import { AlertCircle, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

interface ErrorDisplayProps {
  type?: 'global' | 'wallet' | 'products' | 'registration' | 'verification' | 'transfer' | 'blockchain';
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
  showTechnicalDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'global',
  title,
  message,
  technicalDetails,
  onRetry,
  onDismiss,
  className,
  variant = 'card',
  showTechnicalDetails = false,
}) => {
  const error = useAppStore((state) => state.errors[type]);
  const clearError = useAppStore((state) => state.clearError);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error && !message) {
    return null;
  }

  const errorMessage = message || error;
  const errorTitle = title || getDefaultTitle(type);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      clearError(type);
    }
  };

  const handleCopyError = async () => {
    const errorInfo = {
      title: errorTitle,
      message: errorMessage,
      technicalDetails,
      timestamp: new Date().toISOString(),
      type,
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const baseClasses = 'border border-red-200 bg-red-50 text-red-800';
  
  const variantClasses = {
    inline: 'p-3 rounded-md',
    card: 'p-4 rounded-lg shadow-sm',
    banner: 'p-4 rounded-none border-l-4 border-l-red-500',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{errorTitle}</h3>
          <p className="text-sm mt-1 opacity-90">{errorMessage}</p>
          
          {(technicalDetails || showTechnicalDetails) && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs underline opacity-75 hover:opacity-100 transition-opacity"
              >
                {showDetails ? 'Hide' : 'Show'} technical details
              </button>
              
              {showDetails && technicalDetails && (
                <div className="mt-2 p-3 bg-red-100 rounded text-xs">
                  <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                    {technicalDetails}
                  </pre>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyError}
                      className="text-xs h-6"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Error
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-xs h-7 bg-white hover:bg-red-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs h-7 bg-white hover:bg-red-50"
            >
              Dismiss
            </Button>
            
            {type === 'blockchain' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/help#troubleshooting', '_blank')}
                className="text-xs h-7 bg-white hover:bg-red-50"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Get Help
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600">
              An unexpected error occurred in the application
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? 'Hide' : 'Show'} error details
          </button>
          
          {showDetails && (
            <div className="p-3 bg-gray-100 rounded text-xs">
              <pre className="whitespace-pre-wrap font-mono overflow-x-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultTitle(type: string): string {
  const titles = {
    global: 'Application Error',
    wallet: 'Wallet Connection Error',
    products: 'Product Loading Error',
    registration: 'Product Registration Error',
    verification: 'Product Verification Error',
    transfer: 'Custody Transfer Error',
    blockchain: 'Blockchain Connection Error',
  };
  
  return titles[type as keyof typeof titles] || 'Error';
}

export default ErrorDisplay;