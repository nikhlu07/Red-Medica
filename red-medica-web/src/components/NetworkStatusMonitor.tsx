import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { errorHandlingService } from '../services/errorHandlingService';
import { NetworkStatus } from '../types/blockchain';

interface NetworkStatusMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { networkInfo, isOnline } = useAppStore();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      useAppStore.getState().setOnlineStatus(true);
      checkNetworkHealth();
    };

    const handleOffline = () => {
      useAppStore.getState().setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkNetworkHealth();

    // Periodic health checks every 30 seconds
    const interval = setInterval(checkNetworkHealth, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkNetworkHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const isHealthy = await errorHandlingService.handleNetworkConnectivity();
      setLastCheck(new Date());
      
      if (!isHealthy && isOnline) {
        // We're online but can't reach blockchain network
        useAppStore.getState().setNetworkInfo({
          status: NetworkStatus.ERROR,
          endpoint: networkInfo.endpoint,
          lastUpdate: Date.now(),
          error: 'Cannot reach blockchain network',
        });
      }
    } catch (error) {
      console.error('Network health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (networkInfo.status) {
      case NetworkStatus.CONNECTED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case NetworkStatus.CONNECTING:
      case NetworkStatus.RECONNECTING:
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case NetworkStatus.ERROR:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case NetworkStatus.DISCONNECTED:
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (networkInfo.status) {
      case NetworkStatus.CONNECTED:
        return 'Connected';
      case NetworkStatus.CONNECTING:
        return 'Connecting...';
      case NetworkStatus.RECONNECTING:
        return 'Reconnecting...';
      case NetworkStatus.ERROR:
        return 'Connection Error';
      case NetworkStatus.DISCONNECTED:
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-600';
    }

    switch (networkInfo.status) {
      case NetworkStatus.CONNECTED:
        return 'text-green-600';
      case NetworkStatus.CONNECTING:
      case NetworkStatus.RECONNECTING:
        return 'text-yellow-600';
      case NetworkStatus.ERROR:
        return 'text-red-600';
      case NetworkStatus.DISCONNECTED:
      default:
        return 'text-gray-600';
    }
  };

  const handleRetryConnection = async () => {
    setIsChecking(true);
    try {
      // Trigger a manual network check
      await checkNetworkHealth();
      
      // If we have a blockchain service, try to reconnect
      if (window.blockchainService?.initialize) {
        await window.blockchainService.initialize();
      }
    } catch (error) {
      console.error('Manual reconnection failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Network Status</h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Internet:</span>
          <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Blockchain:</span>
          <span className={getStatusColor()}>
            {getStatusText()}
          </span>
        </div>

        {networkInfo.endpoint && (
          <div className="flex justify-between">
            <span className="text-gray-600">Endpoint:</span>
            <span className="text-gray-800 font-mono text-xs truncate max-w-32">
              {networkInfo.endpoint}
            </span>
          </div>
        )}

        {networkInfo.chainName && (
          <div className="flex justify-between">
            <span className="text-gray-600">Network:</span>
            <span className="text-gray-800">
              {networkInfo.chainName}
            </span>
          </div>
        )}

        {networkInfo.blockNumber && (
          <div className="flex justify-between">
            <span className="text-gray-600">Block:</span>
            <span className="text-gray-800 font-mono">
              #{networkInfo.blockNumber.toLocaleString()}
            </span>
          </div>
        )}

        {lastCheck && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last Check:</span>
            <span className="text-gray-800">
              {lastCheck.toLocaleTimeString()}
            </span>
          </div>
        )}

        {networkInfo.error && (
          <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-xs">
            {networkInfo.error}
          </div>
        )}
      </div>

      {(networkInfo.status === NetworkStatus.ERROR || 
        networkInfo.status === NetworkStatus.DISCONNECTED) && (
        <button
          onClick={handleRetryConnection}
          disabled={isChecking}
          className="mt-3 w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? 'Checking...' : 'Retry Connection'}
        </button>
      )}
    </div>
  );
};

export default NetworkStatusMonitor;