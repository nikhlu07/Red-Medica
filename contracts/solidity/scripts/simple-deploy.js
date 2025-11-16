const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedicalSupplyChain contract...\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    console.log("⏳ Deploying contract...");

    const ContractFactory = await ethers.getContractFactory("MedicalSupplyChain");
    const contract = await ContractFactory.deploy();

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    console.log("\n✅ Contract deployed successfully!");
    console.log("📍 Contract address:", contractAddress);

    // Test basic functions
    console.log("\n🧪 Testing contract...");
    const nextId = await contract.getNextProductId();
    const owner = await contract.getOwner();

    console.log("   Next Product ID:", nextId.toString());
    console.log("   Owner:", owner);

    console.log("\n🎉 Deployment complete!");
    console.log("📋 Contract address:", contractAddress);
    console.log("💾 Save this address for your frontend!");

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
