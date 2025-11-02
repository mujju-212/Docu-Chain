const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy DocuChainManager
  console.log("Deploying DocuChainManager...");
  const DocuChainManager = await hre.ethers.getContractFactory("DocuChainManager");
  const docuChainManager = await DocuChainManager.deploy();
  await docuChainManager.waitForDeployment();
  
  const contractAddress = await docuChainManager.getAddress();
  console.log("DocuChainManager deployed to:", contractAddress);

  // Wait for some confirmations
  console.log("Waiting for confirmations...");
  await docuChainManager.deploymentTransaction().wait(5);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("DocuChainManager Contract:", contractAddress);
  console.log("Gas Used:", docuChainManager.deploymentTransaction().gasLimit.toString());
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DocuChainManager: contractAddress,
    },
    transactionHash: docuChainManager.deploymentTransaction().hash
  };

  console.log("\n=== Contract Addresses ===");
  console.log("Add this to your .env file:");
  console.log(`REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);

  const fs = require('fs');
  const path = require('path');
  
  // Save to deployment file
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\nDeployment info saved to: ${deploymentFile}`);
  
  // Verify contract if on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contract...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}
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
    await enhancedDocumentManager.deployTransaction.wait(6);
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
