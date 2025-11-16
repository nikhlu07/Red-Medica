// Blockchain service types
export enum NetworkStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

export interface NetworkInfo {
  status: NetworkStatus;
  endpoint: string;
  chainName?: string;
  blockNumber?: number;
  lastUpdate: number;
  error?: string;
}

export interface Product {
  id: number;
  name: string;
  batchNumber: string;
  manufacturer: string;
  manufacturerName: string;
  quantity: number;
  mfgDate: number;
  expiryDate: number;
  category: string;
  currentHolder: string;
  isAuthentic: boolean;
  createdAt: number;
}

export interface Transfer {
  productId: number;
  from: string;
  to: string;
  timestamp: number;
  location: string;
  verified: boolean;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string;
  technicalError?: string;
}

export interface ProductRegistrationResult extends TransactionResult {
  productId?: number;
  message?: string;
  technicalError?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  details: {
    api?: boolean;
    connected?: boolean;
    status?: NetworkStatus;
    error?: string;
    peers?: number;
    isSyncing?: any;
    shouldHavePeers?: any;
    chain?: string;
    blockNumber?: number;
    contractReady?: boolean;
    networkStatus?: NetworkInfo;
  };
}