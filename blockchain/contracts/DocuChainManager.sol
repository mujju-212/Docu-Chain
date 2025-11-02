// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocuChainManager {
    // Enums
    enum AccessType { NONE, READ, WRITE }
    enum UserType { STUDENT, FACULTY, ADMIN }
    
    // Structs
    struct User {
        address userAddress;
        string username;
        string email;
        UserType userType;
        bool isActive;
        string institutionId;
    }
    
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
    
    struct Connection {
        address user1;
        address user2;
        uint256 connectedAt;
        bool isActive;
    }
    
    // State variables
    mapping(address => User) public users;
    mapping(uint256 => Document) public documents;
    mapping(uint256 => Folder) public folders;
    mapping(uint256 => mapping(uint256 => DocumentVersion)) public documentVersions;
    mapping(uint256 => mapping(address => AccessPermission)) public documentAccess;
    mapping(uint256 => mapping(address => AccessPermission)) public folderAccess;
    mapping(address => mapping(address => Connection)) public connections;
    mapping(address => uint256[]) public userDocuments;
    mapping(address => uint256[]) public userFolders;
    mapping(uint256 => uint256[]) public folderDocuments;
    mapping(uint256 => uint256[]) public folderSubfolders;
    mapping(address => address[]) public userConnections;
    
    uint256 public documentCounter;
    uint256 public folderCounter;
    string public institutionName;
    
    // Events
    event UserRegistered(address indexed user, string username, UserType userType);
    event DocumentUploaded(uint256 indexed documentId, string fileName, address indexed owner, uint256 folderId);
    event DocumentUpdated(uint256 indexed documentId, uint256 newVersion, address indexed updatedBy);
    event DocumentShared(uint256 indexed documentId, address indexed sharedWith, AccessType accessType, address indexed sharedBy);
    event FolderCreated(uint256 indexed folderId, string name, address indexed owner, uint256 parentId);
    event FolderShared(uint256 indexed folderId, address indexed sharedWith, AccessType accessType, address indexed sharedBy);
    event UsersConnected(address indexed user1, address indexed user2);
    event AccessRevoked(uint256 indexed documentId, address indexed user, address indexed revokedBy);
    
    // Modifiers
    modifier onlyRegisteredUser() {
        require(users[msg.sender].isActive, "User not registered");
        _;
    }
    
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
    
    // User Management
    function registerUser(
        string memory _username,
        string memory _email,
        UserType _userType,
        string memory _institutionId
    ) public {
        require(!users[msg.sender].isActive, "User already registered");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            email: _email,
            userType: _userType,
            isActive: true,
            institutionId: _institutionId
        });
        
        emit UserRegistered(msg.sender, _username, _userType);
    }
    
    function updateUserProfile(
        string memory _username,
        string memory _email
    ) public onlyRegisteredUser {
        users[msg.sender].username = _username;
        users[msg.sender].email = _email;
    }
    
    // Connection Management
    function connectWithUser(address _userAddress) public onlyRegisteredUser {
        require(users[_userAddress].isActive, "Target user not registered");
        require(_userAddress != msg.sender, "Cannot connect with yourself");
        require(!connections[msg.sender][_userAddress].isActive, "Already connected");
        
        // Create bidirectional connection
        connections[msg.sender][_userAddress] = Connection({
            user1: msg.sender,
            user2: _userAddress,
            connectedAt: block.timestamp,
            isActive: true
        });
        
        connections[_userAddress][msg.sender] = Connection({
            user1: _userAddress,
            user2: msg.sender,
            connectedAt: block.timestamp,
            isActive: true
        });
        
        userConnections[msg.sender].push(_userAddress);
        userConnections[_userAddress].push(msg.sender);
        
        emit UsersConnected(msg.sender, _userAddress);
    }
    
    function disconnectUser(address _userAddress) public onlyRegisteredUser {
        require(connections[msg.sender][_userAddress].isActive, "Not connected");
        
        connections[msg.sender][_userAddress].isActive = false;
        connections[_userAddress][msg.sender].isActive = false;
        
        // Remove from connection arrays
        _removeFromArray(userConnections[msg.sender], _userAddress);
        _removeFromArray(userConnections[_userAddress], msg.sender);
    }
    
    // Folder Management
    function createFolder(
        string memory _name,
        uint256 _parentId
    ) public onlyRegisteredUser returns (uint256) {
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
    
    // Document Management
    function uploadDocument(
        string memory _fileName,
        string memory _ipfsHash,
        uint256 _folderId,
        uint256 _fileSize,
        string memory _fileType
    ) public onlyRegisteredUser returns (uint256) {
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
        require(users[_userAddress].isActive, "Target user not registered");
        require(documents[_documentId].isActive, "Document not found");
        
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
        require(users[_userAddress].isActive, "Target user not registered");
        require(folders[_folderId].isActive, "Folder not found");
        
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
    
    function getUserConnections(address _userAddress) public view returns (address[] memory) {
        return userConnections[_userAddress];
    }
    
    function getDocumentAccess(
        uint256 _documentId,
        address _userAddress
    ) public view returns (AccessPermission memory) {
        return documentAccess[_documentId][_userAddress];
    }
    
    function isConnected(address _user1, address _user2) public view returns (bool) {
        return connections[_user1][_user2].isActive;
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
    
    // Utility Functions
    function _removeFromArray(address[] storage _array, address _element) internal {
        for (uint256 i = 0; i < _array.length; i++) {
            if (_array[i] == _element) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }
    
    // Search Functions
    function searchUsersByInstitution(
        string memory _institutionId
    ) public view returns (address[] memory) {
        // This would need to be implemented with a separate mapping
        // for efficient searching in a real implementation
        address[] memory result = new address[](0);
        return result;
    }
    
    function getAllUsers() public view returns (address[] memory) {
        // This would need a separate array to track all users
        // for efficient retrieval in a real implementation
        address[] memory result = new address[](0);
        return result;
    }
}