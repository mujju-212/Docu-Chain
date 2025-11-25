# Document Approval System - Quick Start Guide

## ✅ What's Been Completed

Your document approval system is **fully integrated** with:
- ✅ Smart contract deployed at `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54`
- ✅ Database schema created (4 tables: approval_requests, approval_steps, approved_documents, approval_history)
- ✅ Backend API with 7 endpoints (Flask + SQLAlchemy)
- ✅ Frontend integrated with Web3.js blockchain calls
- ✅ No more dummy data - all real API and blockchain integration

---

## 🚀 How to Get Started (3 Steps)

### Step 1: Create Database Tables

Run this command in PowerShell:

```powershell
psql -U postgres -d "Docu-Chain" -f "d:\AVTIVE PROJ\Docu-Chain\database\approval_system_tables.sql"
```

**Verify tables created**:
```powershell
psql -U postgres -d "Docu-Chain" -c "\dt approval*"
```

You should see 4 tables:
- `approval_requests`
- `approval_steps`
- `approved_documents`
- `approval_history`

---

### Step 2: Start Backend

```powershell
cd "d:\AVTIVE PROJ\Docu-Chain\backend"
python run.py
```

Backend should start on `http://localhost:5000`

**Test backend is working**:
```powershell
curl http://localhost:5000/api/health
```

---

### Step 3: Start Frontend

```powershell
cd "d:\AVTIVE PROJ\Docu-Chain\frontend"
npm run dev
```

Frontend should start on `http://localhost:5173` (or similar port)

---

## 🎯 Test the Complete Flow

### 1. Connect MetaMask
- Open frontend in browser
- Click "Connect Wallet" button
- Confirm connection in MetaMask
- **Make sure you're on Sepolia testnet**

### 2. Upload a Document (if not already done)
- Go to File Manager
- Upload a PDF document
- Document will be stored on IPFS and blockchain
- Note the document ID for approval request

### 3. Create Approval Request

**On Frontend**:
1. Navigate to **Document Approval** page
2. Click **"Send Request"** tab
3. **Select Document** - Choose from your uploaded documents
4. **Add Recipients** - Click "Add Recipient" and select approvers
5. **Choose Process Type**:
   - **Sequential** - Approvers must approve in order (step 1, then step 2, etc.)
   - **Parallel** - All approvers can approve simultaneously
6. **Choose Approval Type**:
   - **Standard** - Simple approval stamp
   - **Digital Signature** - Cryptographic signature
7. **Enter Purpose** - "Leave approval", "Budget request", etc.
8. Click **"Generate Request"**

**What Happens**:
1. MetaMask popup appears → **Confirm transaction**
2. Blockchain contract called → Request recorded on Sepolia
3. Transaction hash returned → `0xabc123...`
4. Backend API called → Request saved to database
5. Approval steps created for each recipient
6. Success message displayed

### 4. Approve Document (as Approver)

**Login as Approver**:
1. Go to **"Receive Requests"** tab
2. See pending approval requests
3. Click **"View Details"** on a request
4. Review document details
5. Click **"Approve"**
6. **Confirm transaction in MetaMask**
7. Wait for blockchain confirmation
8. Status updates to "Approved"

**What Happens**:
1. Blockchain contract updated with approval
2. Approval step marked as `has_approved = true`
3. If all approvers approved → Status becomes "APPROVED"
4. If sequential → Next approver can now approve
5. Requestor sees progress in "Sent Requests"

### 5. Reject Document (Optional)

1. Click **"Reject"** instead of approve
2. Enter reason for rejection (required)
3. **Confirm transaction in MetaMask**
4. Status immediately becomes "REJECTED"
5. Reason sent to requestor

---

## 🔍 Verify Integration

### Check Blockchain Data

**Option 1: Remix IDE**
1. Open Remix → Load DocumentApprovalManager contract
2. Enter contract address: `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54`
3. Call `getApprovalRequest(requestId)` with your request ID
4. See: requester, documentHash, approvers[], status

**Option 2: Etherscan**
1. Visit: https://sepolia.etherscan.io/address/0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
2. View transactions
3. See recent `requestApproval` and `approveDocument` calls

### Check Database Data

```sql
-- View all approval requests
SELECT * FROM approval_requests ORDER BY created_at DESC LIMIT 5;

-- View approval steps
SELECT ar.document_name, u.name as approver, as2.has_approved, as2.has_rejected
FROM approval_steps as2
JOIN approval_requests ar ON as2.approval_request_id = ar.id
JOIN users u ON as2.approver_id = u.id
ORDER BY ar.created_at DESC;

-- View approval history
SELECT ah.event_type, ah.old_status, ah.new_status, u.name as actor, ah.created_at
FROM approval_history ah
JOIN users u ON ah.actor_id = u.id
ORDER BY ah.created_at DESC;
```

### Check API Endpoints

