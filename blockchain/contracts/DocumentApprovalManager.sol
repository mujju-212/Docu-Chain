// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DocumentApprovalManager
 * @dev Manages document approval workflows with sequential and parallel approval support
 * @notice This contract works alongside DocumentManagerV2 for complete document lifecycle management
 * 
 * Features:
 * - Sequential and Parallel approval workflows
 * - Priority levels (Low, Normal, High, Urgent)
 * - Expiry date support with automatic expiration
 * - Digital signature support (optional)
 * - Revision and resubmission capability
 * - Role-based permissions (Student, Faculty, Admin)
 * - Integration with existing DocumentManagerV2 contract
 */
contract DocumentApprovalManager is AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FACULTY_ROLE = keccak256("FACULTY_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Priority levels
    enum Priority { LOW, NORMAL, HIGH, URGENT }
    
    // Request status
    enum RequestStatus { 
        DRAFT,      // Initial state, not submitted
        PENDING,    // Submitted, waiting for approvals
        PARTIAL,    // Some approvals received (parallel only)
        APPROVED,   // All approvals received
        REJECTED,   // Any approver rejected
        CANCELLED,  // Requester cancelled
        EXPIRED     // Expiry date passed
    }

    // Approval type
    enum ApprovalType { STANDARD, DIGITAL_SIGNATURE }

    // Process type
    enum ProcessType { SEQUENTIAL, PARALLEL }

    struct ApprovalRequest {
        bytes32 requestId;
        bytes32 documentId;          // Reference to DocumentManagerV2
        string documentIpfsHash;     // IPFS hash of document
        address requester;
        address[] approvers;
        ProcessType processType;
        ApprovalType approvalType;
        Priority priority;
        uint256 expiryTimestamp;
        uint256 createdAt;
        uint256 submittedAt;
        uint256 completedAt;
        RequestStatus status;
        bool isActive;
        string version;              // e.g., "v1.0", "v1.1"
    }

    struct ApprovalStep {
        address approver;
        uint8 stepOrder;             // For sequential: 1,2,3... For parallel: all same
        bool hasApproved;
        bool hasRejected;
        uint256 actionTimestamp;
        bytes32 signatureHash;       // For digital signatures (optional)
        string reason;               // Approval comment or rejection reason
    }

    struct ApprovedDocument {
        bytes32 requestId;
        bytes32 originalDocumentId;
        bytes32 approvedDocumentId;  // New document ID after approval
        string approvedIpfsHash;     // IPFS hash of PDF with stamps
        bytes32 documentHash;        // SHA256 hash for verification
        string qrCodeData;           // JSON data for QR code
        uint256 approvalTimestamp;
        bool isValid;
    }

    // Storage
    mapping(bytes32 => ApprovalRequest) public approvalRequests;
    mapping(bytes32 => ApprovalStep[]) public approvalSteps;
    mapping(bytes32 => ApprovedDocument) public approvedDocuments;
    
    // Tracking mappings
    mapping(address => bytes32[]) public requesterRequests;
    mapping(address => bytes32[]) public approverRequests;
    mapping(bytes32 => bytes32) public documentToRequest;  // Document ID => Latest Request ID
    mapping(bytes32 => bytes32[]) public documentRequests; // Document ID => All Request IDs (history)
    
    // Reference to DocumentManagerV2 (optional, for verification)
    address public documentManagerAddress;

    // Events
    event ApprovalRequested(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        address indexed requester,
        address[] approvers,
        ProcessType processType,
        Priority priority,
        uint256 expiryTimestamp
    );

    event DocumentApproved(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        address indexed approver,
        uint8 stepOrder,
        bytes32 signatureHash,
        uint256 timestamp
    );

    event DocumentRejected(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        address indexed approver,
        string reason,
        uint256 timestamp
    );

    event ApprovalCompleted(
        bytes32 indexed requestId,
        bytes32 indexed documentId,
        RequestStatus finalStatus,
        uint256 timestamp
    );

    event ApprovedDocumentRecorded(
        bytes32 indexed requestId,
        bytes32 indexed originalDocumentId,
        bytes32 indexed approvedDocumentId,
        string approvedIpfsHash,
        uint256 timestamp
    );

    event RequestCancelled(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 timestamp
    );

    event RequestExpired(
        bytes32 indexed requestId,
        uint256 timestamp
    );

    constructor(address _documentManagerAddress) {
        documentManagerAddress = _documentManagerAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev Request approval for a document
     * @param _documentId Document ID from DocumentManagerV2
     * @param _documentIpfsHash IPFS hash of the document
     * @param _approvers Array of approver addresses
     * @param _processType SEQUENTIAL or PARALLEL
     * @param _approvalType STANDARD or DIGITAL_SIGNATURE
     * @param _priority Priority level (0-3)
     * @param _expiryTimestamp Expiry timestamp (0 for no expiry)
     * @param _version Version string (e.g., "v1.0")
     * @return requestId Unique identifier for this approval request
     */
    function requestApproval(
        bytes32 _documentId,
        string memory _documentIpfsHash,
        address[] memory _approvers,
        ProcessType _processType,
        ApprovalType _approvalType,
        Priority _priority,
        uint256 _expiryTimestamp,
        string memory _version
    ) external whenNotPaused nonReentrant returns (bytes32) {
        _validateApprovalRequest(_approvers, _expiryTimestamp);

        // Generate unique request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                _documentId,
                msg.sender,
                block.timestamp,
                _approvers.length
            )
        );

        // Create approval request
        _createApprovalRequest(
            requestId,
            _documentId,
            _documentIpfsHash,
            _approvers,
            _processType,
            _approvalType,
            _priority,
            _expiryTimestamp,
            _version
        );

        // Create approval steps
        _createApprovalSteps(requestId, _approvers, _processType);

        // Track requests
        requesterRequests[msg.sender].push(requestId);
        documentToRequest[_documentId] = requestId;
        documentRequests[_documentId].push(requestId);

        emit ApprovalRequested(
            requestId,
            _documentId,
            msg.sender,
            _approvers,
            _processType,
            _priority,
            _expiryTimestamp
        );

        return requestId;
    }

    /**
     * @dev Approve a document
     * @param _requestId Request ID to approve
     * @param _signatureHash Digital signature hash (optional, use bytes32(0) for standard)
     * @param _reason Approval comment (optional)
     */
    function approveDocument(
        bytes32 _requestId,
        bytes32 _signatureHash,
        string memory _reason
    ) external whenNotPaused nonReentrant {
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        require(request.isActive, "Request not active");
        require(request.status == RequestStatus.PENDING || request.status == RequestStatus.PARTIAL, "Request not pending");
        require(!_isExpired(request), "Request expired");

        // Find approver's step
        (bool found, uint256 stepIndex) = _findApproverStep(_requestId, msg.sender);
        require(found, "Not an approver for this request");

        ApprovalStep storage step = approvalSteps[_requestId][stepIndex];
        require(!step.hasApproved && !step.hasRejected, "Already acted on this request");

        // For sequential approval, check if it's this approver's turn
        if (request.processType == ProcessType.SEQUENTIAL) {
            require(_isApproverTurn(_requestId, msg.sender), "Not your turn to approve");
        }

        // Record approval
        step.hasApproved = true;
        step.actionTimestamp = block.timestamp;
        step.signatureHash = _signatureHash;
        step.reason = _reason;

        emit DocumentApproved(
            _requestId,
            request.documentId,
            msg.sender,
            step.stepOrder,
            _signatureHash,
            block.timestamp
        );

        // Check if all approvals are complete
        _updateRequestStatus(_requestId);
    }

    /**
     * @dev Reject a document
     * @param _requestId Request ID to reject
     * @param _reason Rejection reason (required)
     */
    function rejectDocument(
        bytes32 _requestId,
        string memory _reason
    ) external whenNotPaused nonReentrant {
        require(bytes(_reason).length > 0, "Rejection reason required");
        
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        require(request.isActive, "Request not active");
        require(request.status == RequestStatus.PENDING || request.status == RequestStatus.PARTIAL, "Request not pending");
        require(!_isExpired(request), "Request expired");

        // Find approver's step
        (bool found, uint256 stepIndex) = _findApproverStep(_requestId, msg.sender);
        require(found, "Not an approver for this request");

        ApprovalStep storage step = approvalSteps[_requestId][stepIndex];
        require(!step.hasApproved && !step.hasRejected, "Already acted on this request");

        // For sequential approval, check if it's this approver's turn
        if (request.processType == ProcessType.SEQUENTIAL) {
            require(_isApproverTurn(_requestId, msg.sender), "Not your turn to reject");
        }

        // Record rejection
        step.hasRejected = true;
        step.actionTimestamp = block.timestamp;
        step.reason = _reason;

        // ANY rejection = ENTIRE request rejected
        request.status = RequestStatus.REJECTED;
        request.completedAt = block.timestamp;

        emit DocumentRejected(
            _requestId,
            request.documentId,
            msg.sender,
            _reason,
            block.timestamp
        );

        emit ApprovalCompleted(
            _requestId,
            request.documentId,
            RequestStatus.REJECTED,
            block.timestamp
        );
    }

    /**
     * @dev Cancel an approval request (only requester can cancel)
     * @param _requestId Request ID to cancel
     */
    function cancelRequest(bytes32 _requestId) external whenNotPaused nonReentrant {
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        require(request.isActive, "Request not active");
        require(request.requester == msg.sender, "Only requester can cancel");
        require(
            request.status == RequestStatus.PENDING || request.status == RequestStatus.PARTIAL,
            "Can only cancel pending requests"
        );

        request.status = RequestStatus.CANCELLED;
        request.completedAt = block.timestamp;
        request.isActive = false;

        emit RequestCancelled(_requestId, msg.sender, block.timestamp);
    }

    /**
     * @dev Record approved document details (called after PDF generation)
     * @param _requestId Original request ID
     * @param _approvedDocumentId New document ID for approved version
     * @param _approvedIpfsHash IPFS hash of approved PDF with stamps
     * @param _documentHash SHA256 hash of approved document
     * @param _qrCodeData JSON data embedded in QR code
     */
    function recordApprovedDocument(
        bytes32 _requestId,
        bytes32 _approvedDocumentId,
        string memory _approvedIpfsHash,
        bytes32 _documentHash,
        string memory _qrCodeData
    ) external whenNotPaused nonReentrant {
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        require(request.isActive, "Request not active");
        require(request.status == RequestStatus.APPROVED, "Request not approved");
        require(
            request.requester == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        ApprovedDocument storage approvedDoc = approvedDocuments[_requestId];
        approvedDoc.requestId = _requestId;
        approvedDoc.originalDocumentId = request.documentId;
        approvedDoc.approvedDocumentId = _approvedDocumentId;
        approvedDoc.approvedIpfsHash = _approvedIpfsHash;
        approvedDoc.documentHash = _documentHash;
        approvedDoc.qrCodeData = _qrCodeData;
        approvedDoc.approvalTimestamp = block.timestamp;
        approvedDoc.isValid = true;

        emit ApprovedDocumentRecorded(
            _requestId,
            request.documentId,
            _approvedDocumentId,
            _approvedIpfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Check and expire requests that have passed their expiry date
     * @param _requestId Request ID to check
     */
    function expireRequest(bytes32 _requestId) external {
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        require(request.isActive, "Request not active");
        require(
            request.status == RequestStatus.PENDING || request.status == RequestStatus.PARTIAL,
            "Request already completed"
        );
        require(_isExpired(request), "Request not yet expired");

        request.status = RequestStatus.EXPIRED;
        request.completedAt = block.timestamp;

        emit RequestExpired(_requestId, block.timestamp);
        emit ApprovalCompleted(_requestId, request.documentId, RequestStatus.EXPIRED, block.timestamp);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Get approval request details
     */
    function getApprovalRequest(bytes32 _requestId)
        external
        view
        returns (ApprovalRequest memory)
    {
        return approvalRequests[_requestId];
    }

    /**
     * @dev Get all approval steps for a request
     */
    function getApprovalSteps(bytes32 _requestId)
        external
        view
        returns (ApprovalStep[] memory)
    {
        return approvalSteps[_requestId];
    }

    /**
     * @dev Get approved document details
     */
    function getApprovedDocument(bytes32 _requestId)
        external
        view
        returns (ApprovedDocument memory)
    {
        return approvedDocuments[_requestId];
    }

    /**
     * @dev Get approval status summary
     * @return isComplete Whether approval process is complete
     * @return isApproved Whether document is approved
     * @return approvedCount Number of approvals received
     * @return totalApprovers Total number of approvers
     * @return isExpired Whether request has expired
     * @return currentStatus Current status of the request
     */
    function getApprovalStatus(bytes32 _requestId)
        external
        view
        returns (
            bool isComplete,
            bool isApproved,
            uint256 approvedCount,
            uint256 totalApprovers,
            bool isExpired,
            RequestStatus currentStatus
        )
    {
        ApprovalRequest storage request = approvalRequests[_requestId];
        currentStatus = request.status;
        isExpired = _isExpired(request);
        totalApprovers = approvalSteps[_requestId].length;
        approvedCount = _countApprovals(_requestId);
        isComplete = _isRequestComplete(currentStatus);
        isApproved = (currentStatus == RequestStatus.APPROVED);
    }

    /**
     * @dev Check if an address can approve a request
     */
    function canApprove(bytes32 _requestId, address _approver)
        external
        view
        returns (bool)
    {
        ApprovalRequest storage request = approvalRequests[_requestId];
        
        if (!request.isActive || 
            (request.status != RequestStatus.PENDING && request.status != RequestStatus.PARTIAL) ||
            _isExpired(request)) {
            return false;
        }

        (bool found, uint256 stepIndex) = _findApproverStep(_requestId, _approver);
        if (!found) {
            return false;
        }

        ApprovalStep storage step = approvalSteps[_requestId][stepIndex];
        if (step.hasApproved || step.hasRejected) {
            return false;
        }

        // For sequential, check if it's the approver's turn
        if (request.processType == ProcessType.SEQUENTIAL) {
            return _isApproverTurn(_requestId, _approver);
        }

        return true;
    }

    /**
     * @dev Verify an approved document by its hash
     * @notice Not implemented - requires additional mapping for efficient lookup
     */
    function verifyApprovedDocument(bytes32 /* _documentHash */)
        external
        pure
        returns (
            bool isValid,
            bytes32 requestId,
            bytes32 originalDocumentId,
            uint256 approvalTimestamp
        )
    {
        // Note: This requires iterating through requests or using a mapping
        // For production, consider adding: mapping(bytes32 => bytes32) public documentHashToRequestId;
        return (false, bytes32(0), bytes32(0), 0);
    }

    /**
     * @dev Get all requests by a requester
     */
    function getRequesterRequests(address _requester)
        external
        view
        returns (bytes32[] memory)
    {
        return requesterRequests[_requester];
    }

    /**
     * @dev Get all requests for an approver
     */
    function getApproverRequests(address _approver)
        external
        view
        returns (bytes32[] memory)
    {
        return approverRequests[_approver];
    }

    /**
     * @dev Get all requests for a document
     */
    function getDocumentRequests(bytes32 _documentId)
        external
        view
        returns (bytes32[] memory)
    {
        return documentRequests[_documentId];
    }

    /**
     * @dev Get the latest request for a document
     */
    function getLatestDocumentRequest(bytes32 _documentId)
        external
        view
        returns (bytes32)
    {
        return documentToRequest[_documentId];
    }

    // ========== INTERNAL FUNCTIONS ==========

    /**
     * @dev Validate approval request parameters
     */
    function _validateApprovalRequest(
        address[] memory _approvers,
        uint256 _expiryTimestamp
    ) internal view {
        require(_approvers.length > 0, "At least one approver required");
        require(_approvers.length <= 10, "Maximum 10 approvers allowed");
        require(
            _expiryTimestamp == 0 || _expiryTimestamp > block.timestamp,
            "Expiry must be in future"
        );

        // Validate approvers (students cannot approve)
        for (uint i = 0; i < _approvers.length; i++) {
            require(_approvers[i] != address(0), "Invalid approver address");
            require(_approvers[i] != msg.sender, "Cannot approve own request");
            require(
                !hasRole(STUDENT_ROLE, _approvers[i]),
                "Students cannot be approvers"
            );
        }
    }

    /**
     * @dev Create approval request storage
     */
    function _createApprovalRequest(
        bytes32 _requestId,
        bytes32 _documentId,
        string memory _documentIpfsHash,
        address[] memory _approvers,
        ProcessType _processType,
        ApprovalType _approvalType,
        Priority _priority,
        uint256 _expiryTimestamp,
        string memory _version
    ) internal {
        ApprovalRequest storage request = approvalRequests[_requestId];
        request.requestId = _requestId;
        request.documentId = _documentId;
        request.documentIpfsHash = _documentIpfsHash;
        request.requester = msg.sender;
        request.approvers = _approvers;
        request.processType = _processType;
        request.approvalType = _approvalType;
        request.priority = _priority;
        request.expiryTimestamp = _expiryTimestamp;
        request.createdAt = block.timestamp;
        request.submittedAt = block.timestamp;
        request.status = RequestStatus.PENDING;
        request.isActive = true;
        request.version = _version;
    }

    /**
     * @dev Create approval steps for approvers
     */
    function _createApprovalSteps(
        bytes32 _requestId,
        address[] memory _approvers,
        ProcessType _processType
    ) internal {
        uint8 stepOrder = (_processType == ProcessType.PARALLEL) ? 1 : 0;
        
        for (uint i = 0; i < _approvers.length; i++) {
            if (_processType == ProcessType.SEQUENTIAL) {
                stepOrder = uint8(i + 1);
            }
            
            approvalSteps[_requestId].push(ApprovalStep({
                approver: _approvers[i],
                stepOrder: stepOrder,
                hasApproved: false,
                hasRejected: false,
                actionTimestamp: 0,
                signatureHash: bytes32(0),
                reason: ""
            }));
            
            approverRequests[_approvers[i]].push(_requestId);
        }
    }

    /**
     * @dev Update request status after an approval
     */
    function _updateRequestStatus(bytes32 _requestId) internal {
        ApprovalRequest storage request = approvalRequests[_requestId];
        ApprovalStep[] storage steps = approvalSteps[_requestId];

        uint256 approvedCount = 0;
        uint256 totalApprovers = steps.length;

        for (uint i = 0; i < steps.length; i++) {
            if (steps[i].hasApproved) {
                approvedCount++;
            }
        }

        if (approvedCount == totalApprovers) {
            // All approved
            request.status = RequestStatus.APPROVED;
            request.completedAt = block.timestamp;

            emit ApprovalCompleted(
                _requestId,
                request.documentId,
                RequestStatus.APPROVED,
                block.timestamp
            );
        } else if (request.processType == ProcessType.PARALLEL && approvedCount > 0) {
            // Partial approval (parallel only)
            request.status = RequestStatus.PARTIAL;
        }
    }

    /**
     * @dev Find approver's step index
     */
    function _findApproverStep(bytes32 _requestId, address _approver)
        internal
        view
        returns (bool found, uint256 index)
    {
        ApprovalStep[] storage steps = approvalSteps[_requestId];
        
        for (uint i = 0; i < steps.length; i++) {
            if (steps[i].approver == _approver) {
                return (true, i);
            }
        }
        
        return (false, 0);
    }

    /**
     * @dev Check if it's the approver's turn (for sequential approval)
     */
    function _isApproverTurn(bytes32 _requestId, address _approver)
        internal
        view
        returns (bool)
    {
        ApprovalRequest storage request = approvalRequests[_requestId];
        ApprovalStep[] storage steps = approvalSteps[_requestId];

        if (request.processType == ProcessType.PARALLEL) {
            return true;
        }

        // For sequential, find the first pending step
        for (uint i = 0; i < steps.length; i++) {
            if (!steps[i].hasApproved && !steps[i].hasRejected) {
                return steps[i].approver == _approver;
            }
        }

        return false;
    }

    /**
     * @dev Check if request has expired
     */
    function _isExpired(ApprovalRequest storage request)
        internal
        view
        returns (bool)
    {
        return (request.expiryTimestamp > 0 && block.timestamp >= request.expiryTimestamp);
    }

    /**
     * @dev Count approved steps
     */
    function _countApprovals(bytes32 _requestId) internal view returns (uint256) {
        ApprovalStep[] storage steps = approvalSteps[_requestId];
        uint256 count = 0;
        for (uint i = 0; i < steps.length; i++) {
            if (steps[i].hasApproved) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Check if request is complete
     */
    function _isRequestComplete(RequestStatus status) internal pure returns (bool) {
        return (status == RequestStatus.APPROVED ||
                status == RequestStatus.REJECTED ||
                status == RequestStatus.CANCELLED ||
                status == RequestStatus.EXPIRED);
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @dev Update DocumentManager reference address
     */
    function setDocumentManagerAddress(address _newAddress)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_newAddress != address(0), "Invalid address");
        documentManagerAddress = _newAddress;
    }

    /**
     * @dev Grant roles to addresses
     */
    function grantRoleToUser(bytes32 role, address account)
        external
        onlyRole(ADMIN_ROLE)
    {
        grantRole(role, account);
    }

    /**
     * @dev Revoke roles from addresses
     */
    function revokeRoleFromUser(bytes32 role, address account)
        external
        onlyRole(ADMIN_ROLE)
    {
        revokeRole(role, account);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
