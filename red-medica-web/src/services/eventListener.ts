import { useAppStore } from '../lib/store';
import { NetworkStatus } from '../types/blockchain';

export interface BlockchainEvent {
  type: 'ProductRegistered' | 'CustodyTransferred' | 'ProductVerified' | 'ManufacturerAuthorized';
  data: any;
  timestamp: number;
  blockNumber?: number;
  txHash?: string;
}

export interface EventListenerConfig {
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  eventBufferSize: number;
}

class EventListenerService {
  private isListening = false;
  private eventBuffer: BlockchainEvent[] = [];
  private eventListeners: Map<string, ((event: BlockchainEvent) => void)[]> = new Map();
  private config: EventListenerConfig = {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    eventBufferSize: 100,
  };
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupWindowEventListeners();
    this.setupNetworkStatusListener();
  }

  /**
   * Start listening for blockchain events
   */
  startListening(): void {
    if (this.isListening) {
      console.log('Event listener already running');
      return;
    }

    this.isListening = true;
    this.reconnectAttempts = 0;
    
    console.log('Real-time blockchain event listening started');
    
    // Notify store that event listening is active
    useAppStore.getState().addInfoNotification(
      'Real-time Updates',
      'Connected to blockchain events'
    );
  }

  /**
   * Stop listening for blockchain events
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    console.log('Real-time blockchain event listening stopped');
    
    // Notify store that event listening is stopped
    useAppStore.getState().addWarningNotification(
      'Real-time Updates',
      'Disconnected from blockchain events'
    );
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, callback: (event: BlockchainEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(callback: (event: BlockchainEvent) => void): () => void {
    return this.subscribe('*', callback);
  }

  /**
   * Get recent events from buffer
   */
  getRecentEvents(limit = 10): BlockchainEvent[] {
    return this.eventBuffer.slice(0, limit);
  }

  /**
   * Clear event buffer
   */
  clearEventBuffer(): void {
    this.eventBuffer = [];
  }

  /**
   * Setup window event listeners for blockchain events
   */
  private setupWindowEventListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen for product registration events
    window.addEventListener('blockchainProductRegistered', (event: any) => {
      this.handleProductRegisteredEvent(event.detail);
    });

    // Listen for custody transfer events
    window.addEventListener('blockchainCustodyTransferred', (event: any) => {
      this.handleCustodyTransferredEvent(event.detail);
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      useAppStore.getState().setOnlineStatus(true);
      if (this.config.autoReconnect && !this.isListening) {
        this.attemptReconnect();
      }
    });

    window.addEventListener('offline', () => {
      useAppStore.getState().setOnlineStatus(false);
      useAppStore.getState().addWarningNotification(
        'Connection Lost',
        'You are now offline. Some features may not work.'
      );
    });
  }

  /**
   * Setup network status listener from store
   */
  private setupNetworkStatusListener(): void {
    // Subscribe to network status changes
    useAppStore.subscribe(
      (state) => state.networkInfo.status,
      (status) => {
        this.handleNetworkStatusChange(status);
      }
    );
  }

  /**
   * Handle network status changes
   */
  private handleNetworkStatusChange(status: NetworkStatus): void {
    const store = useAppStore.getState();
    
    switch (status) {
      case NetworkStatus.CONNECTED:
        if (!this.isListening && this.config.autoReconnect) {
          this.startListening();
        }
        this.reconnectAttempts = 0;
        break;
        
      case NetworkStatus.DISCONNECTED:
      case NetworkStatus.ERROR:
        if (this.isListening) {
          this.stopListening();
        }
        if (this.config.autoReconnect) {
          this.attemptReconnect();
        }
        break;
        
      case NetworkStatus.RECONNECTING:
        store.addInfoNotification(
          'Reconnecting',
          'Attempting to reconnect to blockchain...'
        );
        break;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      useAppStore.getState().addErrorNotification(
        'Connection Failed',
        'Unable to reconnect to blockchain after multiple attempts',
        true
      );
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    useAppStore.getState().addInfoNotification(
      'Reconnecting',
      `Attempting to reconnect... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (useAppStore.getState().isOnline) {
        this.startListening();
      } else {
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Handle product registered events
   */
  private handleProductRegisteredEvent(eventData: any): void {
    try {
      const event: BlockchainEvent = {
        type: 'ProductRegistered',
        data: eventData,
        timestamp: eventData.timestamp || Date.now(),
      };

      this.processEvent(event);

      // Update store state
      const store = useAppStore.getState();
      store.addSuccessNotification(
        'Product Registered',
        `Product ${eventData.name} (ID: ${eventData.productId}) has been registered`
      );

      // Invalidate product cache to force refresh
      store.invalidateProductCache();

      // Update last block update timestamp
      store.updateLastBlockUpdate();

      console.log('Product registration event processed:', eventData);
    } catch (error) {
      console.error('Error processing product registered event:', error);
      this.handleEventError('ProductRegistered', error);
    }
  }

  /**
   * Handle custody transferred events
   */
  private handleCustodyTransferredEvent(eventData: any): void {
    try {
      const event: BlockchainEvent = {
        type: 'CustodyTransferred',
        data: eventData,
        timestamp: eventData.timestamp || Date.now(),
      };

      this.processEvent(event);

      // Update store state
      const store = useAppStore.getState();
      store.addSuccessNotification(
        'Custody Transferred',
        `Product ${eventData.productId} custody transferred to ${eventData.to.slice(0, 8)}...`
      );

      // Invalidate specific product cache
      store.invalidateProductCache(eventData.productId.toString());

      // Update last block update timestamp
      store.updateLastBlockUpdate();

      console.log('Custody transfer event processed:', eventData);
    } catch (error) {
      console.error('Error processing custody transferred event:', error);
      this.handleEventError('CustodyTransferred', error);
    }
  }

  /**
   * Process and distribute events to subscribers
   */
  private processEvent(event: BlockchainEvent): void {
    // Add to event buffer
    this.eventBuffer.unshift(event);
    
    // Maintain buffer size
    if (this.eventBuffer.length > this.config.eventBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(0, this.config.eventBufferSize);
    }

    // Notify specific event type subscribers
    const typeListeners = this.eventListeners.get(event.type) || [];
    typeListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });

    // Notify all-events subscribers
    const allListeners = this.eventListeners.get('*') || [];
    allListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in all-events listener:', error);
      }
    });
  }

  /**
   * Handle event processing errors
   */
  private handleEventError(eventType: string, error: any): void {
    console.error(`Error processing ${eventType} event:`, error);
    
    useAppStore.getState().addErrorNotification(
      'Event Processing Error',
      `Failed to process ${eventType} event. Some data may be out of sync.`
    );
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EventListenerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): EventListenerConfig {
    return { ...this.config };
  }

  /**
   * Get listening status
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Get event statistics
   */
  getStats(): {
    isListening: boolean;
    eventBufferSize: number;
    subscriberCount: number;
    reconnectAttempts: number;
  } {
    let subscriberCount = 0;
    this.eventListeners.forEach(listeners => {
      subscriberCount += listeners.length;
    });

    return {
      isListening: this.isListening,
      eventBufferSize: this.eventBuffer.length,
      subscriberCount,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
export const eventListenerService = new EventListenerService();

// Export types and service
export default eventListenerService;