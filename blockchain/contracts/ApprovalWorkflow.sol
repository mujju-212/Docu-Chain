// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ApprovalWorkflow
 * @dev Manages document approval workflow with digital signatures
 */
contract ApprovalWorkflow is AccessControl, ReentrancyGuard {
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    enum ApprovalStatus {
        Pending,
        Approved,
        Rejected
    }

    enum ProcessType {
        Sequential,
        Parallel
    }

    struct ApprovalRequest {
        bytes32 documentId;
        address requester;
        address[] approvers;
        mapping(address => bool) hasApproved;
        mapping(address => string) signatures;
        uint256 approvalCount;
        ApprovalStatus status;
        ProcessType processType;
        uint256 currentApproverIndex;
        string purpose;
        uint256 timestamp;
    }

    // Mapping from request ID to ApprovalRequest
    mapping(bytes32 => ApprovalRequest) public approvalRequests;
    
    // Mapping from approver to their pending requests
    mapping(address => bytes32[]) public pendingApprovals;
    
    // Mapping to check if request exists
    mapping(bytes32 => bool) public requestExists;

    // Events
    event ApprovalRequested(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        address indexed requester,
        address[] approvers,
        ProcessType processType,
        uint256 timestamp
    );

    event DocumentApproved(
        bytes32 indexed requestId,
        address indexed approver,
        string signature,
        uint256 timestamp
    );

    event DocumentRejected(
        bytes32 indexed requestId,
        address indexed approver,
        string reason,
        uint256 timestamp
    );

    event ApprovalCompleted(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Request approval for a document
     * @param _documentId ID of the document
     * @param _approvers Array of approver addresses
     * @param _processType Sequential or Parallel
     * @param _purpose Purpose of the approval
     * @return requestId Unique identifier for the request
     */
    function requestApproval(
        bytes32 _documentId,
        address[] memory _approvers,
        ProcessType _processType,
        string memory _purpose
    ) external nonReentrant returns (bytes32) {
        require(_approvers.length > 0, "At least one approver required");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");

        // Generate unique request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                _documentId,
                msg.sender,
                block.timestamp
            )
        );

        require(!requestExists[requestId], "Request already exists");

        // Create approval request
        ApprovalRequest storage request = approvalRequests[requestId];
        request.documentId = _documentId;
        request.requester = msg.sender;
        request.approvers = _approvers;
        request.status = ApprovalStatus.Pending;
        request.processType = _processType;
        request.currentApproverIndex = 0;
        request.purpose = _purpose;
        request.timestamp = block.timestamp;

        requestExists[requestId] = true;

        // Add to pending approvals for each approver
        for (uint256 i = 0; i < _approvers.length; i++) {
            pendingApprovals[_approvers[i]].push(requestId);
        }

        emit ApprovalRequested(
            requestId,
            _documentId,
            msg.sender,
            _approvers,
            _processType,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @dev Approve a document
     * @param _requestId ID of the approval request
     * @param _signature Digital signature (optional)
     */
    function approveDocument(bytes32 _requestId, string memory _signature)
        external
        nonReentrant
    {
        require(requestExists[_requestId], "Request does not exist");
        
        ApprovalRequest storage request = approvalRequests[_requestId];
        require(
            request.status == ApprovalStatus.Pending,
            "Request is not pending"
        );

        bool isApprover = false;
        for (uint256 i = 0; i < request.approvers.length; i++) {
            if (request.approvers[i] == msg.sender) {
                isApprover = true;
                break;
            }
        }
        require(isApprover, "Not an approver for this request");

        require(!request.hasApproved[msg.sender], "Already approved");

        // For sequential process, check if it's the current approver's turn
        if (request.processType == ProcessType.Sequential) {
            require(
                request.approvers[request.currentApproverIndex] == msg.sender,
                "Not your turn to approve"
            );
            request.currentApproverIndex++;
        }

        // Mark as approved
        request.hasApproved[msg.sender] = true;
        request.signatures[msg.sender] = _signature;
        request.approvalCount++;

        emit DocumentApproved(_requestId, msg.sender, _signature, block.timestamp);

        // Check if all approvers have approved
        if (request.approvalCount == request.approvers.length) {
            request.status = ApprovalStatus.Approved;
            emit ApprovalCompleted(_requestId, request.documentId, block.timestamp);
        }
    }

    /**
     * @dev Reject a document
     * @param _requestId ID of the approval request
     * @param _reason Reason for rejection
     */
    function rejectDocument(bytes32 _requestId, string memory _reason)
        external
        nonReentrant
    {
        require(requestExists[_requestId], "Request does not exist");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        
        ApprovalRequest storage request = approvalRequests[_requestId];
        require(
            request.status == ApprovalStatus.Pending,
            "Request is not pending"
        );

        bool isApprover = false;
        for (uint256 i = 0; i < request.approvers.length; i++) {
            if (request.approvers[i] == msg.sender) {
                isApprover = true;
                break;
            }
        }
        require(isApprover, "Not an approver for this request");

        request.status = ApprovalStatus.Rejected;

        emit DocumentRejected(_requestId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Get approval request details
     * @param _requestId ID of the request
     * @return Basic request information
     */
    function getApprovalRequest(bytes32 _requestId)
        external
        view
        returns (
            bytes32 documentId,
            address requester,
            address[] memory approvers,
            uint256 approvalCount,
            ApprovalStatus status,
            ProcessType processType,
            string memory purpose,
            uint256 timestamp
        )
    {
        require(requestExists[_requestId], "Request does not exist");
        ApprovalRequest storage request = approvalRequests[_requestId];

        return (
            request.documentId,
            request.requester,
            request.approvers,
            request.approvalCount,
            request.status,
            request.processType,
            request.purpose,
            request.timestamp
        );
    }

    /**
     * @dev Check if an address has approved a request
     * @param _requestId ID of the request
     * @param _approver Address of the approver
     * @return bool True if approved
     */
    function hasApproved(bytes32 _requestId, address _approver)
        external
        view
        returns (bool)
    {
        require(requestExists[_requestId], "Request does not exist");
        return approvalRequests[_requestId].hasApproved[_approver];
    }

    /**
     * @dev Get signature for an approver
     * @param _requestId ID of the request
     * @param _approver Address of the approver
     * @return string Signature
     */
    function getSignature(bytes32 _requestId, address _approver)
        external
        view
        returns (string memory)
    {
        require(requestExists[_requestId], "Request does not exist");
        return approvalRequests[_requestId].signatures[_approver];
    }

    /**
     * @dev Get pending approvals for an address
     * @param _approver Address of the approver
     * @return Array of request IDs
     */
    function getPendingApprovals(address _approver)
        external
        view
        returns (bytes32[] memory)
    {
        return pendingApprovals[_approver];
    }
}
