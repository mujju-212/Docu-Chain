# Document Approval Smart Contract - Quick Reference

## 📦 What We've Created

### 1. **DocumentApprovalManager.sol** - Main Contract
- **Location:** `blockchain/contracts/DocumentApprovalManager.sol`
- **Size:** ~800 lines
- **Purpose:** Manages document approval workflows
- **Works with:** Your existing DocumentManagerV2.sol

### 2. **Deployment Script**
- **Location:** `blockchain/scripts/deploy-approval-manager.js`
- **Purpose:** Deploys the approval contract
- **Features:** Role setup, verification instructions

### 3. **Test Suite**
- **Location:** `blockchain/test/DocumentApprovalManager.test.js`
- **Coverage:** 15+ test cases
- **Tests:** Sequential, parallel, rejection, expiry, roles

### 4. **Integration Guide**
- **Location:** `docs/SMART_CONTRACT_INTEGRATION.md`
- **Content:** Complete integration examples, workflows, code samples

---

## 🚀 Quick Start

### Step 1: Install Dependencies (if needed)
```bash
cd blockchain
npm install
```

### Step 2: Compile Contracts
```bash
npx hardhat compile
```

### Step 3: Run Tests
```bash
npx hardhat test
```

### Step 4: Deploy to Local Network
```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy-approval-manager.js --network localhost
```

### Step 5: Deploy to Testnet (Sepolia)
```bash
# Set your DocumentManagerV2 address
export DOCUMENT_MANAGER_V2_ADDRESS="0xYourDocumentManagerAddress"

# Deploy
npx hardhat run scripts/deploy-approval-manager.js --network sepolia
```

---

## 🔑 Key Features

### ✅ Sequential Approval
```
Person 1 → Person 2 → Person 3 → APPROVED
   ↓ (any reject)
REJECTED
```
- Must approve in order
- Any rejection = full rejection
- Current approver can see previous approvals

### ✅ Parallel Approval
```
Person 1 ↘
Person 2 → All approve → APPROVED
Person 3 ↗
```
- Any order
- Shows "2 of 3 approved" (PARTIAL status)
- Any rejection = full rejection

### ✅ Priority Levels
- **LOW (0)** - Routine documents
- **NORMAL (1)** - Standard approval
- **HIGH (2)** - Important documents
- **URGENT (3)** - Critical, time-sensitive

### ✅ Approval Types
- **STANDARD (0)** - Simple click approval
- **DIGITAL_SIGNATURE (1)** - With cryptographic signature

### ✅ Expiry Support
- Optional expiry timestamp
- Auto-reject on expiry
- Warnings before expiration

### ✅ Role-Based Access
- **STUDENT:** Can only send requests
- **FACULTY:** Can send and approve
- **ADMIN:** Full access

---

## 📝 Core Functions

### Request Approval
```solidity
function requestApproval(
    bytes32 _documentId,        // From DocumentManagerV2
    string _documentIpfsHash,   // IPFS hash
    address[] _approvers,       // List of approvers
    ProcessType _processType,   // 0=SEQUENTIAL, 1=PARALLEL
    ApprovalType _approvalType, // 0=STANDARD, 1=DIGITAL
    Priority _priority,         // 0=LOW, 1=NORMAL, 2=HIGH, 3=URGENT
    uint256 _expiryTimestamp,   // Unix timestamp (0=no expiry)
    string _version             // e.g., "v1.0"
) returns (bytes32 requestId)
```

### Approve Document
```solidity
function approveDocument(
    bytes32 _requestId,
    bytes32 _signatureHash,     // Use bytes32(0) for standard
    string _reason              // Optional comment
)
```

### Reject Document
```solidity
function rejectDocument(
    bytes32 _requestId,
    string _reason              // Required
)
```

### Cancel Request
```solidity
function cancelRequest(bytes32 _requestId)
```

### Get Status
```solidity
function getApprovalStatus(bytes32 _requestId)
    returns (
        bool isComplete,
        bool isApproved,
        uint256 approvedCount,
        uint256 totalApprovers,
        bool isExpired,
        RequestStatus currentStatus
    )
```

---

## 🔄 Complete Workflow

### Frontend → Backend → Blockchain

```javascript
// 1. User uploads document (DocumentManagerV2)
const documentId = await documentManagerV2.uploadDocument(
    ipfsHash, fileName, fileSize, documentType
);

// 2. User requests approval (DocumentApprovalManager)
const requestId = await approvalManager.requestApproval(
    documentId,
    ipfsHash,
    [approver1, approver2],
    0,  // SEQUENTIAL
    1,  // DIGITAL_SIGNATURE
    2,  // HIGH priority
    expiryTimestamp,
    "v1.0"
);

// 3. Approver approves
await approvalManager.connect(approver1).approveDocument(
    requestId,
    signatureHash,
    "Looks good!"
);

// 4. Check status
const status = await approvalManager.getApprovalStatus(requestId);

// 5. If approved, generate PDF and record
await approvalManager.recordApprovedDocument(
    requestId,
    approvedDocId,
    approvedIpfsHash,
    documentHash,
    qrCodeData
);
```

---

## 🎯 Integration Points

