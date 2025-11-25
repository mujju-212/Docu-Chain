const hre = require("hardhat");

async function main() {
  const contractAddress = "0x8E1626654e1B04ADF941EbbcEc7E92728327aA54";
  
  const DocumentApprovalManager = await hre.ethers.getContractFactory("DocumentApprovalManager");
  const contract = DocumentApprovalManager.attach(contractAddress);
  
  console.log("Checking blockchain for approval requests...\n");
  
  const filter = contract.filters.ApprovalRequested();
  const events = await contract.queryFilter(filter);
  
  console.log(`✅ Total requests on blockchain: ${events.length}\n`);
  
  if (events.length === 0) {
    console.log("❌ No requests found on blockchain!");
    console.log("\nThis means approval requests were saved to database but never created on blockchain.");
    console.log("Solution: Create new approval requests that actually get recorded on blockchain.");
  } else {
    console.log("Recent requests:");
    events.slice(-5).forEach((e, i) => {
      console.log(`\n${i + 1}. Request ID: ${e.args.requestId}`);
      console.log(`   Document Hash: ${e.args.documentHash}`);
      console.log(`   Requester: ${e.args.requester}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
