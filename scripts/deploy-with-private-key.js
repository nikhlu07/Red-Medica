#!/usr/bin/env node

/**
 * Red Médica Contract Deployment with Private Key
 * Deploy the medical supply chain contract using a private key
 */

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { ContractPromise, CodePromise } = require('@polkadot/api-contract');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY || '1e8d32fa33366b326512ff8da6fc1b30aadef05ca7a45c8402699e7bd3a128fb';
const NETWORK = process.env.NETWORK || 'moonbase';
const CONTRACT_DIR = path.join(__dirname, '../contracts/medical_supply_chain');

// Network configurations
const NETWORKS = {
    rococo: {
        name: 'Rococo Testnet',
        rpc: 'wss://rococo-rpc.polkadot.io',
        explorer: 'https://rococo.subscan.io/',
        faucet: 'https://paritytech.github.io/polkadot-testnet-faucet/',
        decimals: 12,
        symbol: 'ROC'
    },
    westend: {
        name: 'Westend Testnet',
        rpc: 'wss://westend-rpc.polkadot.io',
        explorer: 'https://westend.subscan.io/',
        faucet: 'https://paritytech.github.io/polkadot-testnet-faucet/',
        decimals: 12,
        symbol: 'WND'
    },
    moonbase: {
        name: 'Moonbase Alpha',
        rpc: 'wss://wss.api.moonbase.moonbeam.network',
        explorer: 'https://moonbase.moonscan.io/',
        faucet: 'https://apps.moonbeam.network/moonbase-alpha/faucet/',
        decimals: 18,
        symbol: 'DEV'
    }
};

class ContractDeployer {
    constructor() {
        this.api = null;
        this.deployer = null;
        this.networkConfig = NETWORKS[NETWORK];

        if (!this.networkConfig) {
            throw new Error(`Network ${NETWORK} not supported. Available: ${Object.keys(NETWORKS).join(', ')}`);
        }
    }

    async initialize() {
        console.log('🚀 Red Médica Contract Deployment');
        console.log('================================');
        console.log(`Network: ${this.networkConfig.name}`);
        console.log(`RPC: ${this.networkConfig.rpc}`);
        console.log('');

        // Wait for crypto to be ready
        await cryptoWaitReady();

        // Connect to network
        console.log('🌐 Connecting to network...');
        const wsProvider = new WsProvider(this.networkConfig.rpc);
        this.api = await ApiPromise.create({ provider: wsProvider });

        console.log(`✅ Connected to ${this.networkConfig.name}`);
        console.log(`Chain: ${await this.api.runtimeChain}`);
        console.log(`Version: ${await this.api.runtimeVersion.specVersion}`);
        console.log('');

        // Setup deployer account from private key
        await this.setupDeployer();
    }

    async setupDeployer() {
        console.log('👤 Setting up deployer account...');

        const keyring = new Keyring({ type: 'sr25519' });

        try {
            // Create account from private key (hex format)
            let privateKeyHex = PRIVATE_KEY;
            if (!privateKeyHex.startsWith('0x')) {
                privateKeyHex = '0x' + privateKeyHex;
            }

            this.deployer = keyring.addFromSeed(privateKeyHex);
            console.log(`Address: ${this.deployer.address}`);

            // Check balance
            const { data: balance } = await this.api.query.system.account(this.deployer.address);
            const freeBalance = balance.free.toHuman();

            console.log(`Balance: ${freeBalance} ${this.networkConfig.symbol}`);

            if (balance.free.isZero()) {
                console.log('');
                console.log('❌ Insufficient balance for deployment!');
                console.log(`Get ${this.networkConfig.symbol} tokens from: ${this.networkConfig.faucet}`);
                throw new Error('Insufficient balance');
            }

            console.log('✅ Account setup complete');
            console.log('');

        } catch (error) {
            console.error('❌ Failed to setup deployer account:', error.message);
            throw error;
        }
    }

    async buildContract() {
        console.log('🔨 Building smart contract...');

        try {
            // Change to contract directory
            const originalDir = process.cwd();
            process.chdir(CONTRACT_DIR);

            // Clean and build
            console.log('Cleaning previous builds...');
            execSync('cargo clean', { stdio: 'pipe' });

            console.log('Building contract...');
            execSync('cargo contract build --release', { stdio: 'inherit' });

            // Return to original directory
            process.chdir(originalDir);

            // Verify build artifacts
            const contractFile = path.join(CONTRACT_DIR, 'target/ink/medical_supply_chain.contract');
            const wasmFile = path.join(CONTRACT_DIR, 'target/ink/medical_supply_chain.wasm');
            const metadataFile = path.join(CONTRACT_DIR, 'target/ink/medical_supply_chain.json');

            if (!fs.existsSync(contractFile) || !fs.existsSync(wasmFile) || !fs.existsSync(metadataFile)) {
                throw new Error('Build artifacts not found');
            }

            const wasmSize = fs.statSync(wasmFile).size;
            console.log(`✅ Contract built successfully (${(wasmSize / 1024).toFixed(2)} KB)`);
            console.log('');

            return { contractFile, wasmFile, metadataFile };

        } catch (error) {
            console.error('❌ Build failed:', error.message);
            throw error;
        }
    }

