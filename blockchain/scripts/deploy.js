const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Deploy DocumentManager
  console.log("Deploying DocumentManager...");
  const DocumentManager = await hre.ethers.getContractFactory("DocumentManager");
  const documentManager = await DocumentManager.deploy();
  await documentManager.deployed();
  console.log("DocumentManager deployed to:", documentManager.address);

  // Deploy ApprovalWorkflow
  console.log("\nDeploying ApprovalWorkflow...");
  const ApprovalWorkflow = await hre.ethers.getContractFactory("ApprovalWorkflow");
  const approvalWorkflow = await ApprovalWorkflow.deploy();
  await approvalWorkflow.deployed();
  console.log("ApprovalWorkflow deployed to:", approvalWorkflow.address);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      DocumentManager: documentManager.address,
      ApprovalWorkflow: approvalWorkflow.address,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  // Wait for block confirmations before verifying
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations...");
    await documentManager.deployTransaction.wait(6);
    await approvalWorkflow.deployTransaction.wait(6);

    console.log("\nVerifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: documentManager.address,
        constructorArguments: [],
      });
      console.log("DocumentManager verified!");
    } catch (error) {
      console.log("Error verifying DocumentManager:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: approvalWorkflow.address,
        constructorArguments: [],
      });
      console.log("ApprovalWorkflow verified!");
    } catch (error) {
      console.log("Error verifying ApprovalWorkflow:", error.message);
    }
  }

  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
