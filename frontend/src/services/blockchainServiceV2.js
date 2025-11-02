import { ethers } from 'ethers';
import DocumentManagerV2ABI from '../contracts/DocumentManagerV2.json';

// Contract configuration
const CONTRACT_ADDRESS = "0xb19f78B9c32dceaA01DE778Fa46784F5437DF373";
const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/edc6ea5d5f0245c3b3c10b06ffa69e18";
const SEPOLIA_CHAIN_ID = 11155111;

console.log('🔧 DocumentManagerV2 Service Configuration:');
console.log('📄 Contract Address:', CONTRACT_ADDRESS);
console.log('🌐 Network: Sepolia Testnet');

// Global variables
let provider = null;
let signer = null;
let contract = null;

class BlockchainServiceV2 {
  constructor() {
    this.isInitialized = false;
    this.currentWallet = null;
  }

  // Initialize the blockchain connection
  async initialize() {
    try {
      console.log('🚀 Initializing DocumentManagerV2 blockchain service...');

      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('👤 Connected accounts:', accounts.length);
      
      // Create provider and signer
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      this.currentWallet = await signer.getAddress();
      console.log('📝 Current wallet:', this.currentWallet);

      // Create contract instance
      contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentManagerV2ABI, signer);
      console.log('📄 Contract instance created');

      // Check network
      const network = await provider.getNetwork();
      console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
      
      if (network.chainId !== BigInt(SEPOLIA_CHAIN_ID)) {
        console.log('⚠️ Not on Sepolia network, attempting to switch...');
        await this.switchToSepolia();
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

      this.isInitialized = true;
      console.log('✅ DocumentManagerV2 service initialized successfully');
      
      return {
        success: true,
        wallet: this.currentWallet,
        network: 'Sepolia'
      };
    } catch (error) {
      console.error('❌ Error initializing blockchain service:', error);
      throw error;
    }
  }

  // Handle account changes (wallet switching)
  handleAccountsChanged(accounts) {
    console.log('🔄 Wallet switched in blockchainServiceV2:', accounts[0]);
    
    if (accounts.length === 0) {
      // User disconnected wallet
      console.log('👋 Wallet disconnected');
      this.currentWallet = null;
      this.isInitialized = false;
    } else {
      // User switched to a different account
      this.currentWallet = accounts[0];
      
      // Reinitialize signer and contract with new account
      if (provider) {
        provider.getSigner().then(newSigner => {
          signer = newSigner;
          contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentManagerV2ABI, signer);
          console.log('✅ Contract reinitialized with new wallet:', this.currentWallet);
        }).catch(error => {
          console.error('❌ Error reinitializing signer:', error);
        });
      }
    }
    
