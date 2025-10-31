// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DocumentManagerV2
 * @dev Enhanced document management with multi-wallet support and collaborative editing
 * @notice This version supports:
 *   - Multiple wallets per user
 *   - Write permission holders can update documents
 *   - Share revocation
 *   - Enhanced permission management
 */
contract DocumentManagerV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Document {
        string ipfsHash;
        address owner;
        uint256 timestamp;
        string fileName;
        uint256 fileSize;
        bool isActive;
        string documentType;
        uint256 version; // Track document versions
    }

    struct DocumentShare {
        address sharedWith;
        string permission; // "read" or "write"
        uint256 timestamp;
        bool isActive;
    }

    // Mapping from document ID to Document
    mapping(bytes32 => Document) public documents;
    
    // Mapping from document ID to array of shares
    mapping(bytes32 => DocumentShare[]) public documentShares;
    
    // Mapping from owner address to their document IDs
    mapping(address => bytes32[]) public ownerDocuments;
    
    // Mapping to check if document ID exists
    mapping(bytes32 => bool) public documentExists;
    
    // Mapping to track document update history
    mapping(bytes32 => mapping(uint256 => string)) public documentHistory; // documentId => version => ipfsHash

    // Events
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

    event DocumentDeactivated(
        bytes32 indexed documentId,
        address indexed owner,
        uint256 timestamp
    );

    event DocumentUpdated(
        bytes32 indexed documentId,
        address indexed updatedBy,
        string newIpfsHash,
        uint256 version,
        uint256 timestamp
    );

    event ShareRevoked(
        bytes32 indexed documentId,
        address indexed owner,
        address indexed revokedFrom,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev Upload a new document to the blockchain
     * @param _ipfsHash IPFS hash of the document
     * @param _fileName Name of the file
     * @param _fileSize Size of the file in bytes
     * @param _documentType Type of document (e.g., "certificate", "transcript")
     * @return documentId Unique identifier for the document
     */
    function uploadDocument(
        string memory _ipfsHash,
        string memory _fileName,
        uint256 _fileSize,
        string memory _documentType
    ) external whenNotPaused returns (bytes32) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(_fileSize > 0, "File size must be greater than 0");

        // Generate unique document ID
        bytes32 documentId = keccak256(
            abi.encodePacked(
                _ipfsHash,
                msg.sender,
                block.timestamp,
                _fileName
            )
        );

        require(!documentExists[documentId], "Document already exists");

        // Store document
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
        
        // Store initial version in history
        documentHistory[documentId][1] = _ipfsHash;

        emit DocumentUploaded(
            documentId,
            msg.sender,
            _ipfsHash,
            _fileName,
            block.timestamp
        );

        return documentId;
    }

    /**
     * @dev Share a document with another user (or another wallet of same user)
     * @param _documentId ID of the document to share
     * @param _shareWith Address to share with (can be another wallet of same user)
     * @param _permission Permission level ("read" or "write")
     */
    function shareDocument(
        bytes32 _documentId,
        address _shareWith,
        string memory _permission
    ) external whenNotPaused nonReentrant {
        require(documentExists[_documentId], "Document does not exist");
        require(_shareWith != address(0), "Invalid address");
        require(
            documents[_documentId].owner == msg.sender,
            "Only owner can share document"
        );
        require(documents[_documentId].isActive, "Document is not active");
        
        // Validate permission type
        require(
            keccak256(bytes(_permission)) == keccak256(bytes("read")) ||
            keccak256(bytes(_permission)) == keccak256(bytes("write")),
            "Invalid permission type. Use 'read' or 'write'"
        );

        // Check if already shared with this address
        DocumentShare[] storage shares = documentShares[_documentId];
        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _shareWith && shares[i].isActive) {
                // Update existing share permission
                shares[i].permission = _permission;
                shares[i].timestamp = block.timestamp;
                
                emit DocumentShared(
                    _documentId,
                    msg.sender,
                    _shareWith,
                    _permission,
                    block.timestamp
                );
                return;
            }
        }

        // Add new share
        documentShares[_documentId].push(
            DocumentShare({
                sharedWith: _shareWith,
                permission: _permission,
                timestamp: block.timestamp,
                isActive: true
            })
        );

        emit DocumentShared(
            _documentId,
            msg.sender,
            _shareWith,
            _permission,
            block.timestamp
        );
    }

    /**
     * @dev Revoke share permission for a specific user
     * @param _documentId ID of the document
     * @param _revokeFrom Address to revoke permission from
     */
    function revokeShare(
        bytes32 _documentId,
        address _revokeFrom
    ) external whenNotPaused {
        require(documentExists[_documentId], "Document does not exist");
        require(
            documents[_documentId].owner == msg.sender,
            "Only owner can revoke shares"
        );

        DocumentShare[] storage shares = documentShares[_documentId];
        bool found = false;

        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _revokeFrom && shares[i].isActive) {
                shares[i].isActive = false;
                found = true;
                
                emit ShareRevoked(
                    _documentId,
                    msg.sender,
                    _revokeFrom,
                    block.timestamp
                );
                break;
            }
        }

        require(found, "No active share found for this address");
    }

    /**
     * @dev Check if an address has write permission for a document
     * @param _documentId ID of the document
     * @param _user Address to check
     * @return bool True if user has write permission
     */
    function hasWritePermission(bytes32 _documentId, address _user)
        public
        view
        returns (bool)
    {
        // Owner always has write permission
        if (documents[_documentId].owner == _user) {
            return true;
        }

        // Check if user has been granted write permission
        DocumentShare[] memory shares = documentShares[_documentId];
        for (uint i = 0; i < shares.length; i++) {
            if (
                shares[i].sharedWith == _user &&
                shares[i].isActive &&
                keccak256(bytes(shares[i].permission)) == keccak256(bytes("write"))
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Check if an address has read permission for a document
     * @param _documentId ID of the document
     * @param _user Address to check
     * @return bool True if user has read permission
     */
    function hasReadPermission(bytes32 _documentId, address _user)
        public
        view
        returns (bool)
    {
        // Owner always has read permission
        if (documents[_documentId].owner == _user) {
            return true;
        }

        // Check if user has been granted any permission
        DocumentShare[] memory shares = documentShares[_documentId];
        for (uint i = 0; i < shares.length; i++) {
            if (shares[i].sharedWith == _user && shares[i].isActive) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Update document IPFS hash (for new versions)
     * @notice Can be called by owner OR anyone with write permission
     * @param _documentId ID of the document
     * @param _newIpfsHash New IPFS hash
     */
    function updateDocument(bytes32 _documentId, string memory _newIpfsHash)
        external
        whenNotPaused
    {
        require(documentExists[_documentId], "Document does not exist");
        require(documents[_documentId].isActive, "Document is not active");
        require(bytes(_newIpfsHash).length > 0, "IPFS hash cannot be empty");
        
        // ✅ ENHANCED: Allow owner OR write permission holders
        require(
            documents[_documentId].owner == msg.sender || 
            hasWritePermission(_documentId, msg.sender),
            "No permission to update document"
        );

        // Increment version
        documents[_documentId].version++;
        uint256 newVersion = documents[_documentId].version;
        
        // Update IPFS hash
        documents[_documentId].ipfsHash = _newIpfsHash;
        
        // Store in history
        documentHistory[_documentId][newVersion] = _newIpfsHash;

        emit DocumentUpdated(
            _documentId, 
            msg.sender,
            _newIpfsHash, 
            newVersion,
            block.timestamp
        );
    }

    /**
     * @dev Get document details
     * @param _documentId ID of the document
     * @return Document struct
     */
    function getDocument(bytes32 _documentId)
        external
        view
        returns (Document memory)
    {
        require(documentExists[_documentId], "Document does not exist");
        return documents[_documentId];
    }

    /**
     * @dev Get specific version of a document
     * @param _documentId ID of the document
     * @param _version Version number
     * @return ipfsHash IPFS hash of that version
     */
    function getDocumentVersion(bytes32 _documentId, uint256 _version)
        external
        view
        returns (string memory)
    {
        require(documentExists[_documentId], "Document does not exist");
        require(_version > 0 && _version <= documents[_documentId].version, "Invalid version");
        return documentHistory[_documentId][_version];
    }

    /**
     * @dev Get all documents owned by an address
     * @param _owner Owner address
     * @return Array of document IDs
     */
    function getOwnerDocuments(address _owner)
        external
        view
        returns (bytes32[] memory)
    {
        return ownerDocuments[_owner];
    }

    /**
     * @dev Get shares for a document
     * @param _documentId ID of the document
     * @return Array of DocumentShare structs
     */
    function getDocumentShares(bytes32 _documentId)
        external
        view
        returns (DocumentShare[] memory)
    {
        require(documentExists[_documentId], "Document does not exist");
        return documentShares[_documentId];
    }

    /**
     * @dev Get active shares for a document (excludes revoked shares)
     * @param _documentId ID of the document
     * @return Array of active DocumentShare structs
     */
    function getActiveDocumentShares(bytes32 _documentId)
        external
        view
        returns (DocumentShare[] memory)
    {
        require(documentExists[_documentId], "Document does not exist");
        
        DocumentShare[] memory allShares = documentShares[_documentId];
        
        // Count active shares
        uint256 activeCount = 0;
        for (uint i = 0; i < allShares.length; i++) {
            if (allShares[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active shares
        DocumentShare[] memory activeShares = new DocumentShare[](activeCount);
        uint256 index = 0;
        for (uint i = 0; i < allShares.length; i++) {
            if (allShares[i].isActive) {
                activeShares[index] = allShares[i];
                index++;
            }
        }
        
        return activeShares;
    }

    /**
     * @dev Deactivate a document (soft delete)
     * @param _documentId ID of the document
     */
    function deactivateDocument(bytes32 _documentId)
        external
        whenNotPaused
    {
        require(documentExists[_documentId], "Document does not exist");
        require(
            documents[_documentId].owner == msg.sender ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        documents[_documentId].isActive = false;

        emit DocumentDeactivated(_documentId, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify document authenticity
     * @param _documentId ID of the document
     * @param _ipfsHash IPFS hash to verify
     * @return bool True if document is valid and hash matches current version
     */
    function verifyDocument(bytes32 _documentId, string memory _ipfsHash)
        external
        view
        returns (bool)
    {
        if (!documentExists[_documentId]) {
            return false;
        }

        Document memory doc = documents[_documentId];
        return
            doc.isActive &&
            keccak256(abi.encodePacked(doc.ipfsHash)) ==
            keccak256(abi.encodePacked(_ipfsHash));
    }

    /**
     * @dev Verify a specific version of a document
     * @param _documentId ID of the document
     * @param _ipfsHash IPFS hash to verify
     * @param _version Version number to check against
     * @return bool True if hash matches the specified version
     */
    function verifyDocumentVersion(
        bytes32 _documentId, 
        string memory _ipfsHash,
        uint256 _version
    ) external view returns (bool) {
        if (!documentExists[_documentId]) {
            return false;
        }
        
        if (_version < 1 || _version > documents[_documentId].version) {
            return false;
        }
        
        string memory versionHash = documentHistory[_documentId][_version];
        return keccak256(abi.encodePacked(versionHash)) == 
               keccak256(abi.encodePacked(_ipfsHash));
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
