import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Product, User, mockProducts, mockUser } from './mockData';
import { NetworkStatus, type NetworkInfo, type Product as BlockchainProduct, type Transfer } from '../types/blockchain';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface BlockchainUser {
  address: string;
  name: string;
  role: 'manufacturer' | 'distributor' | 'pharmacy' | 'consumer';
  isAuthorized?: boolean;
  metadata?: {
    source: string;
    type?: string;
  };
}

export interface LoadingState {
  global: boolean;
  wallet: boolean;
  products: boolean;
  registration: boolean;
  verification: boolean;
  transfer: boolean;
  blockchain: boolean;
}

export interface ErrorState {
  global: string | null;
  wallet: string | null;
  products: string | null;
  registration: string | null;
  verification: string | null;
  transfer: string | null;
  blockchain: string | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'pt';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    itemsPerPage: number;
  };
  onboarding: {
    completed: boolean;
    currentStep: number;
    skipped: boolean;
    completedSteps: string[];
  };
  help: {
    tooltipsEnabled: boolean;
    showHints: boolean;
    tutorialMode: boolean;
  };
}

export interface ProductCache {
  [productId: string]: {
    product: BlockchainProduct;
    transfers: Transfer[];
    lastUpdated: number;
    verified: boolean;
  };
}

interface AppState {
  // Legacy user system (for backward compatibility)
  user: User | null;
  products: Product[];
  isWalletConnected: boolean;
  
  // Enhanced blockchain user system
  blockchainUser: BlockchainUser | null;
  isAuthenticated: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  
  // Network and connection state
  networkInfo: NetworkInfo;
  isOnline: boolean;
  
  // Loading states for different operations
  loading: LoadingState;
  
  // Error states for different operations
  errors: ErrorState;
  
  // Notifications
  notifications: Notification[];
  
  // Product data caching
  productCache: ProductCache;
  
  // User preferences with persistence
  preferences: UserPreferences;
  
  // Real-time updates tracking
  lastBlockUpdate: number;
  pendingTransactions: string[];
  
  // Legacy methods (for backward compatibility)
  connectWallet: (role: User['role']) => void;
  disconnectWallet: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  getProduct: (productId: string) => Product | undefined;
  
