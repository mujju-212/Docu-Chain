# DocuChain Enhanced Blockchain File Manager

This project implements a comprehensive blockchain-based file management system with IPFS storage, version control, folder organization, and granular permissions.

## 🏗️ Architecture

### Smart Contract Layer
- **EnhancedDocumentManager.sol**: Advanced smart contract with folder support, version control, and permissions
- **Features**: File/folder creation, sharing, version history, access control

### IPFS Storage Layer
- **Pinata Integration**: Decentralized file storage via IPFS
- **Content Addressing**: Files stored with cryptographic hashes
- **Gateway Access**: Direct file downloads from IPFS network

### Frontend Integration
- **MetaMask Wallet**: Web3 wallet integration for transactions
- **React Components**: Modern UI built on existing FileManagerNew.js
- **Real-time Updates**: Blockchain state synchronization

## 🚀 Deployment Guide

### Prerequisites
1. **Node.js** (v16 or later)
2. **MetaMask** browser extension
3. **Sepolia ETH** for transactions ([Get from faucet](https://sepoliafaucet.com/))
4. **Pinata Account** for IPFS storage ([Sign up](https://pinata.cloud/))

### Step 1: Install Dependencies

```bash
# Install blockchain dependencies
cd blockchain
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### Step 2: Configure Environment

1. **Update Hardhat Configuration** (`blockchain/hardhat.config.js`):
   ```javascript
   networks: {
     sepolia: {
       url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
       accounts: ["YOUR_PRIVATE_KEY"]
     }
   }
   ```

2. **Get Pinata API Keys**:
   - Sign up at [Pinata.cloud](https://pinata.cloud/)
   - Generate API key and secret
   - Keep these for Step 4

### Step 3: Deploy Smart Contract

Choose your platform:

**Windows (PowerShell):**
```powershell
cd blockchain
.\deploy-enhanced.ps1
```

**Linux/Mac (Bash):**
```bash
cd blockchain
chmod +x deploy-enhanced.sh
./deploy-enhanced.sh
```

**Manual Deployment:**
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
node scripts/update-config.js
```

### Step 4: Configure Frontend

Update `frontend/src/config/blockchain-config.json`:

```json
{
  "blockchain": {
    "network": "sepolia",
    "contracts": {
      "EnhancedDocumentManager": {
        "address": "DEPLOYED_CONTRACT_ADDRESS"
      }
    }
  },
  "ipfs": {
    "pinata": {
      "apiKey": "YOUR_PINATA_API_KEY",
      "secretKey": "YOUR_PINATA_SECRET_KEY"
    }
  }
}
```

### Step 5: Start Frontend

```bash
cd frontend
npm start
```

## 📱 Using the File Manager

### Initial Setup
1. **Connect Wallet**: Click "Connect Wallet" in the top-right corner
2. **Switch Network**: MetaMask will prompt to switch to Sepolia
3. **Confirm Connection**: Approve the connection request

### File Operations

#### Upload Files
1. Click "Upload" button or drag files to the upload area
2. Select files from your computer
3. MetaMask will prompt for transaction approval
4. Files are uploaded to IPFS and metadata stored on blockchain

#### Create Folders
1. Click "New Folder" button
2. Enter folder name
3. Approve blockchain transaction
4. Folder appears in current directory

#### File Sharing
1. Right-click file → "Share"
2. Enter recipient wallet address
3. Set permissions (read, write, execute)
4. Approve transaction

#### Version Control
1. Right-click file → "Update"
2. Select new file version
3. Previous versions remain accessible
4. Version history tracked on blockchain

### Advanced Features

#### Permission Management
- **Read**: View file content
- **Write**: Modify file
- **Execute**: Run executable files
- **Delete**: Remove file
- **Share**: Grant access to others

#### Folder Organization
- Hierarchical folder structure
- Blockchain-tracked folder permissions
- Path-based access control

## 🔧 Technical Details

### Contract Functions

```solidity
// File Operations
function uploadFile(metadata) external returns (uint256)
function updateFile(fileId, newIpfsHash, description) external
function shareFile(fileId, user, permissions) external

// Folder Operations  
function createFolder(name, parentPath) external returns (uint256)
function getFolderContents(folderId) external view returns (files[], folders[])

// Version Control
function getFileVersions(fileId) external view returns (FileVersion[])
function getFileVersion(fileId, version) external view returns (FileVersion)
```

### Service Layer Architecture

```javascript
// fileManagerService.js - Main service layer
class EnhancedFileManagerService {
  async createFile(file, metadata)    // Upload to IPFS + blockchain
  async createFolder(name, path)      // Create blockchain folder
  async updateFile(fileId, newFile)   // Version control
  async shareFile(fileId, recipient)  // Permission management
  async loadFileSystem()              // Sync blockchain state
}
```

### State Management

```javascript
// FileManagerNew.js - React component state
const [blockchainFiles, setBlockchainFiles] = useState([]);
const [blockchainFolders, setBlockchainFolders] = useState([]);
const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
```

## 🐛 Troubleshooting

### Common Issues

**MetaMask Not Connecting**
- Ensure MetaMask is installed and unlocked
- Check network is set to Sepolia
- Refresh page and try again

**Transaction Failures**
- Check Sepolia ETH balance
- Increase gas limit if needed
- Verify contract address is correct

**IPFS Upload Errors**
- Verify Pinata API keys are correct
- Check file size limits (10MB default)
- Ensure stable internet connection

**File Not Loading**
- Wait for blockchain confirmation (1-2 minutes)
- Check transaction status on Etherscan
- Verify IPFS gateway accessibility

### Debug Mode

Enable debug logging:
```javascript
// In fileManagerService.js
this.debugMode = true;
```

### Network Issues

Check current network:
```javascript
console.log('Current network:', await web3.eth.net.getId());
console.log('Expected network: 11155111 (Sepolia)');
```

## 📚 API Reference

### FileManagerService Methods

```javascript
// Initialize service
await fileManagerService.initialize()

// File operations
await fileManagerService.createFile(file, metadata)
await fileManagerService.updateFile(fileId, newFile, metadata)  
await fileManagerService.deleteFile(fileId)
await fileManagerService.shareFile(fileId, recipient, permissions)

// Folder operations
await fileManagerService.createFolder(name, parentPath)
await fileManagerService.getFolderContents(folderId)

// System operations
await fileManagerService.loadFileSystem()
await fileManagerService.getFileHistory(fileId)
```

### Event Handling

```javascript
// Listen for blockchain events
contract.on('FileUploaded', (fileId, owner, ipfsHash) => {
  console.log('New file uploaded:', fileId);
});

contract.on('FileShared', (fileId, from, to, permissions) => {
  console.log('File shared:', fileId);
});
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **API Keys**: Store Pinata keys securely (environment variables)
- **Permissions**: Always verify user permissions before operations
- **Input Validation**: Sanitize all user inputs
- **Gas Limits**: Set appropriate gas limits for transactions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly on Sepolia testnet
4. Submit pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details