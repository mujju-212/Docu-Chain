const { ethers } = require("ethers");

// ABI for approvalRequests mapping
const ABI = [
  "function approvalRequests(bytes32) view returns (bytes32 documentId, address requester, uint8 status, bool isActive, uint8 processType, uint256 createdAt, uint256 expiryTimestamp)",
  "event ApprovalRequestCreated(bytes32 indexed requestId, bytes32 indexed documentId, address indexed requester, uint256 timestamp)"
];

async function main() {
  const contractAddress = "0x8E1626654e1B04ADF941EbbcEc7E92728327aA54";
  const requestId = "0x31a205b56ae198a1b6daaf4badfb1ce7e46d77078b58107666a3240bb94b2bd4";
  
  // Connect to Sepolia using public RPC
  const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_KEY");
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  
  console.log("\n🔍 Checking Request on Sepolia Blockchain");
  console.log("=".repeat(60));
  console.log("Contract:", contractAddress);
  console.log("Request ID:", requestId);
  console.log();
  
  try {
    const request = await contract.approvalRequests(requestId);
    
    console.log("📦 Request Data:");
    console.log("  Document ID:", request.documentId);
    console.log("  Requester:", request.requester);
    console.log("  Status:", request.status);
    console.log("  Is Active:", request.isActive);
    console.log("  Process Type:", request.processType);
    console.log("  Created At:", new Date(Number(request.createdAt) * 1000).toLocaleString());
    
    if (request.requester === "0x0000000000000000000000000000000000000000") {
      console.log("\n❌ REQUEST DOES NOT EXIST (zero address)");
      console.log("   This means the blockchain never received this request ID.");
    } else if (!request.isActive) {
      console.log("\n⚠️  REQUEST EXISTS but IS NOT ACTIVE");
      console.log("   The request was created but then deactivated.");
    } else {
      console.log("\n✅ REQUEST EXISTS AND IS ACTIVE");
    }
    
  } catch (error) {
    console.error("\n❌ Error fetching request:", error.message);
  }
  
  // Try to get recent events
  console.log("\n📜 Checking Recent Events (last 1000 blocks)...");
  try {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 1000);
    
    const filter = contract.filters.ApprovalRequestCreated();
    const events = await contract.queryFilter(filter, fromBlock, latestBlock);
    
    console.log(`Found ${events.length} recent requests:\n`);
    events.slice(-5).forEach((event, i) => {
      console.log(`  ${i + 1}. Request ID: ${event.args.requestId}`);
      console.log(`     Document ID: ${event.args.documentId}`);
      console.log(`     Requester: ${event.args.requester}`);
      console.log(`     Block: ${event.blockNumber}`);
      console.log();
    });
    
  } catch (error) {
    console.log("Could not fetch events:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
