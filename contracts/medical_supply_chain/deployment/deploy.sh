#!/bin/bash

# Medical Supply Chain Contract Deployment Script
# This script builds and prepares the contract for deployment to Polkadot testnet

set -e

echo "🏗️  Building Medical Supply Chain Contract..."

# Navigate to contract directory
cd "$(dirname "$0")/.."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Build the contract
echo "📦 Building contract..."
if command -v cargo-contract &> /dev/null; then
    cargo contract build --release
    echo "✅ Contract built successfully!"
    
    # Check if artifacts were generated
    if [ -f "target/ink/medical_supply_chain.wasm" ]; then
        echo "📄 WASM file generated: target/ink/medical_supply_chain.wasm"
    fi
    
    if [ -f "target/ink/medical_supply_chain.json" ]; then
        echo "📄 Metadata file generated: target/ink/medical_supply_chain.json"
    fi
    
    if [ -f "target/ink/medical_supply_chain.contract" ]; then
        echo "📄 Contract bundle generated: target/ink/medical_supply_chain.contract"
        echo "🎉 Ready for deployment!"
    fi
else
    echo "❌ cargo-contract not found. Please install it first:"
    echo "   cargo install cargo-contract --force"
    exit 1
fi

# Display contract information
echo ""
echo "📋 Contract Information:"
echo "   Name: Medical Supply Chain"
echo "   Version: 0.1.0"
echo "   Target: wasm32-unknown-unknown"
echo ""

# Display deployment instructions
echo "🚀 Deployment Instructions:"
echo "1. Open Polkadot.js Apps (https://polkadot.js.org/apps/)"
echo "2. Connect to Rococo or Westend testnet"
echo "3. Navigate to Developer > Contracts"
echo "4. Click 'Upload & deploy code'"
echo "5. Upload the .contract file from target/ink/"
echo "6. Set constructor parameters and deploy"
echo ""
echo "📁 Contract files location: target/ink/"
echo "   - medical_supply_chain.wasm (bytecode)"
echo "   - medical_supply_chain.json (metadata)"
echo "   - medical_supply_chain.contract (deployment bundle)"