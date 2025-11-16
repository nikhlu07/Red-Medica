/**
 * Wallet Connection Demo
 * 
 * This file demonstrates the wallet connection functionality
 * and can be used for manual testing and verification.
 */

import { blockchainService } from '../services/blockchain';

export class WalletDemo {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing blockchain service...');
      await blockchainService.initialize();
      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');
      
      const status = blockchainService.getNetworkStatus();
      console.log('📊 Network status:', status);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  async connectWallet(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔄 Connecting to wallet...');
      const accounts = await blockchainService.connectWallet();
      
      console.log(`✅ Wallet connected successfully! Found ${accounts.length} accounts:`);
      accounts.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.meta.name || 'Unnamed'} (${account.address.slice(0, 8)}...)`);
        console.log(`     Source: ${account.meta.source}`);
        console.log(`     Type: ${account.type}`);
      });

      return accounts;
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      throw error;
    }
  }

  async selectAccount(accountIndex: number = 0): Promise<void> {
    try {
      const walletStatus = blockchainService.getWalletStatus();
      if (!walletStatus.connected) {
        throw new Error('Wallet not connected. Call connectWallet() first.');
      }

      // Get accounts (this is a simplified version - in real app, accounts would be stored)
      const accounts = await blockchainService.connectWallet();
      
      if (accountIndex >= accounts.length) {
        throw new Error(`Account index ${accountIndex} out of range. Available accounts: ${accounts.length}`);
      }

      const selectedAccount = accounts[accountIndex];
      console.log(`🔄 Selecting account: ${selectedAccount.meta.name || 'Unnamed'}`);
      
      blockchainService.setSelectedAccount(selectedAccount);
      
      // Check manufacturer authorization
      console.log('🔄 Checking manufacturer authorization...');
      const isManufacturer = await blockchainService.isAuthorizedManufacturer(selectedAccount.address);
      
      console.log('✅ Account selected successfully!');
      console.log(`   Name: ${selectedAccount.meta.name || 'Unnamed'}`);
      console.log(`   Address: ${selectedAccount.address}`);
      console.log(`   Role: ${isManufacturer ? 'Manufacturer' : 'Consumer'}`);
      console.log(`   Source: ${selectedAccount.meta.source}`);
      
    } catch (error) {
      console.error('❌ Failed to select account:', error);
      throw error;
    }
  }

  async testTransactionSigning(): Promise<void> {
    try {
      const selectedAccount = blockchainService.getSelectedAccount();
      if (!selectedAccount) {
        throw new Error('No account selected. Call selectAccount() first.');
      }

      console.log('🔄 Testing transaction signing capability...');
      
      // Import web3FromAddress to test signer access
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(selectedAccount.address);
      
      if (!injector || !injector.signer) {
        throw new Error('Failed to get transaction signer');
      }

      console.log('✅ Transaction signing capability verified!');
      console.log('   Signer available:', !!injector.signer);
      console.log('   Injector version:', injector.version || 'unknown');
      
    } catch (error) {
      console.error('❌ Transaction signing test failed:', error);
      throw error;
    }
  }

  async performHealthCheck(): Promise<void> {
    try {
      console.log('🔄 Performing health check...');
      const health = await blockchainService.healthCheck();
      
      console.log('📊 Health Check Results:');
      console.log(`   Overall Health: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`   API Connected: ${health.details.api ? '✅' : '❌'}`);
      console.log(`   Network Connected: ${health.details.connected ? '✅' : '❌'}`);
      console.log(`   Contract Ready: ${health.details.contractReady ? '✅' : '❌'}`);
      
      if (health.details.chain) {
        console.log(`   Chain: ${health.details.chain}`);
      }
      
      if (health.details.blockNumber) {
        console.log(`   Current Block: ${health.details.blockNumber}`);
      }
      
      if (health.details.peers !== undefined) {
        console.log(`   Peers: ${health.details.peers}`);
      }
      
      if (health.details.error) {
        console.log(`   Error: ${health.details.error}`);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      console.log('🔄 Disconnecting wallet...');
      await blockchainService.disconnectWallet();
      console.log('✅ Wallet disconnected successfully');
      
      const status = blockchainService.getWalletStatus();
      console.log('📊 Wallet status after disconnection:', status);
      
    } catch (error) {
      console.error('❌ Failed to disconnect wallet:', error);
      throw error;
    }
  }

  async runFullDemo(): Promise<void> {
    try {
      console.log('🚀 Starting Wallet Connection Demo...\n');
      
      // Step 1: Initialize
      await this.initialize();
      console.log('');
      
      // Step 2: Health check
      await this.performHealthCheck();
      console.log('');
      
      // Step 3: Connect wallet
      await this.connectWallet();
      console.log('');
      
      // Step 4: Select first account
      await this.selectAccount(0);
      console.log('');
      
      // Step 5: Test transaction signing
      await this.testTransactionSigning();
      console.log('');
      
      // Step 6: Disconnect
      await this.disconnectWallet();
      console.log('');
      
      console.log('🎉 Wallet Connection Demo completed successfully!');
      
    } catch (error) {
      console.error('💥 Demo failed:', error);
      throw error;
    }
  }
}

// Export instance for easy use
export const walletDemo = new WalletDemo();

// Example usage:
// import { walletDemo } from './examples/wallet-demo';
// walletDemo.runFullDemo();