# 🗺️ DocuChain - Complete Routing Guide

## Backend API Routes (Flask Blueprints)

### 1. Authentication Routes (`/api/auth`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/api/auth/register` | POST | Register new user (pending approval) | ❌ | `{ email, password, firstName, lastName, role, institutionName, institutionUniqueId, uniqueId, phone?, walletAddress? }` | `{ success, message }` |
| `/api/auth/login` | POST | Login with credentials | ❌ | `{ email, password }` | `{ success, user, token }` |
| `/api/auth/create-institution` | POST | Create institution + admin | ❌ | `{ institutionName, institutionType, institutionUniqueId, adminUsername, adminEmail, adminPassword, adminFirstName, adminLastName, address?, website?, phoneNumber? }` | `{ success, user, institution, token }` |
| `/api/auth/me` | GET | Get current user info | ✅ JWT | - | `{ success, user }` |
| `/api/auth/logout` | POST | Logout (client-side) | ✅ JWT | - | `{ success, message }` |

**Authentication Flow:**
```
1. User submits credentials → /api/auth/login
2. Backend validates → checks password hash
3. Returns JWT token + user data
4. Frontend stores token in localStorage
5. Subsequent requests include: Authorization: Bearer <token>
```

---

### 2. Institution Routes (`/api/institutions`)

| Endpoint | Method | Description | Auth | Response |
|----------|--------|-------------|------|----------|
| `/api/institutions/list` | GET | Get all institutions | ❌ | `{ success, institutions: [{ id, name, unique_id, type }] }` |
| `/api/institutions/<id>/departments` | GET | Get departments of institution | ❌ | `{ success, departments: [{ id, name }] }` |
| `/api/institutions/validate` | POST | Validate institution credentials | ❌ | `{ success, institution, departments }` |
| `/api/institutions/departments/<id>/sections` | GET | Get sections of department | ❌ | `{ success, sections: [{ id, name }] }` |

**Usage in Registration:**
```javascript
// Step 1: Get institution list
GET /api/institutions/list

// Step 2: Validate selection
POST /api/institutions/validate
Body: { name: "ABC University", uniqueId: "ABC123" }

// Step 3: Get departments
GET /api/institutions/<institution_id>/departments

// Step 4: Get sections (if needed)
GET /api/institutions/departments/<dept_id>/sections
```

---

### 3. Document Routes (`/api/documents`) - To Be Implemented

**Planned Endpoints:**

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/documents/upload` | POST | Upload document to IPFS + blockchain | ✅ |
| `/api/documents/list` | GET | Get user's documents | ✅ |
| `/api/documents/<id>` | GET | Get document details | ✅ |
| `/api/documents/<id>` | PUT | Update document metadata | ✅ |
| `/api/documents/<id>` | DELETE | Move to trash | ✅ |
| `/api/documents/<id>/share` | POST | Share with user | ✅ |
| `/api/documents/<id>/verify` | GET | Verify authenticity | ❌ |
| `/api/documents/<id>/versions` | GET | Get version history | ✅ |
| `/api/documents/trash` | GET | Get trashed documents | ✅ |
| `/api/documents/trash/restore` | POST | Restore from trash | ✅ |
| `/api/documents/trash/empty` | DELETE | Permanently delete | ✅ |

---

### 4. User Management Routes (`/api/users`) - To Be Implemented

**Planned Endpoints:**

| Endpoint | Method | Description | Auth | Role |
|----------|--------|-------------|------|------|
| `/api/users` | GET | List all users | ✅ | Admin |
| `/api/users/<id>` | GET | Get user details | ✅ | Admin |
| `/api/users` | POST | Create new user | ✅ | Admin |
| `/api/users/<id>` | PUT | Update user | ✅ | Admin |
| `/api/users/<id>` | DELETE | Deactivate user | ✅ | Admin |
| `/api/users/pending` | GET | Get pending approvals | ✅ | Admin |
| `/api/users/<id>/approve` | POST | Approve user | ✅ | Admin |
| `/api/users/<id>/reject` | POST | Reject user | ✅ | Admin |

---

### 5. Approval Routes (`/api/approvals`) - To Be Implemented

**Planned Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/approvals/create` | POST | Create approval request |
| `/api/approvals/<id>` | GET | Get approval details |
| `/api/approvals/<id>/approve` | POST | Approve as approver |
| `/api/approvals/<id>/reject` | POST | Reject approval |
| `/api/approvals/pending` | GET | Get pending approvals |
| `/api/approvals/history` | GET | Get approval history |

---

### 6. Chat Routes (`/api/chat`) - To Be Implemented

**Planned Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/groups` | GET | Get user's chat groups |
| `/api/chat/groups/<id>/messages` | GET | Get group messages |
| `/api/chat/send` | POST | Send message |
| `/api/chat/direct/<user_id>` | GET | Get direct messages |

**WebSocket Events:**
```javascript
// Connect
socket.emit('join_room', { roomId: 'dept_123' })

// Send message
socket.emit('send_message', { 
  roomId: 'dept_123', 
  message: 'Hello' 
})

