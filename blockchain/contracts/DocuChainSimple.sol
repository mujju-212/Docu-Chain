// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocuChainSimple {
    // Enums
    enum AccessType { NONE, READ, WRITE }
    
    // Structs
    struct Document {
        uint256 id;
        string fileName;
        string ipfsHash;
        address owner;
        uint256 folderId;
        uint256 fileSize;
        string fileType;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 currentVersion;
        bool isActive;
    }
    
    struct DocumentVersion {
        uint256 versionNumber;
        string ipfsHash;
        string fileName;
        uint256 fileSize;
        address updatedBy;
        uint256 timestamp;
        string changeLog;
    }
    
    struct Folder {
        uint256 id;
        string name;
        uint256 parentId;
        address owner;
        uint256 createdAt;
        bool isActive;
    }
    
    struct AccessPermission {
        address user;
        AccessType accessType;
        uint256 grantedAt;
        address grantedBy;
        bool isActive;
    }
    
    // State variables
    mapping(uint256 => Document) public documents;
    mapping(uint256 => Folder) public folders;
    mapping(uint256 => mapping(uint256 => DocumentVersion)) public documentVersions;
    mapping(uint256 => mapping(address => AccessPermission)) public documentAccess;
    mapping(uint256 => mapping(address => AccessPermission)) public folderAccess;
    mapping(address => uint256[]) public userDocuments;
    mapping(address => uint256[]) public userFolders;
    mapping(uint256 => uint256[]) public folderDocuments;
    mapping(uint256 => uint256[]) public folderSubfolders;
    
    uint256 public documentCounter;
    uint256 public folderCounter;
    string public institutionName;
    
    // Events
    event DocumentUploaded(uint256 indexed documentId, string fileName, address indexed owner, uint256 folderId);
    event DocumentUpdated(uint256 indexed documentId, uint256 newVersion, address indexed updatedBy);
    event DocumentShared(uint256 indexed documentId, address indexed sharedWith, AccessType accessType, address indexed sharedBy);
    event FolderCreated(uint256 indexed folderId, string name, address indexed owner, uint256 parentId);
    event FolderShared(uint256 indexed folderId, address indexed sharedWith, AccessType accessType, address indexed sharedBy);
    event AccessRevoked(uint256 indexed documentId, address indexed user, address indexed revokedBy);
    
    // Modifiers
    modifier onlyDocumentOwner(uint256 _documentId) {
        require(documents[_documentId].owner == msg.sender, "Not document owner");
        _;
    }
    
    modifier onlyFolderOwner(uint256 _folderId) {
        require(folders[_folderId].owner == msg.sender, "Not folder owner");
        _;
    }
    
    modifier hasDocumentAccess(uint256 _documentId, AccessType _minAccess) {
        require(
            documents[_documentId].owner == msg.sender ||
            (documentAccess[_documentId][msg.sender].isActive && 
             documentAccess[_documentId][msg.sender].accessType >= _minAccess),
            "Insufficient access permissions"
        );
        _;
    }
    
    constructor(string memory _institutionName) {
        institutionName = _institutionName;
        documentCounter = 0;
        folderCounter = 0;
    }
    
    // Folder Management
    function createFolder(
        string memory _name,
        uint256 _parentId
    ) public returns (uint256) {
        folderCounter++;
        
        folders[folderCounter] = Folder({
            id: folderCounter,
            name: _name,
            parentId: _parentId,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        userFolders[msg.sender].push(folderCounter);
        
        if (_parentId > 0) {
            folderSubfolders[_parentId].push(folderCounter);
        }
        
        emit FolderCreated(folderCounter, _name, msg.sender, _parentId);
        return folderCounter;
    }
    
    // Document Management - No registration required
    function uploadDocument(
        string memory _fileName,
        string memory _ipfsHash,
        uint256 _folderId,
        uint256 _fileSize,
        string memory _fileType
    ) public returns (uint256) {
        documentCounter++;
        
        documents[documentCounter] = Document({
            id: documentCounter,
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            folderId: _folderId,
            fileSize: _fileSize,
            fileType: _fileType,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            currentVersion: 1,
            isActive: true
        });
        
        // Create first version
        documentVersions[documentCounter][1] = DocumentVersion({
            versionNumber: 1,
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            fileSize: _fileSize,
            updatedBy: msg.sender,
            timestamp: block.timestamp,
            changeLog: "Initial upload"
        });
        
        userDocuments[msg.sender].push(documentCounter);
        
        if (_folderId > 0) {
            folderDocuments[_folderId].push(documentCounter);
        }
        
        emit DocumentUploaded(documentCounter, _fileName, msg.sender, _folderId);
        return documentCounter;
    }
    
    function updateDocument(
        uint256 _documentId,
        string memory _newIpfsHash,
        string memory _newFileName,
        uint256 _newFileSize,
        string memory _changeLog
    ) public hasDocumentAccess(_documentId, AccessType.WRITE) {
        require(documents[_documentId].isActive, "Document not found");
        
        Document storage doc = documents[_documentId];
        doc.currentVersion++;
        doc.ipfsHash = _newIpfsHash;
        doc.fileName = _newFileName;
        doc.fileSize = _newFileSize;
        doc.updatedAt = block.timestamp;
        
        // Create new version
        documentVersions[_documentId][doc.currentVersion] = DocumentVersion({
            versionNumber: doc.currentVersion,
            ipfsHash: _newIpfsHash,
            fileName: _newFileName,
            fileSize: _newFileSize,
            updatedBy: msg.sender,
            timestamp: block.timestamp,
            changeLog: _changeLog
        });
        
        emit DocumentUpdated(_documentId, doc.currentVersion, msg.sender);
    }
    
    // Sharing and Access Control
    function shareDocument(
        uint256 _documentId,
        address _userAddress,
        AccessType _accessType
    ) public onlyDocumentOwner(_documentId) {
        require(documents[_documentId].isActive, "Document not found");
        require(_userAddress != address(0), "Invalid user address");
        
        documentAccess[_documentId][_userAddress] = AccessPermission({
            user: _userAddress,
            accessType: _accessType,
            grantedAt: block.timestamp,
            grantedBy: msg.sender,
            isActive: true
        });
        
        emit DocumentShared(_documentId, _userAddress, _accessType, msg.sender);
    }
    
    function shareFolder(
        uint256 _folderId,
        address _userAddress,
        AccessType _accessType
    ) public onlyFolderOwner(_folderId) {
        require(folders[_folderId].isActive, "Folder not found");
        require(_userAddress != address(0), "Invalid user address");
        
        folderAccess[_folderId][_userAddress] = AccessPermission({
            user: _userAddress,
            accessType: _accessType,
            grantedAt: block.timestamp,
            grantedBy: msg.sender,
            isActive: true
        });
        
        emit FolderShared(_folderId, _userAddress, _accessType, msg.sender);
    }
    
    function revokeDocumentAccess(
        uint256 _documentId,
        address _userAddress
    ) public onlyDocumentOwner(_documentId) {
        documentAccess[_documentId][_userAddress].isActive = false;
        emit AccessRevoked(_documentId, _userAddress, msg.sender);
    }
    
    // View Functions
    function getDocument(uint256 _documentId) public view returns (Document memory) {
        return documents[_documentId];
    }
    
    function getDocumentVersion(
        uint256 _documentId,
        uint256 _version
    ) public view hasDocumentAccess(_documentId, AccessType.READ) returns (DocumentVersion memory) {
        return documentVersions[_documentId][_version];
    }
    
    function getUserDocuments(address _userAddress) public view returns (uint256[] memory) {
        return userDocuments[_userAddress];
    }
    
    function getUserFolders(address _userAddress) public view returns (uint256[] memory) {
        return userFolders[_userAddress];
    }
    
    function getFolderDocuments(uint256 _folderId) public view returns (uint256[] memory) {
        return folderDocuments[_folderId];
    }
    
    function getDocumentAccess(
        uint256 _documentId,
        address _userAddress
    ) public view returns (AccessPermission memory) {
        return documentAccess[_documentId][_userAddress];
    }
    
    function hasDocumentPermission(
        uint256 _documentId,
        address _userAddress,
        AccessType _accessType
    ) public view returns (bool) {
        if (documents[_documentId].owner == _userAddress) {
            return true;
        }
        
        AccessPermission memory access = documentAccess[_documentId][_userAddress];
        return access.isActive && access.accessType >= _accessType;
    }
    
    // Get all documents shared with a user
    function getSharedDocuments(address _userAddress) public view returns (uint256[] memory) {
        uint256[] memory allDocs = new uint256[](documentCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= documentCounter; i++) {
            if (documents[i].isActive && 
                documentAccess[i][_userAddress].isActive &&
                documents[i].owner != _userAddress) {
                allDocs[count] = i;
                count++;
            }
        }
        
        // Create array with exact size
        uint256[] memory sharedDocs = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            sharedDocs[i] = allDocs[i];
        }
        
        return sharedDocs;
    }
    
    // Get document count for a user
    function getUserDocumentCount(address _userAddress) public view returns (uint256) {
        return userDocuments[_userAddress].length;
    }
    
    // Get folder count for a user  
    function getUserFolderCount(address _userAddress) public view returns (uint256) {
        return userFolders[_userAddress].length;
    }
}