import Web3 from 'web3';

// Load configuration
import blockchainConfig from '../config/blockchain-config.json';

// Get contract configuration from config file
const CONTRACT_ADDRESS = blockchainConfig.blockchain.contracts.EnhancedDocumentManager.address;
const NETWORK_ID = blockchainConfig.blockchain.chainId;
const NETWORK_NAME = blockchainConfig.blockchain.network;
const RPC_URL = blockchainConfig.blockchain.rpcUrl;

// Validate contract address
const isValidAddress = (address) => {
  return address && address !== "0x0000000000000000000000000000000000000000" && address.length === 42;
};

const validateConfiguration = () => {
  if (!isValidAddress(CONTRACT_ADDRESS)) {
    console.warn('⚠️ Contract address not configured. Please deploy the smart contract and update blockchain-config.json');
    return false;
  }
  return true;
};

// Enhanced Document Manager Contract ABI
const ENHANCED_CONTRACT_ABI = [
  // Core file operations
  {
    "inputs": [
      {"internalType": "string", "name": "_fileName", "type": "string"},
      {"internalType": "string", "name": "_filePath", "type": "string"},
      {"internalType": "string", "name": "_fileType", "type": "string"},
      {"internalType": "uint256", "name": "_fileSize", "type": "uint256"},
      {"internalType": "string", "name": "_ipfsHash", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "string[]", "name": "_tags", "type": "string[]"},
      {"internalType": "bytes32", "name": "_parentFolderId", "type": "bytes32"}
    ],
    "name": "uploadFile",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_folderName", "type": "string"},
      {"internalType": "string", "name": "_folderPath", "type": "string"},
      {"internalType": "bytes32", "name": "_parentFolderId", "type": "bytes32"}
    ],
    "name": "createFolder",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_fileId", "type": "bytes32"},
      {"internalType": "string", "name": "_newIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_newFileSize", "type": "uint256"},
      {"internalType": "string", "name": "_changeDescription", "type": "string"}
    ],
    "name": "updateFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_fileId", "type": "bytes32"},
      {"internalType": "string", "name": "_newName", "type": "string"}
    ],
    "name": "renameFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_fileId", "type": "bytes32"},
      {"internalType": "address", "name": "_shareWith", "type": "address"},
      {
        "components": [
          {"internalType": "bool", "name": "canRead", "type": "bool"},
          {"internalType": "bool", "name": "canWrite", "type": "bool"},
          {"internalType": "bool", "name": "canExecute", "type": "bool"},
          {"internalType": "bool", "name": "canDelete", "type": "bool"},
          {"internalType": "bool", "name": "canShare", "type": "bool"}
        ],
        "internalType": "struct EnhancedDocumentManager.FilePermissions",
        "name": "_permissions",
        "type": "tuple"
      }
    ],
    "name": "shareFile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions
  {
    "inputs": [{"internalType": "bytes32", "name": "_fileId", "type": "bytes32"}],
    "name": "getFile",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "fileName", "type": "string"},
          {"internalType": "string", "name": "filePath", "type": "string"},
          {"internalType": "string", "name": "fileType", "type": "string"},
          {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
          {"internalType": "string", "name": "ipfsHash", "type": "string"},
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "lastModified", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "bool", "name": "isFolder", "type": "bool"},
          {"internalType": "uint256", "name": "currentVersion", "type": "uint256"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "string[]", "name": "tags", "type": "string[]"}
        ],
        "internalType": "struct EnhancedDocumentManager.FileMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_fileId", "type": "bytes32"}],
    "name": "getFileVersions",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "versionNumber", "type": "uint256"},
          {"internalType": "string", "name": "ipfsHash", "type": "string"},
          {"internalType": "address", "name": "modifiedBy", "type": "address"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "string", "name": "changeDescription", "type": "string"},
          {"internalType": "uint256", "name": "fileSize", "type": "uint256"}
        ],
        "internalType": "struct EnhancedDocumentManager.FileVersion[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_folderId", "type": "bytes32"}],
    "name": "getFolderContents",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserFiles",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserFolders",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_fileId", "type": "bytes32"}],
    "name": "getFileHistory",
    "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3;
