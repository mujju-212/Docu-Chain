# Document Approval System - Full Implementation Summary

## 🎯 Project Overview

**Objective**: Integrate deployed DocumentApprovalManager smart contract with full-stack DocuChain application, replacing dummy data with real blockchain and database integration.

**Smart Contract Address**: `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54` (DocumentApprovalManager)  
**Legacy Contract**: `0x1203dc6f5d10556449e194c0c14f167bb3d72208` (DocumentManager - still used for document upload/sharing)  
**Network**: Sepolia Testnet (Chain ID: 11155111)

---

## ✅ Completed Implementation

### 1. Database Schema (approval_system_tables.sql)

**Location**: `database/approval_system_tables.sql`  
**Status**: ✅ Created, ⏳ Pending Execution  

**Tables Created**:
- **approval_requests** (16 fields)
  - `request_id` (BYTEA) - Blockchain request ID from contract
  - `document_id`, `requester_id` (FK to users)
  - `approvers` (UUID[]) - Array of approver user IDs
  - `process_type` (SEQUENTIAL/PARALLEL)
  - `approval_type` (STANDARD/DIGITAL_SIGNATURE)
  - `priority` (LOW/NORMAL/HIGH/URGENT)
  - `status` (DRAFT/PENDING/PARTIAL/APPROVED/REJECTED/CANCELLED/EXPIRED)
  - `blockchain_tx_hash` (VARCHAR 66)
  - `metadata` (JSONB) for extensibility

- **approval_steps** (10 fields)
  - Tracks individual approver actions
  - `approver_id` (FK to users), `approver_wallet`
  - `step_order`, `has_approved`, `has_rejected`
  - `signature_hash`, `reason`, `action_timestamp`

- **approved_documents** (11 fields)
  - Final approved documents with stamps
  - `original_document_id`, `approved_document_id`
  - `ipfs_hash`, `document_hash` (SHA256)
  - `qr_code_data` (JSON), `verification_code`
  - `public_verification_url`

- **approval_history** (9 fields)
  - Audit trail for all approval events
  - `event_type` (CREATED/APPROVED/REJECTED/CANCELLED/EXPIRED)
  - `actor_id` (FK to users)
  - `old_status`, `new_status`
  - `blockchain_tx_hash`

**Features**:
- Indexes on blockchain fields (request_id, tx_hash)
- Triggers for `updated_at` timestamp
- Foreign key constraints with CASCADE delete
- Check constraints for enum validation
- Comprehensive comments on all tables/columns

**⚠️ ACTION REQUIRED**:
```powershell
# Run this command to create tables:
psql -U postgres -d "Docu-Chain" -f "database/approval_system_tables.sql"
```

---

### 2. Frontend Blockchain Integration (metamask.js)

**Location**: `frontend/src/utils/metamask.js`  
**Status**: ✅ Complete  

**Changes Made**:

#### Contract Configuration
```javascript
export const APPROVAL_MANAGER_ADDRESS = '0x8E1626654e1B04ADF941EbbcEc7E92728327aA54';
export const APPROVAL_MANAGER_ABI = [
  // 10 function definitions from DocumentApprovalManager contract
  // requestApproval, approveDocument, rejectDocument, cancelRequest, getApprovalRequest, etc.
];
```

#### 8 New Functions Implemented

1. **requestApprovalOnBlockchain(requestId, documentHash, approvers, processType)**
   - Converts enum values (0=SEQUENTIAL, 1=PARALLEL)
   - Estimates gas with 20% buffer
   - Sends transaction to smart contract
   - Returns transaction hash

2. **approveDocumentOnBlockchain(requestId, signatureHash)**
   - Signs approval on blockchain
   - Requires MetaMask confirmation
   - Returns tx hash for database tracking

3. **rejectDocumentOnBlockchain(requestId, reason)**
   - Rejects document on blockchain with reason
   - Updates contract state immediately
   - Returns tx hash

4. **getApprovalRequestFromBlockchain(requestId)**
   - Fetches approval request from contract
   - Converts blockchain data to JS object
   - Returns: requester, documentHash, approvers[], processType, status, timestamps

5. **getApprovalStepsFromBlockchain(requestId)**
   - Gets all approval steps for request
   - Returns array with approver, approved status, rejected status, signature, timestamp

6. **getApprovalStatusFromBlockchain(requestId)**
   - Checks completion status
   - Returns: { isComplete, isApproved, approvalCount, requiredApprovals }

