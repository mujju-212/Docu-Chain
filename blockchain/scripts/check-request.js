const hre = require("hardhat");

async function main() {
  const contractAddress = "0x8E1626654e1B04ADF941EbbcEc7E92728327aA54";
  const requestId = "0x31a205b56ae198a1b6daaf4badfb1ce7e46d77078b58107666a3240bb94b2bd4"; // Latest request
  
  const DocumentApprovalManager = await hre.ethers.getContractFactory("DocumentApprovalManager");
  const contract = DocumentApprovalManager.attach(contractAddress);
  
  console.log("\n🔍 Checking request on blockchain...");
  console.log("Contract Address:", contractAddress);
  console.log("Request ID:", requestId);
  
  try {
    // Try the mapping directly
    const request = await contract.approvalRequests(requestId);
    
    console.log("\n📦 Request Data from Mapping:");
    console.log("  Document ID:", request.documentId);
    console.log("  Requester:", request.requester);
    console.log("  Status:", request.status);
    console.log("  Is Active:", request.isActive);
    
    if (request.requester === "0x0000000000000000000000000000000000000000") {
      console.log("\n❌ Request does NOT exist (zero address)");
    } else if (!request.isActive) {
      console.log("\n⚠️ Request EXISTS but is NOT ACTIVE");
    } else {
      console.log("\n✅ Request EXISTS and IS ACTIVE");
    }
    
  } catch (error) {
    console.log("\n❌ Error reading request:", error.message);
  }
  
  // Also try to get recent events
  console.log("\n📜 Checking recent ApprovalRequestCreated events...");
  try {
    const filter = contract.filters.ApprovalRequestCreated();
    const events = await contract.queryFilter(filter, -100); // Last 100 blocks
    console.log(`Found ${events.length} recent requests:`);
    events.forEach((event, i) => {
      console.log(`\n  ${i + 1}. Request ID: ${event.args.requestId}`);
      console.log(`     Document ID: ${event.args.documentId}`);
      console.log(`     Requester: ${event.args.requester}`);
    });
  } catch (error) {
    console.log("Error fetching events:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
