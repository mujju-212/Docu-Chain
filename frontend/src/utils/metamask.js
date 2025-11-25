// MetaMask integration for DocuChain
// Based on reference implementation from docuchain-project

// Blockchain configuration
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

// Contract addresses
const DOCUMENT_MANAGER_ADDRESS = '0x1203dc6f5d10556449e194c0c14f167bb3d72208'; // Original DocumentManager
const APPROVAL_MANAGER_ADDRESS = '0x8E1626654e1B04ADF941EbbcEc7E92728327aA54'; // DocumentApprovalManager

// MetaMask connection state
let web3 = null;
let userAccount = null;

// Smart Contract ABI for DocumentManager (original contract)
const DOCUMENT_MANAGER_ABI = [
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

// Smart Contract ABI for DocumentApprovalManager
const APPROVAL_MANAGER_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "requestId", "type": "bytes32"},
            {"indexed": true, "name": "documentId", "type": "bytes32"},
            {"indexed": true, "name": "requester", "type": "address"},
            {"indexed": false, "name": "approvers", "type": "address[]"},
            {"indexed": false, "name": "processType", "type": "uint8"},
            {"indexed": false, "name": "priority", "type": "uint8"},
            {"indexed": false, "name": "expiryTimestamp", "type": "uint256"}
        ],
        "name": "ApprovalRequested",
        "type": "event"
    },
    {
        "inputs": [
            {"name": "_documentId", "type": "bytes32"},
            {"name": "_documentIpfsHash", "type": "string"},
            {"name": "_approvers", "type": "address[]"},
            {"name": "_processType", "type": "uint8"}, // 0=SEQUENTIAL, 1=PARALLEL
            {"name": "_approvalType", "type": "uint8"}, // 0=STANDARD, 1=DIGITAL_SIGNATURE
            {"name": "_priority", "type": "uint8"}, // 0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT
            {"name": "_expiryTimestamp", "type": "uint256"},
            {"name": "_version", "type": "string"}
        ],
        "name": "requestApproval",
        "outputs": [{"name": "requestId", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"},
            {"name": "_signatureHash", "type": "bytes32"},
            {"name": "_reason", "type": "string"}
        ],
        "name": "approveDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"},
            {"name": "_reason", "type": "string"}
        ],
        "name": "rejectDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"}
        ],
        "name": "cancelRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"}
        ],
        "name": "getApprovalRequest",
        "outputs": [
            {
                "components": [
                    {"name": "requestId", "type": "bytes32"},
                    {"name": "documentId", "type": "bytes32"},
                    {"name": "documentIpfsHash", "type": "string"},
                    {"name": "requester", "type": "address"},
                    {"name": "approvers", "type": "address[]"},
                    {"name": "processType", "type": "uint8"},
                    {"name": "approvalType", "type": "uint8"},
                    {"name": "priority", "type": "uint8"},
                    {"name": "expiryTimestamp", "type": "uint256"},
                    {"name": "createdAt", "type": "uint256"},
                    {"name": "submittedAt", "type": "uint256"},
                    {"name": "completedAt", "type": "uint256"},
                    {"name": "status", "type": "uint8"},
                    {"name": "isActive", "type": "bool"},
                    {"name": "version", "type": "string"}
                ],
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"}
        ],
        "name": "getApprovalSteps",
        "outputs": [
            {
                "components": [
                    {"name": "approver", "type": "address"},
                    {"name": "stepOrder", "type": "uint8"},
                    {"name": "hasApproved", "type": "bool"},
                    {"name": "hasRejected", "type": "bool"},
                    {"name": "actionTimestamp", "type": "uint256"},
                    {"name": "signatureHash", "type": "bytes32"},
                    {"name": "reason", "type": "string"}
                ],
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requestId", "type": "bytes32"}
        ],
        "name": "getApprovalStatus",
        "outputs": [
            {"name": "isComplete", "type": "bool"},
            {"name": "isApproved", "type": "bool"},
            {"name": "approvedCount", "type": "uint256"},
            {"name": "totalApprovers", "type": "uint256"},
            {"name": "isExpired", "type": "bool"},
            {"name": "currentStatus", "type": "uint8"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_requester", "type": "address"}
        ],
        "name": "getRequesterRequests",
        "outputs": [{"name": "", "type": "bytes32[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_approver", "type": "address"}
        ],
        "name": "getApproverRequests",
        "outputs": [{"name": "", "type": "bytes32[]"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Keep CONTRACT_ABI for backward compatibility
const CONTRACT_ABI = DOCUMENT_MANAGER_ABI;

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

// ========== APPROVAL SYSTEM FUNCTIONS ==========

/**
 * Request document approval on blockchain
 * @param {string} documentId - Document ID (bytes32)
 * @param {string} ipfsHash - IPFS hash of document
 * @param {string[]} approverAddresses - Array of approver wallet addresses
 * @param {string} processType - 'SEQUENTIAL' or 'PARALLEL'
 * @param {string} approvalType - 'STANDARD' or 'DIGITAL_SIGNATURE'
 * @param {string} priority - 'LOW', 'NORMAL', 'HIGH', 'URGENT'
 * @param {number} expiryTimestamp - Unix timestamp (0 for no expiry)
 * @param {string} version - Version string (e.g., 'v1.0')
 * @returns {Promise<{requestId: string, transactionHash: string}>}
 */
export const requestApprovalOnBlockchain = async (
    documentId,
    ipfsHash,
    approverAddresses,
    processType = 'PARALLEL',
    approvalType = 'STANDARD',
    priority = 'NORMAL',
    expiryTimestamp = 0,
    version = 'v1.0'
) => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        
        // Convert enum values
        const processTypeEnum = processType === 'SEQUENTIAL' ? 0 : 1;
        const approvalTypeEnum = approvalType === 'DIGITAL_SIGNATURE' ? 1 : 0;
        const priorityMap = { 'LOW': 0, 'NORMAL': 1, 'HIGH': 2, 'URGENT': 3 };
        const priorityEnum = priorityMap[priority] || 1;
        
        console.log('🔄 Requesting approval on blockchain...', {
            documentId,
            approvers: approverAddresses,
            processType: processTypeEnum,
            approvalType: approvalTypeEnum,
            priority: priorityEnum
        });
        
        // Estimate gas
        const gasEstimate = await contract.methods
            .requestApproval(
                documentId,
                ipfsHash,
                approverAddresses,
                processTypeEnum,
                approvalTypeEnum,
                priorityEnum,
                expiryTimestamp,
                version
            )
            .estimateGas({ from: userAccount });
        
        // Convert BigInt to Number for gas calculation
        const gasEstimateNumber = Number(gasEstimate);
        const gasLimit = Math.round(gasEstimateNumber * 1.2); // Add 20% buffer
        
        console.log('⛽ Gas estimate:', gasEstimateNumber, '→ Gas limit:', gasLimit);
        
        // Send transaction
        const result = await contract.methods
            .requestApproval(
                documentId,
                ipfsHash,
                approverAddresses,
                processTypeEnum,
                approvalTypeEnum,
                priorityEnum,
                expiryTimestamp,
                version
            )
            .send({
                from: userAccount,
                gas: gasLimit
            });
        
        console.log('📦 Full blockchain result:', result);
        console.log('📦 Events:', result.events);
        
        // Get request ID from event - try different event names
        let requestId = result.events.ApprovalRequested?.returnValues?.requestId ||
                       result.events.ApprovalRequestCreated?.returnValues?.requestId;
        
        // If not in events, check if it's returned directly
        if (!requestId && result.returnValues) {
            requestId = result.returnValues.requestId || result.returnValues[0];
        }
        
        console.log('✅ Approval request created on blockchain:', {
            requestId,
            txHash: result.transactionHash
        });
        
        return {
            success: true,
            requestId,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
        };
    } catch (error) {
        console.error('Blockchain approval request error:', error);
        throw new Error('Failed to request approval on blockchain: ' + error.message);
    }
};

/**
 * Approve a document on blockchain
 * @param {string} requestId - Request ID (bytes32)
 * @param {string} reason - Approval comment (optional)
 * @param {string} signatureHash - Digital signature hash (optional, use '0x0000...' for standard)
 * @returns {Promise<{transactionHash: string}>}
 */
export const approveDocumentOnBlockchain = async (requestId, reason = '', signatureHash = '0x0000000000000000000000000000000000000000000000000000000000000000') => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        
        console.log('🔍 Approve function called with:');
        console.log('  - requestId:', requestId);
        console.log('  - requestId type:', typeof requestId);
        console.log('  - requestId length:', requestId?.length);
        console.log('  - userAccount:', userAccount);
        
        // First, try to fetch the request from blockchain to verify it exists
        try {
            const blockchainRequest = await contract.methods.getApprovalRequest(requestId).call();
            console.log('📦 Blockchain request data:', blockchainRequest);
            console.log('  - isActive:', blockchainRequest.isActive);
            console.log('  - status:', blockchainRequest.status);
            console.log('  - requester:', blockchainRequest.requester);
            
            // Check if request exists (requester is not zero address)
            if (blockchainRequest.requester === '0x0000000000000000000000000000000000000000') {
                throw new Error('Request does not exist on blockchain');
            }
            
            if (!blockchainRequest.isActive) {
                throw new Error('Request exists but is not active on blockchain');
            }
        } catch (fetchError) {
            console.error('❌ Failed to fetch request from blockchain:', fetchError.message);
            throw new Error(`Request verification failed: ${fetchError.message}`);
        }
        
        console.log('✅ Approving document on blockchain...', { requestId, reason });
        
        // Estimate gas
        const gasEstimate = await contract.methods
            .approveDocument(requestId, signatureHash, reason)
            .estimateGas({ from: userAccount });
        
        // Convert BigInt to Number for calculation
        const gasEstimateNumber = Number(gasEstimate);
        const gasLimit = Math.round(gasEstimateNumber * 1.2);
        
        console.log('⛽ Gas estimate:', gasEstimateNumber, '→ Gas limit:', gasLimit);
        
        // Send transaction
        const result = await contract.methods
            .approveDocument(requestId, signatureHash, reason)
            .send({
                from: userAccount,
                gas: gasLimit
            });
        
        console.log('✅ Document approved on blockchain:', result.transactionHash);
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber ? Number(result.blockNumber) : null
        };
    } catch (error) {
        console.error('Blockchain approval error:', error);
        throw new Error('Failed to approve document on blockchain: ' + error.message);
    }
};

/**
 * Reject a document on blockchain
 * @param {string} requestId - Request ID (bytes32)
 * @param {string} reason - Rejection reason (required)
 * @returns {Promise<{transactionHash: string}>}
 */
export const rejectDocumentOnBlockchain = async (requestId, reason) => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    if (!reason || reason.trim() === '') {
        throw new Error('Rejection reason is required');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        
        console.log('❌ Rejecting document on blockchain...', { requestId, reason });
        
        // Estimate gas
        const gasEstimate = await contract.methods
            .rejectDocument(requestId, reason)
            .estimateGas({ from: userAccount });
        
        // Convert BigInt to Number for calculation
        const gasEstimateNumber = Number(gasEstimate);
        const gasLimit = Math.round(gasEstimateNumber * 1.2);
        
        console.log('⛽ Gas estimate:', gasEstimateNumber, '→ Gas limit:', gasLimit);
        
        // Send transaction
        const result = await contract.methods
            .rejectDocument(requestId, reason)
            .send({
                from: userAccount,
                gas: gasLimit
            });
        
        console.log('✅ Document rejected on blockchain:', result.transactionHash);
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
        };
    } catch (error) {
        console.error('Blockchain rejection error:', error);
        throw new Error('Failed to reject document on blockchain: ' + error.message);
    }
};

/**
 * Get approval request details from blockchain
 * @param {string} requestId - Request ID (bytes32)
 * @returns {Promise<Object>} Approval request details
 */
export const getApprovalRequestFromBlockchain = async (requestId) => {
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        const request = await contract.methods.getApprovalRequest(requestId).call();
        
        return {
            requestId: request.requestId,
            documentId: request.documentId,
            documentIpfsHash: request.documentIpfsHash,
            requester: request.requester,
            approvers: request.approvers,
            processType: request.processType === '0' ? 'SEQUENTIAL' : 'PARALLEL',
            approvalType: request.approvalType === '0' ? 'STANDARD' : 'DIGITAL_SIGNATURE',
            priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'][parseInt(request.priority)],
            status: ['DRAFT', 'PENDING', 'PARTIAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'][parseInt(request.status)],
            isActive: request.isActive,
            version: request.version,
            expiryTimestamp: parseInt(request.expiryTimestamp),
            createdAt: parseInt(request.createdAt),
            submittedAt: parseInt(request.submittedAt),
            completedAt: parseInt(request.completedAt)
        };
    } catch (error) {
        console.error('Error fetching approval request:', error);
        throw new Error('Failed to fetch approval request: ' + error.message);
    }
};

/**
 * Get approval steps from blockchain
 * @param {string} requestId - Request ID (bytes32)
 * @returns {Promise<Array>} Array of approval steps
 */
export const getApprovalStepsFromBlockchain = async (requestId) => {
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        const steps = await contract.methods.getApprovalSteps(requestId).call();
        
        return steps.map(step => ({
            approver: step.approver,
            stepOrder: parseInt(step.stepOrder),
            hasApproved: step.hasApproved,
            hasRejected: step.hasRejected,
            actionTimestamp: parseInt(step.actionTimestamp),
            signatureHash: step.signatureHash,
            reason: step.reason
        }));
    } catch (error) {
        console.error('Error fetching approval steps:', error);
        throw new Error('Failed to fetch approval steps: ' + error.message);
    }
};

/**
 * Get approval status from blockchain
 * @param {string} requestId - Request ID (bytes32)
 * @returns {Promise<Object>} Approval status
 */
export const getApprovalStatusFromBlockchain = async (requestId) => {
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        const status = await contract.methods.getApprovalStatus(requestId).call();
        
        return {
            isComplete: status.isComplete,
            isApproved: status.isApproved,
            approvedCount: parseInt(status.approvedCount),
            totalApprovers: parseInt(status.totalApprovers),
            isExpired: status.isExpired,
            currentStatus: ['DRAFT', 'PENDING', 'PARTIAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'][parseInt(status.currentStatus)]
        };
    } catch (error) {
        console.error('Error fetching approval status:', error);
        throw new Error('Failed to fetch approval status: ' + error.message);
    }
};

/**
 * Get all approval requests for current user (as requester)
 * @returns {Promise<Array>} Array of request IDs
 */
export const getMyApprovalRequests = async () => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        const requestIds = await contract.methods.getRequesterRequests(userAccount).call();
        return requestIds;
    } catch (error) {
        console.error('Error fetching my requests:', error);
        throw new Error('Failed to fetch requests: ' + error.message);
    }
};

/**
 * Get all approval requests where current user is an approver
 * @returns {Promise<Array>} Array of request IDs
 */
export const getMyApprovalTasks = async () => {
    if (!userAccount) {
        throw new Error('Please connect your wallet first');
    }
    
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    
    try {
        const contract = new web3.eth.Contract(APPROVAL_MANAGER_ABI, APPROVAL_MANAGER_ADDRESS);
        const requestIds = await contract.methods.getApproverRequests(userAccount).call();
        return requestIds;
    } catch (error) {
        console.error('Error fetching my approval tasks:', error);
        throw new Error('Failed to fetch approval tasks: ' + error.message);
    }
};

export default {
    initializeMetaMask,
    connectWallet,
    disconnectWallet,
    uploadDocumentToBlockchain,
    shareDocumentOnBlockchain,
    requestApprovalOnBlockchain,
    approveDocumentOnBlockchain,
    rejectDocumentOnBlockchain,
    getApprovalRequestFromBlockchain,
    getApprovalStepsFromBlockchain,
    getApprovalStatusFromBlockchain,
    getMyApprovalRequests,
    getMyApprovalTasks,
    getCurrentWalletAddress,
    isWalletConnected,
    getWeb3Instance,
    formatWalletAddress,
    isMetaMaskInstalled,
    getNetworkInfo,
    DOCUMENT_MANAGER_ADDRESS,
    APPROVAL_MANAGER_ADDRESS,
    DOCUMENT_MANAGER_ABI,
    APPROVAL_MANAGER_ABI,
    CONTRACT_ADDRESS: DOCUMENT_MANAGER_ADDRESS, // For backward compatibility
    CONTRACT_ABI: DOCUMENT_MANAGER_ABI // For backward compatibility
};