import { useState, useCallback, useEffect } from 'react';
import { moonbeamBlockchainService } from '@/services/moonbeam-blockchain';
import { useAppStore } from '@/lib/store';
import type { Product, Transfer } from '@/types/blockchain';

export interface BlockchainOperationState {
  isLoading: boolean;
  error: string | null;
}

export interface NetworkInfo {
  isConnected: boolean;
  isWalletConnected: boolean;
  contractAddress: string;
  networkEndpoint: string;
  connectedAccount: string | null;
}

export const useMoonbeamBlockchain = () => {
  const [state, setState] = useState<BlockchainOperationState>({
    isLoading: false,
    error: null,
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: false,
    isWalletConnected: false,
    contractAddress: '',
    networkEndpoint: '',
    connectedAccount: null,
  });

  const { addNotification } = useAppStore();

  // Initialize blockchain service
  const initialize = useCallback(async () => {
    try {
      setState({ isLoading: true, error: null });
      
      if (!moonbeamBlockchainService.isConnected()) {
        await moonbeamBlockchainService.initialize();
      }
      
      updateNetworkInfo();
      setState({ isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      setState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize blockchain service' 
      });
    }
  }, []);

  // Update network info
  const updateNetworkInfo = useCallback(() => {
    setNetworkInfo({
      isConnected: moonbeamBlockchainService.isConnected(),
      isWalletConnected: moonbeamBlockchainService.isWalletConnected(),
      contractAddress: moonbeamBlockchainService.getContractAddress(),
      networkEndpoint: moonbeamBlockchainService.getNetworkEndpoint(),
      connectedAccount: moonbeamBlockchainService.getConnectedAccount(),
    });
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setState({ isLoading: true, error: null });
      
      await moonbeamBlockchainService.connectWallet();
      updateNetworkInfo();
      
      setState({ isLoading: false, error: null });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Wallet Connected',
        message: 'Successfully connected to Moonbase Alpha',
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState({ isLoading: false, error: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
      });
      
      throw error;
    }
  }, [addNotification, updateNetworkInfo]);

  // Register a new product
  const registerProduct = useCallback(async (productData: {
    name: string;
    batchNumber: string;
    manufacturerName: string;
    quantity: number;
    mfgDate: Date;
    expiryDate: Date;
    category: string;
  }) => {
    try {
      setState({ isLoading: true, error: null });

      const result = await moonbeamBlockchainService.registerProduct(
        productData.name,
        productData.batchNumber,
        productData.manufacturerName,
        productData.quantity,
        Math.floor(productData.mfgDate.getTime() / 1000), // Convert to seconds
        Math.floor(productData.expiryDate.getTime() / 1000), // Convert to seconds
        productData.category
      );

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Registered',
          message: `Product "${productData.name}" registered successfully${result.productId ? ` with ID: ${result.productId}` : ''}`,
        });

        setState({ isLoading: false, error: null });
        return result;
      } else {
        throw new Error(result.error || 'Failed to register product');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register product';
      setState({ isLoading: false, error: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage,
      });
      
      throw error;
    }
  }, [addNotification]);

  // Verify a product
  const verifyProduct = useCallback(async (productId: number): Promise<Product | null> => {
    try {
      setState({ isLoading: true, error: null });

      const product = await moonbeamBlockchainService.verifyProduct(productId);
      
      setState({ isLoading: false, error: null });
      
      if (product) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Verified',
          message: `Product "${product.name}" is authentic`,
        });
      } else {
        addNotification({
          id: Date.now().toString(),
          type: 'warning',
          title: 'Product Not Found',
          message: `No product found with ID: ${productId}`,
        });
      }

      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify product';
      setState({ isLoading: false, error: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Verification Failed',
        message: errorMessage,
      });
      
      return null;
    }
  }, [addNotification]);

  // Transfer custody of a product
  const transferCustody = useCallback(async (
    productId: number,
    toAddress: string,
    location: string
  ) => {
    try {
      setState({ isLoading: true, error: null });

      const result = await moonbeamBlockchainService.transferCustody(productId, toAddress, location);

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Custody Transferred',
          message: `Product custody transferred successfully to ${toAddress.slice(0, 8)}...`,
        });

        setState({ isLoading: false, error: null });
        return result;
      } else {
        throw new Error(result.error || 'Failed to transfer custody');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to transfer custody';
      setState({ isLoading: false, error: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Transfer Failed',
        message: errorMessage,
      });
      
      throw error;
    }
  }, [addNotification]);

  // Get transfer history for a product
  const getTransferHistory = useCallback(async (productId: number): Promise<Transfer[]> => {
    try {
      setState({ isLoading: true, error: null });

      const transfers = await moonbeamBlockchainService.getTransferHistory(productId);
      
      setState({ isLoading: false, error: null });
      return transfers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transfer history';
      setState({ isLoading: false, error: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'History Load Failed',
        message: errorMessage,
      });
      
      return [];
    }
  }, [addNotification]);

  // Check if an address is an authorized manufacturer
  const checkManufacturerStatus = useCallback(async (address: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });

      const isAuthorized = await moonbeamBlockchainService.isAuthorizedManufacturer(address);
      
      setState({ isLoading: false, error: null });
      return isAuthorized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check manufacturer status';
      setState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  // Get next product ID
  const getNextProductId = useCallback(async (): Promise<number> => {
    try {
      return await moonbeamBlockchainService.getNextProductId();
    } catch (error) {
      console.error('Failed to get next product ID:', error);
      return 1;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Health check function
  const healthCheck = useCallback(async () => {
    try {
      if (!moonbeamBlockchainService.isConnected()) {
        await moonbeamBlockchainService.initialize();
      }
      
      // Test basic contract function
      await moonbeamBlockchainService.getNextProductId();
      
      updateNetworkInfo();
      return { healthy: true, message: 'Blockchain service is healthy' };
    } catch (error) {
      console.error('Health check failed:', error);
      return { 
        healthy: false, 
        message: error instanceof Error ? error.message : 'Health check failed' 
      };
    }
  }, [updateNetworkInfo]);

  return {
    ...state,
    networkInfo,
    initialize,
    connectWallet,
    registerProduct,
    verifyProduct,
    transferCustody,
    getTransferHistory,
    checkManufacturerStatus,
    getNextProductId,
    healthCheck,
    updateNetworkInfo,
    // Compatibility methods
    isConnected: () => networkInfo.isConnected,
    isWalletConnected: () => networkInfo.isWalletConnected,
    getContractAddress: () => networkInfo.contractAddress,
    getNetworkEndpoint: () => networkInfo.networkEndpoint,
    getConnectedAccount: () => networkInfo.connectedAccount,
  };
};

export default useMoonbeamBlockchain;