  // Enhanced blockchain methods
  setUser: (user: BlockchainUser | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setSelectedAccount: (account: InjectedAccountWithMeta | null) => void;
  
  // Network state management
  setNetworkInfo: (info: NetworkInfo) => void;
  setOnlineStatus: (online: boolean) => void;
  
  // Loading state management
  setLoading: (key: keyof LoadingState, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Error state management
  setError: (key: keyof ErrorState, error: string | null) => void;
  clearError: (key: keyof ErrorState) => void;
  clearAllErrors: () => void;
  
  // Enhanced notification methods
  addNotification: (notification: Omit<Notification, 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  addSuccessNotification: (title: string, message: string) => void;
  addErrorNotification: (title: string, message: string, persistent?: boolean) => void;
  addWarningNotification: (title: string, message: string) => void;
  addInfoNotification: (title: string, message: string) => void;
  
  // Product caching methods
  cacheProduct: (productId: string, product: BlockchainProduct, transfers?: Transfer[]) => void;
  getCachedProduct: (productId: string) => BlockchainProduct | null;
  getCachedTransfers: (productId: string) => Transfer[] | null;
  invalidateProductCache: (productId?: string) => void;
  isProductCacheValid: (productId: string, maxAge?: number) => boolean;
  
  // User preferences management
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  
  // Real-time updates
  updateLastBlockUpdate: () => void;
  addPendingTransaction: (txHash: string) => void;
  removePendingTransaction: (txHash: string) => void;
  clearPendingTransactions: () => void;
  
  // Utility methods
  reset: () => void;
  getConnectionStatus: () => {
    wallet: boolean;
    blockchain: boolean;
    network: NetworkStatus;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  dashboard: {
    layout: 'grid',
    itemsPerPage: 12,
  },
  onboarding: {
    completed: false,
    currentStep: 0,
    skipped: false,
    completedSteps: [],
  },
  help: {
    tooltipsEnabled: true,
    showHints: true,
    tutorialMode: false,
  },
};

const defaultLoadingState: LoadingState = {
  global: false,
  wallet: false,
  products: false,
  registration: false,
  verification: false,
  transfer: false,
  blockchain: false,
};

const defaultErrorState: ErrorState = {
  global: null,
  wallet: null,
  products: null,
  registration: null,
  verification: null,
  transfer: null,
  blockchain: null,
};

const defaultNetworkInfo: NetworkInfo = {
  status: NetworkStatus.DISCONNECTED,
  endpoint: '',
  lastUpdate: Date.now(),
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Legacy state
        user: null,
        products: mockProducts,
        isWalletConnected: false,
        
        // Enhanced blockchain state
        blockchainUser: null,
        isAuthenticated: false,
        accounts: [],
        selectedAccount: null,
        
        // Network and connection state
        networkInfo: defaultNetworkInfo,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        
        // Loading states
        loading: { ...defaultLoadingState },
        
        // Error states
        errors: { ...defaultErrorState },
        
        // Notifications
        notifications: [],
        
        // Product caching
        productCache: {},
        
        // User preferences
        preferences: { ...defaultPreferences },
        
        // Real-time updates
        lastBlockUpdate: 0,
        pendingTransactions: [],

        // Legacy methods (for backward compatibility)
        connectWallet: (role) => {
          const mockAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
          const roleNames = {
            Manufacturer: 'MediCorp Inc',
            Distributor: 'Global Distribution Ltd',
            Pharmacy: 'HealthPlus Pharmacy',
            Patient: 'John Doe',
          };

          set({
            isWalletConnected: true,
            user: {
              ...mockUser,
              address: mockAddress,
              name: roleNames[role],
              role,
              email: `contact@${role.toLowerCase()}.com`,
            },
          });
        },

        disconnectWallet: () => {
          set({ 
            isWalletConnected: false, 
            user: null,
            blockchainUser: null,
            isAuthenticated: false,
            accounts: [],
            selectedAccount: null,
          });
          
          // Clear sensitive cached data
          get().invalidateProductCache();
          get().clearPendingTransactions();
          get().clearAllErrors();
        },

        addProduct: (product) => {
          set((state) => ({
            products: [product, ...state.products],
          }));
        },

        updateProduct: (productId, updates) => {
          set((state) => ({
            products: state.products.map((p) =>
              p.productId === productId ? { ...p, ...updates } : p
            ),
          }));
        },

        getProduct: (productId) => {
          return get().products.find((p) => p.productId === productId);
        },

        // Enhanced blockchain methods
        setUser: (user) => {
          set({ blockchainUser: user });
        },

        setIsAuthenticated: (authenticated) => {
          set({ isAuthenticated: authenticated });
        },

        setAccounts: (accounts) => {
          set({ accounts });
        },

        setSelectedAccount: (account) => {
          set({ selectedAccount: account });
        },

        // Network state management
        setNetworkInfo: (info) => {
          set({ networkInfo: info });
        },

        setOnlineStatus: (online) => {
          set({ isOnline: online });
        },

        // Loading state management
        setLoading: (key, loading) => {
          set((state) => ({
            loading: { ...state.loading, [key]: loading },
          }));
        },

        setGlobalLoading: (loading) => {
          set((state) => ({
            loading: { ...state.loading, global: loading },
          }));
        },

        // Error state management
        setError: (key, error) => {
          set((state) => ({
            errors: { ...state.errors, [key]: error },
          }));
        },

        clearError: (key) => {
          set((state) => ({
            errors: { ...state.errors, [key]: null },
          }));
        },

        clearAllErrors: () => {
          set({ errors: { ...defaultErrorState } });
        },

        // Enhanced notification methods
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            timestamp: Date.now(),
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications.slice(0, 9)], // Keep max 10 notifications
          }));