    async deployContract(contractFiles) {
        console.log('📡 Deploying contract...');

        const wasm = fs.readFileSync(contractFiles.wasmFile);
        const metadata = JSON.parse(fs.readFileSync(contractFiles.metadataFile, 'utf8'));

        const code = new CodePromise(this.api, metadata, wasm);

        // Configure gas limit
        const gasLimit = this.api.registry.createType('WeightV2', {
            refTime: 200000000000,
            proofSize: 1000000,
        });

        console.log(`Gas limit: ${gasLimit.refTime.toHuman()}`);

        // Create deployment transaction
        const tx = code.tx.new(
            {
                gasLimit,
                storageDepositLimit: null,
                salt: null
            }
            // No constructor arguments for this contract
        );

        console.log('Submitting transaction...');

        // Deploy with promise
        return new Promise((resolve, reject) => {
            let contractAddress = null;

            tx.signAndSend(this.deployer, (result) => {
                console.log(`Status: ${result.status.type}`);

                if (result.status.isInBlock) {
                    console.log(`In block: ${result.status.asInBlock.toHex()}`);

                    // Find contract instantiation event
                    result.events.forEach(({ event }) => {
                        if (event.method === 'Instantiated' && event.section === 'contracts') {
                            contractAddress = event.data[1].toString();
                            console.log(`🎉 Contract deployed at: ${contractAddress}`);
                        }

                        if (event.method === 'ExtrinsicFailed') {
                            console.error('❌ Deployment failed:', event.data.toString());
                        }
                    });
                }

                if (result.status.isFinalized) {
                    console.log(`✅ Finalized: ${result.status.asFinalized.toHex()}`);

                    if (contractAddress) {
                        resolve({
                            address: contractAddress,
                            blockHash: result.status.asFinalized.toHex(),
                            txHash: result.txHash.toHex()
                        });
                    } else {
                        reject(new Error('Contract address not found'));
                    }
                }

                if (result.isError) {
                    reject(new Error(`Transaction error: ${result.status.type}`));
                }
            });
        });
    }

    async verifyDeployment(deploymentResult) {
        console.log('');
        console.log('🔍 Verifying deployment...');

        try {
            const metadataFile = path.join(CONTRACT_DIR, 'target/ink/medical_supply_chain.json');
            const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));

            const contract = new ContractPromise(this.api, metadata, deploymentResult.address);

            // Test a read-only method
            const { result, output } = await contract.query.getNextProductId(
                this.deployer.address,
                { gasLimit: -1 }
            );

            if (result.isOk) {
                console.log('✅ Contract verification successful');
                console.log(`Next product ID: ${output.toHuman()}`);
                return true;
            } else {
                console.log('❌ Contract verification failed');
                return false;
            }

        } catch (error) {
            console.error('❌ Verification error:', error.message);
            return false;
        }
    }

    async saveDeploymentInfo(deploymentResult) {
        console.log('');
        console.log('💾 Saving deployment information...');

        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            network: NETWORK,
            networkName: this.networkConfig.name,
            contractAddress: deploymentResult.address,
            blockHash: deploymentResult.blockHash,
            txHash: deploymentResult.txHash,
            deployer: this.deployer.address,
            explorer: `${this.networkConfig.explorer}account/${deploymentResult.address}`
        };

        // Save to deployment directory
        const deploymentFile = path.join(CONTRACT_DIR, 'deployment/latest-deployment.json');
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

        // Update environment file
        const envFile = path.join(__dirname, '../red-medica-web/.env');
        const envContent = `# Red Médica Environment Configuration
# Generated: ${new Date().toISOString()}

VITE_CONTRACT_ADDRESS=${deploymentResult.address}
VITE_POLKADOT_WS=${this.networkConfig.rpc}
VITE_NETWORK_NAME=${this.networkConfig.name}
VITE_NETWORK_SYMBOL=${this.networkConfig.symbol}
VITE_EXPLORER_URL=${this.networkConfig.explorer}
VITE_DEPLOYMENT_BLOCK=${deploymentResult.blockHash}
VITE_DEPLOYMENT_TX=${deploymentResult.txHash}
`;

        fs.writeFileSync(envFile, envContent);

        console.log(`✅ Deployment info saved to: ${deploymentFile}`);
        console.log(`✅ Environment updated: ${envFile}`);
    }

    async deploy() {
        try {
            await this.initialize();
            const contractFiles = await this.buildContract();
            const deploymentResult = await this.deployContract(contractFiles);
            await this.verifyDeployment(deploymentResult);
            await this.saveDeploymentInfo(deploymentResult);

            console.log('');
            console.log('🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('========================');
            console.log(`Network: ${this.networkConfig.name}`);
            console.log(`Contract: ${deploymentResult.address}`);
            console.log(`Block: ${deploymentResult.blockHash}`);
            console.log(`Transaction: ${deploymentResult.txHash}`);
            console.log(`Explorer: ${this.networkConfig.explorer}account/${deploymentResult.address}`);
            console.log('');

        } catch (error) {
            console.error('');
            console.error('❌ DEPLOYMENT FAILED!');
            console.error('====================');
            console.error(error.message);
            process.exit(1);
        } finally {
            if (this.api) {
                await this.api.disconnect();
            }
        }
    }
}

// Run deployment
if (require.main === module) {
    const deployer = new ContractDeployer();
    deployer.deploy();
}

module.exports = ContractDeployer;