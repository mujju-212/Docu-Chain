# Smart Contract Deployment Guide

This guide will walk you through deploying the EnhancedDocumentManager smart contract to the Sepolia testnet.

## Prerequisites

1. **MetaMask Extension**: Install MetaMask browser extension
2. **Sepolia ETH**: Get test ETH from Sepolia faucet
3. **API Keys**: Get Pinata API keys for IPFS storage

## Step 1: Get Sepolia Test ETH

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/) or [Alchemy Faucet](https://sepoliafaucet.com/)
2. Enter your MetaMask wallet address
3. Request test ETH (you'll need at least 0.1 ETH for deployment)

## Step 2: Switch to Sepolia Network

1. Open MetaMask
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Select "Sepolia test network"
4. If not available, add it manually:
   - Network Name: Sepolia
   - RPC URL: https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
   - Chain ID: 11155111
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

## Step 3: Compile the Smart Contract

The contract needs to be compiled to get the bytecode for deployment.

### Option A: Using Hardhat (Recommended)

1. Navigate to the blockchain directory:
```bash
cd d:\AVTIVE PROJ\Docu-Chain\blockchain
```

2. Install dependencies:
```bash
npm install
```

3. Copy the EnhancedDocumentManager.sol to the contracts folder:
```bash
copy "..\frontend\src\contracts\EnhancedDocumentManager.sol" "contracts\"
```

4. Compile the contract:
```bash
npx hardhat compile
```

5. The compiled contract will be in `artifacts/contracts/EnhancedDocumentManager.sol/EnhancedDocumentManager.json`

### Option B: Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file called `EnhancedDocumentManager.sol`
3. Copy the contract code from `frontend/src/contracts/EnhancedDocumentManager.sol`
4. Compile using Solidity compiler (version 0.8.19 or higher)
5. Copy the bytecode from the compilation artifacts

## Step 4: Deploy Using Hardhat

1. Create a deployment script in `blockchain/scripts/deploy-enhanced.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying EnhancedDocumentManager...");

  const EnhancedDocumentManager = await hre.ethers.getContractFactory("EnhancedDocumentManager");
  const contract = await EnhancedDocumentManager.deploy();

  await contract.deployed();

  console.log("EnhancedDocumentManager deployed to:", contract.address);
  console.log("Transaction hash:", contract.deployTransaction.hash);
  
  // Wait for a few confirmations
  await contract.deployTransaction.wait(2);
  
  console.log("Deployment confirmed!");
  
  // Save contract address to config
  const fs = require('fs');
  const config = {
    contractAddress: contract.address,
    networkId: 11155111,
    networkName: "Sepolia Testnet",
    deploymentBlock: contract.deployTransaction.blockNumber,
    deploymentHash: contract.deployTransaction.hash
  };
  
  fs.writeFileSync('../frontend/src/config/blockchain-config.json', JSON.stringify(config, null, 2));
  console.log("Config updated!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

2. Update `hardhat.config.js` with Sepolia network:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: ["YOUR_PRIVATE_KEY_HERE"] // Replace with your private key
    }
  }
};
```

3. Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy-enhanced.js --network sepolia
```

## Step 5: Manual Deployment (Alternative)

If you prefer manual deployment through MetaMask:

1. Use the deployment utility in the frontend:
```javascript
import { contractDeployer } from '../utils/deployContract.js';

// Initialize deployer
await contractDeployer.initialize();

// Deploy contract
const result = await contractDeployer.deployContract();

if (result.success) {
  console.log('Contract deployed at:', result.contractAddress);
  
  // Update configuration
  await contractDeployer.updateConfiguration(result.contractAddress);
} else {
  console.error('Deployment failed:', result.error);
}
```

## Step 6: Get Pinata API Keys

1. Go to [Pinata](https://pinata.cloud/)
2. Create a free account
3. Go to API Keys section
4. Create a new API key with the following permissions:
   - pinFileToIPFS
   - pinJSONToIPFS
   - userPinnedDataTotal
5. Save the API Key, Secret Key, and JWT token

## Step 7: Update Configuration

Update `frontend/src/config/blockchain-config.json`:

```json
{
  "contractAddress": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  "networkId": 11155111,
  "networkName": "Sepolia Testnet",
  "rpcUrl": "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  "explorerUrl": "https://sepolia.etherscan.io",
  "pinata": {
    "apiKey": "YOUR_PINATA_API_KEY",
    "secretKey": "YOUR_PINATA_SECRET_KEY",
    "jwt": "YOUR_PINATA_JWT"
  }
}
```

## Step 8: Test the Deployment

1. Start the frontend application
2. Connect MetaMask to Sepolia network
3. Try creating a folder or uploading a file
4. Check the transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)

## Troubleshooting

### Common Issues:

1. **Insufficient funds**: Make sure you have enough Sepolia ETH
2. **Wrong network**: Ensure MetaMask is on Sepolia testnet
3. **Gas estimation failed**: Try manually setting gas limit to 3,000,000
4. **Contract bytecode missing**: Ensure the contract is properly compiled

### Getting Help:

- Check console logs for detailed error messages
- Verify contract address on Sepolia Etherscan
- Test with small operations first (create folder before uploading files)

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Test thoroughly on testnet before mainnet deployment
- Consider using a hardware wallet for mainnet deployments

## Next Steps

After successful deployment:

1. Test all functionality (create folders, upload files, download files)
2. Monitor gas costs and optimize if needed
3. Set up monitoring for contract events
4. Document the deployed contract address and keep it secure