// Receive message
socket.on('new_message', (data) => {
  // Handle incoming message
})
```

---

### 7. Circular Routes (`/api/circulars`) - To Be Implemented

**Planned Endpoints:**

| Endpoint | Method | Description | Role |
|----------|--------|-------------|------|
| `/api/circulars` | GET | Get circulars | All |
| `/api/circulars/<id>` | GET | Get circular details | All |
| `/api/circulars` | POST | Create circular | Admin |
| `/api/circulars/<id>` | PUT | Update circular | Admin |
| `/api/circulars/<id>/publish` | POST | Publish circular | Admin |

---

## Frontend Routes (React Router)

### Public Routes (No Authentication Required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Redirect | Redirects to `/login` or `/dashboard` |
| `/login` | Login | Login page |
| `/register` | Register | Registration page |

### Protected Routes (Authentication Required)

| Path | Component | Role | Description |
|------|-----------|------|-------------|
| `/dashboard` | AdminDashboard | Admin | Admin dashboard |
| `/dashboard` | FacultyDashboard | Faculty | Faculty dashboard |
| `/dashboard` | StudentDashboard | Student | Student dashboard |

**Route Protection Logic:**
```javascript
<Route
  path="/dashboard"
  element={isAuthenticated ? 
    getDashboardComponent() : // Role-based
    <Navigate to="/login" replace />
  }
/>

function getDashboardComponent() {
  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'student': return <StudentDashboard />;
  }
}
```

---

## Request/Response Flow Examples

### Example 1: User Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@university.edu",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "admin@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "institutionId": "uuid",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Example 2: Get Institutions

**Request:**
```http
GET /api/institutions/list
```

**Response:**
```json
{
  "success": true,
  "institutions": [
    {
      "id": "uuid-1",
      "name": "ABC University",
      "unique_id": "ABC123",
      "type": "university"
    },
    {
      "id": "uuid-2",
      "name": "XYZ College",
      "unique_id": "XYZ456",
      "type": "college"
    }
  ]
}
```

---

### Example 3: Validate Institution

**Request:**
```http
POST /api/institutions/validate
Content-Type: application/json

{
  "name": "ABC University",
  "uniqueId": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "institution": {
    "id": "uuid-1",
    "name": "ABC University",
    "unique_id": "ABC123"
  },
  "departments": [
    {
      "id": "dept-uuid-1",
      "name": "Computer Science"
    },
    {
      "id": "dept-uuid-2",
      "name": "Mathematics"
    }
  ]
}
```

---

### Example 4: Register New User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "student",
  "institutionName": "ABC University",
  "institutionUniqueId": "ABC123",
  "uniqueId": "STU001",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please wait for admin approval."
}
```

---

### Example 5: Get Current User (Protected)

**Request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "institutionId": "uuid",
    "departmentId": null,
    "sectionId": null,
    "status": "active",
    "walletAddress": "0x1234...",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

---

## Smart Contract Functions (Blockchain Layer)

### DocumentManager Contract

**Upload Document:**
```javascript
// Frontend call
const tx = await documentManager.uploadDocument(
  ipfsHash,        // "QmXx..."
  fileName,        // "certificate.pdf"
  fileSize,        // 1024000
  documentType     // "certificate"
);
const receipt = await tx.wait();
const documentId = receipt.events[0].args.documentId;
```

**Share Document:**
```javascript
await documentManager.shareDocument(
  documentId,      // bytes32
  recipientAddress,// 0x1234...
  "read"          // permission
);
```

**Verify Document:**
```javascript
const isValid = await documentManager.verifyDocument(
  documentId,
  ipfsHash
);
// Returns: true/false
```

**Get User Documents:**
```javascript
const documentIds = await documentManager.getOwnerDocuments(
  userAddress
);
// Returns: bytes32[] array
```

---

## API Error Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | Request successful |
| 201 | Created | User/resource created |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid token/credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email exists) |
| 500 | Server Error | Internal server error |

---

## CORS Configuration

**Allowed Origins:**
```python
CORS_ORIGINS = [
  'http://localhost:3000',   # React dev server (CRA)
  'http://localhost:5173',   # Vite dev server
  'http://localhost:8080'    # Alternative
]
```

**Allowed Methods:**
```python
['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

**Allowed Headers:**
```python
['Content-Type', 'Authorization', 'X-Requested-With']
```

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_CHAIN_ID=11155111
VITE_DOCUMENT_MANAGER_ADDRESS=0x...
```

### Backend (.env)
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=postgresql://postgres:mk0492@localhost:5432/Docu-Chain
PINATA_API_KEY=your-key
PINATA_SECRET_KEY=your-secret
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x...
```

---

## Development URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:5000 | 5000 |
| PostgreSQL | localhost:5432 | 5432 |
| Hardhat Node | http://127.0.0.1:8545 | 8545 |

---

## Testing Endpoints

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**List Institutions:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/institutions/list"
```

**Login:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"test123"}'
```

---

## Route Order (Execution Priority)

Flask routes are matched in order of registration:

1. `/api/auth/*` - Authentication (auth.py)
2. `/api/documents/*` - Documents (documents.py)
3. `/api/users/*` - Users (users.py)
4. `/api/approvals/*` - Approvals (approvals.py)
5. `/api/chat/*` - Chat (chat.py)
6. `/api/circulars/*` - Circulars (circulars.py)
7. `/api/institutions/*` - Institutions (institutions.py)

---

**End of Routing Guide**
