const hre = require("hardhat");

/**
 * Deployment script for DocumentApprovalManager
 * This contract works alongside the existing DocumentManagerV2
 */
async function main() {
  console.log("🚀 Starting DocumentApprovalManager deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get existing DocumentManagerV2 address (update this with your deployed address)
  // If you haven't deployed DocumentManagerV2 yet, deploy it first or use address(0) for now
  const DOCUMENT_MANAGER_V2_ADDRESS = process.env.DOCUMENT_MANAGER_V2_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  console.log("📄 DocumentManagerV2 Address:", DOCUMENT_MANAGER_V2_ADDRESS);
  
  if (DOCUMENT_MANAGER_V2_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  WARNING: DocumentManagerV2 address not set. Using zero address.");
    console.log("⚠️  You can update it later using setDocumentManagerAddress()\n");
  }

  // Deploy DocumentApprovalManager
  console.log("📝 Deploying DocumentApprovalManager contract...");
  const DocumentApprovalManager = await hre.ethers.getContractFactory("DocumentApprovalManager");
  const approvalManager = await DocumentApprovalManager.deploy(DOCUMENT_MANAGER_V2_ADDRESS);

  await approvalManager.waitForDeployment();
  const approvalManagerAddress = await approvalManager.getAddress();

  console.log("✅ DocumentApprovalManager deployed to:", approvalManagerAddress);
  console.log("");

  // Grant initial roles
  console.log("🔐 Setting up roles...");
  
  // Grant ADMIN_ROLE to deployer (already done in constructor)
  console.log("✅ ADMIN_ROLE granted to:", deployer.address);
  
  // You can grant additional roles here if needed
  // Example:
  // const FACULTY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FACULTY_ROLE"));
  // await approvalManager.grantRole(FACULTY_ROLE, "0xFacultyAddress");
  
  console.log("");

  // Display contract information
  console.log("📋 Contract Information:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Name:        DocumentApprovalManager");
  console.log("Contract Address:     ", approvalManagerAddress);
  console.log("Deployer:             ", deployer.address);
  console.log("DocumentManagerV2:    ", DOCUMENT_MANAGER_V2_ADDRESS);
  console.log("Network:              ", hre.network.name);
  console.log("Block Number:         ", await hre.ethers.provider.getBlockNumber());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "DocumentApprovalManager",
    contractAddress: approvalManagerAddress,
    deployer: deployer.address,
    documentManagerV2Address: DOCUMENT_MANAGER_V2_ADDRESS,
    deploymentBlock: await hre.ethers.provider.getBlockNumber(),
    deploymentDate: new Date().toISOString(),
    roles: {
      ADMIN_ROLE: await approvalManager.ADMIN_ROLE(),
      FACULTY_ROLE: await approvalManager.FACULTY_ROLE(),
      STUDENT_ROLE: await approvalManager.STUDENT_ROLE(),
      VERIFIER_ROLE: await approvalManager.VERIFIER_ROLE()
    }
  };

  console.log("💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${approvalManagerAddress} "${DOCUMENT_MANAGER_V2_ADDRESS}"`);
    console.log("");
  }

  // Next steps
  console.log("📝 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Update DocumentManagerV2 address if using zero address:");
  console.log("   await approvalManager.setDocumentManagerAddress('0xYourAddress')");
  console.log("");
  console.log("2. Grant roles to users:");
  console.log("   - FACULTY_ROLE: Can approve requests");
  console.log("   - STUDENT_ROLE: Can only send requests");
  console.log("   Example:");
  console.log("   await approvalManager.grantRoleToUser(FACULTY_ROLE, '0xFacultyAddress')");
  console.log("");
  console.log("3. Update your backend configuration:");
  console.log("   - Add contract address to config");
  console.log("   - Add contract ABI to your project");
  console.log("");
  console.log("4. Test the contract:");
  console.log("   - Send a test approval request");
  console.log("   - Approve/reject documents");
  console.log("   - Verify status tracking");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return {
    approvalManager: approvalManagerAddress,
    documentManagerV2: DOCUMENT_MANAGER_V2_ADDRESS,
    deployer: deployer.address
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
