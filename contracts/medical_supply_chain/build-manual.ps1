# Manual build script for ink! contracts without cargo-contract (PowerShell)
# This script builds the contract manually using rustc and wasm tools

Write-Host "🏗️  Manual Contract Build (Alternative Method)" -ForegroundColor Cyan

# Set contract directory
$CONTRACT_DIR = $PSScriptRoot
Set-Location $CONTRACT_DIR

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
cargo clean

# Build for WASM target
Write-Host "📦 Building WASM binary..." -ForegroundColor Yellow
cargo build --release --target wasm32-unknown-unknown

# Check if build succeeded
$WASM_FILE = "target\wasm32-unknown-unknown\release\medical_supply_chain.wasm"
if (Test-Path $WASM_FILE) {
    Write-Host "✅ WASM file generated: $WASM_FILE" -ForegroundColor Green
    
    # Create ink directory if it doesn't exist
    if (-not (Test-Path "target\ink")) {
        New-Item -ItemType Directory -Path "target\ink" -Force | Out-Null
    }
    
    # Copy WASM file to ink directory
    Copy-Item $WASM_FILE "target\ink\medical_supply_chain.wasm"
    
    # Generate basic metadata (manually created)
    Write-Host "📄 Creating metadata file..." -ForegroundColor Yellow
    Copy-Item "deployment\contract-abi.json" "target\ink\medical_supply_chain.json"
    
    Write-Host "🎉 Manual build completed successfully!" -ForegroundColor Green
    Write-Host "Files generated:" -ForegroundColor Green
    Write-Host "  - target\ink\medical_supply_chain.wasm" -ForegroundColor White
    Write-Host "  - target\ink\medical_supply_chain.json" -ForegroundColor White
    
    # Calculate file sizes
    $WASM_SIZE = (Get-Item $WASM_FILE).Length
    Write-Host "  - WASM size: $WASM_SIZE bytes" -ForegroundColor White
    
} else {
    Write-Host "❌ WASM build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Cyan
Write-Host "You can now deploy using Polkadot.js Apps:" -ForegroundColor White
Write-Host "1. Go to https://polkadot.js.org/apps/" -ForegroundColor White
Write-Host "2. Connect to Rococo testnet" -ForegroundColor White
Write-Host "3. Navigate to Developer > Contracts" -ForegroundColor White
Write-Host "4. Upload target\ink\medical_supply_chain.wasm" -ForegroundColor White
Write-Host "5. Use target\ink\medical_supply_chain.json as metadata" -ForegroundColor White