    // Note: Page reload removed - let WalletContext handle UI updates
    // If you need to reload data, dispatch a custom event instead
    window.dispatchEvent(new CustomEvent('walletChanged', { 
      detail: { address: accounts[0] } 
    }));
  }

  // Handle chain changes
  handleChainChanged(chainId) {
    console.log('🔄 Network changed:', chainId);
    
    // Check if still on Sepolia
    const newChainId = parseInt(chainId, 16);
    if (newChainId !== SEPOLIA_CHAIN_ID) {
      console.warn('⚠️ Not on Sepolia network anymore. ChainId:', newChainId);
    }
    
    // Dispatch event for components to handle
    window.dispatchEvent(new CustomEvent('networkChanged', { 
      detail: { chainId: newChainId } 
    }));
    
    // Reload page to reset state (optional - you can handle this in components instead)
    window.location.reload();
  }

  // Switch to Sepolia network
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
      });
      console.log('✅ Switched to Sepolia network');
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Network not added to MetaMask
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [SEPOLIA_RPC_URL],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Get current connected wallet
  async getCurrentWallet() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.currentWallet;
  }

  // Switch wallet (prompt MetaMask to connect different wallet)
  async switchWallet() {
    try {
      console.log('🔄 Requesting wallet switch...');
      const accounts = await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      }).then(() => window.ethereum.request({ method: 'eth_requestAccounts' }));
      
      this.currentWallet = accounts[0];
      console.log('✅ Switched to wallet:', this.currentWallet);
      
      // Reinitialize with new wallet
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentManagerV2ABI, signer);
      
      return this.currentWallet;
    } catch (error) {
      console.error('❌ Error switching wallet:', error);
      throw error;
    }
  }

  // Upload document to blockchain
  async uploadDocument(ipfsHash, fileName, fileSize, documentType = 'document') {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log('📤 Uploading document to blockchain...');
      console.log('📝 File:', fileName);
      console.log('📦 IPFS Hash:', ipfsHash);
      console.log('🔗 Wallet:', this.currentWallet);

      const tx = await contract.uploadDocument(
        ipfsHash,
        fileName,
        fileSize,
        documentType
      );

      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);

      // Get document ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'DocumentUploaded';
        } catch (e) {
          return false;
        }
      });

      const documentId = event ? contract.interface.parseLog(event).args.documentId : null;

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        documentId: documentId,
        uploadedByWallet: this.currentWallet
      };
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  // Share document with another wallet
  async shareDocument(documentId, recipientWallet, permission = 'read') {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log('🤝 Sharing document...');
      console.log('📄 Document ID:', documentId);
      console.log('👤 Recipient:', recipientWallet);
      console.log('🔐 Permission:', permission);
      console.log('🔗 Sharing from wallet:', this.currentWallet);

      // Validate permission
      if (permission !== 'read' && permission !== 'write') {
        throw new Error('Permission must be "read" or "write"');
      }

      const tx = await contract.shareDocument(
        documentId,
        recipientWallet,
        permission
      );

      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        sharedWithWallet: recipientWallet
      };
    } catch (error) {
      console.error('❌ Error sharing document:', error);
      
      // Check if error is due to wallet mismatch
      if (error.message.includes('Only owner can share')) {
        throw new Error(`You must connect to the wallet that uploaded this document to share it.`);
      }
      
      throw error;
    }
  }

  // Update document (owner or write permission holders)
  async updateDocument(documentId, newIpfsHash) {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log('📝 Updating document...');
      console.log('📄 Document ID:', documentId);
      console.log('📦 New IPFS Hash:', newIpfsHash);
      console.log('🔗 Updating from wallet:', this.currentWallet);

      const tx = await contract.updateDocument(documentId, newIpfsHash);

      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error updating document:', error);
      
      // Check if error is due to permission
      if (error.message.includes('No permission to update')) {
        throw new Error(`You don't have permission to update this document. You need to be the owner or have write permission.`);
      }
      
      throw error;
    }
  }

  // Revoke share permission
  async revokeShare(documentId, revokeFromWallet) {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log('🚫 Revoking share permission...');
      console.log('📄 Document ID:', documentId);
      console.log('👤 Revoking from:', revokeFromWallet);

      const tx = await contract.revokeShare(documentId, revokeFromWallet);

      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Share revoked:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error revoking share:', error);
      throw error;
    }
  }

  // Check if user has write permission
  async hasWritePermission(documentId, walletAddress = null) {
    try {
      if (!this.isInitialized) await this.initialize();

      const wallet = walletAddress || this.currentWallet;
      const hasPermission = await contract.hasWritePermission(documentId, wallet);

      console.log(`🔐 Write permission for ${wallet}:`, hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking write permission:', error);
      return false;
    }
  }

  // Check if user has read permission
  async hasReadPermission(documentId, walletAddress = null) {
    try {
      if (!this.isInitialized) await this.initialize();

      const wallet = walletAddress || this.currentWallet;
      const hasPermission = await contract.hasReadPermission(documentId, wallet);

      console.log(`🔐 Read permission for ${wallet}:`, hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking read permission:', error);
      return false;
    }
  }

  // Get document details
  async getDocument(documentId) {
    try {
      if (!this.isInitialized) await this.initialize();

      const doc = await contract.getDocument(documentId);
      
      return {
        ipfsHash: doc.ipfsHash,
        owner: doc.owner,
        timestamp: Number(doc.timestamp),
        fileName: doc.fileName,
        fileSize: Number(doc.fileSize),
        isActive: doc.isActive,
        documentType: doc.documentType,
        version: Number(doc.version)
      };
    } catch (error) {
      console.error('❌ Error getting document:', error);
      throw error;
    }
  }

  // Get specific version of document
  async getDocumentVersion(documentId, version) {
    try {
      if (!this.isInitialized) await this.initialize();

      const ipfsHash = await contract.getDocumentVersion(documentId, version);
      return ipfsHash;
    } catch (error) {
      console.error('❌ Error getting document version:', error);
      throw error;
    }
  }

  // Get active shares for a document
  async getActiveDocumentShares(documentId) {
    try {
      if (!this.isInitialized) await this.initialize();

      const shares = await contract.getActiveDocumentShares(documentId);
      
      return shares.map(share => ({
        sharedWith: share.sharedWith,
        permission: share.permission,
        timestamp: Number(share.timestamp),
        isActive: share.isActive
      }));
    } catch (error) {
      console.error('❌ Error getting document shares:', error);
      return [];
    }
  }

  // Get all documents owned by a wallet
  async getOwnerDocuments(walletAddress = null) {
    try {
      if (!this.isInitialized) await this.initialize();

      const wallet = walletAddress || this.currentWallet;
      const documentIds = await contract.getOwnerDocuments(wallet);

      console.log(`📂 Found ${documentIds.length} documents for ${wallet}`);
      return documentIds;
    } catch (error) {
      console.error('❌ Error getting owner documents:', error);
      return [];
    }
  }

  // Verify document authenticity
  async verifyDocument(documentId, ipfsHash) {
    try {
      if (!this.isInitialized) await this.initialize();

      const isValid = await contract.verifyDocument(documentId, ipfsHash);
      return isValid;
    } catch (error) {
      console.error('❌ Error verifying document:', error);
      return false;
    }
  }

  // Deactivate document
  async deactivateDocument(documentId) {
    try {
      if (!this.isInitialized) await this.initialize();

      const tx = await contract.deactivateDocument(documentId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Error deactivating document:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.isInitialized = false;
    this.currentWallet = null;
    provider = null;
    signer = null;
    contract = null;
    console.log('🔌 Disconnected from blockchain');
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && contract !== null;
  }

  // Get document version history (V2 specific)
  async getDocumentVersionHistory(documentId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📜 Fetching version history for documentId:', documentId);

      // Get document info
      const doc = await contract.getDocument(documentId);
      const currentVersion = Number(doc.version);
      
      console.log('📊 Current version:', currentVersion);

      const versions = [];
      
      // Fetch all versions from newest to oldest
      for (let i = currentVersion; i >= 1; i--) {
        try {
          const versionData = await contract.getDocumentVersion(documentId, i);
          
          versions.push({
            versionNumber: i,
            ipfsHash: versionData,
            updatedBy: doc.owner, // V2 doesn't track per-version updater
            date: new Date().toISOString(), // V2 doesn't track per-version timestamp
            fileName: doc.fileName,
            fileSize: Number(doc.fileSize),
            changeLog: i === currentVersion ? 'Current version' : `Version ${i}`
          });
        } catch (error) {
          console.error(`Error fetching version ${i}:`, error);
        }
      }

      console.log(`✅ Fetched ${versions.length} versions`);
      
      return {
        success: true,
        versions
      };
    } catch (error) {
      console.error('❌ Error fetching version history:', error);
      return {
        success: false,
        error: error.message,
        versions: []
      };
    }
  }
}

// Export singleton instance
const blockchainServiceV2 = new BlockchainServiceV2();
export default blockchainServiceV2;
