const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DocumentManagerV2 contract...\n");

  // Get the contract factory
  const DocumentManagerV2 = await hre.ethers.getContractFactory("DocumentManagerV2");
  
  // Deploy the contract
  console.log("📝 Deploying contract to network:", hre.network.name);
  const documentManager = await DocumentManagerV2.deploy();
  
  // Wait for deployment to finish
  await documentManager.waitForDeployment();
  
  const contractAddress = await documentManager.getAddress();
  
  console.log("\n✅ DocumentManagerV2 deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("\n📋 SAVE THIS INFORMATION:\n");
  console.log("================================");
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", (await hre.ethers.getSigners())[0].address);
  console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
  console.log("Timestamp:", new Date().toISOString());
  console.log("================================\n");

  // Wait for a few block confirmations (if on testnet/mainnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting for 5 block confirmations...");
    await documentManager.deploymentTransaction().wait(5);
    console.log("✅ 5 confirmations received!\n");

    // Verify contract on Etherscan (if API key is configured)
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("🔍 Verifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan!");
      } catch (error) {
        console.log("❌ Verification failed:", error.message);
      }
    }
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update frontend/src/config/blockchain.js with new address");
  console.log("3. Copy the ABI from artifacts/contracts/DocumentManagerV2.sol/DocumentManagerV2.json");
  console.log("4. Update frontend ABI file\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
