# 📁 DocuChain File Manager - Complete Technical Documentation

> **Version:** 1.0  
> **Last Updated:** November 2, 2025  
> **Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Blockchain Integration](#blockchain-integration)
7. [File Upload Flow](#file-upload-flow)
8. [File Sharing System](#file-sharing-system)
9. [Folder Management](#folder-management)
10. [API Endpoints](#api-endpoints)
11. [Dependencies & Packages](#dependencies--packages)
12. [Security & Authentication](#security--authentication)
13. [Error Handling](#error-handling)
14. [Future Enhancements](#future-enhancements)

---

## 1. Overview

### 1.1 What is DocuChain File Manager?

DocuChain File Manager is a **hybrid document management system** that combines:
- **Traditional database storage** (PostgreSQL) for metadata and folder structure
- **IPFS/Pinata** for decentralized file storage
- **Ethereum blockchain** (Sepolia testnet) for immutable document records
- **MetaMask wallet** integration for blockchain transactions

### 1.2 Key Features

✅ **Document Management**
- Upload files to blockchain-backed storage
- Organize files in hierarchical folder structure
- Search, filter, and sort documents
- Star/favorite important files
- Move files to trash (soft delete)

✅ **Sharing & Collaboration**
- Share documents with other users
- Read/Write permissions
- Sent and Received folders for tracking shares
- Documents remain in original location when shared

✅ **Version Control**
- Track document versions automatically
- View version history
- Restore previous versions

✅ **Blockchain Features**
- Immutable document records on Ethereum
- IPFS content addressing
- Transaction hash verification
- Multi-wallet support per user

✅ **System Folders (Protected)**
- **Shared** - Contains Sent and Received subfolders
  - **Sent** - Documents shared BY the user
  - **Received** - Documents shared WITH the user
- **Generated** - System-generated documents
- **Approved** - Approved documents
- **Rejected** - Rejected documents

---

## 2. System Architecture

### 2.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  React.js + TailwindCSS + MetaMask Integration              │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                     SERVICES LAYER                           │
│  • blockchainServiceV2.js (Ethereum interaction)            │
│  • pinataService.js (IPFS file storage)                     │
│  • hybridFileManagerService.js (Database operations)        │
│  • api.js (HTTP requests)                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                      BACKEND LAYER                           │
│  Flask REST API + SQLAlchemy ORM + JWT Authentication       │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│              PostgreSQL (Metadata Storage)                   │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                            │
│  Ethereum (Sepolia) + Smart Contracts + IPFS/Pinata         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Action (Upload File)
    ↓
Frontend (FileManagerNew.js)
    ↓
1. Create DB Entry (hybridFileManagerService) → PostgreSQL
    ↓
2. Upload to IPFS (pinataService) → Pinata → Returns IPFS Hash
    ↓
3. Store on Blockchain (blockchainServiceV2) → MetaMask Transaction → Smart Contract
    ↓
4. Update DB with IPFS Hash & Blockchain ID → PostgreSQL
    ↓
5. Display File in UI → User sees uploaded file
```

---

## 3. Database Schema

### 3.1 Documents Table

**File:** `backend/app/models/document.py`

```python
CREATE TABLE documents (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Blockchain References
    document_id VARCHAR(66),              -- Blockchain document ID (nullable until upload)
    ipfs_hash VARCHAR(100),               -- IPFS content hash (nullable until upload)
    transaction_hash VARCHAR(66) NOT NULL, -- Ethereum transaction hash
    block_number INTEGER,                  -- Block number on blockchain
    
    -- File Information
    name VARCHAR(255) NOT NULL,           -- Document display name
    file_name VARCHAR(255) NOT NULL,      -- Original file name
    file_size BIGINT NOT NULL,            -- File size in bytes
    document_type VARCHAR(50),            -- MIME type (e.g., 'application/pdf')
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(id),
    owner_address VARCHAR(42) NOT NULL,    -- Ethereum wallet address
    
    -- Folder Organization
    folder_id UUID REFERENCES folders(id), -- Parent folder (NULL = root)
    
    -- Status Flags
    is_active BOOLEAN DEFAULT TRUE,        -- Soft delete flag
    is_in_trash BOOLEAN DEFAULT FALSE,     -- Trash status
    is_starred BOOLEAN DEFAULT FALSE,      -- Favorite/starred flag
    trash_date TIMESTAMP,                  -- When moved to trash
    
    -- Timestamps
    timestamp BIGINT NOT NULL,             -- Unix timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_blockchain_id ON documents(document_id);
CREATE INDEX idx_documents_active ON documents(is_active) WHERE is_active = TRUE;
```

**Key Features:**
- `document_id` and `ipfs_hash` are nullable to support step-by-step upload process
- Soft delete using `is_active` flag instead of hard deletion
- Support for blockchain verification via `transaction_hash`

### 3.2 Folders Table

**File:** `backend/app/models/folder.py`

```python
CREATE TABLE folders (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Folder Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES folders(id),  -- Self-referencing for tree structure
    path VARCHAR(1000) NOT NULL,            -- Full path like '/folder1/subfolder'
    level INTEGER DEFAULT 0,                -- Depth in folder tree
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Permissions
    is_public BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Status Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_in_trash BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_system_folder BOOLEAN DEFAULT FALSE, -- Protected system folders
    trash_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_folders_owner ON folders(owner_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_system ON folders(is_system_folder) WHERE is_system_folder = TRUE;
```

**Key Features:**
- Hierarchical structure using `parent_id` (self-referencing foreign key)
- `is_system_folder` flag protects critical folders (Shared, Sent, Received, etc.)
- Path tracking for easy navigation

### 3.3 Document Shares Table

**File:** `backend/app/models/shares.py`

```python
CREATE TABLE document_shares (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id),
    shared_by_id UUID NOT NULL REFERENCES users(id),   -- Who shared it
    shared_with_id UUID NOT NULL REFERENCES users(id), -- Who received it
    
    -- Permissions
    permission VARCHAR(10) DEFAULT 'read',  -- 'read' or 'write'
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    shared_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, shared_with_id)  -- Can't share same doc to same user twice
);

-- Indexes
CREATE INDEX idx_shares_document ON document_shares(document_id);
CREATE INDEX idx_shares_shared_by ON document_shares(shared_by_id);
CREATE INDEX idx_shares_shared_with ON document_shares(shared_with_id);
```

**Key Features:**
- Tracks who shared what with whom
- Supports read/write permissions
- Documents stay in original location (not moved to Sent folder)
- Sent/Received folders show via JOIN queries, not physical moves

### 3.4 Document Versions Table

**File:** `backend/app/models/document.py`

```python
CREATE TABLE document_versions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id),
    
    -- Version Information
    version_number INTEGER NOT NULL,
    ipfs_hash VARCHAR(100) NOT NULL,      -- IPFS hash for this version
    file_name VARCHAR(255),
    file_size BIGINT,
    transaction_id VARCHAR(66),            -- Blockchain transaction for this version
    changes_description TEXT,
    created_by UUID,                       -- Who created this version
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_versions_document ON document_versions(document_id);
CREATE INDEX idx_versions_number ON document_versions(document_id, version_number);
```

---

## 4. Backend Implementation

### 4.1 Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── models/
│   │   ├── user.py             # User model
│   │   ├── document.py         # Document & DocumentVersion models
│   │   ├── folder.py           # Folder model
│   │   └── shares.py           # DocumentShare model
│   ├── routes/
│   │   ├── auth.py             # Login, register, OTP verification
│   │   ├── documents.py        # Document CRUD operations
│   │   ├── folders.py          # Folder management
│   │   ├── shares.py           # Document sharing
│   │   ├── recent.py           # Recent activity tracking
│   │   └── versions.py         # Version history
│   └── utils/
│       └── email_service.py    # Email sending (OTP, notifications)
├── config.py                    # Configuration (DB, SECRET_KEY, etc.)
├── run.py                       # Application entry point
└── requirements.txt             # Python dependencies
```

### 4.2 Key Backend Routes

#### 4.2.1 Document Routes (`/api/documents`)

**File:** `backend/app/routes/documents.py`

```python
# List documents in a folder
@bp.route('/', methods=['GET'])
@token_required
def list_documents():
    """
    Query Parameters:
    - folder_id: UUID of folder (optional, NULL = root)
    
    Returns: List of documents with metadata
    
    Special handling:
    - Received folder: Shows documents shared WITH user
    - Sent folder: Shows documents shared BY user
    - Regular folders: Shows documents in that folder
    """
    
# Upload document metadata
@bp.route('/upload', methods=['POST'])
@token_required
def upload_document():
    """
    Body: {
        document_id: Blockchain document ID (nullable),
        ipfs_hash: IPFS hash (nullable),
        file_name: Original filename,
        file_size: Size in bytes,
        file_type: MIME type,
        folder_id: Parent folder UUID,
        transaction_hash: Ethereum tx hash,
        block_number: Block number
    }
    
    Process:
    1. Create document entry in database
    2. Set owner_id from JWT token
    3. Return document object with UUID
    """
    
# Update document (move, rename, or update content)
@bp.route('/<document_id>', methods=['PUT'])
@token_required
def update_document(document_id):
    """
    Body: {
        folder_id: New folder (optional),
        name: New name (optional),
        ipfs_hash: New IPFS hash for content update (optional),
        document_id: Blockchain doc ID (optional)
    }
    
    Features:
    - Skip version creation if old IPFS hash is NULL (initial upload)
    - Create version entries for actual content updates
    - Update all copies if blockchain document_id exists
    """

# Delete document (soft delete)
@bp.route('/<document_id>', methods=['DELETE'])
@token_required
def delete_document(document_id):
    """
    Sets is_active=False and is_in_trash=True
    Does NOT physically delete from database
    """

# Get starred documents
@bp.route('/starred', methods=['GET'])
@token_required
def get_starred_documents():
    """Returns all documents where is_starred=True for current user"""

# Toggle star status
@bp.route('/<document_id>/star', methods=['PUT'])
@token_required
def toggle_star(document_id):
    """Toggles is_starred flag"""
```

#### 4.2.2 Folder Routes (`/api/folders`)

**File:** `backend/app/routes/folders.py`

```python
# List folders
@bp.route('/', methods=['GET'])
@token_required
def list_folders():
    """
    Query Parameters:
    - parent_id: UUID of parent folder (optional, NULL = root)
    
    Returns: List of folders with document/subfolder counts
    
    Special handling for counts:
    - Received folder: Count documents shared WITH user (via JOIN)
    - Sent folder: Count documents shared BY user (via JOIN)
    - Regular folders: Count documents where folder_id matches
    """

# Create folder
@bp.route('/', methods=['POST'])
@token_required
def create_folder():
    """
    Body: {
        name: Folder name,
        parent_id: Parent folder UUID (optional),
        description: Folder description (optional)
    }
    
    Process:
    1. Validate folder name uniqueness in parent
    2. Calculate path and level
    3. Create folder entry
    4. Return folder object
    """

# Update folder
@bp.route('/<folder_id>', methods=['PUT'])
@token_required
def update_folder(folder_id):
    """
    Body: {
        name: New name (optional),
        description: New description (optional),
        parent_id: New parent (optional)
    }
    """

# Delete folder
@bp.route('/<folder_id>', methods=['DELETE'])
@token_required
def delete_folder(folder_id):
    """
    Soft delete: Sets is_active=False
    Prevents deletion of system folders (is_system_folder=True)
    """
```

#### 4.2.3 Sharing Routes (`/api/shares`)

**File:** `backend/app/routes/shares.py`

```python
# Share document
@bp.route('/', methods=['POST'])
@token_required
def share_document():
    """
    Body: {
        document_id: Document UUID,
        shared_with_id: User UUID to share with,
        permission: 'read' or 'write'
    }
    
    Process:
    1. Verify user owns document
    2. Create DocumentShare entry
    3. Documents stay in original folder (NOT moved to Sent)
    4. Return success
    """

# List shares for a document
@bp.route('/document/<document_id>', methods=['GET'])
@token_required
def get_document_shares(document_id):
    """Returns list of users document is shared with"""

# Revoke share
@bp.route('/<share_id>', methods=['DELETE'])
@token_required
def revoke_share(share_id):
    """Remove share entry (only owner can revoke)"""
```

### 4.3 Authentication & Security

**File:** `backend/app/routes/auth.py`

```python
# JWT Token-based authentication
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

# Decorator for protected routes
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        return f(*args, **kwargs)
    return decorated_function

# Login endpoint
@bp.route('/login', methods=['POST'])
def login():
    """
    Body: { email, password }
    Returns: { token, user_data }
    """

# Registration endpoint
@bp.route('/register', methods=['POST'])
def register():
    """
    Body: { email, password, name, institution }
    Sends OTP for verification
    """
```

---

## 5. Frontend Implementation

### 5.1 File Manager Component

**File:** `frontend/src/pages/shared/FileManagerNew.js` (5153 lines)

**Key State Variables:**

```javascript
// Blockchain & Wallet
const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
const [walletAccount, setWalletAccount] = useState(null);
const [currentUser, setCurrentUser] = useState(null);

// File System Data
const [blockchainFiles, setBlockchainFiles] = useState([]);
const [blockchainFolders, setBlockchainFolders] = useState([]);
const [folderStack, setFolderStack] = useState([{id: null, name: 'Home'}]);
const [currentFolderId, setCurrentFolderId] = useState(null);

// UI State
const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
const [searchTerm, setSearchTerm] = useState('');
const [selectedFiles, setSelectedFiles] = useState([]);
const [currentSection, setCurrentSection] = useState('section-all');

// Modals
const [isFileModalOpen, setIsFileModalOpen] = useState(false);
const [isShareModalOpen, setIsShareModalOpen] = useState(false);
const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

// Sharing
const [selectedRecipients, setSelectedRecipients] = useState([]);
const [connectedUsers, setConnectedUsers] = useState([]);

// Starred & Recent
const [starredItems, setStarredItems] = useState([]);
const [recentItems, setRecentItems] = useState([]);
```

### 5.2 Main Functions

#### 5.2.1 File Upload Flow

```javascript
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  
  setIsProgressModalOpen(true);
  setIsUploadingToBlockchain(true);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // STEP 1: Create database entry (25% progress)
      setUploadProgress(25);
      const dbResult = await hybridFileManagerService.createFile(file, {
        parentFolderId: getCurrentFolderId()
      });
      
      // STEP 2: Upload to IPFS via Pinata (50% progress)
      setUploadProgress(50);
      const ipfsResult = await pinataService.uploadFile(file);
      
      // STEP 3: Store on blockchain (75% progress)
      setUploadProgress(75);
      const blockchainResult = await blockchainServiceV2.uploadDocument(
        ipfsResult.ipfsHash,
        file.name,
        file.size,
        file.type || 'document'
      );
      
      // STEP 4: Update database with blockchain data (100% progress)
      setUploadProgress(100);
      await axios.put(`/api/documents/${dbResult.document.id}`, {
        document_id: blockchainResult.documentId,
        ipfs_hash: ipfsResult.ipfsHash
      });
      
      showNotification('success', 'File uploaded successfully!');
      
    } catch (error) {
      showNotification('error', `Upload failed: ${error.message}`);
    }
  }
  
  await loadBlockchainFiles();
  setIsProgressModalOpen(false);
};
```

#### 5.2.2 File Sharing Flow

```javascript
const handleShare = async () => {
  const documentsToShare = currentSharingItems.filter(item => item.type === 'document');
  
  for (const doc of documentsToShare) {
    for (const recipient of selectedRecipients) {
      try {
        // DATABASE SHARE (always done)
        await axios.post('/api/shares', {
          document_id: doc.id,
          shared_with_id: recipient.id,
          permission: 'read'
        });
        
        // BLOCKCHAIN SHARE (if document has valid blockchain ID)
        if (isValidBlockchainId(doc.blockchainId)) {
          await blockchainServiceV2.shareDocument(
            doc.blockchainId,
            recipient.walletAddress,
            'read'
          );
        }
        
        showNotification('success', `Shared with ${recipient.name}`);
      } catch (error) {
        showNotification('error', `Failed to share: ${error.message}`);
      }
    }
  }
  
  setIsShareModalOpen(false);
};
```

#### 5.2.3 Folder Navigation

```javascript
const handleFolderDoubleClick = (folder) => {
  // Add to navigation stack
  setFolderStack(prev => [...prev, {
    id: folder.id,
    name: folder.name,
    path: folder.path
  }]);
  
  // Set as current folder
  setCurrentFolderId(folder.id);
  
  // Clear any filtered view
  if (filteredView) {
    setFilteredView(null);
    setFilteredFiles([]);
  }
  
  // Track activity
  addRecentActivity(folder.id, folder.name, 'folder-opened', 'folder');
};

const navigateToFolder = (index) => {
  // Navigate to specific folder in breadcrumb
  const newStack = folderStack.slice(0, index + 1);
  setFolderStack(newStack);
  
  const targetFolder = newStack[newStack.length - 1];
  setCurrentFolderId(targetFolder.id);
};
```

#### 5.2.4 Special Folder Handling

```javascript
const loadBlockchainFiles = async () => {
  try {
    const token = localStorage.getItem('token');
    const currentFolderId = getCurrentFolderId();
    
    // Load folders
    const foldersResponse = await axios.get('/api/folders', {
      params: { parent_id: currentFolderId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Load documents
    const documentsResponse = await axios.get('/api/documents', {
      params: { folder_id: currentFolderId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Check if current folder is Received or Sent
    const currentFolder = folderStack[folderStack.length - 1];
    const isSpecialFolder = currentFolder && 
      (currentFolder.name === 'Received' || currentFolder.name === 'Sent');
    
    setBlockchainFolders(foldersResponse.data.folders || []);
    
    // For special folders, show ALL files returned by backend
    // Backend filters by shared_with_id (Received) or shared_by_id (Sent)
    if (isSpecialFolder) {
      setBlockchainFiles(documentsResponse.data.documents || []);
    } else {
      // For regular folders, filter by folder_id
      const filesInFolder = documentsResponse.data.documents.filter(
        doc => doc.folderId === currentFolderId
      );
      setBlockchainFiles(filesInFolder);
    }
    
  } catch (error) {
    console.error('Error loading files:', error);
  }
};
```

---

## 6. Blockchain Integration

### 6.1 Smart Contract

**File:** `blockchain/contracts/DocumentManagerV2.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentManagerV2 {
    struct Document {
        string ipfsHash;
        address owner;
        uint256 timestamp;
        string fileName;
        uint256 fileSize;
        bool isActive;
        string documentType;
        uint256 version;
    }
    
    struct DocumentShare {
        address sharedWith;
        string permission; // "read" or "write"
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(bytes32 => Document) public documents;
    mapping(bytes32 => DocumentShare[]) public documentShares;
    mapping(address => bytes32[]) public ownerDocuments;
    mapping(bytes32 => bool) public documentExists;
    
    event DocumentUploaded(
        bytes32 indexed documentId,
        address indexed owner,
        string ipfsHash,
        string fileName,
        uint256 timestamp
    );
    
    event DocumentShared(
        bytes32 indexed documentId,
        address indexed owner,
        address indexed sharedWith,
        string permission,
        uint256 timestamp
    );
    
    function uploadDocument(
        string memory _ipfsHash,
        string memory _fileName,
        uint256 _fileSize,
        string memory _documentType
    ) external returns (bytes32) {
        bytes32 documentId = keccak256(
            abi.encodePacked(_ipfsHash, msg.sender, block.timestamp, _fileName)
        );
        
        documents[documentId] = Document({
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            fileName: _fileName,
            fileSize: _fileSize,
            isActive: true,
            documentType: _documentType,
            version: 1
        });
        
        documentExists[documentId] = true;
        ownerDocuments[msg.sender].push(documentId);
        
        emit DocumentUploaded(documentId, msg.sender, _ipfsHash, _fileName, block.timestamp);
        
        return documentId;
    }
    
    function shareDocument(
        bytes32 _documentId,
        address _shareWith,
        string memory _permission
    ) external {
        require(documentExists[_documentId], "Document does not exist");
        require(documents[_documentId].owner == msg.sender, "Not document owner");
        
        documentShares[_documentId].push(DocumentShare({
            sharedWith: _shareWith,
            permission: _permission,
            timestamp: block.timestamp,
            isActive: true
        }));
        
        emit DocumentShared(_documentId, msg.sender, _shareWith, _permission, block.timestamp);
    }
}
```

**Contract Address:** `0xb19f78B9c32dceaA01DE778Fa46784F5437DF373` (Sepolia Testnet)

### 6.2 Blockchain Service

**File:** `frontend/src/services/blockchainServiceV2.js`

```javascript
import { ethers } from 'ethers';
import DocumentManagerV2ABI from '../contracts/DocumentManagerV2.json';

const CONTRACT_ADDRESS = "0xb19f78B9c32dceaA01DE778Fa46784F5437DF373";
const SEPOLIA_CHAIN_ID = 11155111;

class BlockchainServiceV2 {
  async initialize() {
    // Request MetaMask account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    // Create provider and signer
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.currentWallet = await this.signer.getAddress();
    
    // Create contract instance
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS, 
      DocumentManagerV2ABI, 
      this.signer
    );
    
    this.isInitialized = true;
  }
  
  async uploadDocument(ipfsHash, fileName, fileSize, documentType) {
    // Send transaction to blockchain
    const tx = await this.contract.uploadDocument(
      ipfsHash,
      fileName,
      fileSize,
      documentType
    );
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    // Extract document ID from event
    const event = receipt.logs.find(log => {
      const parsed = this.contract.interface.parseLog(log);
      return parsed.name === 'DocumentUploaded';
    });
    
    const documentId = this.contract.interface.parseLog(event).args.documentId;
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      documentId: documentId
    };
  }
  
  async shareDocument(documentId, recipientWallet, permission) {
    const tx = await this.contract.shareDocument(
      documentId,
      recipientWallet,
      permission
    );
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  }
}

export default new BlockchainServiceV2();
```

### 6.3 IPFS/Pinata Service

**File:** `frontend/src/services/pinataService.js`

```javascript
import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

class PinataService {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
      uploadedBy: 'DocuChain',
      uploadDate: new Date().toISOString()
    });
    formData.append('pinataMetadata', metadata);
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );
    
    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    };
  }
  
  validateFile(file, maxSize = 50 * 1024 * 1024) {
    const errors = [];
    
    if (file.size > maxSize) {
      errors.push(`File too large (max ${maxSize / 1024 / 1024}MB)`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new PinataService();
```

---

## 7. File Upload Flow (Detailed)

### 7.1 Complete Upload Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Database Entry Creation (25% progress)              │
├─────────────────────────────────────────────────────────────┤
│ Frontend: hybridFileManagerService.createFile()             │
│ Backend: POST /api/documents/upload                         │
│ Action: Create document record with NULL ipfs_hash          │
│ Returns: Document UUID                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: IPFS Upload (50% progress)                          │
├─────────────────────────────────────────────────────────────┤
│ Frontend: pinataService.uploadFile()                        │
│ External: Pinata API                                        │
│ Action: Upload file to IPFS network                         │
│ Returns: IPFS hash (QmXxx...)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Blockchain Transaction (75% progress)               │
├─────────────────────────────────────────────────────────────┤
│ Frontend: blockchainServiceV2.uploadDocument()              │
│ User: Approve MetaMask transaction (ONE popup only)         │
│ Blockchain: Smart contract stores metadata                  │
│ Returns: Transaction hash, Block number, Document ID        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Update Database (100% progress)                     │
├─────────────────────────────────────────────────────────────┤
│ Frontend: axios.put() to update document                    │
│ Backend: PUT /api/documents/:id                             │
│ Action: Update ipfs_hash and document_id fields             │
│ Note: Version creation skipped (old ipfs_hash was NULL)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: UI Update                                           │
├─────────────────────────────────────────────────────────────┤
│ Frontend: loadBlockchainFiles()                             │
│ Action: Refresh file list                                   │
│ Result: User sees uploaded file                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Why This Flow?

**Problem Solved:** Previously, the system tried to upload to blockchain TWICE:
1. ❌ `hybridFileManagerService.createFile()` → called old blockchain service
2. ❌ `blockchainServiceV2.uploadDocument()` → called new blockchain service

**Result:** User saw TWO MetaMask transaction popups!

**Solution:**
- `hybridFileManagerService.createFile()` now ONLY creates database entry (no blockchain)
- `blockchainServiceV2.uploadDocument()` handles blockchain upload
- **Result:** ONE MetaMask popup ✅

---

## 8. File Sharing System

### 8.1 Sharing Architecture

**Key Design Decision:** Documents stay in their original location when shared.

```
BEFORE (Old System - WRONG):
Share document → Move to "Sent" folder → Document disappears from original location ❌

AFTER (Current System - CORRECT):
Share document → Create DocumentShare record → Document stays in place ✅
                → Sent folder shows via JOIN query
                → Received folder shows via JOIN query
```

### 8.2 Database Queries for Special Folders

**Sent Folder Query:**
```python
# backend/app/routes/documents.py
if folder.name == 'Sent':
    sent_docs_query = db.session.query(Document).join(
        DocumentShare, Document.id == DocumentShare.document_id
    ).filter(
        DocumentShare.shared_by_id == current_user_id,  # Documents I shared
        Document.is_active == True
    ).all()
```

**Received Folder Query:**
```python
# backend/app/routes/documents.py
if folder.name == 'Received':
    received_docs_query = db.session.query(Document).join(
        DocumentShare, Document.id == DocumentShare.document_id
    ).filter(
        DocumentShare.shared_with_id == current_user_id,  # Documents shared with me
        Document.is_active == True
    ).all()
```

**Folder Count Calculations:**
```python
# backend/app/models/folder.py
def to_dict(self):
    if self.name == 'Sent':
        document_count = db.session.query(func.count(Document.id)).join(
            DocumentShare
        ).filter(
            DocumentShare.shared_by_id == self.owner_id,
            Document.is_active == True
        ).scalar() or 0
    
    elif self.name == 'Received':
        document_count = db.session.query(func.count(Document.id)).join(
            DocumentShare
        ).filter(
            DocumentShare.shared_with_id == self.owner_id,
            Document.is_active == True
        ).scalar() or 0
    
    else:
        # Regular folder: count by folder_id
        document_count = self.documents.filter_by(is_active=True).count()
```

### 8.3 Frontend Handling

```javascript
// frontend/src/pages/shared/FileManagerNew.js

const loadBlockchainFiles = async () => {
  // Detect if current folder is special
  const currentFolder = folderStack[folderStack.length - 1];
  const isSpecialFolder = currentFolder && 
    (currentFolder.name === 'Received' || currentFolder.name === 'Sent');
  
  if (isSpecialFolder) {
    // Trust backend filtering - show ALL files returned
    setBlockchainFiles(documentsResponse.data.documents || []);
  } else {
    // Regular folder - filter by folder_id
    const filesInFolder = documentsResponse.data.documents.filter(
      doc => doc.folderId === currentFolderId
    );
    setBlockchainFiles(filesInFolder);
  }
};
```

---

## 9. Folder Management

### 9.1 System Folders

**Created Automatically:** When user registers, these folders are created:

```python
# backend/create_default_folders.py

DEFAULT_FOLDERS = [
    {
        'name': 'Shared',
        'is_system': True,
        'children': [
            {'name': 'Sent', 'is_system': True},
            {'name': 'Received', 'is_system': True}
        ]
    },
    {'name': 'Generated', 'is_system': True},
    {'name': 'Approved', 'is_system': True},
    {'name': 'Rejected', 'is_system': True},
]
```

**Protection:**
```python
# backend/app/routes/folders.py

@bp.route('/<folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    folder = Folder.query.get(folder_id)
    
    if folder.is_system_folder:
        return jsonify({
            'success': False,
            'error': 'Cannot delete system folder'
        }), 403
```

### 9.2 Folder Hierarchy

**Path Calculation:**
```python
# When creating folder
if parent_id:
    parent_folder = Folder.query.get(parent_id)
    folder_path = f"{parent_folder.path}/{folder_name}"
    level = parent_folder.level + 1
else:
    folder_path = f"/{folder_name}"
    level = 0
```

**Example Hierarchy:**
```
/ (root)
├── Shared (level 0, path: /Shared)
│   ├── Sent (level 1, path: /Shared/Sent)
│   └── Received (level 1, path: /Shared/Received)
├── Generated (level 0, path: /Generated)
├── My Documents (level 0, path: /My Documents)
│   ├── Work (level 1, path: /My Documents/Work)
│   │   └── Reports (level 2, path: /My Documents/Work/Reports)
│   └── Personal (level 1, path: /My Documents/Personal)
└── Projects (level 0, path: /Projects)
```

---

## 10. API Endpoints

### 10.1 Complete API Reference

#### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login and get JWT token
POST   /api/auth/verify-otp        - Verify OTP code
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with code
GET    /api/auth/me                - Get current user info
```

#### Documents
```
GET    /api/documents              - List documents in folder
POST   /api/documents/upload       - Create document entry
PUT    /api/documents/:id          - Update document (move, rename, content)
DELETE /api/documents/:id          - Delete document (soft delete)
GET    /api/documents/starred      - Get starred documents
PUT    /api/documents/:id/star     - Toggle star status
POST   /api/documents/:id/restore  - Restore from trash
```

#### Folders
```
GET    /api/folders                - List folders (with parent_id param)
POST   /api/folders                - Create new folder
PUT    /api/folders/:id            - Update folder
DELETE /api/folders/:id            - Delete folder (soft delete)
GET    /api/folders/starred        - Get starred folders
PUT    /api/folders/:id/star       - Toggle star status
```

#### Sharing
```
POST   /api/shares                 - Share document with user
GET    /api/shares/document/:id    - Get shares for document
DELETE /api/shares/:id             - Revoke share
GET    /api/shares/received        - Documents shared with me
GET    /api/shares/sent            - Documents I shared
```

#### Versions
```
GET    /api/versions/:document_id  - Get version history
POST   /api/versions/:document_id  - Create new version
GET    /api/versions/:version_id   - Get specific version details
```

#### Recent Activity
```
GET    /api/recent                 - Get recent activities
POST   /api/recent                 - Log new activity
```

---

## 11. Dependencies & Packages

### 11.1 Backend Dependencies

**File:** `backend/requirements.txt`

```txt
# Core Framework
Flask==2.3.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
Flask-JWT-Extended==4.5.2

# Database
psycopg2-binary==2.9.6
SQLAlchemy==2.0.19

# Security
bcrypt==4.0.1
python-dotenv==1.0.0

# Email
Flask-Mail==0.9.1

# Utilities
python-dateutil==2.8.2
```

**Installation:**
```bash
cd backend
pip install -r requirements.txt
```

### 11.2 Frontend Dependencies

**File:** `frontend/package.json`

```json
{
  "dependencies": {
    // Core React
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    
    // HTTP & Web3
    "axios": "^1.4.0",
    "ethers": "^6.7.0",
    
    // UI & Styling
    "tailwindcss": "^3.3.0",
    "@headlessui/react": "^1.7.15",
    "@heroicons/react": "^2.0.18",
    
    // Utilities
    "date-fns": "^2.30.0"
  }
}
```

**Installation:**
```bash
cd frontend
npm install
```

### 11.3 Blockchain Dependencies

**File:** `blockchain/package.json`

```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.17.0",
    "ethers": "^6.7.0"
  }
}
```

---

## 12. Security & Authentication

### 12.1 JWT Token Flow

```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token (expires in 24 hours)
   ↓
4. Frontend stores token in localStorage
   ↓
5. Frontend includes token in Authorization header for all API calls
   ↓
6. Backend validates token on each request (@token_required decorator)
```

### 12.2 Token Structure

```python
# backend/app/routes/auth.py

access_token = create_access_token(
    identity=str(user.id),  # User UUID
    expires_delta=timedelta(hours=24)
)

# Token is sent as:
# Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 12.3 Protected Routes

```python
@bp.route('/documents', methods=['GET'])
@token_required  # This decorator validates JWT
def list_documents():
    current_user_id = get_jwt_identity()  # Extract user ID from token
    # ... rest of logic
```

### 12.4 Data Validation

**Backend:**
```python
# Validate folder name
if not folder_name or folder_name.strip() == '':
    return jsonify({'error': 'Folder name required'}), 400

# Prevent duplicate folder names
existing = Folder.query.filter_by(
    name=folder_name,
    parent_id=parent_id,
    owner_id=current_user_id
).first()

if existing:
    return jsonify({'error': 'Folder already exists'}), 400
```

**Frontend:**
```javascript
// Validate file size
const maxSize = 50 * 1024 * 1024; // 50MB
if (file.size > maxSize) {
  showNotification('error', 'File too large (max 50MB)');
  return;
}

// Validate blockchain ID format
const isValidBlockchainId = blockchainId && 
  typeof blockchainId === 'string' && 
  blockchainId.startsWith('0x') && 
  blockchainId.length === 66;
```

---

## 13. Error Handling

### 13.1 Backend Error Handling

```python
try:
    # Database operation
    db.session.add(document)
    db.session.commit()
    
    return jsonify({'success': True, 'document': document.to_dict()}), 201
    
except Exception as e:
    db.session.rollback()  # Rollback on error
    print(f"❌ Error: {str(e)}")
    return jsonify({
        'success': False,
        'error': str(e)
    }), 500
```

### 13.2 Frontend Error Handling

```javascript
try {
  const response = await axios.post('/api/documents/upload', data);
  showNotification('success', 'Upload successful');
  
} catch (error) {
  console.error('Upload error:', error);
  
  // Show user-friendly error message
  const errorMessage = error.response?.data?.error || 
                       error.message || 
                       'Upload failed';
                       
  showNotification('error', errorMessage);
}
```

### 13.3 Blockchain Error Handling

```javascript
async uploadDocument(ipfsHash, fileName, fileSize, documentType) {
  try {
    const tx = await contract.uploadDocument(...);
    const receipt = await tx.wait();
    
    return { success: true, ...receipt };
    
  } catch (error) {
    console.error('Blockchain error:', error);
    
    // User rejected transaction
    if (error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    
    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH for gas fees');
    }
    
    throw new Error(error.message);
  }
}
```

---

## 14. Future Enhancements

### 14.1 Planned Features

#### Phase 1: Enhanced Collaboration
- [ ] Real-time collaboration (multiple users editing)
- [ ] Comment threads on documents
- [ ] @mentions in comments
- [ ] Activity notifications

#### Phase 2: Advanced Blockchain
- [ ] Multi-signature document approval
- [ ] Smart contract-based workflow automation
- [ ] Document expiration on blockchain
- [ ] Encrypted document storage

#### Phase 3: Mobile & Desktop
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Offline mode with sync
- [ ] Background upload queue

#### Phase 4: AI & Analytics
- [ ] AI-powered document classification
- [ ] OCR for scanned documents
- [ ] Document similarity detection
- [ ] Usage analytics dashboard

### 14.2 Performance Optimizations

#### Current Optimizations:
✅ Pagination for large file lists
✅ Lazy loading of folder contents
✅ Debounced search
✅ Cached folder counts

#### Future Optimizations:
- [ ] Virtual scrolling for large lists
- [ ] Image thumbnails with lazy loading
- [ ] WebSocket for real-time updates
- [ ] CDN for static assets
- [ ] Database query optimization (indexes, caching)

### 14.3 Security Enhancements

#### Current Security:
✅ JWT authentication
✅ Password hashing (bcrypt)
✅ CORS protection
✅ Input validation
✅ System folder protection

#### Future Security:
- [ ] Two-factor authentication (2FA)
- [ ] File encryption at rest
- [ ] Audit logs for all actions
- [ ] IP whitelisting
- [ ] Rate limiting on API endpoints
- [ ] Document watermarking
- [ ] Blockchain-based access control

---

## 15. Troubleshooting Guide

### 15.1 Common Issues

#### Issue: "MetaMask popup appears twice during upload"
**Solution:** ✅ FIXED - Removed duplicate blockchain upload from `hybridFileManagerService.createFile()`

#### Issue: "Received folder shows empty"
**Cause:** Type mismatch - `folder.owner_id` (UUID) vs `current_user_id` (string)
**Solution:** ✅ FIXED - Convert both to strings: `str(folder.owner_id) == str(current_user_id)`

#### Issue: "Shared documents disappear from original location"
**Cause:** Old code moved documents to Sent folder
**Solution:** ✅ FIXED - Documents now stay in place, Sent/Received show via JOIN queries

#### Issue: "Upload fails with 'ipfs_hash cannot be null'"
**Cause:** Database required ipfs_hash before blockchain upload completed
**Solution:** ✅ FIXED - Made `ipfs_hash` and `document_id` nullable in schema

#### Issue: "Version creation fails on initial upload"
**Cause:** Tried to create version with NULL old IPFS hash
**Solution:** ✅ FIXED - Skip version creation when `old_ipfs_hash` is None

### 15.2 Debug Commands

```bash
# Check database schema
python backend/init_db.py

# List all API routes
python backend/list_routes.py

# Run comprehensive tests
python backend/test_filemanager_comprehensive.py

# Check folder structure
SELECT id, name, parent_id, path, is_system_folder 
FROM folders 
WHERE owner_id = '<user_id>' 
ORDER BY path;

# Check document shares
SELECT d.file_name, u1.email as shared_by, u2.email as shared_with, ds.permission
FROM document_shares ds
JOIN documents d ON ds.document_id = d.id
JOIN users u1 ON ds.shared_by_id = u1.id
JOIN users u2 ON ds.shared_with_id = u2.id;
```

---

## 16. Deployment Checklist

### 16.1 Pre-Deployment

- [ ] Remove all `console.log()` statements from production frontend
- [ ] Remove DEBUG print statements from backend
- [ ] Set `DEBUG=False` in Flask config
- [ ] Update environment variables in `.env`
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Update Pinata API keys
- [ ] Update blockchain contract address
- [ ] Run database migrations
- [ ] Create default folders for existing users
- [ ] Run comprehensive tests

### 16.2 Database Setup

```bash
# Production database setup
cd backend
python init_db.py
python create_default_folders.py

# Verify setup
python test_filemanager_comprehensive.py
```

### 16.3 Environment Variables

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:pass@localhost/docuchain
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET_API_KEY=your-pinata-secret
REACT_APP_PINATA_JWT=your-pinata-jwt
REACT_APP_BLOCKCHAIN_CONTRACT_ADDRESS=0xb19f78B9c32dceaA01DE778Fa46784F5437DF373
```

---

## 17. Maintenance & Monitoring

### 17.1 Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check blockchain transaction success rate
- Review IPFS pin status

**Weekly:**
- Database backup
- Clear soft-deleted items (is_active=False)
- Review user feedback

**Monthly:**
- Update dependencies
- Security audit
- Performance optimization review
- Cost analysis (IPFS storage, gas fees)

### 17.2 Monitoring Metrics

**System Health:**
- API response time
- Database query performance
- IPFS upload success rate
- Blockchain transaction success rate
- Error rate by endpoint

**User Metrics:**
- Active users
- Documents uploaded per day
- Average file size
- Shares per document
- Most used features

**Cost Metrics:**
- IPFS storage costs (Pinata)
- Ethereum gas fees
- Database size growth
- Bandwidth usage

---

## 18. Contact & Support

**Documentation Maintained By:** DocuChain Development Team  
**Last Updated:** November 2, 2025  
**Version:** 1.0 (Production Ready)

For questions or issues:
1. Check this documentation first
2. Review troubleshooting guide
3. Check error logs
4. Contact development team

---

## 19. Glossary

- **IPFS:** InterPlanetary File System - Decentralized file storage
- **Pinata:** IPFS pinning service (keeps files available)
- **JWT:** JSON Web Token - Authentication mechanism
- **MetaMask:** Browser extension for Ethereum wallet
- **Sepolia:** Ethereum test network
- **Gas:** Transaction fee on Ethereum
- **UUID:** Universally Unique Identifier
- **Soft Delete:** Marking record as inactive instead of deleting
- **ORM:** Object-Relational Mapping (SQLAlchemy)
- **ABI:** Application Binary Interface (for smart contracts)

---

**END OF DOCUMENTATION**
