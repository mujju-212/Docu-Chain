// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DocumentManager
 * @dev Manages document storage, sharing, and verification on blockchain
 */
contract DocumentManager is AccessControl, ReentrancyGuard, Pausable {
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
        string newIpfsHash,
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
            documentType: _documentType
        });

        documentExists[documentId] = true;
        ownerDocuments[msg.sender].push(documentId);

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
     * @dev Share a document with another user
     * @param _documentId ID of the document to share
     * @param _shareWith Address to share with
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

        // Add share
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
     * @dev Update document IPFS hash (for new versions)
     * @param _documentId ID of the document
     * @param _newIpfsHash New IPFS hash
     */
    function updateDocument(bytes32 _documentId, string memory _newIpfsHash)
        external
        whenNotPaused
    {
        require(documentExists[_documentId], "Document does not exist");
        require(
            documents[_documentId].owner == msg.sender,
            "Only owner can update document"
        );
        require(documents[_documentId].isActive, "Document is not active");

        documents[_documentId].ipfsHash = _newIpfsHash;

        emit DocumentUpdated(_documentId, _newIpfsHash, block.timestamp);
    }

    /**
     * @dev Verify document authenticity
     * @param _documentId ID of the document
     * @param _ipfsHash IPFS hash to verify
     * @return bool True if document is valid and hash matches
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