          // Auto-remove non-persistent notifications after 5 seconds
          if (!notification.persistent) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, 5000);
          }
        },

        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        addSuccessNotification: (title, message) => {
          get().addNotification({
            id: `success-${Date.now()}-${Math.random()}`,
            type: 'success',
            title,
            message,
          });
        },

        addErrorNotification: (title, message, persistent = false) => {
          get().addNotification({
            id: `error-${Date.now()}-${Math.random()}`,
            type: 'error',
            title,
            message,
            persistent,
          });
        },

        addWarningNotification: (title, message) => {
          get().addNotification({
            id: `warning-${Date.now()}-${Math.random()}`,
            type: 'warning',
            title,
            message,
          });
        },

        addInfoNotification: (title, message) => {
          get().addNotification({
            id: `info-${Date.now()}-${Math.random()}`,
            type: 'info',
            title,
            message,
          });
        },

        // Product caching methods
        cacheProduct: (productId, product, transfers = []) => {
          set((state) => ({
            productCache: {
              ...state.productCache,
              [productId]: {
                product,
                transfers,
                lastUpdated: Date.now(),
                verified: true,
              },
            },
          }));
        },

        getCachedProduct: (productId) => {
          const cached = get().productCache[productId];
          if (cached && get().isProductCacheValid(productId)) {
            return cached.product;
          }
          return null;
        },

        getCachedTransfers: (productId) => {
          const cached = get().productCache[productId];
          if (cached && get().isProductCacheValid(productId)) {
            return cached.transfers;
          }
          return null;
        },

        invalidateProductCache: (productId) => {
          if (productId) {
            set((state) => {
              const newCache = { ...state.productCache };
              delete newCache[productId];
              return { productCache: newCache };
            });
          } else {
            set({ productCache: {} });
          }
        },

        isProductCacheValid: (productId, maxAge = 5 * 60 * 1000) => { // 5 minutes default
          const cached = get().productCache[productId];
          if (!cached) return false;
          return Date.now() - cached.lastUpdated < maxAge;
        },

        // User preferences management
        updatePreferences: (updates) => {
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
          }));
        },

        resetPreferences: () => {
          set({ preferences: { ...defaultPreferences } });
        },

        // Real-time updates
        updateLastBlockUpdate: () => {
          set({ lastBlockUpdate: Date.now() });
        },

        addPendingTransaction: (txHash) => {
          set((state) => ({
            pendingTransactions: [...state.pendingTransactions, txHash],
          }));
        },

        removePendingTransaction: (txHash) => {
          set((state) => ({
            pendingTransactions: state.pendingTransactions.filter(tx => tx !== txHash),
          }));
        },

        clearPendingTransactions: () => {
          set({ pendingTransactions: [] });
        },

        // Utility methods
        reset: () => {
          set({
            user: null,
            products: mockProducts,
            isWalletConnected: false,
            blockchainUser: null,
            isAuthenticated: false,
            accounts: [],
            selectedAccount: null,
            networkInfo: defaultNetworkInfo,
            loading: { ...defaultLoadingState },
            errors: { ...defaultErrorState },
            notifications: [],
            productCache: {},
            lastBlockUpdate: 0,
            pendingTransactions: [],
          });
        },

        getConnectionStatus: () => {
          const state = get();
          return {
            wallet: state.isWalletConnected || state.accounts.length > 0,
            blockchain: state.networkInfo.status === NetworkStatus.CONNECTED,
            network: state.networkInfo.status,
          };
        },
      }),
      {
        name: 'red-medica-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist user preferences and non-sensitive data
          preferences: state.preferences,
          // Don't persist sensitive data like accounts, products, etc.
        }),
      }
    )
  )
);
