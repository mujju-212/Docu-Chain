import Web3 from 'web3';
import { ethers } from 'ethers';

// Contract ABI (will be updated when you provide the deployed contract address)
const CONTRACT_ABI = [
    // User Management
    {
        "inputs": [
            {"name": "_username", "type": "string"},
            {"name": "_email", "type": "string"},
            {"name": "_userType", "type": "uint8"},
            {"name": "_institutionId", "type": "string"}
        ],
        "name": "registerUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "_userAddress", "type": "address"}],
        "name": "connectWithUser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Document Management
    {
        "inputs": [
            {"name": "_fileName", "type": "string"},
            {"name": "_ipfsHash", "type": "string"},
            {"name": "_folderId", "type": "uint256"},
            {"name": "_fileSize", "type": "uint256"},
            {"name": "_fileType", "type": "string"}
        ],
        "name": "uploadDocument",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_documentId", "type": "uint256"},
            {"name": "_newIpfsHash", "type": "string"},
            {"name": "_newFileName", "type": "string"},
            {"name": "_newFileSize", "type": "uint256"},
            {"name": "_changeLog", "type": "string"}
        ],
        "name": "updateDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_documentId", "type": "uint256"},
            {"name": "_userAddress", "type": "address"},
            {"name": "_accessType", "type": "uint8"}
        ],
        "name": "shareDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Folder Management
    {
        "inputs": [
            {"name": "_name", "type": "string"},
            {"name": "_parentId", "type": "uint256"}
        ],
        "name": "createFolder",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // View Functions
    {
        "inputs": [{"name": "_documentId", "type": "uint256"}],
        "name": "getDocument",
        "outputs": [{
            "components": [
                {"name": "id", "type": "uint256"},
                {"name": "fileName", "type": "string"},
                {"name": "ipfsHash", "type": "string"},
                {"name": "owner", "type": "address"},
                {"name": "folderId", "type": "uint256"},
                {"name": "fileSize", "type": "uint256"},
                {"name": "fileType", "type": "string"},
                {"name": "createdAt", "type": "uint256"},
                {"name": "updatedAt", "type": "uint256"},
                {"name": "currentVersion", "type": "uint256"},
                {"name": "isActive", "type": "bool"}
            ],
            "name": "",
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_userAddress", "type": "address"}],
        "name": "getUserDocuments",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "_userAddress", "type": "address"}],
        "name": "getUserConnections",
        "outputs": [{"name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
];

class BlockchainService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        this.userAccount = null;
        this.isInitialized = false;
        
        this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0xA89623a9576aD802D5b798975dCEA4a6DB643B01";
        this.rpcUrl = process.env.REACT_APP_RPC_URL;
        this.chainId = parseInt(process.env.REACT_APP_CHAIN_ID);
        this.institutionName = process.env.REACT_APP_INSTITUTION_NAME;
        this.institutionId = process.env.REACT_APP_INSTITUTION_ID;
    }

    async initialize() {
        try {
            if (window.ethereum) {
                this.web3 = new Web3(window.ethereum);
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                this.userAccount = await this.signer.getAddress();
                
                if (this.contractAddress) {
                    this.contract = new ethers.Contract(
                        this.contractAddress,
                        CONTRACT_ABI,
                        this.signer
                    );
                }
                
                this.isInitialized = true;
                return { success: true, account: this.userAccount };
            } else {
                throw new Error('MetaMask not installed');
            }
        } catch (error) {
            console.error('Blockchain initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts available');
            }

            this.userAccount = accounts[0];
            await this.switchToCorrectNetwork();
            await this.initialize();

            return {
                success: true,
                account: this.userAccount
            };
        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async switchToCorrectNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.chainId.toString(16)}` }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${this.chainId.toString(16)}`,
                        chainName: process.env.REACT_APP_CHAIN_NAME,
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [this.rpcUrl],
                        blockExplorerUrls: [process.env.REACT_APP_BLOCK_EXPLORER]
                    }]
                });
            }
        }
    }

    // User Management
    async registerUser(username, email, userType) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const tx = await this.contract.registerUser(
                username,
                email,
                userType, // 0: STUDENT, 1: FACULTY, 2: ADMIN
                this.institutionId
            );

            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('User registration error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async connectWithUser(userAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const tx = await this.contract.connectWithUser(userAddress);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('User connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Document Management - simplified without registration requirement
    async uploadDocument(fileName, ipfsHash, folderId, fileSize, fileType, username, email) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // For now, just store document without user registration requirement
            // You can modify the contract to not require registration
            const tx = await this.contract.uploadDocument(
                fileName,
                ipfsHash,
                folderId || 0,
                fileSize,
                fileType
            );

            const receipt = await tx.wait();
            
            // Extract document ID from events
            const event = receipt.logs.find(log => 
                log.topics[0] === this.web3.utils.keccak256('DocumentUploaded(uint256,string,address,uint256)')
            );
            
            const documentId = event ? parseInt(event.topics[1], 16) : null;

            return {
                success: true,
                documentId,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Document upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateDocument(documentId, newIpfsHash, newFileName, newFileSize, changeLog) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const tx = await this.contract.updateDocument(
                documentId,
                newIpfsHash,
                newFileName,
                newFileSize,
                changeLog
            );

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Document update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async shareDocument(documentId, userAddress, accessType) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // accessType: 1 = READ, 2 = WRITE
            const tx = await this.contract.shareDocument(
                documentId,
                userAddress,
                accessType
            );

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Document sharing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Folder Management
    async createFolder(name, parentId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const tx = await this.contract.createFolder(name, parentId || 0);
            const receipt = await tx.wait();

            // Extract folder ID from events
            const event = receipt.logs.find(log => 
                log.topics[0] === this.web3.utils.keccak256('FolderCreated(uint256,string,address,uint256)')
            );
            
            const folderId = event ? parseInt(event.topics[1], 16) : null;

            return {
                success: true,
                folderId,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Folder creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // View Functions
    async getDocument(documentId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const document = await this.contract.getDocument(documentId);
            return {
                success: true,
                document: {
                    id: Number(document.id),
                    fileName: document.fileName,
                    ipfsHash: document.ipfsHash,
                    owner: document.owner,
                    folderId: Number(document.folderId),
                    fileSize: Number(document.fileSize),
                    fileType: document.fileType,
                    createdAt: Number(document.createdAt),
                    updatedAt: Number(document.updatedAt),
                    currentVersion: Number(document.currentVersion),
                    isActive: document.isActive
                }
            };
        } catch (error) {
            console.error('Get document error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserDocuments(userAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const documentIds = await this.contract.getUserDocuments(
                userAddress || this.userAccount
            );

            return {
                success: true,
                documentIds: documentIds.map(id => Number(id))
            };
        } catch (error) {
            console.error('Get user documents error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserConnections(userAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const connections = await this.contract.getUserConnections(
                userAddress || this.userAccount
            );

            return {
                success: true,
                connections
            };
        } catch (error) {
            console.error('Get user connections error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility Functions
    getCurrentAccount() {
        return this.userAccount;
    }

    isContractReady() {
        return this.isInitialized && this.contract && this.contractAddress;
    }

    async getBalance() {
        try {
            if (!this.provider || !this.userAccount) {
                throw new Error('Provider not initialized');
            }

            const balance = await this.provider.getBalance(this.userAccount);
            return {
                success: true,
                balance: ethers.formatEther(balance)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async estimateGas(methodName, ...params) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const gasEstimate = await this.contract[methodName].estimateGas(...params);
            return {
                success: true,
                gasEstimate: gasEstimate.toString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new BlockchainService();