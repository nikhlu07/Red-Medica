import { useEffect, useCallback, useState } from 'react';
import eventListenerService, { type BlockchainEvent } from '../services/eventListener';

/**
 * Hook to listen for specific blockchain events
 */
export function useBlockchainEvent(
  eventType: string,
  callback: (event: BlockchainEvent) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventListenerService.subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, ...dependencies]);
}

/**
 * Hook to listen for all blockchain events
 */
export function useAllBlockchainEvents(
  callback: (event: BlockchainEvent) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unsubscribe = eventListenerService.subscribeToAll(callback);
    return unsubscribe;
  }, [...dependencies]);
}

/**
 * Hook to get recent blockchain events
 */
export function useRecentEvents(limit = 10) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);

  const updateEvents = useCallback(() => {
    setEvents(eventListenerService.getRecentEvents(limit));
  }, [limit]);

  useEffect(() => {
    // Initial load
    updateEvents();

    // Subscribe to all events to update the list
    const unsubscribe = eventListenerService.subscribeToAll(() => {
      updateEvents();
    });

    return unsubscribe;
  }, [updateEvents]);

  return events;
}

/**
 * Hook to manage event listener service
 */
export function useEventListenerService() {
  const [isListening, setIsListening] = useState(eventListenerService.isActive());
  const [stats, setStats] = useState(eventListenerService.getStats());

  const updateStatus = useCallback(() => {
    setIsListening(eventListenerService.isActive());
    setStats(eventListenerService.getStats());
  }, []);

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  const startListening = useCallback(() => {
    eventListenerService.startListening();
    updateStatus();
  }, [updateStatus]);

  const stopListening = useCallback(() => {
    eventListenerService.stopListening();
    updateStatus();
  }, [updateStatus]);

  const clearEventBuffer = useCallback(() => {
    eventListenerService.clearEventBuffer();
    updateStatus();
  }, [updateStatus]);

  return {
    isListening,
    stats,
    startListening,
    stopListening,
    clearEventBuffer,
    updateStatus,
  };
}

/**
 * Hook for product registration events
 */
export function useProductRegistrationEvents(
  callback: (productId: number, manufacturer: string, name: string, batchNumber: string) => void,
  dependencies: any[] = []
) {
  useBlockchainEvent(
    'ProductRegistered',
    (event) => {
      const { productId, manufacturer, name, batchNumber } = event.data;
      callback(productId, manufacturer, name, batchNumber);
    },
    dependencies
  );
}

/**
 * Hook for custody transfer events
 */
export function useCustodyTransferEvents(
  callback: (productId: number, from: string, to: string, location: string) => void,
  dependencies: any[] = []
) {
  useBlockchainEvent(
    'CustodyTransferred',
    (event) => {
      const { productId, from, to, location } = event.data;
      callback(productId, from, to, location);
    },
    dependencies
  );
}

/**
 * Hook to automatically refresh product data when events occur
 */
export function useAutoRefreshOnEvents(
  refreshCallback: () => void,
  eventTypes: string[] = ['ProductRegistered', 'CustodyTransferred']
) {
  useEffect(() => {
    const unsubscribes = eventTypes.map(eventType =>
      eventListenerService.subscribe(eventType, () => {
        // Add a small delay to allow blockchain state to settle
        setTimeout(refreshCallback, 1000);
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [refreshCallback, ...eventTypes]);
}

/**
 * Hook to track pending transactions and their completion
 */
export function usePendingTransactionTracker() {
  const [pendingTxs, setPendingTxs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to all events to track transaction completions
    const unsubscribe = eventListenerService.subscribeToAll((event) => {
      if (event.txHash) {
        setPendingTxs(prev => prev.filter(tx => tx !== event.txHash));
      }
    });

    return unsubscribe;
  }, []);

  const addPendingTransaction = useCallback((txHash: string) => {
    setPendingTxs(prev => [...prev, txHash]);
  }, []);

  const removePendingTransaction = useCallback((txHash: string) => {
    setPendingTxs(prev => prev.filter(tx => tx !== txHash));
  }, []);

  return {
    pendingTxs,
    addPendingTransaction,
    removePendingTransaction,
    hasPendingTransactions: pendingTxs.length > 0,
  };
}

/**
 * Hook for real-time notifications based on events
 */
export function useEventNotifications() {
  useAllBlockchainEvents((event) => {
    // This is handled by the event listener service itself
    // This hook can be used to add custom notification logic
    console.log('Event notification:', event);
  });
}