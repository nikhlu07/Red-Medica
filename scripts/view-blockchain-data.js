#!/usr/bin/env node

/**
 * Red Médica Blockchain Data Viewer
 * Shows how to view and monitor data stored on the blockchain
 */

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { ContractPromise } = require('@polkadot/api-contract');
const fs = require('fs');

const CONFIG = {
    CONTRACT_ADDRESS: '0xAD6655fa10DB0DDDc079774198E76c457E2e0C8C',
    NETWORK_RPC: 'wss://wss.api.moonbase.moonbeam.network',
    EXPLORER_URL: 'https://moonbase.moonscan.io/',
    NETWORK_NAME: 'Moonbase Alpha'
};

class BlockchainDataViewer {
    constructor() {
        this.api = null;
        this.contract = null;
    }

    async initialize() {
        console.log('🔗 Connecting to Moonbase Alpha...');
        const wsProvider = new WsProvider(CONFIG.NETWORK_RPC);
        this.api = await ApiPromise.create({ provider: wsProvider });
        
        console.log(`✅ Connected to ${CONFIG.NETWORK_NAME}`);
        console.log(`📋 Contract: ${CONFIG.CONTRACT_ADDRESS}`);
        console.log(`🌐 Explorer: ${CONFIG.EXPLORER_URL}address/${CONFIG.CONTRACT_ADDRESS}`);
        console.log('');
    }

    async viewContractEvents() {
        console.log('📊 Recent Contract Events:');
        console.log('==========================');
        
        try {
            // Get recent blocks to scan for events
            const latestBlock = await this.api.rpc.chain.getHeader();
            const currentBlockNumber = latestBlock.number.toNumber();
            const fromBlock = Math.max(1, currentBlockNumber - 1000); // Last 1000 blocks
            
            console.log(`Scanning blocks ${fromBlock} to ${currentBlockNumber}...`);
            
            // This is a simplified example - in practice you'd scan block by block
            console.log('');
            console.log('🔍 How to view events:');
            console.log(`1. Visit: ${CONFIG.EXPLORER_URL}address/${CONFIG.CONTRACT_ADDRESS}`);
            console.log('2. Click on "Events" or "Logs" tab');
            console.log('3. Look for these event types:');
            console.log('   • ProductRegistered - New products added');
            console.log('   • CustodyTransferred - Supply chain movements');
            console.log('   • ManufacturerAuthorized - New manufacturers approved');
            
        } catch (error) {
            console.error('Error viewing events:', error.message);
        }
    }

    async viewStoredData() {
        console.log('💾 Viewing Stored Data:');
        console.log('=======================');
        
        console.log('📋 Data stored on blockchain:');
        console.log('');
        console.log('🏭 Products Registry:');
        console.log('   • Product ID, Name, Batch Number');
        console.log('   • Manufacturer details and verification');
        console.log('   • Manufacturing and expiry dates');
        console.log('   • Current holder/custody information');
        console.log('   • Authenticity status');
        console.log('');
        console.log('🚚 Transfer History:');
        console.log('   • Complete custody chain for each product');
        console.log('   • Timestamps and locations of transfers');
        console.log('   • Verification status of each transfer');
        console.log('');
        console.log('👥 Manufacturer Registry:');
        console.log('   • Authorized manufacturer addresses');
        console.log('   • Authorization status and permissions');
        console.log('');
        
        console.log('🔍 How to query data:');
        console.log('1. Use the Red Médica frontend application');
        console.log('2. Call smart contract functions directly');
        console.log('3. Use blockchain explorer to view transactions');
        console.log('4. Monitor events in real-time');
    }

    displayDataAccessMethods() {
        console.log('');
        console.log('🛠️  DATA ACCESS METHODS');
        console.log('========================');
        console.log('');
        
        console.log('1. 🌐 BLOCKCHAIN EXPLORER (Easiest)');
        console.log(`   URL: ${CONFIG.EXPLORER_URL}address/${CONFIG.CONTRACT_ADDRESS}`);
        console.log('   • View all transactions to/from contract');
        console.log('   • See event logs and data changes');
        console.log('   • Monitor real-time activity');
        console.log('   • No technical knowledge required');
        console.log('');
        
        console.log('2. 📱 RED MÉDICA FRONTEND');
        console.log('   URL: http://localhost:5173 (when running locally)');
        console.log('   • User-friendly interface to view products');
        console.log('   • Search and verify products by ID or QR code');
        console.log('   • View supply chain history');
        console.log('   • See analytics and statistics');
        console.log('');
        
        console.log('3. 🔧 DIRECT CONTRACT CALLS');
        console.log('   • Use Web3 libraries to call contract functions');
        console.log('   • Query specific product data');
        console.log('   • Get transfer histories');
        console.log('   • Check manufacturer authorizations');
        console.log('');
        
        console.log('4. 📊 REAL-TIME MONITORING');
        console.log('   • Subscribe to contract events');
        console.log('   • Get notifications when data changes');
        console.log('   • Build custom dashboards');
        console.log('   • Integrate with external systems');
    }