**Get My Requests**:
```bash
curl http://localhost:5000/api/approvals/my-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get My Tasks**:
```bash
curl http://localhost:5000/api/approvals/my-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Status**:
```bash
curl http://localhost:5000/api/approvals/status/REQUEST_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### MetaMask Issues

**"User denied transaction"**
- User cancelled in MetaMask → Try again

**"Insufficient funds for gas"**
- Need Sepolia ETH → Get from https://sepoliafaucet.com/
- Minimum: 0.001 ETH recommended

**"Wrong network"**
- Switch MetaMask to Sepolia testnet
- Chain ID: 11155111 (0xaa36a7)

**"MetaMask not connected"**
- Click "Connect Wallet" in frontend
- Allow site in MetaMask

### Backend Issues

**"Connection refused"**
- Backend not running → Run `python run.py`
- Check port 5000 not in use

**"Unauthorized" (401 error)**
- JWT token expired → Re-login
- Token not sent → Check `localStorage.getItem('token')`

**"Database error"**
- Tables not created → Run SQL file (Step 1)
- Wrong credentials → Check `.env` DATABASE_URL

### Frontend Issues

**"Failed to fetch"**
- Backend down → Start Flask server
- CORS error → Check Flask-CORS configuration

**"Document not found"**
- Use existing document ID from File Manager
- Verify document uploaded successfully

**"Wallet address not found"**
- Ensure users have `wallet_address` field populated
- Update user profile with MetaMask address

---

## 📊 Data Flow Summary

```
USER ACTION (Frontend)
    ↓
BLOCKCHAIN TRANSACTION (MetaMask → Sepolia)
    ↓
GET TX HASH
    ↓
BACKEND API CALL (with TX hash)
    ↓
DATABASE UPDATE (PostgreSQL)
    ↓
REFRESH UI (fetch updated data)
```

**Example: Create Approval Request**

```
1. User clicks "Generate Request"
2. Frontend calls requestApprovalOnBlockchain()
3. MetaMask prompts for confirmation
4. User confirms → TX sent to Sepolia
5. Blockchain returns TX hash (0xabc...)
6. Frontend calls POST /api/approvals/request with TX hash
7. Backend creates approval_requests record
8. Backend creates approval_steps for each approver
9. Backend creates approval_history entry
10. Frontend receives success response
11. Frontend refreshes "Sent Requests" list
12. User sees new request in list
```

---

## 📝 Important Notes

### Contract Addresses
- **DocumentApprovalManager**: `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54` (NEW - for approvals)
- **DocumentManager**: `0x1203dc6f5d10556449e194c0c14f167bb3d72208` (OLD - for document upload/sharing)

Both contracts are used:
- Use **DocumentManager** for document upload and IPFS storage
- Use **DocumentApprovalManager** for approval workflows

### Network
- **Sepolia Testnet** only
- Chain ID: `11155111` (hex: `0xaa36a7`)
- Need testnet ETH for transactions

### Database
- Database name: `Docu-Chain`
- User: `postgres`
- Port: `5432`
- 4 new tables created by SQL file

### API Base URL
- Development: `http://localhost:5000`
- Change in frontend `.env` if different

---

## 🎉 What's Working Now

1. **Real blockchain integration** - All transactions go to Sepolia testnet
2. **Real database** - All data persisted in PostgreSQL
3. **Real API calls** - Frontend fetches from Flask backend
4. **No dummy data** - All data comes from blockchain and database
5. **Full approval workflow** - Create → Approve → Reject → Track status
6. **Sequential & Parallel** - Both process types supported
7. **Digital signatures** - Cryptographic signature hashes stored
8. **Audit trail** - Complete history in approval_history table
9. **MetaMask integration** - Users sign transactions with their wallet
10. **Error handling** - User-friendly messages for all error cases

---

## 📚 Next Steps (Optional Phase 2)

- [ ] PDF generation with approval stamps
- [ ] QR code generation for verified documents
- [ ] Public verification page (`/verify/:code`)
- [ ] Email notifications for new requests
- [ ] Real-time updates with WebSocket
- [ ] Bulk approval for multiple documents
- [ ] Approval templates for common workflows
- [ ] Analytics dashboard

---

## 📞 Need Help?

**Check logs**:
- Frontend: Browser console (F12)
- Backend: Terminal running Flask
- Blockchain: Sepolia Etherscan

**Common files**:
- Frontend: `frontend/src/pages/shared/DocumentApproval.js`
- Backend API: `backend/app/routes/approvals.py`
- Backend Models: `backend/app/models/approval.py`
- Blockchain: `frontend/src/utils/metamask.js`
- Database: `database/approval_system_tables.sql`

**Full documentation**:
- See `docs/APPROVAL_SYSTEM_IMPLEMENTATION.md` for complete technical details

---

**System Status**: ✅ **READY FOR TESTING**

All components integrated and ready to use!