let contract;
let userAccount;

// Initialize Web3 and MetaMask connection
export const initializeEnhancedMetaMask = async () => {
  try {
    // First validate configuration
    if (!validateConfiguration()) {
      return { 
        success: false, 
        error: 'Contract not deployed. Please deploy the smart contract first.',
        needsDeployment: true
      };
    }

    if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAccount = accounts[0];
      
      // Check if we're on the correct network
      const networkId = await web3.eth.net.getId();
      if (networkId !== NETWORK_ID) {
        await switchToSepoliaNetwork();
      }
      
      // Initialize contract only if address is valid
      if (isValidAddress(CONTRACT_ADDRESS)) {
        contract = new web3.eth.Contract(ENHANCED_CONTRACT_ABI, CONTRACT_ADDRESS);
      }
      
      console.log('Enhanced MetaMask initialized successfully');
      console.log('Connected account:', userAccount);
      console.log('Contract address:', CONTRACT_ADDRESS);
      
      return { success: true, account: userAccount, contractDeployed: isValidAddress(CONTRACT_ADDRESS) };
    } else {
      throw new Error('MetaMask not found');
    }
  } catch (error) {
    console.error('Error initializing Enhanced MetaMask:', error);
    return { success: false, error: error.message };
  }
};

// Switch to Sepolia network
export const switchToSepoliaNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORK_ID.toString(16)}` }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      // Network doesn't exist, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${NETWORK_ID.toString(16)}`,
          chainName: NETWORK_NAME,
          rpcUrls: [RPC_URL],
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
        }],
      });
    } else {
      throw switchError;
    }
  }
};

// Connect wallet
export const connectEnhancedWallet = async () => {
  try {
    const result = await initializeEnhancedMetaMask();
    return result;
  } catch (error) {
    console.error('Error connecting enhanced wallet:', error);
    return { success: false, error: error.message };
  }
};

