// MetaMask integration for DocuChain
// Based on reference implementation from docuchain-project

// Blockchain configuration
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const CONTRACT_ADDRESS = '0x1203dc6f5d10556449e194c0c14f167bb3d72208';

// MetaMask connection state
let web3 = null;
let userAccount = null;

// Smart Contract ABI (matching deployed DocumentManager contract)
const CONTRACT_ABI = [
    {
        "inputs": [
            {"name": "_ipfsHash", "type": "string"}, 
            {"name": "_fileName", "type": "string"}, 
            {"name": "_fileSize", "type": "uint256"}, 
            {"name": "_documentType", "type": "string"}
        ],
        "name": "uploadDocument",
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_documentId", "type": "bytes32"}, 
            {"name": "_shareWith", "type": "address"}, 
            {"name": "_permission", "type": "string"}
        ],
        "name": "shareDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_documentId", "type": "bytes32"}
        ],
        "name": "getDocument",
        "outputs": [
            {"name": "ipfsHash", "type": "string"},
            {"name": "owner", "type": "address"},
            {"name": "timestamp", "type": "uint256"},
            {"name": "fileName", "type": "string"},
            {"name": "fileSize", "type": "uint256"},
            {"name": "isActive", "type": "bool"},
            {"name": "documentType", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize MetaMask
export const initializeMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Import Web3 dynamically
            const Web3 = (await import('web3')).default;
            web3 = new Web3(window.ethereum);
            
            // Check if already connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAccount = accounts[0];
                await switchToSepolia();
            }
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    userAccount = null;
                } else {
                    userAccount = accounts[0];
                }
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
            
            return true;
        } catch (error) {
            console.error('Error initializing MetaMask:', error);
            return false;
        }
    } else {
        console.log('MetaMask not detected');
        return false;
    }
};

// Connect wallet
export const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
        console.log('🔗 Requesting MetaMask account access...');
        
        // Request account access with timeout
        const requestPromise = window.ethereum.request({
            method: 'eth_requestAccounts',
        });
        
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection request timed out. Please try again.')), 60000);
        });
        
        const accounts = await Promise.race([requestPromise, timeoutPromise]);
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask and try again.');
        }
        
        userAccount = accounts[0];
        console.log('✅ Account connected:', userAccount);
        
        // Switch to Sepolia network (non-blocking - can fail gracefully)
        try {
            await switchToSepolia();
            console.log('✅ Switched to Sepolia network');
        } catch (networkError) {
            console.warn('⚠️ Failed to switch network (will continue):', networkError.message);
            // Don't fail the whole connection if network switch fails
        }
        
        // Update backend with wallet connection (non-blocking)
        try {
            await updateWalletConnection();
            console.log('✅ Backend updated with wallet connection');
        } catch (backendError) {
            console.warn('⚠️ Failed to update backend (will continue):', backendError.message);
            // Don't fail the whole connection if backend update fails
        }
        
        return {
            success: true,
            account: userAccount,
            message: 'Wallet connected successfully'
        };
    } catch (error) {
        console.error('❌ Error connecting wallet:', error);
        
        // User rejected the request
        if (error.code === 4001) {
            throw new Error('Connection request rejected. Please approve the connection in MetaMask.');
        }
        
        // Other errors
        throw new Error('Failed to connect wallet: ' + error.message);
    }
};

// Switch to Sepolia network
const switchToSepolia = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: SEPOLIA_CHAIN_ID,
                            chainName: 'Sepolia Test Network',
                            nativeCurrency: {
                                name: 'Sepolia ETH',
                                symbol: 'SEP',
                                decimals: 18,
                            },
                            rpcUrls: ['https://sepolia.infura.io/v3/'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                        },
                    ],
                });
            } catch (addError) {
                throw new Error('Failed to add Sepolia network to MetaMask');
            }
        } else {
            throw new Error('Failed to switch to Sepolia network');
        }
    }
};

