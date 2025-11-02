const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DocuChainSimple contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Display account balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance));

  // Deploy the contract
  const DocuChainSimple = await ethers.getContractFactory("DocuChainSimple");
  
  // Constructor parameter - institution name
  const institutionName = "Test University";
  
  console.log("Deploying with institution name:", institutionName);
  
  const docuChainSimple = await DocuChainSimple.deploy(institutionName);
  
  await docuChainSimple.deployed();

  console.log("✅ DocuChainSimple deployed to:", docuChainSimple.address);
  console.log("🏫 Institution:", institutionName);
  
  // Verify deployment by calling a view function
  try {
    const contractInstitution = await docuChainSimple.institutionName();
    console.log("📋 Contract institution name:", contractInstitution);
    
    const documentCounter = await docuChainSimple.documentCounter();
    console.log("📄 Initial document counter:", documentCounter.toString());
    
    const folderCounter = await docuChainSimple.folderCounter();
    console.log("📁 Initial folder counter:", folderCounter.toString());
    
  } catch (error) {
    console.error("❌ Error verifying deployment:", error);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: docuChainSimple.address,
    institutionName: institutionName,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: docuChainSimple.deployTransaction.blockNumber,
    transactionHash: docuChainSimple.deployTransaction.hash
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Transaction Hash:", deploymentInfo.transactionHash);
  console.log("Institution:", deploymentInfo.institutionName);
  console.log("=".repeat(50));

  // Instructions for next steps
  console.log("\n🔧 Next Steps:");
  console.log("1. Update CONTRACT_ADDRESS in blockchainSimpleService.js");
  console.log("2. Update CONTRACT_ADDRESS in test_blockchain_simple.html");
  console.log("3. Test the contract using the test HTML file");
  console.log("4. Integrate with the FileManager frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });