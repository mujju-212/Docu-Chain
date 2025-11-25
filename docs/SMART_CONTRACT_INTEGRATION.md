# Smart Contract Integration Guide

## Overview

This guide explains how **DocumentApprovalManager** and **DocumentManagerV2** work together to provide complete document lifecycle management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (React)                   │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│   DocumentManagerV2     │    │  DocumentApprovalManager     │
│   (Existing Contract)   │    │  (New Contract)              │
├─────────────────────────┤    ├──────────────────────────────┤
│ • Upload documents      │    │ • Request approvals          │
│ • Share documents       │    │ • Sequential/Parallel flow   │
│ • Version control       │    │ • Digital signatures         │
│ • Update documents      │    │ • Track approval status      │
│ • Access control        │    │ • Record approved docs       │
└─────────────────────────┘    └──────────────────────────────┘
             │                              │
             └──────────────┬───────────────┘
                            ▼
                    ┌───────────────┐
                    │  IPFS/Pinata  │
                    └───────────────┘
```

## Workflow Integration

### Step 1: Upload Document (DocumentManagerV2)

```javascript
// User uploads document to blockchain
const documentId = await documentManagerV2.uploadDocument(
  ipfsHash,
  fileName,
  fileSize,
  documentType
);
```

**Result:** Document is stored on blockchain with unique `documentId`.

### Step 2: Request Approval (DocumentApprovalManager)

```javascript
// User requests approval for the uploaded document
const requestId = await approvalManager.requestApproval(
  documentId,              // Reference to DocumentManagerV2 document
  ipfsHash,                // Same IPFS hash
  [approver1, approver2],  // List of approvers
  0,                       // SEQUENTIAL (0) or PARALLEL (1)
  1,                       // DIGITAL_SIGNATURE (0=STANDARD, 1=DIGITAL)
  2,                       // HIGH priority (0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT)
  expiryTimestamp,         // Unix timestamp
  "v1.0"                   // Version string
);
```

**Result:** Approval request is created and approvers are notified.

### Step 3: Approve/Reject (DocumentApprovalManager)

```javascript
// Approver approves the document
await approvalManager.approveDocument(
  requestId,
  signatureHash,  // bytes32(0) for standard approval
  "Looks good!"   // Optional comment
);

// OR reject
await approvalManager.rejectDocument(
  requestId,
  "Needs revision in section 3"  // Required reason
);
```

### Step 4: Generate Approved Document (Backend + IPFS)

```javascript
// After all approvals, backend generates PDF with stamps
const approvedPdf = generateApprovedPDF(originalDocument, approvalData);
const approvedIpfsHash = await uploadToIPFS(approvedPdf);

// Upload approved document to DocumentManagerV2
const approvedDocId = await documentManagerV2.uploadDocument(
  approvedIpfsHash,
  `${originalFileName}_APPROVED.pdf`,
  approvedFileSize,
  "approved_document"
);
```

### Step 5: Record Approved Document (DocumentApprovalManager)

```javascript
// Link approved document back to the request
await approvalManager.recordApprovedDocument(
  requestId,
  approvedDocId,
  approvedIpfsHash,
  documentHash,      // SHA256 hash for verification
  qrCodeData         // JSON string for QR code
);
```

## Contract Interaction Examples

### Example 1: Sequential Approval Flow

```javascript
// STEP 1: Upload document
const tx1 = await documentManagerV2.uploadDocument(
  "QmXyZ123...",
  "Leave_Application.pdf",
  245678,
  "leave_application"
);
const documentId = extractDocumentIdFromLogs(tx1);

// STEP 2: Request sequential approval (HOD → Principal → Admin)
const tx2 = await approvalManager.requestApproval(
  documentId,
  "QmXyZ123...",
  [hodAddress, principalAddress, adminAddress],
  0,  // SEQUENTIAL
  0,  // STANDARD
  1,  // NORMAL priority
  0,  // No expiry
  "v1.0"
);
const requestId = extractRequestIdFromLogs(tx2);

// STEP 3: HOD approves (first in sequence)
await approvalManager.connect(hod).approveDocument(
  requestId,
  ethers.ZeroHash,
  "Approved"
);

// STEP 4: Principal approves (second in sequence)
await approvalManager.connect(principal).approveDocument(
  requestId,
  ethers.ZeroHash,
  "Approved"
);