// Update wallet connection with backend
const updateWalletConnection = async () => {
    if (userAccount) {
        try {
            const authToken = localStorage.getItem('token');
            if (!authToken) {
                console.error('❌ No auth token found! Cannot save wallet address to database.');
                console.error('❌ Please make sure you are logged in before connecting wallet.');
                alert('Please make sure you are logged in before connecting your wallet.');
                return;
            }
            
            console.log('📤 Sending wallet address to backend:', userAccount);
            
            // Add timeout to backend request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    walletAddress: userAccount
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            if (!response.ok || data.error) {
                console.error('❌ Backend wallet update failed!');
                console.error('Response status:', response.status);
                console.error('Error:', data.error || data.message);
                alert('Warning: Wallet connected but failed to save to database. Error: ' + (data.error || data.message));
            } else {
                console.log('✅ Wallet address SUCCESSFULLY saved to database:', userAccount);
                console.log('✅ Database response:', data);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Backend wallet update TIMED OUT after 5 seconds!');
                alert('Warning: Request timed out while saving wallet to database.');
            } else {
                console.error('❌ Error updating wallet connection:', error);
                alert('Warning: Failed to save wallet address to database. Error: ' + error.message);
            }
            // Don't throw - allow connection to succeed even if backend fails
        }
    } else {
        console.error('❌ No user account to update!');
    }
};

// Disconnect wallet
export const disconnectWallet = () => {
    userAccount = null;
    return {
        success: true,
        message: 'Wallet disconnected'
    };
};

// Upload document to blockchain
export const uploadDocumentToBlockchain = async (ipfsHash, fileName, fileType, fileSize) => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // Estimate gas
        const gasEstimate = await contract.methods
            .uploadDocument(ipfsHash, fileName, fileSize, fileType)
            .estimateGas({ from: userAccount });
        
        // Send transaction
        const result = await contract.methods
            .uploadDocument(ipfsHash, fileName, fileSize, fileType)
            .send({
                from: userAccount,
                gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
            });
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            documentId: result.events.DocumentUploaded.returnValues.documentId
        };
    } catch (error) {
        console.error('Blockchain upload error:', error);
        throw new Error('Failed to upload document to blockchain: ' + error.message);
    }
};

// Share document on blockchain
export const shareDocumentOnBlockchain = async (documentId, shareWithAddress, permission) => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // Estimate gas
        const gasEstimate = await contract.methods
            .shareDocument(documentId, shareWithAddress, permission)
            .estimateGas({ from: userAccount });
        
        // Send transaction
        const result = await contract.methods
            .shareDocument(documentId, shareWithAddress, permission)
            .send({
                from: userAccount,
                gas: Math.round(gasEstimate * 1.2)
            });
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
        };
    } catch (error) {
        console.error('Blockchain share error:', error);
        throw new Error('Failed to share document on blockchain: ' + error.message);
    }
};

// Utility functions
export const getCurrentWalletAddress = () => userAccount;
export const isWalletConnected = () => !!userAccount;
export const getWeb3Instance = () => web3;

// Format wallet address for display
export const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
};

// Get network info
export const getNetworkInfo = async () => {
    if (!web3) return null;
    
    try {
        const chainId = await web3.eth.getChainId();
        const isCorrectNetwork = chainId.toString() === '11155111'; // Sepolia
        
        return {
            chainId,
            isCorrectNetwork,
            networkName: isCorrectNetwork ? 'Sepolia Testnet' : 'Unknown Network'
        };
    } catch (error) {
        console.error('Error getting network info:', error);
        return null;
    }
};

export default {
    initializeMetaMask,
    connectWallet,
    disconnectWallet,
    uploadDocumentToBlockchain,
    shareDocumentOnBlockchain,
    getCurrentWalletAddress,
    isWalletConnected,
    getWeb3Instance,
    formatWalletAddress,
    isMetaMaskInstalled,
    getNetworkInfo,
    CONTRACT_ADDRESS,
    CONTRACT_ABI
};