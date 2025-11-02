import { 
  uploadFileToBlockchain, 
  createFolderOnBlockchain,
  updateFileOnBlockchain,
  renameFileOnBlockchain,
  shareFileOnBlockchain,
  getFileFromBlockchain,
  getFileVersionsFromBlockchain,
  getUserFilesFromBlockchain,
  getFolderContentsFromBlockchain,
  getFileHistoryFromBlockchain,
  initializeEnhancedMetaMask,
  getCurrentAccount
} from '../utils/enhancedMetamask';

// Load configuration
import blockchainConfig from '../config/blockchain-config.json';

class EnhancedFileManagerService {
  constructor() {
    this.isInitialized = false;
    this.userAccount = null;
    this.config = blockchainConfig;
  }

  // Initialize the service
  async initialize() {
    try {
      const result = await initializeEnhancedMetaMask();
      if (result.success) {
        this.isInitialized = true;
        this.userAccount = result.account;
        console.log('Enhanced File Manager Service initialized');
        return { success: true };
      } else if (result.needsDeployment) {
        // Contract not deployed but MetaMask connected
        this.isInitialized = false;
        this.userAccount = result.account || null;
        console.log('MetaMask connected but contract not deployed');
        return { success: true, needsDeployment: true, account: result.account };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize Enhanced File Manager Service:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload file to IPFS
  async uploadToIPFS(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedBy: this.userAccount,
          timestamp: new Date().toISOString(),
          fileSize: file.size.toString(),
          fileType: file.type
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.config.ipfs.pinata.apiKey,
          'pinata_secret_api_key': this.config.ipfs.pinata.secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('File uploaded to IPFS:', result);
      return { success: true, ipfsHash: result.IpfsHash, size: result.PinSize };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new file (upload to IPFS + store metadata on blockchain)
  async createFile(file, metadata = {}) {
    try {
      if (!this.userAccount) {
        return { success: false, error: 'No wallet connected' };
      }

      // Check if contract is deployed
      if (!this.isInitialized) {
        return { 
          success: false, 
          needsDeployment: true, 
          error: 'Smart contract not deployed. Please deploy the contract first.' 
        };
      }

      // Step 1: Upload file to IPFS
      const ipfsResult = await this.uploadToIPFS(file);
      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      // Step 2: Prepare file metadata
      const fileData = {
        fileName: file.name,
        filePath: metadata.filePath || '/',
        fileType: file.type || this.getFileType(file.name),
        fileSize: file.size,
        ipfsHash: ipfsResult.ipfsHash,
        description: metadata.description || '',
        tags: metadata.tags || [],
        parentFolderId: metadata.parentFolderId || '0x0000000000000000000000000000000000000000000000000000000000000000'
      };

      // Step 3: Store metadata on blockchain
      const blockchainResult = await uploadFileToBlockchain(fileData);
      if (!blockchainResult.success) {
        if (blockchainResult.needsDeployment) {
          return { success: false, needsDeployment: true, error: blockchainResult.error };
        }
        throw new Error(`Blockchain upload failed: ${blockchainResult.error}`);
      }

      return {
        success: true,
        fileId: blockchainResult.fileId,
        ipfsHash: ipfsResult.ipfsHash,
        transaction: blockchainResult.transaction,
        metadata: fileData
      };
    } catch (error) {
      console.error('Error creating file:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new folder
  async createFolder(folderName, parentPath = '/', parentFolderId = null) {
    try {
      if (!this.userAccount) {
        return { success: false, error: 'No wallet connected' };
      }

      // Check if contract is deployed
      if (!this.isInitialized) {
        return { 
          success: false, 
          needsDeployment: true, 
          error: 'Smart contract not deployed. Please deploy the contract first.' 
        };
      }

      const folderData = {
        folderName,
        folderPath: parentPath,
        parentFolderId: parentFolderId || '0x0000000000000000000000000000000000000000000000000000000000000000'
      };

      const result = await createFolderOnBlockchain(folderData);
      if (!result.success) {
        if (result.needsDeployment) {
          return { success: false, needsDeployment: true, error: result.error };
        }
        throw new Error(`Folder creation failed: ${result.error}`);
      }

      return {
        success: true,
        folderId: result.folderId,
        transaction: result.transaction,
        metadata: folderData
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing file (creates new version)
  async updateFile(fileId, newFile, changeDescription = 'File updated') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Step 1: Upload new version to IPFS
      const ipfsResult = await this.uploadToIPFS(newFile);
      if (!ipfsResult.success) {
        throw new Error(`IPFS upload failed: ${ipfsResult.error}`);
      }

      // Step 2: Update blockchain with new version
      const updateData = {
        newIpfsHash: ipfsResult.ipfsHash,
        newFileSize: newFile.size,
        changeDescription
      };

      const blockchainResult = await updateFileOnBlockchain(fileId, updateData);
      if (!blockchainResult.success) {
        throw new Error(`Blockchain update failed: ${blockchainResult.error}`);
      }

      return {
        success: true,
        transaction: blockchainResult.transaction,
        newIpfsHash: ipfsResult.ipfsHash,
        newVersion: 'Retrieved from blockchain event' // Will be in transaction events
      };
    } catch (error) {
      console.error('Error updating file:', error);
      return { success: false, error: error.message };
    }
  }

  // Rename a file or folder
  async renameFile(fileId, newName) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const result = await renameFileOnBlockchain(fileId, newName);
      if (!result.success) {
        throw new Error(`Rename failed: ${result.error}`);
      }

      return {
        success: true,
        transaction: result.transaction
      };
    } catch (error) {
      console.error('Error renaming file:', error);
      return { success: false, error: error.message };
    }
  }

  // Share a file with specific permissions
  async shareFile(fileId, shareWithAddress, permissions) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Default permissions if not specified
      const defaultPermissions = {
        canRead: true,
        canWrite: false,
        canExecute: false,
        canDelete: false,
        canShare: false,
        ...permissions
      };

      const result = await shareFileOnBlockchain(fileId, shareWithAddress, defaultPermissions);
      if (!result.success) {
        throw new Error(`Share failed: ${result.error}`);
      }

      return {
        success: true,
        transaction: result.transaction,
        permissions: defaultPermissions
      };
    } catch (error) {
      console.error('Error sharing file:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file metadata and details
  async getFile(fileId) {
    try {
      const result = await getFileFromBlockchain(fileId);
      if (!result.success) {
        throw new Error(`Failed to get file: ${result.error}`);
      }

      // Format the file data for easier use
      const fileData = result.fileData;
      return {
        success: true,
        file: {
          id: fileId,
          name: fileData.fileName,
          path: fileData.filePath,
          type: fileData.fileType,
          size: parseInt(fileData.fileSize),
          ipfsHash: fileData.ipfsHash,
          owner: fileData.owner,
          createdAt: new Date(parseInt(fileData.createdAt) * 1000),
          lastModified: new Date(parseInt(fileData.lastModified) * 1000),
          isActive: fileData.isActive,
          isFolder: fileData.isFolder,
          currentVersion: parseInt(fileData.currentVersion),
          description: fileData.description,
          tags: fileData.tags,
          downloadUrl: `${this.config.ipfs.pinata.gateway}${fileData.ipfsHash}`
        }
      };
    } catch (error) {
      console.error('Error getting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file version history
  async getFileVersions(fileId) {
    try {
      const result = await getFileVersionsFromBlockchain(fileId);
      if (!result.success) {
        throw new Error(`Failed to get file versions: ${result.error}`);
      }

      // Format version data
      const versions = result.versions.map(version => ({
        versionNumber: parseInt(version.versionNumber),
        ipfsHash: version.ipfsHash,
        modifiedBy: version.modifiedBy,
        timestamp: new Date(parseInt(version.timestamp) * 1000),
        changeDescription: version.changeDescription,
        fileSize: parseInt(version.fileSize),
        downloadUrl: `${this.config.ipfs.pinata.gateway}${version.ipfsHash}`
      }));

      return {
        success: true,
        versions: versions.sort((a, b) => b.versionNumber - a.versionNumber) // Latest first
      };
    } catch (error) {
      console.error('Error getting file versions:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's files and folders
  async getUserFiles(userAddress = null) {
    try {
      const result = await getUserFilesFromBlockchain(userAddress);
      if (!result.success) {
        throw new Error(`Failed to get user files: ${result.error}`);
      }

      return {
        success: true,
        fileIds: result.files,
        folderIds: result.folders
      };
    } catch (error) {
      console.error('Error getting user files:', error);
      return { success: false, error: error.message };
    }
  }

  // Get folder contents
  async getFolderContents(folderId) {
    try {
      const result = await getFolderContentsFromBlockchain(folderId);
      if (!result.success) {
        throw new Error(`Failed to get folder contents: ${result.error}`);
      }

      return {
        success: true,
        contents: result.contents
      };
    } catch (error) {
      console.error('Error getting folder contents:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file operation history
  async getFileHistory(fileId) {
    try {
      const result = await getFileHistoryFromBlockchain(fileId);
      if (!result.success) {
        throw new Error(`Failed to get file history: ${result.error}`);
      }

      return {
        success: true,
        history: result.history
      };
    } catch (error) {
      console.error('Error getting file history:', error);
      return { success: false, error: error.message };
    }
  }

  // Load complete file system structure for user
  async loadFileSystem() {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Get user's files and folders
      const userFilesResult = await this.getUserFiles();
      if (!userFilesResult.success) {
        throw new Error(`Failed to load file system: ${userFilesResult.error}`);
      }

      // Load detailed metadata for each file and folder
      const files = [];
      const folders = [];

      // Load files
      for (const fileId of userFilesResult.fileIds) {
        const fileResult = await this.getFile(fileId);
        if (fileResult.success) {
          files.push(fileResult.file);
        }
      }

      // Load folders
      for (const folderId of userFilesResult.folderIds) {
        const folderResult = await this.getFile(folderId);
        if (folderResult.success) {
          folders.push(folderResult.file);
        }
      }

      return {
        success: true,
        fileSystem: {
          files,
          folders,
          totalFiles: files.length,
          totalFolders: folders.length
        }
      };
    } catch (error) {
      console.error('Error loading file system:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to determine file type
  getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const typeMap = {
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      // Videos
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/mov',
      // Others
      'zip': 'application/zip',
      'json': 'application/json'
    };
    return typeMap[extension] || 'application/octet-stream';
  }

  // Get current user account
  getCurrentUser() {
    return this.userAccount;
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && this.userAccount;
  }
}

// Export singleton instance
export const fileManagerService = new EnhancedFileManagerService();
export default fileManagerService;