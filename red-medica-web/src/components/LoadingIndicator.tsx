import React from 'react';
import { Loader2, Wallet, Database, QrCode, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface LoadingIndicatorProps {
  type?: 'global' | 'wallet' | 'products' | 'registration' | 'verification' | 'transfer' | 'blockchain';
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const loadingIcons = {
  global: Loader2,
  wallet: Wallet,
  products: Database,
  registration: QrCode,
  verification: CheckCircle,
  transfer: Send,
  blockchain: Database,
};

const loadingMessages = {
  global: 'Loading...',
  wallet: 'Connecting to wallet...',
  products: 'Loading products...',
  registration: 'Registering product...',
  verification: 'Verifying product...',
  transfer: 'Transferring custody...',
  blockchain: 'Connecting to blockchain...',
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'global',
  message,
  progress,
  className,
  size = 'md',
  showIcon = true,
}) => {
  const loading = useAppStore((state) => state.loading[type]);
  
  if (!loading) {
    return null;
  }

  const Icon = loadingIcons[type];
  const defaultMessage = message || loadingMessages[type];

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn('flex items-center gap-2', sizeClasses[size], className)}>
      {showIcon && (
        <Icon className={cn('animate-spin', iconSizes[size])} />
      )}
      <span>{defaultMessage}</span>
      {progress !== undefined && (
        <span className="text-muted-foreground">({progress}%)</span>
      )}
    </div>
  );
};

interface GlobalLoadingOverlayProps {
  message?: string;
  progress?: number;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  message = 'Loading...',
  progress,
}) => {
  const isLoading = useAppStore((state) => state.loading.global);
  
  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg border max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <h3 className="font-semibold">{message}</h3>
        </div>
        
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface BlockchainStatusIndicatorProps {
  className?: string;
}

export const BlockchainStatusIndicator: React.FC<BlockchainStatusIndicatorProps> = ({
  className,
}) => {
  const { networkInfo, loading } = useAppStore();
  const isConnecting = loading.blockchain;
  
  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-500';
    switch (networkInfo.status) {
      case 'connected': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'reconnecting': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (isConnecting) return <Loader2 className="w-4 h-4 animate-spin" />;
    switch (networkInfo.status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'reconnecting': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    switch (networkInfo.status) {
      case 'connected': return 'Connected';
      case 'error': return 'Connection Error';
      case 'reconnecting': return 'Reconnecting...';
      default: return 'Disconnected';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', getStatusColor(), className)}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {networkInfo.chainName && networkInfo.status === 'connected' && (
        <span className="text-muted-foreground">({networkInfo.chainName})</span>
      )}
    </div>
  );
};

interface TransactionStatusProps {
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  message?: string;
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  txHash,
  status,
  message,
  className,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return message || 'Transaction pending...';
      case 'confirmed': return message || 'Transaction confirmed';
      case 'failed': return message || 'Transaction failed';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {getStatusIcon()}
      <div className="flex-1">
        <p>{getStatusText()}</p>
        {txHash && (
          <p className="text-xs text-muted-foreground font-mono">
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;