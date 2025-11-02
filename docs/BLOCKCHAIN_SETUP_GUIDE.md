# Blockchain File Manager Integration Setup Guide

## 📋 Overview

This guide will help you deploy the enhanced smart contract and configure the blockchain file management system for DocuChain.

## 🔧 Prerequisites

1. **MetaMask Extension** installed in browser
2. **Remix IDE** access (https://remix.ethereum.org)
3. **Sepolia Testnet ETH** for deployment
4. **Pinata Account** for IPFS storage (optional but recommended)

## 📝 Step-by-Step Setup

### Step 1: Deploy Enhanced Smart Contract

1. **Open Remix IDE** (https://remix.ethereum.org)

2. **Create New Contract File**:
   - Create new file: `EnhancedDocumentManager.sol`
   - Copy the contract code from `blockchain/contracts/EnhancedDocumentManager.sol`

3. **Compile Contract**:
   - Go to "Solidity Compiler" tab
   - Select compiler version: `0.8.20`
   - Enable optimization (200 runs)
   - Click "Compile EnhancedDocumentManager.sol"

4. **Deploy Contract**:
   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Account: Select your MetaMask account
   - Contract: `EnhancedDocumentManager`
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy Contract Address**:
   - After successful deployment, copy the contract address
   - Save this address for configuration

### Step 2: Configure Frontend

1. **Update Contract Address**:
   ```javascript
   // In frontend/src/utils/enhancedMetamask.js
   const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
   ```

2. **Configure IPFS (Optional but Recommended)**:
   - Sign up for Pinata account: https://pinata.cloud
   - Get API Key and Secret Key
   - Update in `frontend/src/services/fileManagerService.js`:
   ```javascript
   const IPFS_API_KEY = 'YOUR_PINATA_API_KEY';
   const IPFS_SECRET_KEY = 'YOUR_PINATA_SECRET_KEY';
   ```

3. **Update Network Configuration** (if needed):
   ```javascript
   // In frontend/src/utils/enhancedMetamask.js
   const RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
   ```

### Step 3: Test the Integration

1. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Connect Wallet**:
   - Click "Connect Wallet" button in dashboard
   - Confirm MetaMask connection
   - Ensure you're on Sepolia testnet

3. **Test File Operations**:
   - Navigate to File Manager
   - Try uploading a small test file
   - Verify blockchain transaction in MetaMask
   - Check file appears in file list

## 🎯 Configuration Options

### Storage Strategy

**Blockchain Storage** (Recommended for):
- File metadata (name, size, owner, permissions)
- Version history and change logs
- Access control and sharing permissions
- Folder structure and organization
- File operation history

**IPFS Storage** (Recommended for):
- Actual file content
- Large files and media
- Immutable file versions

**Database Storage** (Optional for):
- User preferences and UI state
- Temporary data and caching
- Search indexes and optimization

### Permission System

The enhanced contract supports granular permissions:
- **Read**: View file content and metadata
- **Write**: Modify file content (create new versions)
- **Execute**: Run executable files (future feature)
- **Delete**: Remove files (soft delete)
- **Share**: Grant permissions to other users

### Version Control Features

- **Automatic versioning** on file updates
- **Version history** with change descriptions
- **Rollback capability** to previous versions
- **Change tracking** with timestamps and authors

## 🔐 Security Considerations

1. **Private Key Security**:
   - Never expose private keys in code
   - Use MetaMask for transaction signing
   - Keep backup of seed phrases secure

2. **Access Control**:
   - Files are owned by uploading wallet address
   - Sharing requires explicit permission grants
   - All operations are logged on blockchain

3. **IPFS Security**:
   - Files on IPFS are public by hash
   - Use Pinata for reliable pinning service
   - Consider encryption for sensitive files

## 📊 Gas Optimization

Estimated gas costs on Sepolia:
- **File Upload**: ~150,000 gas
- **Folder Creation**: ~100,000 gas
- **File Update**: ~80,000 gas
- **Rename Operation**: ~50,000 gas
- **Share File**: ~60,000 gas

Tips for optimization:
- Batch operations when possible
- Use appropriate gas prices
- Consider Layer 2 solutions for production

## 🛠 Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**:
   - Check if MetaMask is installed and unlocked
   - Verify network is set to Sepolia
   - Clear browser cache and reload

2. **Contract Deployment Failed**:
   - Ensure sufficient ETH balance for gas
   - Check compiler version matches (0.8.20)
   - Verify OpenZeppelin contracts are available

3. **File Upload Failed**:
   - Check IPFS configuration
   - Verify contract address is correct
   - Ensure wallet has enough ETH for gas

4. **Transaction Pending**:
   - Check network congestion
   - Increase gas price if needed
   - Wait for confirmation before retrying

### Debug Tips

1. **Enable Console Logs**:
   ```javascript
   // Add to component for debugging
   console.log('File upload result:', result);
   console.log('Current user account:', fileManagerService.getCurrentUser());
   ```

2. **Check Network Status**:
   - Verify Sepolia testnet connectivity
   - Check Etherscan for transaction status
   - Monitor gas prices and network load

3. **Validate Contract State**:
   - Use Remix to query contract functions
   - Check user files: `getUserFiles(address)`
   - Verify file metadata: `getFile(fileId)`

## 🚀 Production Deployment

For production deployment:

1. **Use Mainnet** or appropriate L2 solution
2. **Implement proper error handling** and user feedback
3. **Add file encryption** for sensitive documents
4. **Set up monitoring** for contract events
5. **Implement backup strategies** for IPFS content
6. **Add rate limiting** and spam protection
7. **Consider gas sponsorship** for better UX

## 📚 Additional Resources

- **Solidity Documentation**: https://docs.soliditylang.org
- **Web3.js Guide**: https://web3js.readthedocs.io
- **IPFS Documentation**: https://docs.ipfs.io
- **MetaMask Developer Docs**: https://docs.metamask.io
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all configuration steps
3. Test with small files first
4. Check browser console for errors
5. Ensure all dependencies are installed correctly

---

**Note**: This is a development setup. For production use, implement additional security measures, error handling, and performance optimizations.