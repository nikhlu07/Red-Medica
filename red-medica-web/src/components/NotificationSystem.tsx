import React, { useState, useEffect } from 'react';
import { useAppStore, type Notification } from '@/lib/store';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface EnhancedNotification extends Notification {
  progress?: number;
  isLoading?: boolean;
  txHash?: string;
  blockExplorerUrl?: string;
  canRetry?: boolean;
  onRetry?: () => void;
}

const NotificationItem: React.FC<{ 
  notification: EnhancedNotification; 
  onRemove: (id: string) => void; 
}> = ({ notification, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  // Auto-dismiss timer for non-persistent notifications
  useEffect(() => {
    if (!notification.persistent && notification.timestamp) {
      const dismissTime = 5000; // 5 seconds
      const elapsed = Date.now() - notification.timestamp;
      const remaining = Math.max(0, dismissTime - elapsed);
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        const timer = setInterval(() => {
          const newRemaining = Math.max(0, dismissTime - (Date.now() - notification.timestamp));
          setTimeLeft(newRemaining);
          
          if (newRemaining <= 0) {
            onRemove(notification.id);
          }
        }, 100);
        
        return () => clearInterval(timer);
      }
    }
  }, [notification.persistent, notification.timestamp, notification.id, onRemove]);

  const Icon = notification.isLoading ? Loader2 : icons[notification.type];
  const progressPercentage = timeLeft ? (timeLeft / 5000) * 100 : 0;

  return (
    <div
      className={cn(
        'rounded-lg border shadow-sm transition-all duration-300 ease-in-out',
        colors[notification.type],
        isExpanded ? 'max-w-md' : 'max-w-sm'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon 
          className={cn(
            'w-5 h-5 mt-0.5 flex-shrink-0', 
            iconColors[notification.type],
            notification.isLoading && 'animate-spin'
          )} 
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {!notification.persistent && (
              <button
                onClick={() => onRemove(notification.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors ml-2"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          
          {/* Progress bar for loading operations */}
          {notification.progress !== undefined && (
            <div className="mt-2">
              <Progress value={notification.progress} className="h-2" />
              <p className="text-xs opacity-75 mt-1">{notification.progress}% complete</p>
            </div>
          )}
          
          {/* Transaction hash link */}
          {notification.txHash && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs underline opacity-75 hover:opacity-100 transition-opacity"
              >
                {isExpanded ? 'Hide' : 'Show'} transaction details
              </button>
              
              {isExpanded && (
                <div className="mt-2 p-2 bg-black/5 rounded text-xs">
                  <p className="font-mono break-all">{notification.txHash}</p>
                  {notification.blockExplorerUrl && (
                    <a
                      href={notification.blockExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View on explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          {(notification.action || notification.canRetry) && (
            <div className="flex gap-2 mt-3">
              {notification.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.action.onClick}
                  className="text-xs h-7"
                >
                  {notification.action.label}
                </Button>
              )}
              
              {notification.canRetry && notification.onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.onRetry}
                  className="text-xs h-7"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
        
        {notification.persistent && (
          <button
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Auto-dismiss progress bar */}
      {!notification.persistent && timeLeft && timeLeft > 0 && (
        <div className="h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationSystem;