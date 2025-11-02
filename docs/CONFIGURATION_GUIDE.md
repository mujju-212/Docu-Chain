# Configuration Setup Guide

This guide helps you configure the DocuChain application for blockchain functionality.

## Current Status

✅ **MetaMask Integration**: Complete  
✅ **Smart Contract**: Created (EnhancedDocumentManager.sol)  
✅ **Service Layer**: Complete (IPFS + Blockchain)  
✅ **UI Integration**: Complete (FileManagerNew.js)  
🔄 **Configuration**: In Progress  
❌ **Contract Deployment**: Needed  
❌ **API Keys**: Needed  

## Quick Start

If you want to test the system without full blockchain deployment:

1. The system will show friendly warnings for missing deployment
2. All UI functionality works (just won't persist to blockchain)
3. You can deploy the contract later when ready

## Required Configuration

### 1. Blockchain Configuration

File: `frontend/src/config/blockchain-config.json`

```json
{
  "contractAddress": "DEPLOY_CONTRACT_FIRST",
  "networkId": 11155111,
  "networkName": "Sepolia Testnet",
  "rpcUrl": "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  "explorerUrl": "https://sepolia.etherscan.io",
  "pinata": {
    "apiKey": "GET_FROM_PINATA_DASHBOARD",
    "secretKey": "GET_FROM_PINATA_DASHBOARD", 
    "jwt": "GET_FROM_PINATA_DASHBOARD"
  }
}
```

### 2. Environment Variables

Create `.env` file in frontend directory:

```env
# Pinata IPFS Configuration
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key  
VITE_PINATA_JWT=your_pinata_jwt_token

# Blockchain Configuration
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_NETWORK_ID=11155111

# Optional: Infura Project ID for better RPC reliability
VITE_INFURA_PROJECT_ID=your_infura_project_id
```

## Setup Steps

### Step 1: Get Pinata API Keys (5 minutes)

1. Go to [Pinata.cloud](https://pinata.cloud)
2. Create free account
3. Navigate to API Keys section
4. Create new API key with permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS` 
   - `userPinnedDataTotal`
5. Copy API Key, Secret Key, and JWT

### Step 2: Get Sepolia Test ETH (5 minutes)

1. Install MetaMask browser extension
2. Create/import wallet
3. Switch to Sepolia testnet
4. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
5. Need at least 0.1 ETH for contract deployment

### Step 3: Deploy Smart Contract (10 minutes)

Choose one method:

#### Method A: Using Hardhat (Recommended)

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

#### Method B: Using Remix IDE

1. Go to [Remix.ethereum.org](https://remix.ethereum.org)
2. Copy contract from `frontend/src/contracts/EnhancedDocumentManager.sol`
3. Compile with Solidity 0.8.19+
4. Deploy to Sepolia network via MetaMask
5. Copy deployed contract address

### Step 4: Update Configuration

1. Update `blockchain-config.json` with:
   - Deployed contract address
   - Pinata API credentials

2. Update `.env` file with same information

### Step 5: Test System

1. Start frontend: `npm run dev`
2. Connect MetaMask to Sepolia
3. Try creating a folder
4. Try uploading a small file
5. Check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)

## Current System Behavior

### Before Configuration:
- ✅ MetaMask connection works
- ✅ UI fully functional
- ⚠️ Shows "Contract not deployed" warnings
- ⚠️ Files don't persist (not saved to blockchain)
- ✅ No crashes or errors

### After Configuration:
- ✅ Full blockchain functionality
- ✅ Files stored on IPFS
- ✅ Metadata stored on blockchain
- ✅ Permanent, decentralized storage
- ✅ Version control and permissions

## Testing Checklist

After configuration, test these features:

- [ ] MetaMask connection
- [ ] Create folder on blockchain
- [ ] Upload file to IPFS + blockchain
- [ ] Download file from IPFS
- [ ] View file details on Etherscan
- [ ] Switch between folders
- [ ] Multiple file uploads

## Troubleshooting

### Common Issues:

**"Contract address not specified"**
- Solution: Deploy contract and update config

**"MetaMask not connected"**  
- Solution: Connect MetaMask and switch to Sepolia

**"Insufficient funds"**
- Solution: Get more Sepolia ETH from faucet

**"IPFS upload failed"**
- Solution: Check Pinata API keys and quota

**"Transaction failed"**
- Solution: Check gas settings and network congestion

### Getting Support:

1. Check browser console for detailed errors
2. Verify all configuration values
3. Test with small files first
4. Ensure sufficient Sepolia ETH balance

## Cost Estimates

### Sepolia Testnet (Free):
- Contract deployment: ~0.02 ETH
- Create folder: ~0.001 ETH  
- Upload file: ~0.002 ETH
- Total for testing: ~0.1 ETH (free from faucet)

### IPFS Storage (Pinata Free):
- 1GB storage included
- 1000 API calls/month
- More than enough for testing

## Next Steps

1. **Complete setup** following this guide
2. **Test thoroughly** with various file types
3. **Monitor gas costs** for optimization
4. **Consider mainnet deployment** when ready for production

Need help? All the tools are built and working - just need the configuration keys to unlock full functionality!