// STEP 5: Admin approves (final approval)
await approvalManager.connect(admin).approveDocument(
  requestId,
  ethers.ZeroHash,
  "Final approval"
);

// STEP 6: Check status
const status = await approvalManager.getApprovalStatus(requestId);
console.log("Approved:", status.isApproved); // true
```

### Example 2: Parallel Approval with Digital Signature

```javascript
// Request parallel approval with digital signature
const requestId = await approvalManager.requestApproval(
  documentId,
  ipfsHash,
  [approver1, approver2, approver3],
  1,  // PARALLEL
  1,  // DIGITAL_SIGNATURE
  3,  // URGENT priority
  Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiry
  "v2.0"
);

// All approvers can approve simultaneously
const signatureHash1 = ethers.keccak256(
  ethers.toUtf8Bytes("Approval message 1")
);

await approvalManager.connect(approver1).approveDocument(
  requestId,
  signatureHash1,
  "Digitally approved"
);

// Approver 2 and 3 approve independently
// Status will show "PARTIAL" until all approve
```

### Example 3: Rejection and Revision

```javascript
// Approver rejects document
await approvalManager.connect(approver2).rejectDocument(
  requestId,
  "Section 3 needs revision"
);

// Status is now REJECTED

// User makes changes and uploads new version
const newDocId = await documentManagerV2.updateDocument(
  originalDocId,
  "QmAbc456...",  // New IPFS hash
  "Updated content"
);

// User creates new approval request with same/different approvers
const newRequestId = await approvalManager.requestApproval(
  newDocId,
  "QmAbc456...",
  [approver1, approver2],  // Can change approvers
  0,
  0,
  1,
  0,
  "v2.0"  // New version
);

// Fresh approval process starts
```

## Role-Based Access Control

### Granting Roles

```javascript
// Get role hashes
const ADMIN_ROLE = await approvalManager.ADMIN_ROLE();
const FACULTY_ROLE = await approvalManager.FACULTY_ROLE();
const STUDENT_ROLE = await approvalManager.STUDENT_ROLE();

// Grant roles
await approvalManager.grantRoleToUser(FACULTY_ROLE, facultyAddress);
await approvalManager.grantRoleToUser(STUDENT_ROLE, studentAddress);

// Check role
const isFaculty = await approvalManager.hasRole(FACULTY_ROLE, facultyAddress);
```

### Role Restrictions

| Role | Can Request | Can Approve | Can Be Approver |
|------|-------------|-------------|-----------------|
| **STUDENT** | ✅ Yes | ❌ No | ❌ No |
| **FACULTY** | ✅ Yes | ✅ Yes | ✅ Yes |
| **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes |

## Query Functions

### Get Request Details

```javascript
const request = await approvalManager.getApprovalRequest(requestId);
console.log({
  documentId: request.documentId,
  requester: request.requester,
  approvers: request.approvers,
  status: request.status,
  priority: request.priority,
  expiryTimestamp: request.expiryTimestamp
});
```

### Get Approval Steps

```javascript
const steps = await approvalManager.getApprovalSteps(requestId);
steps.forEach((step, index) => {
  console.log(`Step ${step.stepOrder}:`, {
    approver: step.approver,
    hasApproved: step.hasApproved,
    hasRejected: step.hasRejected,
    timestamp: step.actionTimestamp,
    reason: step.reason
  });
});
```

### Check if User Can Approve

```javascript
const canApprove = await approvalManager.canApprove(requestId, userAddress);
if (canApprove) {
  // Show approve/reject buttons
} else {
  // Hide buttons or show "Waiting for others"
}
```

### Get User's Requests

```javascript
// Requests sent by user
const sentRequests = await approvalManager.getRequesterRequests(userAddress);

// Requests user needs to approve
const receivedRequests = await approvalManager.getApproverRequests(userAddress);
```

### Get Document History

```javascript
// Get all approval requests for a document
const requests = await approvalManager.getDocumentRequests(documentId);

// Get latest request
const latestRequest = await approvalManager.getLatestDocumentRequest(documentId);
```

## Integration with Backend

### Python/Flask Backend Example

```python
from web3 import Web3
from eth_account import Account
import json

# Initialize
w3 = Web3(Web3.HTTPProvider('YOUR_RPC_URL'))
approval_manager_address = '0xYourApprovalManagerAddress'
document_manager_address = '0xYourDocumentManagerAddress'