7. **getMyApprovalRequests()**
   - Gets all requests created by connected wallet
   - Returns array of request IDs

8. **getMyApprovalTasks()**
   - Gets all requests where user is approver
   - Returns array of request IDs

**Gas Estimation**: All functions estimate gas with 20% safety buffer

---

### 3. Backend SQLAlchemy Models (approval.py)

**Location**: `backend/app/models/approval.py`  
**Status**: ✅ Complete  

**Models Created**:

#### ApprovalRequest Model
```python
class ApprovalRequest(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = db.Column(db.LargeBinary(32), unique=True, nullable=False)  # Blockchain ID
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=False)
    requester_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    approvers = db.Column(ARRAY(UUID(as_uuid=True)), nullable=False)
    process_type = db.Column(db.String(20), nullable=False)  # SEQUENTIAL/PARALLEL
    approval_type = db.Column(db.String(30), nullable=False)  # STANDARD/DIGITAL_SIGNATURE
    priority = db.Column(db.String(10), nullable=False, default='NORMAL')
    status = db.Column(db.String(20), nullable=False, default='PENDING')
    blockchain_tx_hash = db.Column(db.String(66))
    metadata = db.Column(JSONB)
    
    # Relationships
    approval_steps = db.relationship('ApprovalStep', backref='approval_request', cascade='all, delete-orphan')
    approved_document = db.relationship('ApprovedDocument', uselist=False, backref='approval_request')
    history = db.relationship('ApprovalHistory', backref='approval_request', cascade='all, delete-orphan')
```

#### ApprovalStep Model
```python
class ApprovalStep(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id'), nullable=False)
    approver_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    approver_wallet = db.Column(db.String(42))
    step_order = db.Column(db.Integer, nullable=False)
    has_approved = db.Column(db.Boolean, default=False)
    has_rejected = db.Column(db.Boolean, default=False)
    signature_hash = db.Column(db.String(66))
    reason = db.Column(db.Text)
    action_timestamp = db.Column(db.DateTime)
```

#### ApprovedDocument Model
```python
class ApprovedDocument(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id'), nullable=False)
    original_document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=False)
    approved_document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'))
    ipfs_hash = db.Column(db.String(100))
    document_hash = db.Column(db.String(64), nullable=False)  # SHA256
    qr_code_data = db.Column(JSONB)
    verification_code = db.Column(db.String(50), unique=True, nullable=False)
    public_verification_url = db.Column(db.String(255))
```

#### ApprovalHistory Model
```python
class ApprovalHistory(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id'), nullable=False)
    event_type = db.Column(db.String(20), nullable=False)  # CREATED/APPROVED/REJECTED/etc
    actor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    blockchain_tx_hash = db.Column(db.String(66))
```

**Features**:
- All models use UUID primary keys
- Blockchain fields (request_id, tx_hash) included
- Full relationships between models
- `to_dict()` and `to_dict_detailed()` methods for API responses
- JSONB metadata fields for extensibility

**Registration**:
- Exported in `backend/app/models/__init__.py`
- Imported in `backend/app/__init__.py` for SQLAlchemy registration

---

### 4. Backend API Routes (approvals.py)

**Location**: `backend/app/routes/approvals.py`  
**Status**: ✅ Complete  

**Endpoints Implemented**:

#### 1. Create Approval Request
```
POST /api/approvals/request
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "requestId": "0x1234...",           // Blockchain request ID (hex string)
  "documentId": "uuid",
  "documentName": "Report.pdf",
  "documentIpfsHash": "Qm...",
  "approvers": ["uuid1", "uuid2"],    // User IDs
  "processType": "SEQUENTIAL",        // or "PARALLEL"
  "approvalType": "STANDARD",         // or "DIGITAL_SIGNATURE"
  "priority": "NORMAL",               // LOW/NORMAL/HIGH/URGENT
  "blockchainTxHash": "0xabcd..."
}

Response (201):
{
  "message": "Approval request created successfully",
  "request": { ...detailed request object... }
}
```

**Logic**:
- Validates 10 required fields
- Converts requestId from hex string to bytes
- Creates ApprovalRequest record
- Creates ApprovalStep for each approver (with step_order for SEQUENTIAL)
- Creates ApprovalHistory entry (event_type='CREATED')
- Database transaction with rollback on error

