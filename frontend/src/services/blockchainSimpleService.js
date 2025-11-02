import { ethers } from 'ethers';

/**
 * ⚠️ LEGACY SERVICE - Use blockchainServiceV2.js for new features
 * 
 * This service uses the old DocuChainSimple contract.
 * For multi-wallet support and collaborative editing, use:
 * - blockchainServiceV2.js (DocumentManagerV2 contract at 0xb19f78B9c32dceaA01DE778Fa46784F5437DF373)
 */

// Contract configuration - using the simplified contract (Create React App uses process.env)
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0xfBb782aD097B2Daa2296EBa9FCC9DEeE2C220528";
const SEPOLIA_RPC_URL = process.env.REACT_APP_RPC_URL || "https://sepolia.infura.io/v3/edc6ea5d5f0245c3b3c10b06ffa69e18";

console.log('🔧 Blockchain Service Configuration:');
console.log('📄 Contract Address:', CONTRACT_ADDRESS);
console.log('🌐 RPC URL:', SEPOLIA_RPC_URL);
console.log('🔍 Environment check:', {
  'NODE_ENV': process.env.NODE_ENV,
  'REACT_APP_CONTRACT_ADDRESS': process.env.REACT_APP_CONTRACT_ADDRESS ? 'SET' : 'NOT SET',
  'REACT_APP_RPC_URL': process.env.REACT_APP_RPC_URL ? 'SET' : 'NOT SET'
});

// Contract ABI - simplified version without registration
const CONTRACT_ABI = [
  // Document functions
  "function uploadDocument(string memory _fileName, string memory _ipfsHash, uint256 _folderId, uint256 _fileSize, string memory _fileType) public returns (uint256)",
  "function updateDocument(uint256 _documentId, string memory _newIpfsHash, string memory _newFileName, uint256 _newFileSize, string memory _changeLog) public",
  "function shareDocument(uint256 _documentId, address _userAddress, uint8 _accessType) public",
  "function getDocument(uint256 _documentId) public view returns (tuple(uint256 id, string fileName, string ipfsHash, address owner, uint256 folderId, uint256 fileSize, string fileType, uint256 createdAt, uint256 updatedAt, uint256 currentVersion, bool isActive))",
  "function getDocumentVersion(uint256 _documentId, uint256 _version) public view returns (tuple(uint256 versionNumber, string ipfsHash, string fileName, uint256 fileSize, address updatedBy, uint256 timestamp, string changeLog))",
  "function getUserDocuments(address _userAddress) public view returns (uint256[])",
  "function getSharedDocuments(address _userAddress) public view returns (uint256[])",
  
  // Folder functions  
  "function createFolder(string memory _name, uint256 _parentId) public returns (uint256)",
  "function getUserFolders(address _userAddress) public view returns (uint256[])",
  
  // Access control
  "function hasDocumentPermission(uint256 _documentId, address _userAddress, uint8 _accessType) public view returns (bool)",
  
  // Events
  "event DocumentUploaded(uint256 indexed documentId, string fileName, address indexed owner, uint256 folderId)",
  "event DocumentUpdated(uint256 indexed documentId, uint256 newVersion, address indexed updatedBy)",
  "event DocumentShared(uint256 indexed documentId, address indexed sharedWith, uint8 accessType, address indexed sharedBy)"
];

// Global variables
let provider = null;
let signer = null;
let contract = null;

// Access types enum
const ACCESS_TYPES = {
  NONE: 0,
  READ: 1,
  WRITE: 2
};

class BlockchainService {
  constructor() {
    this.isInitialized = false;
    this.userAddress = null;
  }

