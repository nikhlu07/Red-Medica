#!/bin/bash

# Manual build script for ink! contracts without cargo-contract
# This script builds the contract manually using rustc and wasm tools

echo "🏗️  Manual Contract Build (Alternative Method)"

# Set contract directory
CONTRACT_DIR="$(dirname "$0")"
cd "$CONTRACT_DIR"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Build for WASM target
echo "📦 Building WASM binary..."
cargo build --release --target wasm32-unknown-unknown

# Check if build succeeded
WASM_FILE="target/wasm32-unknown-unknown/release/medical_supply_chain.wasm"
if [ -f "$WASM_FILE" ]; then
    echo "✅ WASM file generated: $WASM_FILE"
    
    # Create ink directory if it doesn't exist
    mkdir -p target/ink
    
    # Copy WASM file to ink directory
    cp "$WASM_FILE" "target/ink/medical_supply_chain.wasm"
    
    # Generate basic metadata (manually created)
    echo "📄 Creating metadata file..."
    cp "deployment/contract-abi.json" "target/ink/medical_supply_chain.json"
    
    echo "🎉 Manual build completed successfully!"
    echo "Files generated:"
    echo "  - target/ink/medical_supply_chain.wasm"
    echo "  - target/ink/medical_supply_chain.json"
    
    # Calculate file sizes
    WASM_SIZE=$(wc -c < "$WASM_FILE")
    echo "  - WASM size: $WASM_SIZE bytes"
    
else
    echo "❌ WASM build failed"
    exit 1
fi

echo ""
echo "🚀 Ready for deployment!"
echo "You can now deploy using Polkadot.js Apps:"
echo "1. Go to https://polkadot.js.org/apps/"
echo "2. Connect to Rococo testnet"
echo "3. Navigate to Developer > Contracts"
echo "4. Upload target/ink/medical_supply_chain.wasm"
echo "5. Use target/ink/medical_supply_chain.json as metadata"