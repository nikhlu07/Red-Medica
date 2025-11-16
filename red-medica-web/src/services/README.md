# Blockchain Service - Polkadot.js API Integration

This document describes the enhanced Polkadot.js API integration implemented for Red Médica's blockchain service.

## Overview

The `BlockchainService` provides a comprehensive interface for interacting with the Red Médica smart contract deployed on Polkadot testnet. It includes robust connection management, error handling, and network status monitoring.

## Key Features

### ✅ WebSocket Connection Management
- Automatic connection to Polkadot testnet (Rococo/Westend)
- Connection state monitoring and health checks
- Automatic reconnection with exponential backoff
- Graceful error handling and recovery

### ✅ Smart Contract Integration
- ContractPromise initialization with deployed contract
- Type-safe contract method calls
- Transaction signing and confirmation
- Event parsing and result handling

### ✅ Network Status Monitoring
- Real-time network status updates
- Block number tracking
- Chain information retrieval
- Connection health monitoring

### ✅ Error Handling & Validation
- Comprehensive input validation
- User-friendly error messages
- Connection state validation
- Transaction failure recovery

## Architecture

```
BlockchainService
├── Connection Management
│   ├── WebSocket Provider (WsProvider)
│   ├── API Promise (ApiPromise)
│   └── Connection Event Handlers
├── Contract Integration
│   ├── Contract Promise (ContractPromise)
│   ├── Transaction Methods
│   └── Query Methods
├── Wallet Integration
│   ├── Polkadot.js Extension
│   ├── Account Management
│   └── Transaction Signing
└── Status Monitoring
    ├── Network Status Tracking
    ├── Block Subscription
    └── Health Checks
```

## Usage

### Basic Initialization

```typescript
import { blockchainService } from '../services/blockchain';

// Initialize the service
await blockchainService.initialize();

// Check connection status
if (blockchainService.isConnected()) {
  console.log('Connected to blockchain!');
}
```

### Network Status Monitoring

```typescript
// Subscribe to network status changes
const unsubscribe = blockchainService.onNetworkStatusChange((networkInfo) => {
  console.log('Network status:', networkInfo.status);
  console.log('Block number:', networkInfo.blockNumber);
  console.log('Chain name:', networkInfo.chainName);
});

// Get current network status
const status = blockchainService.getNetworkStatus();
```

### Wallet Connection

```typescript
// Connect to Polkadot.js extension
const accounts = await blockchainService.connectWallet();

// Select an account
blockchainService.setSelectedAccount(accounts[0]);

// Check if account is authorized manufacturer
const isAuthorized = await blockchainService.isAuthorizedManufacturer(accounts[0].address);
```

### Product Operations

```typescript
// Register a new product
const result = await blockchainService.registerProduct(
  'Aspirin 100mg',
  'BATCH-001',
  'Demo Pharma',
  1000,
  Date.now(),
  Date.now() + 31536000000, // 1 year
  'Pain Relief'
);

// Verify a product
const product = await blockchainService.verifyProduct(productId);

// Transfer custody
const transferResult = await blockchainService.transferCustody(
  productId,
  recipientAddress,
  'Distribution Center A'
);

// Get transfer history
const transfers = await blockchainService.getTransferHistory(productId);
```

## Configuration

The service uses environment variables for configuration:

```env
# Contract address (set after deployment)
VITE_CONTRACT_ADDRESS=your_contract_address_here

# Polkadot WebSocket endpoint
VITE_POLKADOT_WS=wss://westend-asset-hub-rpc.polkadot.io
```

## Network Status Types

```typescript
enum NetworkStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}
```

## Error Handling

The service provides comprehensive error handling:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **Transaction Errors**: Detailed error messages and recovery suggestions
- **Validation Errors**: Input validation with clear error messages
- **Network Errors**: Graceful degradation and offline handling

## Health Monitoring

```typescript
// Perform comprehensive health check
const health = await blockchainService.healthCheck();

if (health.healthy) {
  console.log('Service is healthy');
  console.log('Peers:', health.details.peers);
  console.log('Chain:', health.details.chain);
  console.log('Block number:', health.details.blockNumber);
} else {
  console.error('Service is unhealthy:', health.details.error);
}
```

## Connection Management

The service includes robust connection management:

1. **Initial Connection**: Establishes WebSocket connection to testnet
2. **Connection Monitoring**: Tracks connection state and network health
3. **Automatic Reconnection**: Reconnects on disconnection with exponential backoff
4. **Error Recovery**: Handles network errors and provides recovery mechanisms
5. **Graceful Shutdown**: Properly disconnects and cleans up resources

## Testing

The service includes comprehensive unit tests covering:

- Network status management
- Connection state validation
- Input validation
- Error handling
- Health checks

Run tests with:
```bash
npm test
```

## Examples

See `src/examples/blockchain-usage.ts` for complete usage examples including:

- Service initialization
- Wallet connection
- Product registration
- Product verification
- Custody transfers
- Complete workflow demonstrations

## Requirements Fulfilled

This implementation fulfills the following task requirements:

✅ **Set up WebSocket connection to testnet**
- Configured WsProvider with Rococo/Westend endpoints
- Connection event handling and monitoring

✅ **Initialize ContractPromise with deployed contract**
- ContractPromise initialization with metadata
- Contract method binding and type safety

✅ **Implement connection management and error handling**
- Automatic reconnection with exponential backoff
- Comprehensive error handling and validation
- Graceful degradation and recovery mechanisms

✅ **Add network status monitoring**
- Real-time network status updates
- Block number tracking and chain information
- Health checks and connection monitoring

## Future Enhancements

Potential improvements for future versions:

- Connection pooling for multiple RPC endpoints
- Advanced caching strategies for query results
- Batch transaction support
- Enhanced offline functionality
- Performance metrics and monitoring
- Multi-chain support