// File upload to blockchain
export const uploadFileToBlockchain = async (fileData) => {
  try {
    if (!contract || !userAccount) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const {
      fileName,
      filePath = '/',
      fileType,
      fileSize,
      ipfsHash,
      description = '',
      tags = [],
      parentFolderId = '0x0000000000000000000000000000000000000000000000000000000000000000'
    } = fileData;

    const gasEstimate = await contract.methods.uploadFile(
      fileName,
      filePath,
      fileType,
      fileSize,
      ipfsHash,
      description,
      tags,
      parentFolderId
    ).estimateGas({ from: userAccount });

    const tx = await contract.methods.uploadFile(
      fileName,
      filePath,
      fileType,
      fileSize,
      ipfsHash,
      description,
      tags,
      parentFolderId
    ).send({ 
      from: userAccount,
      gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
    });

    console.log('File uploaded to blockchain:', tx);
    return { success: true, transaction: tx, fileId: tx.events.FileUploaded.returnValues.fileId };
  } catch (error) {
    console.error('Error uploading file to blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Create folder on blockchain
export const createFolderOnBlockchain = async (folderData) => {
  try {
    if (!validateConfiguration()) {
      console.warn('Contract not deployed, folder creation disabled');
      return { success: false, error: 'Smart contract not deployed. Please deploy the contract first.', needsDeployment: true };
    }

    if (!contract || !userAccount) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const {
      folderName,
      folderPath = '/',
      parentFolderId = '0x0000000000000000000000000000000000000000000000000000000000000000'
    } = folderData;

    const gasEstimate = await contract.methods.createFolder(
      folderName,
      folderPath,
      parentFolderId
    ).estimateGas({ from: userAccount });

    const tx = await contract.methods.createFolder(
      folderName,
      folderPath,
      parentFolderId
    ).send({ 
      from: userAccount,
      gas: Math.floor(gasEstimate * 1.2)
    });

    console.log('Folder created on blockchain:', tx);
    return { success: true, transaction: tx, folderId: tx.events.FolderCreated.returnValues.folderId };
  } catch (error) {
    console.error('Error creating folder on blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Update file on blockchain (new version)
export const updateFileOnBlockchain = async (fileId, updateData) => {
  try {
    if (!contract || !userAccount) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const { newIpfsHash, newFileSize, changeDescription } = updateData;

    const gasEstimate = await contract.methods.updateFile(
      fileId,
      newIpfsHash,
      newFileSize,
      changeDescription
    ).estimateGas({ from: userAccount });

    const tx = await contract.methods.updateFile(
      fileId,
      newIpfsHash,
      newFileSize,
      changeDescription
    ).send({ 
      from: userAccount,
      gas: Math.floor(gasEstimate * 1.2)
    });

    console.log('File updated on blockchain:', tx);
    return { success: true, transaction: tx };
  } catch (error) {
    console.error('Error updating file on blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Rename file on blockchain
export const renameFileOnBlockchain = async (fileId, newName) => {
  try {
    if (!contract || !userAccount) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    const gasEstimate = await contract.methods.renameFile(
      fileId,
      newName
    ).estimateGas({ from: userAccount });

    const tx = await contract.methods.renameFile(
      fileId,
      newName
    ).send({ 
      from: userAccount,
      gas: Math.floor(gasEstimate * 1.2)
    });

    console.log('File renamed on blockchain:', tx);
    return { success: true, transaction: tx };
  } catch (error) {
    console.error('Error renaming file on blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Share file on blockchain
export const shareFileOnBlockchain = async (fileId, shareWithAddress, permissions) => {
  try {
    if (!contract || !userAccount) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    // Convert permissions object to tuple format expected by contract
    const permissionsTuple = {
      canRead: permissions.canRead || false,
      canWrite: permissions.canWrite || false,
      canExecute: permissions.canExecute || false,
      canDelete: permissions.canDelete || false,
      canShare: permissions.canShare || false
    };

    const gasEstimate = await contract.methods.shareFile(
      fileId,
      shareWithAddress,
      permissionsTuple
    ).estimateGas({ from: userAccount });

    const tx = await contract.methods.shareFile(
      fileId,
      shareWithAddress,
      permissionsTuple
    ).send({ 
      from: userAccount,
      gas: Math.floor(gasEstimate * 1.2)
    });

    console.log('File shared on blockchain:', tx);
    return { success: true, transaction: tx };
  } catch (error) {
    console.error('Error sharing file on blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Get file metadata from blockchain
export const getFileFromBlockchain = async (fileId) => {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    const fileData = await contract.methods.getFile(fileId).call();
    return { success: true, fileData };
  } catch (error) {
    console.error('Error getting file from blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Get file versions from blockchain
export const getFileVersionsFromBlockchain = async (fileId) => {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    const versions = await contract.methods.getFileVersions(fileId).call();
    return { success: true, versions };
  } catch (error) {
    console.error('Error getting file versions from blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Get user files from blockchain
export const getUserFilesFromBlockchain = async (userAddress = null) => {
  try {
    if (!validateConfiguration()) {
      console.warn('Contract not deployed, returning empty file system');
      return { success: true, files: [], folders: [], needsDeployment: true };
    }

    if (!contract) {
      throw new Error('Contract not initialized');
    }

    const address = userAddress || userAccount;
    if (!address) {
      throw new Error('No user address provided');
    }

    const files = await contract.methods.getUserFiles(address).call();
    const folders = await contract.methods.getUserFolders(address).call();
    
    return { success: true, files, folders };
  } catch (error) {
    console.error('Error getting user files from blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Get folder contents from blockchain
export const getFolderContentsFromBlockchain = async (folderId) => {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    const contents = await contract.methods.getFolderContents(folderId).call();
    return { success: true, contents };
  } catch (error) {
    console.error('Error getting folder contents from blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Get file operation history from blockchain
export const getFileHistoryFromBlockchain = async (fileId) => {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    const history = await contract.methods.getFileHistory(fileId).call();
    return { success: true, history };
  } catch (error) {
    console.error('Error getting file history from blockchain:', error);
    return { success: false, error: error.message };
  }
};

// Utility functions
export const getCurrentAccount = () => userAccount;
export const getContract = () => contract;
export const getWeb3 = () => web3;