#### 2. Approve Document
```
POST /api/approvals/approve/<request_id>
Authorization: Bearer <JWT_TOKEN>

Request Body:
{
  "signatureHash": "0xsig...",
  "blockchainTxHash": "0xtx..."
}

Response (200):
{
  "message": "Document approved successfully",
  "request": { ...updated request... }
}
```

**Logic**:
- Finds user's ApprovalStep
- Sets `has_approved = True`, `action_timestamp = now`
- Stores signature_hash
- Checks if all approvers approved → status = 'APPROVED'
- Creates ApprovalHistory entry
- Returns updated request with all steps

#### 3. Reject Document
```
POST /api/approvals/reject/<request_id>
Authorization: Bearer <JWT_TOKEN>

Request Body:
{
  "reason": "Missing signatures",
  "blockchainTxHash": "0xtx..."
}

Response (200):
{
  "message": "Document rejected successfully",
  "request": { ...updated request... }
}
```

**Logic**:
- Requires reason field (validation error if missing)
- Sets ApprovalStep: `has_rejected = True`, stores reason
- **Immediately sets status = 'REJECTED'** (any reject = full reject)
- Creates ApprovalHistory entry
- Does NOT check other approvers (rejection is final)

#### 4. Get Approval Status
```
GET /api/approvals/status/<request_id>
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "request": {
    "id": "uuid",
    "status": "PENDING",
    "approval_steps": [
      { "approver_id": "uuid", "has_approved": true, "step_order": 1 },
      { "approver_id": "uuid", "has_approved": false, "step_order": 2 }
    ],
    ...
  }
}
```

**Logic**:
- Access control: Only requester or approvers can view
- Returns full request with all steps

#### 5. Get My Requests (Sent)
```
GET /api/approvals/my-requests
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "requests": [
    { ...request details... }
  ],
  "total": 15
}
```

**Logic**:
- Finds all requests where requester_id = current_user
- Ordered by created_at DESC
- Pagination ready (can add ?page=1&limit=10)

#### 6. Get My Tasks (Approval Tasks)
```
GET /api/approvals/my-tasks
Authorization: Bearer <JWT_TOKEN>

Query Params:
?status=pending  (optional: pending/approved/rejected)

Response (200):
{
  "tasks": [
    {
      "request": { ...request details... },
      "my_step": { "has_approved": false, "step_order": 1 }
    }
  ],
  "total": 8
}
```

**Logic**:
- Joins through ApprovalStep where approver_id = current_user
- Optional status filter
- Returns request + user's specific step

#### 7. Cancel Request (Placeholder)
```
POST /api/approvals/cancel/<request_id>
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "Approval request cancelled successfully"
}
```

**Logic**:
- Only requester can cancel
- Sets status = 'CANCELLED'
- Creates history entry
- ⚠️ TODO: Add blockchain cancel call

**Error Handling**:
- All endpoints have try-catch blocks
- `db.session.rollback()` on exceptions
- Detailed error logging
- Returns 400/404/500 with error messages

**Authentication**:
- All endpoints protected with `@jwt_required()`
- Current user accessed via `get_jwt_identity()`

**Blueprint Registration**:
- Registered in `backend/app/__init__.py` at `/api/approvals`

---

## ⏳ Pending Implementation

### 6. Frontend Integration (DocumentApproval.js)

**Location**: `frontend/src/pages/shared/DocumentApproval.js`  
**Status**: ⏳ Has dummy data, needs replacement  

**Current Dummy Data**:
```javascript
const [blockchainDocuments, setBlockchainDocuments] = useState([/* 4 dummy objects */]);
const [availableUsers, setAvailableUsers] = useState([/* 6 dummy users */]);
const [incomingRequests, setIncomingRequests] = useState([/* 2 dummy requests */]);
const [sentRequests, setSentRequests] = useState([/* 2 dummy requests */]);
```

**Required Changes**:

#### Import Blockchain Functions
```javascript
import {
  requestApprovalOnBlockchain,
  approveDocumentOnBlockchain,
  rejectDocumentOnBlockchain,
  getApprovalRequestFromBlockchain,
  getApprovalStatusFromBlockchain,
  getMyApprovalRequests,
  getMyApprovalTasks
} from '../../utils/metamask';
```

#### Replace Dummy Data with API Calls

**1. Load Blockchain Documents**
```javascript
useEffect(() => {
  const fetchDocuments = async () => {
    const response = await fetch('http://localhost:5000/api/documents', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setBlockchainDocuments(data.documents);
  };
  fetchDocuments();
}, []);
```

