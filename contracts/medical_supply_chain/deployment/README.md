# Medical Supply Chain Contract Deployment

## Build Configuration

The smart contract has been configured for deployment with the following optimizations:

### Cargo.toml Configuration
- **Contract Size Optimization**: LTO enabled, single codegen unit
- **Panic Handling**: Abort on panic for smaller WASM size
- **Target**: wasm32-unknown-unknown for Polkadot compatibility

### Build Settings
```toml
[profile.release]
overflow-checks = false
lto = true
codegen-units = 1
panic = "abort"
```

## Contract Metadata

### Contract Information
- **Name**: Medical Supply Chain
- **Version**: 0.1.0
- **Authors**: Red Medica Team
- **License**: MIT

### Contract Features
- Product registration and tracking
- Custody transfer management
- Manufacturer authorization
- Supply chain verification
- Event emission for transparency

## Deployment Requirements

### Prerequisites
1. Polkadot testnet account with sufficient tokens
2. cargo-contract tool installed
3. Polkadot.js Apps or equivalent deployment interface

### Build Commands
```bash
# Install cargo-contract
cargo install cargo-contract --force

# Build the contract
cargo contract build --release

# Generate metadata
cargo contract build --release --generate-metadata
```

### Expected Artifacts
- `medical_supply_chain.wasm` - Contract bytecode
- `medical_supply_chain.json` - Contract metadata
- `medical_supply_chain.contract` - Bundle file for deployment

## Gas Requirements

### Estimated Gas Costs
- **Constructor**: ~200,000 gas units
- **register_product**: ~150,000 gas units
- **transfer_custody**: ~100,000 gas units
- **verify_product**: ~50,000 gas units (read-only)

## Deployment Steps

1. **Prepare Environment**
   - Ensure testnet account has sufficient balance
   - Connect to Rococo or Westend testnet

2. **Upload Contract**
   - Use Polkadot.js Apps Contracts section
   - Upload the .contract file
   - Set appropriate gas limits

3. **Instantiate Contract**
   - Call constructor with deployer account
   - Deployer becomes initial authorized manufacturer

4. **Verify Deployment**
   - Test basic functionality
   - Verify event emission
   - Check contract state

## Contract Interface

### Main Functions
- `new()` - Constructor, sets deployer as owner and manufacturer
- `register_product()` - Register new medical product
- `transfer_custody()` - Transfer product custody
- `verify_product()` - Verify product authenticity
- `authorize_manufacturer()` - Add/remove manufacturer authorization

### Events
- `ProductRegistered` - New product added to system
- `CustodyTransferred` - Product custody changed
- `ManufacturerAuthorized` - Manufacturer status updated

## Security Considerations

- Only authorized manufacturers can register products
- Only current holders can transfer custody
- Owner-only functions for manufacturer management
- All operations emit events for transparency