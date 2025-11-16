import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { productCache, transferCache, authCache } from './cache';
import { connectionPool } from './connectionPool';
import { retryBlockchainOperation } from '../utils/retry';
import type { Product, Transfer } from '../types/blockchain';

// Gas optimization constants
const GAS_LIMITS = {
  QUERY: {
    refTime: 3000000000, // 3 billion
    proofSize: 131072,   // 128KB
  },
  TRANSACTION: {
    refTime: 10000000000, // 10 billion
    proofSize: 262144,    // 256KB
  },
};

class OptimizedBlockchainService {
  private api: ApiPromise | null = null;
  private contract: ContractPromise | null = null;
  private contractAddress: string;
  private contractMetadata: any;

  constructor(contractAddress: string, contractMetadata: any) {
    this.contractAddress = contractAddress;
    this.contractMetadata = contractMetadata;
  }

  async initialize(): Promise<void> {
    const result = await retryBlockchainOperation(async () => {
      const provider = await connectionPool.getConnection();
      this.api = await ApiPromise.create({ provider });
      await this.api.isReady;

      if (this.contractAddress && this.contractMetadata) {
        this.contract = new ContractPromise(this.api, this.contractMetadata, this.contractAddress);
      }

      return true;
    });

    if (!result.success) {
      throw new Error(`Failed to initialize blockchain service: ${result.error?.message}`);
    }
  }

  // Optimized product verification with caching
  async verifyProduct(productId: number): Promise<Product | null> {
    const cacheKey = `product_${productId}`;
    
    // Check cache first
    const cachedProduct = productCache.get<Product>(cacheKey);
    if (cachedProduct) {
      console.log(`Product ${productId} retrieved from cache`);
      return cachedProduct;
    }

    const result = await retryBlockchainOperation(async () => {
      if (!this.isReady()) {
        throw new Error('Blockchain service not ready');
      }

      const gasLimit = this.api!.registry.createType('WeightV2', GAS_LIMITS.QUERY);

      const { result, output } = await this.contract!.query.verifyProduct(
        '', // Empty address for queries
        { gasLimit, storageDepositLimit: null },
        productId
      );

      if (result.isOk && output) {
        const productData = output.toHuman() as any;
        if (productData && productData.Ok) {
          const product = this.parseProductData(productData.Ok);
          
          // Cache the result
          productCache.set(cacheKey, product, 10 * 60 * 1000); // 10 minutes
          
          return product;
        }
      }

      return null;
    });

    return result.success ? result.data : null;
  }

  // Optimized transfer history with caching
  async getTransferHistory(productId: number): Promise<Transfer[]> {
    const cacheKey = `transfers_${productId}`;
    
    // Check cache first
    const cachedTransfers = transferCache.get<Transfer[]>(cacheKey);
    if (cachedTransfers) {
      console.log(`Transfer history for product ${productId} retrieved from cache`);
      return cachedTransfers;
    }

    const result = await retryBlockchainOperation(async () => {
      if (!this.isReady()) {
        throw new Error('Blockchain service not ready');
      }

      const gasLimit = this.api!.registry.createType('WeightV2', GAS_LIMITS.QUERY);

      const { result, output } = await this.contract!.query.getTransferHistory(
        '',
        { gasLimit, storageDepositLimit: null },
        productId
      );

      if (result.isOk && output) {
        const transfersData = output.toHuman() as any[];
        const transfers = transfersData.map(this.parseTransferData);
        
        // Cache the result
        transferCache.set(cacheKey, transfers, 5 * 60 * 1000); // 5 minutes
        
        return transfers;
      }

      return [];
    });

    return result.success ? result.data || [] : [];
  }

  // Optimized authorization check with caching
  async isAuthorizedManufacturer(address: string): Promise<boolean> {
    const cacheKey = `auth_${address}`;
    
    // Check cache first
    const cachedAuth = authCache.get<boolean>(cacheKey);
    if (cachedAuth !== null) {
      console.log(`Authorization for ${address} retrieved from cache`);
      return cachedAuth;
    }

    const result = await retryBlockchainOperation(async () => {
      if (!this.isReady()) {
        throw new Error('Blockchain service not ready');
      }

      const gasLimit = this.api!.registry.createType('WeightV2', GAS_LIMITS.QUERY);

      const { result, output } = await this.contract!.query.isAuthorizedManufacturer(
        address,
        { gasLimit, storageDepositLimit: null },
        address
      );

      if (result.isOk && output) {
        const isAuthorized = output.toHuman() as boolean;
        
        // Cache the result for 30 minutes
        authCache.set(cacheKey, isAuthorized, 30 * 60 * 1000);
        
        return isAuthorized;
      }

      return false;
    });

    return result.success ? result.data || false : false;
  }

  // Batch product verification for better performance
  async verifyProductsBatch(productIds: number[]): Promise<Map<number, Product | null>> {
    const results = new Map<number, Product | null>();
    const uncachedIds: number[] = [];

    // Check cache for each product
    for (const productId of productIds) {
      const cacheKey = `product_${productId}`;
      const cachedProduct = productCache.get<Product>(cacheKey);
      
      if (cachedProduct) {
        results.set(productId, cachedProduct);
      } else {
        uncachedIds.push(productId);
      }
    }

    // Fetch uncached products in parallel (limited concurrency)
    if (uncachedIds.length > 0) {
      const batchSize = 5; // Limit concurrent requests
      const batches = [];
      
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        batches.push(uncachedIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (productId) => {
          const product = await this.verifyProduct(productId);
          results.set(productId, product);
        });

        await Promise.all(batchPromises);
      }
    }

    return results;
  }

  // Optimized gas estimation
  async estimateGas(
    method: string,
    args: any[],
    caller: string
  ): Promise<any> {
    const cacheKey = `gas_${method}_${JSON.stringify(args)}_${caller}`;
    
    // Check cache for gas estimation (short TTL)
    const cachedGas = productCache.get<any>(cacheKey);
    if (cachedGas) {
      return cachedGas;
    }

    const result = await retryBlockchainOperation(async () => {
      if (!this.isReady()) {
        throw new Error('Blockchain service not ready');
      }

      // Use optimized gas limits based on method type
      const baseGasLimit = method.includes('query') ? GAS_LIMITS.QUERY : GAS_LIMITS.TRANSACTION;
      const gasLimit = this.api!.registry.createType('WeightV2', baseGasLimit);

      // Cache gas estimation for 1 minute
      productCache.set(cacheKey, gasLimit, 60 * 1000);

      return gasLimit;
    });

    return result.success ? result.data : this.api!.registry.createType('WeightV2', GAS_LIMITS.TRANSACTION);
  }

  // Cache invalidation methods
  invalidateProductCache(productId: number): void {
    productCache.delete(`product_${productId}`);
    transferCache.delete(`transfers_${productId}`);
  }

  invalidateAuthCache(address: string): void {
    authCache.delete(`auth_${address}`);
  }

  clearAllCaches(): void {
    productCache.clear();
    transferCache.clear();
    authCache.clear();
  }

  // Helper methods
  private isReady(): boolean {
    return !!(this.api && this.contract && this.api.isConnected);
  }

  private parseProductData(productData: any): Product {
    return {
      id: parseInt(productData.id.replace(/,/g, '')),
      name: productData.name,
      batchNumber: productData.batchNumber,
      manufacturer: productData.manufacturer,
      manufacturerName: productData.manufacturerName,
      quantity: parseInt(productData.quantity.replace(/,/g, '')),
      mfgDate: parseInt(productData.mfgDate.replace(/,/g, '')),
      expiryDate: parseInt(productData.expiryDate.replace(/,/g, '')),
      category: productData.category,
      currentHolder: productData.currentHolder,
      isAuthentic: productData.isAuthentic,
      createdAt: parseInt(productData.createdAt.replace(/,/g, '')),
    };
  }

  private parseTransferData(transferData: any): Transfer {
    return {
      productId: parseInt(transferData.productId.replace(/,/g, '')),
      from: transferData.from,
      to: transferData.to,
      timestamp: parseInt(transferData.timestamp.replace(/,/g, '')),
      location: transferData.location,
      verified: transferData.verified,
    };
  }

  // Performance monitoring
  getPerformanceStats(): {
    cacheStats: any;
    connectionStats: any;
  } {
    return {
      cacheStats: {
        products: productCache.getStats(),
        transfers: transferCache.getStats(),
        auth: authCache.getStats(),
      },
      connectionStats: connectionPool.getStats(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const isConnected = this.isReady();
      const poolHealthy = await connectionPool.healthCheck();
      return isConnected && poolHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export { OptimizedBlockchainService };