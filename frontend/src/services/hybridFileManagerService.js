/**
 * Hybrid File Manager Service
 * Combines database storage for folders/metadata with blockchain storage for files
 */

import axios from 'axios';
import blockchainService from './blockchainSimpleService.js';
import pinataService from './pinataService.js';

class HybridFileManagerService {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5000'; // Updated to match backend port
    this.isInitialized = false;
    this.userAccount = null;
    this.authToken = null;
  }

  /**
   * Initialize the service with auth token
   */
  async initialize(authToken) {
    console.log('🔧 Service initialization starting...');
    try {
      this.authToken = authToken;
      
      // NOTE: Blockchain service initialization is now handled globally by WalletProvider
      // We only need to initialize it here if it's not already done AND wallet is connected
      if (!blockchainService.isInitialized && typeof window.ethereum !== 'undefined') {
        console.log('🔗 Blockchain service not initialized, attempting initialization...');
        try {
          const blockchainResult = await blockchainService.initialize();
          if (blockchainResult.success) {
            console.log('✅ Blockchain service initialized successfully');
          }
        } catch (blockchainError) {
          console.warn('⚠️ Blockchain initialization failed (will work without blockchain features):', blockchainError.message);
          // Don't fail the entire service - file manager can work with database only
        }
      } else if (!blockchainService.isInitialized) {
        console.log('ℹ️ Blockchain service will be initialized when wallet connects');
      }
      
      // Set default axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('🔑 Authorization header set');
      
      // Get user info to verify connection
      console.log('📞 Calling profile endpoint:', `${this.apiBaseUrl}/api/users/profile`);
      const response = await axios.get(`${this.apiBaseUrl}/api/users/profile`);
      console.log('📨 Profile response:', response.data);
      
      if (response.data.success) {
        this.isInitialized = true;
        this.userAccount = response.data.user.walletAddress;
        console.log('✅ Hybrid File Manager Service initialized');
        console.log('👤 User account:', this.userAccount);
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('💥 Failed to initialize Hybrid File Manager Service:', error);
      console.error('🔍 Error details:', error.response?.data);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new folder (stored in database)
   */
  async createFolder(folderName, parentPath = '/', parentFolderId = null) {
    try {
      if (!this.isInitialized) {
        return { success: false, error: 'Service not initialized' };
      }

      const response = await axios.post(`${this.apiBaseUrl}/api/folders/`, {
        name: folderName,
        parent_id: parentFolderId,
        description: `Created on ${new Date().toLocaleString()}`
      });

      if (response.data.success) {
        return {
          success: true,
          folder: response.data.folder,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Create file entry in database ONLY (blockchain upload handled separately)
   */
  async createFile(file, metadata = {}) {
    try {
      if (!this.isInitialized) {
        return { success: false, error: 'Service not initialized' };
      }

      // Store metadata in database WITHOUT blockchain upload
      // (Blockchain upload is now handled externally in FileManagerNew)
      const uploadData = {
        ipfs_hash: null, // Will be updated later after IPFS/blockchain upload
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        folder_id: metadata.parentFolderId,
        transaction_hash: null, // Will be updated later
        block_number: null, // Will be updated later
        document_id: null // Will be updated later
      };
      
      console.log('📤 Creating document in database (without blockchain):', uploadData);
      console.log('📤 folder_id being sent:', metadata.parentFolderId, typeof metadata.parentFolderId);
      
      const dbResult = await axios.post(`${this.apiBaseUrl}/api/documents/upload`, uploadData);

      if (dbResult.data.success) {
        return {
          success: true,
          document: dbResult.data.document,
          transaction: dbResult.data.transaction,
          message: dbResult.data.message
        };
      } else {
        throw new Error(dbResult.data.error);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Upload file to blockchain and IPFS
   */
  async uploadFileToBlockchain(file) {
    try {
      // Upload to IPFS first
      const ipfsResult = await this.uploadToIPFS(file);
      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      // Then store metadata on blockchain
      const fileData = {
        fileName: file.name,
        fileType: file.type || this.getFileType(file.name),
        fileSize: file.size,
        ipfsHash: ipfsResult.ipfsHash,
        parentFolderId: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };

      // Use the correct blockchain service
      if (!blockchainService.isInitialized) {
        console.log('🔗 Blockchain not initialized, attempting to initialize...');
        const initResult = await blockchainService.initialize();
        if (!initResult.success) {
          throw new Error(`Blockchain initialization failed: ${initResult.error}`);
        }
      }

      const blockchainResult = await blockchainService.uploadDocument(
        fileData.fileName,
        fileData.ipfsHash,
        0, // folderId
        fileData.fileSize,
        fileData.fileType
      );
      
      if (!blockchainResult.success) {
        throw new Error(`Blockchain storage failed: ${blockchainResult.error}`);
      }

      return {
        success: true,
        ipfsHash: ipfsResult.ipfsHash,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        documentId: blockchainResult.documentId
      };
    } catch (error) {
      console.error('Blockchain upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload file to IPFS using Pinata service
   */
  async uploadToIPFS(file) {
    try {
      console.log('📤 Uploading to IPFS via Pinata service...');
      
      const metadata = {
        name: file.name,
        uploadedBy: this.userAccount || 'unknown',
        uploadDate: new Date().toISOString(),
        fileSize: file.size.toString(),
        project: 'DocuChain'
      };

      const result = await pinataService.uploadFile(file, metadata);
      
      if (result.success) {
        console.log('✅ IPFS upload successful:', result.ipfsHash);
        return {
          success: true,
          ipfsHash: result.ipfsHash,
          ipfsUrl: result.url
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      return { 
        success: false, 
        error: error.message || 'IPFS upload failed'
      };
    }
  }

  /**
   * Load file system from database
   */
  async loadFileSystem() {
    try {
      if (!this.isInitialized) {
        return { success: false, error: 'Service not initialized' };
      }

      const response = await axios.get(`${this.apiBaseUrl}/api/filesystem`);
      
      if (response.data.success) {
        return {
          success: true,
          folders: response.data.folders,
          documents: response.data.documents
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error loading file system:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Get folders for a specific parent
   */
  async getFolders(parentId = null) {
    try {
      const params = parentId ? { parent_id: parentId } : {};
      const response = await axios.get(`${this.apiBaseUrl}/api/folders/`, { params });
      
      if (response.data.success) {
        return {
          success: true,
          folders: response.data.folders
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error getting folders:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Get documents for a specific folder
   */
  async getDocuments(folderId = null, getAll = false) {
    try {
      console.log('📄 getDocuments called with folderId:', folderId, 'getAll:', getAll);
      
      const params = {};
      if (getAll) {
        params.all = 'true';  // Get ALL documents from all folders
      } else if (folderId) {
        params.folder_id = folderId;
      }
      
      console.log('📄 Making request to /api/documents/ with params:', params);
      
      const response = await axios.get(`${this.apiBaseUrl}/api/documents/`, { params });
      
      console.log('📄 Backend response:', response.data);
      
      if (response.data.success) {
        console.log('📄 Documents found:', response.data.documents.length);
        return {
          success: true,
          documents: response.data.documents
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Error getting documents:', error);
      console.error('❌ Response data:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Get blockchain transactions
   */
  async getBlockchainTransactions() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/blockchain/transactions`);
      
      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.transactions
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error getting blockchain transactions:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  /**
   * Get file type from filename
   */
  getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const types = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'avi': 'video/avi'
    };
    return types[extension] || 'application/octet-stream';
  }
}

// Create singleton instance
const hybridFileManagerService = new HybridFileManagerService();

export { hybridFileManagerService, HybridFileManagerService };
export default hybridFileManagerService;