### With Existing DocumentManagerV2
```javascript
// DocumentManagerV2 handles:
✅ Document upload to IPFS
✅ Document sharing
✅ Version tracking
✅ Access control

// DocumentApprovalManager handles:
✅ Approval requests
✅ Approval workflows
✅ Status tracking
✅ Approved document records
```

### With Backend (Python/Flask)
```python
# Request approval
request_id = approval_contract.functions.requestApproval(
    document_id, ipfs_hash, approvers, 0, 0, 1, 0, "v1.0"
).transact()

# Check status
status = approval_contract.functions.getApprovalStatus(request_id).call()

# Listen for events
approval_filter = approval_contract.events.DocumentApproved.create_filter(fromBlock='latest')
events = approval_filter.get_new_entries()
```

---

## 📊 Status Flow

```
DRAFT (0)
   ↓ (submit)
PENDING (1)
   ↓ (some approve in parallel)
PARTIAL (2)
   ↓ (all approve)
APPROVED (3)

OR

REJECTED (4)   ← Any rejection
CANCELLED (5)  ← Requester cancels
EXPIRED (6)    ← Expiry date passed
```

---

## 🔐 Security Features

1. ✅ **ReentrancyGuard** - Prevents reentrancy attacks
2. ✅ **AccessControl** - Role-based permissions
3. ✅ **Pausable** - Emergency stop functionality
4. ✅ **Sequential Validation** - Enforces approval order
5. ✅ **Expiry Check** - Auto-reject expired requests
6. ✅ **One Action Rule** - Can't approve after rejecting
7. ✅ **No Self-Approval** - Can't approve own requests
8. ✅ **Student Restriction** - Students can't approve

---

## 📈 Gas Costs (Estimates)

| Function | Gas | Notes |
|----------|-----|-------|
| `requestApproval` | ~250k | +50k per additional approver |
| `approveDocument` | ~100k | Standard approval |
| `approveDocument` (signature) | ~120k | With digital signature |
| `rejectDocument` | ~80k | Rejection |
| `cancelRequest` | ~50k | Cancellation |
| `recordApprovedDocument` | ~150k | Record final version |

---

## 🎨 Events

Monitor these events for real-time updates:

```javascript
// New approval request
event ApprovalRequested(requestId, documentId, requester, approvers, ...)

// Document approved by someone
event DocumentApproved(requestId, documentId, approver, signatureHash, ...)

// Document rejected
event DocumentRejected(requestId, documentId, approver, reason, ...)

// Approval process complete
event ApprovalCompleted(requestId, documentId, finalStatus, ...)

// Approved document recorded
event ApprovedDocumentRecorded(requestId, originalDocId, approvedDocId, ...)

// Request cancelled
event RequestCancelled(requestId, requester, ...)

// Request expired
event RequestExpired(requestId, ...)
```

---

## 🧪 Testing Checklist

- ✅ Sequential approval flow
- ✅ Parallel approval flow
- ✅ Sequential out-of-order rejection
- ✅ Any rejection = full rejection
- ✅ Digital signatures stored
- ✅ All priority levels work
- ✅ Expiry date enforcement
- ✅ Requester can cancel
- ✅ Students can't be approvers
- ✅ No self-approval
- ✅ Role restrictions
- ✅ Query functions
- ✅ Admin pause/unpause
- ✅ Contract upgrade capability

---

## 🛠️ Useful Commands

```bash
# Compile
npx hardhat compile

# Test
npx hardhat test
npx hardhat test --grep "Sequential"  # Run specific test

# Coverage
npx hardhat coverage

# Deploy local
npx hardhat node
npx hardhat run scripts/deploy-approval-manager.js --network localhost

# Deploy testnet
npx hardhat run scripts/deploy-approval-manager.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS "DOCUMENT_MANAGER_ADDRESS"

# Console
npx hardhat console --network localhost
```

---

## 📚 Next Steps

### Phase 2: Database Models
1. Create `approval_requests` table
2. Create `approval_steps` table
3. Create `approved_documents` table
4. Create `approval_history` table

### Phase 3: Backend APIs
1. POST `/api/approval/request` - Create request
2. POST `/api/approval/approve/:id` - Approve
3. POST `/api/approval/reject/:id` - Reject
4. GET `/api/approval/status/:id` - Get status
5. POST `/api/approval/generate-pdf/:id` - Generate approved doc

### Phase 4: Frontend Integration
1. Connect approval form to contract
2. Display pending requests
3. Show approval status
4. Integrate with chat notifications

---

## 🆘 Troubleshooting

### Contract not compiling?
```bash
npm install @openzeppelin/contracts
npx hardhat clean
npx hardhat compile
```

### Tests failing?
```bash
# Make sure you have correct network config
npx hardhat test --network hardhat
```

### Deployment issues?
```bash
# Check your .env file
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_rpc_url
```

---

## 📞 Support

- **Contract Code:** `blockchain/contracts/DocumentApprovalManager.sol`
- **Tests:** `blockchain/test/DocumentApprovalManager.test.js`
- **Docs:** `docs/SMART_CONTRACT_INTEGRATION.md`
- **Plan:** `docs/APPROVAL_IMPLEMENTATION_PLAN.md`

---

**Contract Version:** 1.0  
**Solidity Version:** 0.8.20  
**OpenZeppelin:** ^5.0.0  
**Last Updated:** November 25, 2025

🎉 **You're ready to deploy and use the approval system!**