# Load ABIs
with open('DocumentApprovalManager.json') as f:
    approval_abi = json.load(f)['abi']

with open('DocumentManagerV2.json') as f:
    document_abi = json.load(f)['abi']

approval_contract = w3.eth.contract(address=approval_manager_address, abi=approval_abi)
document_contract = w3.eth.contract(address=document_manager_address, abi=document_abi)

# Request approval
def request_approval(user_address, private_key, document_id, ipfs_hash, approvers):
    # Build transaction
    tx = approval_contract.functions.requestApproval(
        document_id,
        ipfs_hash,
        approvers,
        0,  # Sequential
        0,  # Standard
        1,  # Normal priority
        0,  # No expiry
        "v1.0"
    ).build_transaction({
        'from': user_address,
        'nonce': w3.eth.get_transaction_count(user_address),
        'gas': 500000,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign and send
    signed_tx = Account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Extract requestId from logs
    request_id = extract_request_id(receipt)
    return request_id

# Approve document
def approve_document(approver_address, private_key, request_id):
    tx = approval_contract.functions.approveDocument(
        request_id,
        bytes(32),  # No signature
        "Approved"
    ).build_transaction({
        'from': approver_address,
        'nonce': w3.eth.get_transaction_count(approver_address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })
    
    signed_tx = Account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt

# Get approval status
def get_approval_status(request_id):
    status = approval_contract.functions.getApprovalStatus(request_id).call()
    return {
        'isComplete': status[0],
        'isApproved': status[1],
        'approvedCount': status[2],
        'totalApprovers': status[3],
        'isExpired': status[4],
        'currentStatus': status[5]
    }
```

## Gas Estimates

| Function | Estimated Gas | Notes |
|----------|---------------|-------|
| `requestApproval` | ~250,000 | Varies with number of approvers |
| `approveDocument` | ~100,000 | Standard approval |
| `approveDocument` (with signature) | ~120,000 | Digital signature |
| `rejectDocument` | ~80,000 | Rejection |
| `cancelRequest` | ~50,000 | Cancellation |
| `recordApprovedDocument` | ~150,000 | Record approved version |

## Security Considerations

1. **Role Validation**: Students cannot be approvers
2. **Sequential Control**: Approvers must approve in order
3. **No Self-Approval**: Cannot approve your own requests
4. **Expiry Check**: Expired requests cannot be approved
5. **One Action Per Approver**: Cannot approve and reject
6. **Immutable Approvals**: Cannot undo approval/rejection
7. **Reentrancy Protection**: All state-changing functions protected
8. **Pausable**: Admin can pause in emergency

## Events for Monitoring

Monitor these events in your backend:

```javascript
// Listen for approval requests
approvalManager.on("ApprovalRequested", (requestId, documentId, requester, approvers) => {
  console.log("New approval request:", requestId);
  // Send notifications to approvers
});

// Listen for approvals
approvalManager.on("DocumentApproved", (requestId, documentId, approver) => {
  console.log("Document approved by:", approver);
  // Update database, send notifications
});

// Listen for rejections
approvalManager.on("DocumentRejected", (requestId, documentId, approver, reason) => {
  console.log("Document rejected:", reason);
  // Notify requester
});

// Listen for completion
approvalManager.on("ApprovalCompleted", (requestId, documentId, status) => {
  console.log("Approval process complete:", status);
  // Generate approved PDF if status is APPROVED
});
```

## Testing

```bash
# Compile contracts
cd blockchain
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy-approval-manager.js --network localhost

# Deploy to testnet (Sepolia)
npx hardhat run scripts/deploy-approval-manager.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia APPROVAL_MANAGER_ADDRESS "DOCUMENT_MANAGER_ADDRESS"
```

## Next Steps

1. ✅ Deploy both contracts to testnet
2. ✅ Grant roles to test users
3. ✅ Test sequential approval flow
4. ✅ Test parallel approval flow
5. ✅ Integrate with backend APIs
6. ✅ Create frontend UI components
7. ✅ Test PDF generation and QR codes
8. ✅ Create verification page
9. ✅ Deploy to mainnet (Polygon recommended)

## Support

For issues or questions:
- Check contract source code for detailed comments
- Review test files for usage examples
- Check deployment logs for contract addresses

---

**Version:** 1.0  
**Last Updated:** November 25, 2025
