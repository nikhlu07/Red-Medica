import { useState, useCallback, useEffect } from 'react';
import { moonbeamBlockchainService } from '@/services/moonbeam-blockchain';
import { demoModeService } from '@/services/demo-mode';
import { useAppStore } from '@/lib/store';
import type { Product, Transfer } from '@/types/blockchain';

export interface BlockchainOperationState {
  isLoading: boolean;
  error: string | null;
}

export const useBlockchain = () => {
  const [state, setState] = useState<BlockchainOperationState>({
    isLoading: false,
    error: null,
  });

  const { addNotification } = useAppStore();

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

      const result = demoModeService.isInDemoMode()
        ? await demoModeService.registerProduct(productData)
        : await moonbeamBlockchainService.registerProduct(
            productData.name,
            productData.batchNumber,
            productData.manufacturerName,
            productData.quantity,
            Math.floor(productData.mfgDate.getTime() / 1000),
            Math.floor(productData.expiryDate.getTime() / 1000),
            productData.category
          );

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Registered',
          message: `Product "${productData.name}" registered successfully${result.productId ? ` with ID: ${result.productId}` : ''}`,
        });

        // Dispatch event for dashboard listeners (works for both demo and blockchain)
        try {
          window.dispatchEvent(
            new CustomEvent('productRegistered', {
              detail: { productId: result.productId, txHash: (result as any).txHash, productData },
            })
          );
        } catch (_) {}

        setState({ isLoading: false, error: null });
        return result;
      } else {
        throw new Error((result as any).error || 'Failed to register product');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register product';
      setState({ isLoading: false, error: errorMessage });
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Registration Failed', message: errorMessage });
      throw error;
    }
  }, [addNotification]);

  // Verify a product
  const verifyProduct = useCallback(async (productId: number): Promise<Product | null> => {
    try {
      setState({ isLoading: true, error: null });

      let product: Product | null = null;
      if (demoModeService.isInDemoMode()) {
        const demo = await demoModeService.verifyProduct(productId);
        if (demo) {
          product = {
            id: demo.id,
            name: demo.name,
            batchNumber: demo.batchNumber,
            manufacturer: demo.manufacturerAddress,
            manufacturerName: demo.manufacturer,
            quantity: demo.quantity,
            mfgDate: Math.floor(new Date(demo.mfgDate).getTime() / 1000),
            expiryDate: Math.floor(new Date(demo.expiryDate).getTime() / 1000),
            category: demo.category,
            currentHolder: demo.currentHolder,
            isAuthentic: demo.isAuthentic,
            createdAt: Math.floor(Date.now() / 1000),
          };
        } else {
          product = null;
        }
      } else {
        product = await moonbeamBlockchainService.verifyProduct(productId);
      }

      setState({ isLoading: false, error: null });

      if (product) {
        addNotification({ id: Date.now().toString(), type: 'success', title: 'Product Verified', message: `Product "${product.name}" is authentic` });
      } else {
        addNotification({ id: Date.now().toString(), type: 'warning', title: 'Product Not Found', message: `No product found with ID: ${productId}` });
      }

      return product;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify product';
      setState({ isLoading: false, error: errorMessage });
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Verification Failed', message: errorMessage });
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

      const result = demoModeService.isInDemoMode()
        ? await demoModeService.transferCustody(productId, toAddress, location)
        : await moonbeamBlockchainService.transferCustody(productId, toAddress, location);

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Custody Transferred',
          message: `Product custody transferred successfully to ${toAddress}`,
        });

        setState({ isLoading: false, error: null });
        return result;
      } else {
        throw new Error((result as any).error || 'Failed to transfer custody');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to transfer custody';
      setState({ isLoading: false, error: errorMessage });
      addNotification({ id: Date.now().toString(), type: 'error', title: 'Transfer Failed', message: errorMessage });
      throw error;
    }
  }, [addNotification]);

  // Get transfer history for a product
  const getTransferHistory = useCallback(async (productId: number): Promise<Transfer[]> => {
    try {
      setState({ isLoading: true, error: null });

      let transfers: Transfer[] = [];
      if (demoModeService.isInDemoMode()) {
        const demoTransfers = await demoModeService.getTransferHistory(productId);
        transfers = demoTransfers.map(t => ({
          productId: t.productId,
          from: t.from,
          to: t.to,
          timestamp: Math.floor(new Date(t.timestamp).getTime() / 1000),
          location: t.location,
          verified: t.verified,
        }));
      } else {
        transfers = await moonbeamBlockchainService.getTransferHistory(productId);
      }

      setState({ isLoading: false, error: null });
      return transfers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transfer history';
      setState({ isLoading: false, error: errorMessage });
      addNotification({ id: Date.now().toString(), type: 'error', title: 'History Load Failed', message: errorMessage });
      return [];
    }
  }, [addNotification]);

  // Check if an address is an authorized manufacturer
  const checkManufacturerStatus = useCallback(async (address: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });

      const isAuthorized = demoModeService.isInDemoMode()
        ? true
        : await moonbeamBlockchainService.isAuthorizedManufacturer(address);
      
      setState({ isLoading: false, error: null });
      return isAuthorized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check manufacturer status';
      setState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  // Get blockchain connection status
  const getConnectionStatus = useCallback(() => {
    if (demoModeService.isInDemoMode()) {
      return {
        isConnected: true,
        contractAddress: 'demo',
        networkEndpoint: 'demo',
      };
    }
    return {
      isConnected: moonbeamBlockchainService.isConnected() && moonbeamBlockchainService.isWalletConnected(),
      contractAddress: moonbeamBlockchainService.getContractAddress(),
      networkEndpoint: moonbeamBlockchainService.getNetworkEndpoint(),
    };
  }, []);

  // Refresh connection status manually
  const refreshConnectionStatus = useCallback(() => {
    const connected = demoModeService.isInDemoMode()
      ? true
      : moonbeamBlockchainService.isConnected() && moonbeamBlockchainService.isWalletConnected();
    setIsConnected(connected);
    return connected;
  }, []);

  // Get network info from store
  const { networkInfo } = useAppStore();

  // Check if connected (reactive to changes)
  const [isConnected, setIsConnected] = useState(
    demoModeService.isInDemoMode()
      ? true
      : moonbeamBlockchainService.isConnected() && moonbeamBlockchainService.isWalletConnected()
  );

  // Update connection status when networkInfo changes
  useEffect(() => {
    const connected = demoModeService.isInDemoMode()
      ? true
      : moonbeamBlockchainService.isConnected() && moonbeamBlockchainService.isWalletConnected();
    setIsConnected(connected);
  }, [networkInfo]);

  return {
    ...state,
    registerProduct,
    verifyProduct,
    transferCustody,
    getTransferHistory,
    checkManufacturerStatus,
    getConnectionStatus,
    refreshConnectionStatus,
    isConnected,
    networkInfo,
  };
};