**2. Load Available Users**
```javascript
useEffect(() => {
  const fetchUsers = async () => {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setAvailableUsers(data.users);
  };
  fetchUsers();
}, []);
```

**3. Load Incoming Requests (My Tasks)**
```javascript
useEffect(() => {
  const fetchIncomingRequests = async () => {
    const response = await fetch('http://localhost:5000/api/approvals/my-tasks', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setIncomingRequests(data.tasks.map(t => t.request));
  };
  fetchIncomingRequests();
}, []);
```

**4. Load Sent Requests**
```javascript
useEffect(() => {
  const fetchSentRequests = async () => {
    const response = await fetch('http://localhost:5000/api/approvals/my-requests', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setSentRequests(data.requests);
  };
  fetchSentRequests();
}, []);
```

#### Update handleGenerateRequest
```javascript
const handleGenerateRequest = async () => {
  try {
    setIsGenerating(true);
    
    // Validation
    if (!selectedDocument || selectedApprovers.length === 0) {
      alert('Please select document and approvers');
      return;
    }
    
    // Generate unique request ID (bytes32)
    const requestId = web3.utils.randomHex(32);
    
    // Get approver wallet addresses (need to fetch from backend)
    const approverAddresses = await Promise.all(
      selectedApprovers.map(async (approverId) => {
        const user = await fetchUserById(approverId);
        return user.wallet_address;
      })
    );
    
    // 1. Call blockchain contract
    const txHash = await requestApprovalOnBlockchain(
      requestId,
      selectedDocument.ipfs_hash,
      approverAddresses,
      processType === 'sequential' ? 0 : 1
    );
    
    // 2. Save to database
    const response = await fetch('http://localhost:5000/api/approvals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        requestId: requestId,
        documentId: selectedDocument.id,
        documentName: selectedDocument.name,
        documentIpfsHash: selectedDocument.ipfs_hash,
        approvers: selectedApprovers,
        processType: processType.toUpperCase(),
        approvalType: approvalType.toUpperCase(),
        priority: priority.toUpperCase(),
        blockchainTxHash: txHash
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Approval request created successfully!');
      // Refresh sent requests
      fetchSentRequests();
      // Reset form
      setSelectedDocument(null);
      setSelectedApprovers([]);
    } else {
      alert(`Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error('Error creating approval request:', error);
    alert('Failed to create approval request. Check console for details.');
  } finally {
    setIsGenerating(false);
  }
};
```

#### Update handleApproveRequest
```javascript
const handleApproveRequest = async (request) => {
  try {
    // 1. Approve on blockchain
    const signatureHash = web3.utils.randomHex(32); // Or use actual signature
    const txHash = await approveDocumentOnBlockchain(request.request_id, signatureHash);
    
    // 2. Update database
    const response = await fetch(`http://localhost:5000/api/approvals/approve/${request.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        signatureHash: signatureHash,
        blockchainTxHash: txHash
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Document approved successfully!');
      fetchIncomingRequests(); // Refresh
    } else {
      alert(`Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error('Error approving document:', error);
    alert('Failed to approve document');
  }
};
```

#### Update handleRejectRequest
```javascript
const handleRejectRequest = async (request, reason) => {
  try {
    if (!reason || reason.trim() === '') {
      alert('Please provide a reason for rejection');
      return;
    }
    
    // 1. Reject on blockchain
    const txHash = await rejectDocumentOnBlockchain(request.request_id, reason);
    
    // 2. Update database
    const response = await fetch(`http://localhost:5000/api/approvals/reject/${request.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        reason: reason,
        blockchainTxHash: txHash
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Document rejected successfully!');
      fetchIncomingRequests(); // Refresh
    } else {
      alert(`Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error('Error rejecting document:', error);
    alert('Failed to reject document');
  }
};
```

**Error Handling Additions**:
- MetaMask not connected → Prompt connection
- Insufficient gas → Display error with gas estimate
- Transaction rejected → Show user-friendly message
- Network mismatch → Check if on Sepolia testnet
- Loading states during blockchain transactions

---

## 🧪 Testing Plan

### Phase 1: Database Setup
```powershell
# 1. Create tables
psql -U postgres -d "Docu-Chain" -f "database/approval_system_tables.sql"

# 2. Verify tables
psql -U postgres -d "Docu-Chain" -c "\dt approval*"

# Expected output:
# approval_requests
# approval_steps
# approved_documents
# approval_history
```

### Phase 2: Backend API Testing

**Setup**:
1. Ensure Flask backend is running (`python run.py`)
2. Obtain JWT token from login endpoint
3. Use Postman or curl for testing

**Test 1: Create Approval Request**
```bash
curl -X POST http://localhost:5000/api/approvals/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "requestId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "documentId": "document-uuid-here",
    "documentName": "Test Report.pdf",
    "documentIpfsHash": "QmTest123",
    "approvers": ["approver-uuid-1", "approver-uuid-2"],
    "processType": "SEQUENTIAL",
    "approvalType": "STANDARD",
    "priority": "NORMAL",
    "blockchainTxHash": "0xabcdef..."
  }'

# Expected: 201 Created with request details
```

**Test 2: Approve Document**
```bash
curl -X POST http://localhost:5000/api/approvals/approve/REQUEST_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer APPROVER_JWT_TOKEN" \
  -d '{
    "signatureHash": "0xsig123...",
    "blockchainTxHash": "0xtx456..."
  }'

