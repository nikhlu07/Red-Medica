const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedicalSupplyChain contract to Passet Hub...\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "PAS\n");

    // Check if we have enough balance (at least 0.01 PAS for deployment)
    const minBalance = ethers.parseEther("0.01");
    if (balance < minBalance) {
      console.error("❌ Insufficient balance for deployment");
      console.error("💰 Required: at least 0.01 PAS");
      console.error("💰 Current:", ethers.formatEther(balance), "PAS");
      console.error("🔗 Get more PAS from: https://faucet.polkadot.io/?parachain=1111");
      process.exit(1);
    }

    // Get contract factory
    console.log("🔧 Getting contract factory...");
    const ContractFactory = await ethers.getContractFactory("MedicalSupplyChain");
    console.log("✅ Contract factory created");

    // Deploy contract with manual gas settings for PolkaVM
    console.log("⏳ Deploying contract...");
    console.log("📊 Using optimized gas settings for PolkaVM...");

    const deployTx = await ContractFactory.getDeployTransaction();
    const gasEstimate = await ethers.provider.estimateGas(deployTx);
    console.log("⛽ Estimated gas:", gasEstimate.toString());

    const contract = await ContractFactory.deploy({
      gasLimit: gasEstimate * BigInt(2), // Double the estimate for safety
      gasPrice: ethers.parseUnits("2", "gwei")
    });

    console.log("⏳ Waiting for deployment confirmation...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("\n✅ Contract deployed successfully!");
    console.log("📍 Contract address:", contractAddress);

    // Test basic functions
    console.log("\n🧪 Testing contract functions...");
    try {
      const nextId = await contract.getNextProductId();
      const owner = await contract.getOwner();

      console.log("   ✅ Next Product ID:", nextId.toString());
      console.log("   ✅ Owner:", owner);
    } catch (testError) {
      console.log("   ⚠️  Function testing skipped (contract might need activation)");
    }

    // Save deployment info
    const fs = require("fs");
    const path = require("path");

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
      network: "passetHub",
      contractAddress: contractAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      chainId: 420420422,
      gasUsed: gasEstimate.toString(),
    };

    const deploymentFile = path.join(deploymentsDir, "passetHub.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. Copy contract address:", contractAddress);
    console.log("   2. Update red-medica-web/.env with:");
    console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("   3. Test the contract in Remix or with Hardhat");

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    if (error.reason) {
      console.error("Reason:", error.reason);
    }

    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution: Get more PAS tokens from:");
      console.error("   https://faucet.polkadot.io/?parachain=1111");
    } else if (error.message.includes("ReviveApi")) {
      console.error("\n💡 Solution: Try deploying via Remix IDE instead:");
      console.error("   https://remix.ethereum.org/");
    } else if (error.message.includes("nonce")) {
      console.error("\n💡 Solution: Wait a few minutes and try again");
    }

    process.exit(1);
  }
}

main();