    displayExampleQueries() {
        console.log('');
        console.log('📝 EXAMPLE DATA QUERIES');
        console.log('========================');
        console.log('');
        
        console.log('🔍 Query Product by ID:');
        console.log('```javascript');
        console.log('// Get product details');
        console.log('const product = await contract.query.verifyProduct(');
        console.log('  callerAddress,');
        console.log('  { gasLimit: -1 },');
        console.log('  productId // e.g., 1');
        console.log(');');
        console.log('console.log(product.output.toHuman());');
        console.log('```');
        console.log('');
        
        console.log('📋 Get Transfer History:');
        console.log('```javascript');
        console.log('// Get complete supply chain history');
        console.log('const history = await contract.query.getTransferHistory(');
        console.log('  callerAddress,');
        console.log('  { gasLimit: -1 },');
        console.log('  productId');
        console.log(');');
        console.log('console.log(history.output.toHuman());');
        console.log('```');
        console.log('');
        
        console.log('🏭 Check Manufacturer Status:');
        console.log('```javascript');
        console.log('// Check if address is authorized manufacturer');
        console.log('const isAuthorized = await contract.query.isAuthorizedManufacturer(');
        console.log('  callerAddress,');
        console.log('  { gasLimit: -1 },');
        console.log('  manufacturerAddress');
        console.log(');');
        console.log('console.log(isAuthorized.output.toHuman());');
        console.log('```');
    }

    displayRealTimeMonitoring() {
        console.log('');
        console.log('⚡ REAL-TIME DATA MONITORING');
        console.log('=============================');
        console.log('');
        
        console.log('🔔 Event Subscription Example:');
        console.log('```javascript');
        console.log('// Listen for new product registrations');
        console.log('contract.events.ProductRegistered((error, event) => {');
        console.log('  if (error) {');
        console.log('    console.error("Event error:", error);');
        console.log('    return;');
        console.log('  }');
        console.log('  ');
        console.log('  console.log("New product registered:");');
        console.log('  console.log("Product ID:", event.args.product_id);');
        console.log('  console.log("Manufacturer:", event.args.manufacturer);');
        console.log('  console.log("Name:", event.args.name);');
        console.log('  console.log("Batch:", event.args.batch_number);');
        console.log('});');
        console.log('');
        console.log('// Listen for custody transfers');
        console.log('contract.events.CustodyTransferred((error, event) => {');
        console.log('  if (error) return;');
        console.log('  ');
        console.log('  console.log("Custody transferred:");');
        console.log('  console.log("Product ID:", event.args.product_id);');
        console.log('  console.log("From:", event.args.from);');
        console.log('  console.log("To:", event.args.to);');
        console.log('  console.log("Location:", event.args.location);');
        console.log('});');
        console.log('```');
    }

    async run() {
        try {
            await this.initialize();
            await this.viewContractEvents();
            await this.viewStoredData();
            this.displayDataAccessMethods();
            this.displayExampleQueries();
            this.displayRealTimeMonitoring();
            
            console.log('');
            console.log('🎯 QUICK ACCESS LINKS');
            console.log('=====================');
            console.log(`📊 Contract Explorer: ${CONFIG.EXPLORER_URL}address/${CONFIG.CONTRACT_ADDRESS}`);
            console.log('📱 Frontend App: http://localhost:5173');
            console.log('📋 Demo Data: ./demo-data/demo-data.json');
            console.log('🔧 This Script: node scripts/view-blockchain-data.js');
            
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            if (this.api) {
                await this.api.disconnect();
            }
        }
    }
}

// Run the viewer
if (require.main === module) {
    const viewer = new BlockchainDataViewer();
    viewer.run();
}

module.exports = BlockchainDataViewer;