# Expected: 200 OK with updated request
```

**Test 3: Get My Tasks**
```bash
curl -X GET http://localhost:5000/api/approvals/my-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with array of tasks
```

### Phase 3: Frontend Testing

1. **MetaMask Connection**
   - Open frontend in browser
   - Click "Connect Wallet"
   - Verify wallet address displayed
   - Check console for connection confirmation

2. **Load Data**
   - Verify blockchain documents load from API
   - Verify available users load from API
   - Verify incoming requests display
   - Verify sent requests display
   - Check Network tab for API calls

3. **Create Approval Request**
   - Select document
   - Add approvers
   - Set process type (sequential/parallel)
   - Click "Generate Request"
   - **Confirm MetaMask transaction**
   - Wait for blockchain confirmation
   - Verify success message
   - Check database for new record
   - Check sent requests list updates

4. **Approve Document**
   - Login as approver
   - View incoming requests
   - Click "Approve"
   - **Confirm MetaMask transaction**
   - Wait for confirmation
   - Verify status updates in UI
   - Check database approval_steps table

5. **Reject Document**
   - Login as approver
   - View incoming requests
   - Click "Reject"
   - Enter reason
   - **Confirm MetaMask transaction**
   - Verify status changes to REJECTED
   - Check reason stored in database

### Phase 4: Integration Testing

**Full Workflow Test**:
```
1. User A creates document → uploads to IPFS
2. User A requests approval → Blockchain tx → Database record
3. Check blockchain: getApprovalRequestFromBlockchain(requestId)
4. Check database: SELECT * FROM approval_requests WHERE request_id = ...
5. User B (approver) approves → Blockchain tx → Database update
6. Check blockchain: getApprovalStatusFromBlockchain(requestId)
7. Check database: SELECT * FROM approval_steps WHERE approval_request_id = ...
8. Verify status changes from PENDING → APPROVED
9. Check approval_history table for audit trail
```

**Error Scenarios**:
- ❌ Insufficient gas → Show error with required amount
- ❌ Wrong network → Prompt to switch to Sepolia
- ❌ MetaMask locked → Prompt unlock
- ❌ Unauthorized approver → 403 error
- ❌ Already approved → Prevent duplicate approval
- ❌ Backend down → Show connection error

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  React UI   │
└──────┬──────┘
       │
       ├─── 1. User Action (Create Request)
       │
       ├────► ┌────────────────┐
       │      │   MetaMask     │
       │      │  (Web3.js)     │
       │      └────────┬───────┘
       │               │
       │               └──► 2. Blockchain Transaction
       │                    (requestApproval function)
       │                         │
       │                         ▼
       │                    ┌────────────────────────┐
       │                    │ DocumentApprovalManager│
       │                    │  Smart Contract        │
       │                    │  (Sepolia Testnet)     │
       │                    └────────────────────────┘
       │                         │
       │                         └──► 3. Emits Event
       │                              Returns tx hash
       │                                  │
       └────► 4. POST /api/approvals/request
              (with tx hash)
                   │
                   ▼
              ┌─────────────┐
              │   Backend   │
              │ Flask API   │
              └──────┬──────┘
                     │
                     ├──► 5. Create ApprovalRequest
                     ├──► 6. Create ApprovalSteps
                     ├──► 7. Create ApprovalHistory
                     │
                     ▼
              ┌──────────────┐
              │  PostgreSQL  │
              │   Database   │
              └──────────────┘
```

