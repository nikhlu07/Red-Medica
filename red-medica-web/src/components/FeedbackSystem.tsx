import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';

interface FeedbackStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  estimatedTime?: number;
  errorMessage?: string;
}

interface FeedbackSystemProps {
  steps: FeedbackStep[];
  title?: string;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  steps,
  title = 'Processing...',
  onComplete,
  onCancel,
  className,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = (completedSteps / steps.length) * 100;
    setOverallProgress(progress);

    const activeStepIndex = steps.findIndex(step => step.status === 'active');
    if (activeStepIndex !== -1) {
      setCurrentStepIndex(activeStepIndex);
    }

    // Check if all steps are completed
    if (completedSteps === steps.length && onComplete) {
      setTimeout(onComplete, 500); // Small delay for better UX
    }
  }, [steps, onComplete]);

  const getStepIcon = (step: FeedbackStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: FeedbackStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}% complete
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all duration-200',
              getStepColor(step),
              index === currentStepIndex && 'ring-2 ring-blue-200'
            )}
          >
            {getStepIcon(step)}
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{step.title}</h4>
              {step.description && (
                <p className="text-sm opacity-75 mt-1">{step.description}</p>
              )}
              
              {step.status === 'active' && step.progress !== undefined && (
                <div className="mt-2">
                  <Progress value={step.progress} className="h-1" />
                  <p className="text-xs opacity-75 mt-1">{step.progress}% complete</p>
                </div>
              )}
              
              {step.status === 'error' && step.errorMessage && (
                <p className="text-sm text-red-600 mt-1">{step.errorMessage}</p>
              )}
              
              {step.estimatedTime && step.status === 'active' && (
                <p className="text-xs opacity-75 mt-1">
                  Estimated time: {step.estimatedTime}s
                </p>
              )}
            </div>
            
            {index < steps.length - 1 && step.status === 'completed' && (
              <ArrowRight className="w-4 h-4 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {onCancel && (
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

interface SuccessConfirmationProps {
  title: string;
  message: string;
  details?: {
    txHash?: string;
    productId?: string;
    blockExplorerUrl?: string;
  };
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  onDismiss?: () => void;
  className?: string;
}

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  title,
  message,
  details,
  actions,
  onDismiss,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      'bg-green-50 border border-green-200 rounded-lg p-6 transition-all duration-300',
      className
    )}>
      <div className="flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 mb-2">{title}</h3>
          <p className="text-green-700 mb-4">{message}</p>
          
          {details && (
            <div className="bg-green-100 rounded p-3 mb-4 text-sm">
              {details.productId && (
                <p className="mb-1">
                  <span className="font-medium">Product ID:</span> {details.productId}
                </p>
              )}
              {details.txHash && (
                <p className="mb-1">
                  <span className="font-medium">Transaction:</span>
                  <span className="font-mono ml-1">
                    {details.txHash.slice(0, 10)}...{details.txHash.slice(-8)}
                  </span>
                </p>
              )}
              {details.blockExplorerUrl && (
                <a
                  href={details.blockExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                >
                  View on blockchain explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
          
          {actions && (
            <div className="flex gap-2">
              {actions.primary && (
                <Button
                  onClick={actions.primary.onClick}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actions.primary.label}
                </Button>
              )}
              {actions.secondary && (
                <Button
                  variant="outline"
                  onClick={actions.secondary.onClick}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  {actions.secondary.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UserGuidanceProps {
  title: string;
  steps: string[];
  currentStep?: number;
  type?: 'info' | 'warning' | 'tip';
  onNext?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const UserGuidance: React.FC<UserGuidanceProps> = ({
  title,
  steps,
  currentStep = 0,
  type = 'info',
  onNext,
  onSkip,
  className,
}) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    tip: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  const iconColors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    tip: 'text-purple-500',
  };

  return (
    <div className={cn(
      'rounded-lg border p-4',
      colors[type],
      className
    )}>
      <div className="flex items-start gap-3">
        <Info className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[type])} />
        
        <div className="flex-1">
          <h4 className="font-medium mb-3">{title}</h4>
          
          <ol className="space-y-2 mb-4">
            {steps.map((step, index) => (
              <li
                key={index}
                className={cn(
                  'flex items-start gap-2 text-sm',
                  index === currentStep && 'font-medium',
                  index < currentStep && 'opacity-60'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center',
                  index === currentStep ? 'bg-current text-white' : 'bg-current/20'
                )}>
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          
          {(onNext || onSkip) && (
            <div className="flex gap-2">
              {onNext && (
                <Button
                  size="sm"
                  onClick={onNext}
                  className="text-xs"
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
                </Button>
              )}
              {onSkip && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSkip}
                  className="text-xs"
                >
                  Skip Guide
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackSystem;