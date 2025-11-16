/**
 * Example usage of the enhanced BlockchainService
 * This file demonstrates how to use the Polkadot.js API integration
 */

import { blockchainService, NetworkStatus } from '../services/blockchain';

// Example: Initialize and monitor blockchain connection
export async function initializeBlockchainExample() {
  console.log('🚀 Initializing blockchain service...');
  
  // Subscribe to network status changes
  const unsubscribe = blockchainService.onNetworkStatusChange((networkInfo) => {
    console.log('📡 Network status changed:', {
      status: networkInfo.status,
      endpoint: networkInfo.endpoint,
      chainName: networkInfo.chainName,
      blockNumber: networkInfo.blockNumber,
      error: networkInfo.error
    });
    
    // Handle different network states
    switch (networkInfo.status) {
      case NetworkStatus.CONNECTING:
        console.log('🔄 Connecting to blockchain...');
        break;
      case NetworkStatus.CONNECTED:
        console.log('✅ Connected to blockchain!');
        console.log(`📊 Chain: ${networkInfo.chainName}, Block: ${networkInfo.blockNumber}`);
        break;
      case NetworkStatus.DISCONNECTED:
        console.log('❌ Disconnected from blockchain');
        break;
      case NetworkStatus.ERROR:
        console.error('🚨 Blockchain connection error:', networkInfo.error);
        break;
      case NetworkStatus.RECONNECTING:
        console.log('🔄 Attempting to reconnect...');
        break;
    }
  });

  try {
    // Initialize the service
    await blockchainService.initialize();
    
    // Perform health check
    const health = await blockchainService.healthCheck();
    console.log('🏥 Health check result:', health);
    
    return { success: true, unsubscribe };
  } catch (error) {
    console.error('❌ Failed to initialize blockchain service:', error);
    return { success: false, error, unsubscribe };
  }
}

// Example: Connect wallet and select account
export async function connectWalletExample() {
  console.log('👛 Connecting wallet...');
  
  try {
    // Check if service is ready
    if (!blockchainService.isConnected()) {
      throw new Error('Blockchain service not connected');
    }
    
    // Connect to wallet
    const accounts = await blockchainService.connectWallet();
    console.log('📋 Available accounts:', accounts.map(acc => ({
      address: acc.address,
      name: acc.meta.name,
      source: acc.meta.source
    })));
    
    // Select first account for demo
    if (accounts.length > 0) {
      blockchainService.setSelectedAccount(accounts[0]);
      console.log('✅ Selected account:', accounts[0].address);
      
      // Check if account is authorized manufacturer
      const isAuthorized = await blockchainService.isAuthorizedManufacturer(accounts[0].address);
      console.log('🏭 Is authorized manufacturer:', isAuthorized);
    }
    
    return { success: true, accounts };
  } catch (error) {
    console.error('❌ Failed to connect wallet:', error);
    return { success: false, error };
  }
}

// Example: Register a product
export async function registerProductExample() {
  console.log('📦 Registering product...');
  
  try {
    if (!blockchainService.isContractReady()) {
      throw new Error('Contract not ready');
    }
    
    const selectedAccount = blockchainService.getSelectedAccount();
    if (!selectedAccount) {
      throw new Error('No account selected');
    }
    
    // Example product data
    const productData = {
      name: 'Aspirin 100mg',
      batchNumber: 'ASP-2024-001',
      manufacturerName: 'Demo Pharmaceuticals',
      quantity: 1000,
      mfgDate: Date.now(),
      expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
      category: 'Pain Relief'
    };
    
    console.log('📋 Product data:', productData);
    
    const result = await blockchainService.registerProduct(
      productData.name,
      productData.batchNumber,
      productData.manufacturerName,
      productData.quantity,
      productData.mfgDate,
      productData.expiryDate,
      productData.category
    );
    
    if (result.success) {
      console.log('✅ Product registered successfully!');
      console.log('🆔 Product ID:', result.productId);
      console.log('🔗 Transaction hash:', result.txHash);
      return { success: true, productId: result.productId, txHash: result.txHash };
    } else {
      console.error('❌ Product registration failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Failed to register product:', error);
    return { success: false, error };
  }
}

// Example: Verify a product
export async function verifyProductExample(productId: number) {
  console.log(`🔍 Verifying product ID: ${productId}`);
  
  try {
    if (!blockchainService.isContractReady()) {
      throw new Error('Contract not ready');
    }
    
    const product = await blockchainService.verifyProduct(productId);
    
    if (product) {
      console.log('✅ Product found and verified!');
      console.log('📋 Product details:', {
        id: product.id,
        name: product.name,
        batchNumber: product.batchNumber,
        manufacturer: product.manufacturerName,
        quantity: product.quantity,
        mfgDate: new Date(product.mfgDate).toLocaleDateString(),
        expiryDate: new Date(product.expiryDate).toLocaleDateString(),
        category: product.category,
        isAuthentic: product.isAuthentic,
        currentHolder: product.currentHolder
      });
      
      // Get transfer history
      const transfers = await blockchainService.getTransferHistory(productId);
      console.log('📜 Transfer history:', transfers.map(t => ({
        from: t.from,
        to: t.to,
        timestamp: new Date(t.timestamp).toLocaleString(),
        location: t.location,
        verified: t.verified
      })));
      
      return { success: true, product, transfers };
    } else {
      console.log('❌ Product not found - may be counterfeit!');
      return { success: false, error: 'Product not found' };
    }
  } catch (error) {
    console.error('❌ Failed to verify product:', error);
    return { success: false, error };
  }
}

// Example: Transfer custody
export async function transferCustodyExample(productId: number, toAddress: string, location: string) {
  console.log(`📦 Transferring custody of product ${productId} to ${toAddress}`);
  
  try {
    if (!blockchainService.isContractReady()) {
      throw new Error('Contract not ready');
    }
    
    const selectedAccount = blockchainService.getSelectedAccount();
    if (!selectedAccount) {
      throw new Error('No account selected');
    }
    
    const result = await blockchainService.transferCustody(productId, toAddress, location);
    
    if (result.success) {
      console.log('✅ Custody transferred successfully!');
      console.log('🔗 Transaction hash:', result.txHash);
      return { success: true, txHash: result.txHash };
    } else {
      console.error('❌ Custody transfer failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Failed to transfer custody:', error);
    return { success: false, error };
  }
}

// Example: Complete workflow demonstration
export async function completeWorkflowExample() {
  console.log('🎯 Starting complete blockchain workflow example...');
  
  try {
    // 1. Initialize blockchain service
    console.log('\n1️⃣ Initializing blockchain service...');
    const initResult = await initializeBlockchainExample();
    if (!initResult.success) {
      throw new Error('Failed to initialize blockchain service');
    }
    
    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Connect wallet
    console.log('\n2️⃣ Connecting wallet...');
    const walletResult = await connectWalletExample();
    if (!walletResult.success) {
      throw new Error('Failed to connect wallet');
    }
    
    // 3. Register a product (only if authorized)
    console.log('\n3️⃣ Registering product...');
    const registerResult = await registerProductExample();
    if (registerResult.success && registerResult.productId) {
      // 4. Verify the registered product
      console.log('\n4️⃣ Verifying registered product...');
      await verifyProductExample(registerResult.productId);
      
      // 5. Transfer custody (if we have another account)
      if (walletResult.accounts && walletResult.accounts.length > 1) {
        console.log('\n5️⃣ Transferring custody...');
        await transferCustodyExample(
          registerResult.productId,
          walletResult.accounts[1].address,
          'Distribution Center A'
        );
        
        // 6. Verify product again to see updated transfer history
        console.log('\n6️⃣ Verifying product after transfer...');
        await verifyProductExample(registerResult.productId);
      }
    }
    
    console.log('\n✅ Complete workflow example finished!');
    
    // Clean up
    if (initResult.unsubscribe) {
      initResult.unsubscribe();
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Workflow example failed:', error);
    return { success: false, error };
  }
}

// Export all examples
export const blockchainExamples = {
  initializeBlockchainExample,
  connectWalletExample,
  registerProductExample,
  verifyProductExample,
  transferCustodyExample,
  completeWorkflowExample
};