  // Initialize the blockchain connection
  async initialize() {
    try {
      // Validate contract address
      if (!CONTRACT_ADDRESS) {
        console.error('❌ Contract address not properly configured');
        throw new Error('Contract address not configured. Please check your REACT_APP_CONTRACT_ADDRESS environment variable.');
      }
      
      console.log('🚀 Initializing blockchain service with contract:', CONTRACT_ADDRESS);

      if (typeof window.ethereum === 'undefined') {
        console.error('❌ MetaMask not detected');
        throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
      }

      console.log('🦊 MetaMask detected, requesting account access...');
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('👤 Accounts received:', accounts.length);
      
      // Create provider and signer
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      this.userAddress = await signer.getAddress();
      console.log('📝 Signer address:', this.userAddress);

      // Create contract instance
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      console.log('📄 Contract instance created');

      // Check if connected to Sepolia network
      const network = await provider.getNetwork();
      console.log('🌐 Current network:', network.name, 'Chain ID:', network.chainId.toString());
      
      if (network.chainId !== 11155111n) { // Sepolia chain ID
        console.log('⚠️ Not on Sepolia network, attempting to switch...');
        await this.switchToSepolia();
      }

      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');
      console.log('👤 User address:', this.userAddress);
      console.log('🌐 Network:', await provider.getNetwork());
      
      return {
        success: true,
        account: this.userAddress,
        address: this.userAddress,
        message: 'Blockchain initialized successfully'
      };
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Switch to Sepolia network
  async switchToSepolia() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
      });
    } catch (error) {
      // If the chain is not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }]
        });
      } else {
        throw error;
      }
    }
  }

  // Connect wallet
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return {
        success: true,
        account: this.userAddress, // Return 'account' to match FileManager expectation
        address: this.userAddress,
        message: 'Wallet connected successfully'
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload document to blockchain - simplified (no registration required)
  async uploadDocument(fileName, ipfsHash, folderId = 0, fileSize, fileType) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('📋 uploadDocument called with parameters:');
      console.log('  - fileName:', fileName, typeof fileName);
      console.log('  - ipfsHash:', ipfsHash, typeof ipfsHash);
      console.log('  - folderId:', folderId, typeof folderId);
      console.log('  - fileSize:', fileSize, typeof fileSize);
      console.log('  - fileType:', fileType, typeof fileType);

      // Ensure folderId is a number
      const numericFolderId = Number(folderId);
      if (isNaN(numericFolderId)) {
        throw new Error(`Invalid folderId: ${folderId} (type: ${typeof folderId}). Must be a number.`);
      }

      console.log('📋 Converting to numeric folderId:', numericFolderId);

      // Upload document to smart contract
      const tx = await contract.uploadDocument(
        fileName,
        ipfsHash,
        numericFolderId,
        fileSize,
        fileType
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract document ID from event logs
      const documentUploadedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog.name === 'DocumentUploaded';
        } catch (error) {
          return false;
        }
      });

      let documentId = null;
      if (documentUploadedEvent) {
        const parsedLog = contract.interface.parseLog(documentUploadedEvent);
        documentId = parsedLog.args.documentId.toString();
      }

      return {
        success: true,
        documentId: documentId,
        transactionHash: tx.hash,
        message: 'Document uploaded to blockchain successfully'
      };

    } catch (error) {
      console.error('Error uploading document to blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update existing document with new version
  async updateDocument(documentId, newIpfsHash, newFileName, newFileSize, changeLog = 'File updated') {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('📋 updateDocument called with parameters:');
      console.log('  - documentId:', documentId, typeof documentId);
      console.log('  - newIpfsHash:', newIpfsHash);
      console.log('  - newFileName:', newFileName);
      console.log('  - newFileSize:', newFileSize);
      console.log('  - changeLog:', changeLog);

      // Ensure documentId is a number
      const numericDocumentId = Number(documentId);
      if (isNaN(numericDocumentId)) {
        throw new Error(`Invalid documentId: ${documentId} (type: ${typeof documentId}). Must be a number.`);
      }

      // Update document on smart contract
      const tx = await contract.updateDocument(
        numericDocumentId,
        newIpfsHash,
        newFileName,
        newFileSize,
        changeLog
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Document updated on blockchain successfully'
      };

    } catch (error) {
      console.error('Error updating document on blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get document version history
  async getDocumentVersionHistory(documentId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      console.log('📋 Getting version history for document:', documentId);

      // First, get the document to find current version count
      const document = await contract.getDocument(documentId);
      const currentVersion = Number(document.currentVersion);
      
      console.log('📋 Document has', currentVersion, 'versions');

      // Fetch all versions
      const versions = [];
      for (let i = currentVersion; i >= 1; i--) {
        try {
          const version = await contract.getDocumentVersion(documentId, i);
          versions.push({
            versionNumber: Number(version.versionNumber),
            ipfsHash: version.ipfsHash,
            fileName: version.fileName,
            fileSize: Number(version.fileSize),
            updatedBy: version.updatedBy,
            timestamp: Number(version.timestamp),
            changeLog: version.changeLog,
            date: new Date(Number(version.timestamp) * 1000).toLocaleString()
          });
        } catch (versionError) {
          console.warn(`⚠️ Could not fetch version ${i}:`, versionError.message);
        }
      }

      console.log('✅ Fetched', versions.length, 'versions');

      return {
        success: true,
        versions: versions,
        currentVersion: currentVersion
      };

    } catch (error) {
      console.error('Error getting version history:', error);
      return {
        success: false,
        error: error.message,
        versions: []
      };
    }
  }

  // Get specific document version
  async getDocumentVersion(documentId, versionNumber) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const version = await contract.getDocumentVersion(documentId, versionNumber);

      return {
        success: true,
        version: {
          versionNumber: Number(version.versionNumber),
          ipfsHash: version.ipfsHash,
          fileName: version.fileName,
          fileSize: Number(version.fileSize),
          updatedBy: version.updatedBy,
          timestamp: Number(version.timestamp),
          changeLog: version.changeLog
        }
      };

    } catch (error) {
      console.error('Error getting document version:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Share document with another user
  async shareDocument(documentId, userAddress, accessType = ACCESS_TYPES.READ) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await contract.shareDocument(documentId, userAddress, accessType);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Document shared successfully'
      };
    } catch (error) {
      console.error('Error sharing document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create folder
  async createFolder(name, parentId = 0) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await contract.createFolder(name, parentId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        message: 'Folder created successfully'
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's documents
  async getUserDocuments(userAddress = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const address = userAddress || this.userAddress;
      const documentIds = await contract.getUserDocuments(address);
      
      const documents = [];
      for (const id of documentIds) {
        try {
          const doc = await contract.getDocument(id);
          documents.push({
            id: doc.id.toString(),
            fileName: doc.fileName,
            ipfsHash: doc.ipfsHash,
            owner: doc.owner,
            folderId: doc.folderId.toString(),
            fileSize: doc.fileSize.toString(),
            fileType: doc.fileType,
            createdAt: new Date(Number(doc.createdAt) * 1000),
            updatedAt: new Date(Number(doc.updatedAt) * 1000),
            currentVersion: doc.currentVersion.toString(),
            isActive: doc.isActive
          });
        } catch (error) {
          console.error(`Error fetching document ${id}:`, error);
        }
      }

      return {
        success: true,
        documents: documents
      };
    } catch (error) {
      console.error('Error getting user documents:', error);
      return {
        success: false,
        error: error.message,
        documents: []
      };
    }
  }

  // Get shared documents
  async getSharedDocuments(userAddress = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const address = userAddress || this.userAddress;
      const documentIds = await contract.getSharedDocuments(address);
      
      const documents = [];
      for (const id of documentIds) {
        try {
          const doc = await contract.getDocument(id);
          documents.push({
            id: doc.id.toString(),
            fileName: doc.fileName,
            ipfsHash: doc.ipfsHash,
            owner: doc.owner,
            folderId: doc.folderId.toString(),
            fileSize: doc.fileSize.toString(),
            fileType: doc.fileType,
            createdAt: new Date(Number(doc.createdAt) * 1000),
            updatedAt: new Date(Number(doc.updatedAt) * 1000),
            currentVersion: doc.currentVersion.toString(),
            isActive: doc.isActive
          });
        } catch (error) {
          console.error(`Error fetching shared document ${id}:`, error);
        }
      }

      return {
        success: true,
        documents: documents
      };
    } catch (error) {
      console.error('Error getting shared documents:', error);
      return {
        success: false,
        error: error.message,
        documents: []
      };
    }
  }

  // Get user's folders
  async getUserFolders(userAddress = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const address = userAddress || this.userAddress;
      const folderIds = await contract.getUserFolders(address);
      
      return {
        success: true,
        folderIds: folderIds.map(id => id.toString())
      };
    } catch (error) {
      console.error('Error getting user folders:', error);
      return {
        success: false,
        error: error.message,
        folderIds: []
      };
    }
  }

  // Check if user has permission for document
  async hasDocumentPermission(documentId, userAddress = null, accessType = ACCESS_TYPES.READ) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const address = userAddress || this.userAddress;
      const hasPermission = await contract.hasDocumentPermission(documentId, address, accessType);
      
      return {
        success: true,
        hasPermission: hasPermission
      };
    } catch (error) {
      console.error('Error checking document permission:', error);
      return {
        success: false,
        hasPermission: false,
        error: error.message
      };
    }
  }

  // Get wallet address
  getWalletAddress() {
    return this.userAddress;
  }

  // Check if initialized
  isReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
export { ACCESS_TYPES };