**Approval Flow**:
```
1. Approver sees request in "My Tasks"
2. Clicks "Approve" → MetaMask transaction
3. Blockchain: approveDocument(requestId) → tx hash
4. Frontend: POST /api/approvals/approve/:id (with tx hash)
5. Backend: Update approval_steps (has_approved=true)
6. Backend: Check if all approved → Update request status
7. Backend: Create history entry
8. Frontend: Refresh UI with new status
```

---

## 🔧 Configuration Required

### Environment Variables

**Backend (.env)**:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/Docu-Chain
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

**Frontend (.env)**:
```bash
VITE_API_URL=http://localhost:5000
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_CONTRACT_ADDRESS=0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
```

### MetaMask Setup
1. Install MetaMask extension
2. Switch to Sepolia testnet
3. Add test ETH (get from Sepolia faucet)
4. Connect wallet to frontend

### Database Connection
```
Host: localhost
Port: 5432
Database: Docu-Chain
User: postgres
Password: (your password)
```

---

## 🚀 Deployment Checklist

- [ ] **Database**
  - [ ] Run approval_system_tables.sql
  - [ ] Verify all 4 tables created
  - [ ] Check foreign key constraints
  - [ ] Test sample INSERT queries

- [ ] **Backend**
  - [ ] Install requirements: `pip install -r requirements.txt`
  - [ ] Run Flask: `python run.py`
  - [ ] Test /api/approvals/request endpoint
  - [ ] Test /api/approvals/my-tasks endpoint
  - [ ] Verify JWT authentication works

- [ ] **Frontend**
  - [ ] Update DocumentApproval.js (replace dummy data)
  - [ ] Install dependencies: `npm install`
  - [ ] Run dev server: `npm run dev`
  - [ ] Test MetaMask connection
  - [ ] Test create approval request
  - [ ] Test approve/reject actions

- [ ] **Blockchain**
  - [ ] Verify contract deployed at 0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
  - [ ] Test requestApproval function on Remix
  - [ ] Test approveDocument function
  - [ ] Check events emitted

- [ ] **Integration**
  - [ ] Test full workflow: create → approve → status update
  - [ ] Verify blockchain and database stay in sync
  - [ ] Test error scenarios (network errors, rejected txs)
  - [ ] Test with multiple approvers (sequential + parallel)

---

## 📝 Next Steps (Phase 2 Features)

### PDF Generation with Stamps
- Generate approved PDF with approval stamps
- Include QR code for verification
- Upload to IPFS
- Store IPFS hash in approved_documents table

### Public Verification Page
- Create `/verify/:verification_code` route
- Display document details
- Show approval chain
- Verify blockchain data matches

### Notifications
- Email notifications for new approval requests
- Email on approval/rejection
- Real-time notifications using Socket.IO

### Advanced Features
- Bulk approval
- Approval reminders
- Approval templates
- Analytics dashboard

---

## 🐛 Known Issues / Limitations

1. **Gas Estimation**: May fail if contract has complex logic. Use fixed gas limit as fallback.
2. **MetaMask Popup Blocker**: User may need to allow popups for transaction signing.
3. **Network Latency**: Blockchain transactions take 10-30 seconds. Show loading states.
4. **Wallet Address Storage**: Need to ensure all users have wallet_address field populated.
5. **Sequential Approval Order**: Need to enforce that step 2 cannot approve before step 1.

---

## 📞 Support & Resources

- **Smart Contract (Remix)**: https://remix.ethereum.org/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **Contract Address**: https://sepolia.etherscan.io/address/0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
- **Web3.js Docs**: https://web3js.readthedocs.io/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

## ✅ Summary

**COMPLETED**:
- ✅ Database schema (4 tables with blockchain integration)
- ✅ Frontend blockchain functions (8 functions in metamask.js)
- ✅ Backend models (4 SQLAlchemy models)
- ✅ Backend API routes (7 endpoints)
- ✅ Model registration in Flask app

**IN PROGRESS**:
- ⏳ Frontend integration (replace dummy data with real APIs)

**PENDING**:
- ⏳ Database table creation (run SQL file)
- ⏳ End-to-end testing
- ⏳ PDF generation
- ⏳ Public verification page

---

**Last Updated**: Current Session  
**Contract Version**: DocumentApprovalManager v1.0  
**Database Version**: v1.0 (approval_system_tables.sql)  
**API Version**: v1.0 (7 endpoints)
