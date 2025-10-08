# 📚 DocuChain - Complete Project Structure Analysis

**Generated:** October 7, 2025  
**Repository:** Docu-Chain by mujju-11

---

## 🎯 Project Overview

**DocuChain** is a **blockchain-based document management system** designed for educational institutions (schools, colleges, universities, coaching centers). It provides secure, decentralized document storage using IPFS, Ethereum smart contracts for verification, and a comprehensive role-based access control system.

### Key Objectives
1. **Decentralized Storage**: Documents stored on IPFS with blockchain verification
2. **Tamper-Proof Records**: Immutable document history on Ethereum
3. **Multi-Role Access**: Admin, Faculty, and Student roles with specific permissions
4. **Document Workflows**: Approval processes with digital signatures
5. **Institutional Management**: Hierarchical structure (Institution → Department → Section)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React Frontend (Port 3000/5173)                    │  │
│  │   - Material UI Components                           │  │
│  │   - React Router for Navigation                      │  │
│  │   - Axios for API calls                              │  │
│  │   - Context API for State Management                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    SERVER LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Flask Backend (Port 5000)                          │  │
│  │   - RESTful API Endpoints                            │  │
│  │   - JWT Authentication                               │  │
│  │   - Flask-SocketIO for Real-time Chat               │  │
│  │   - File Upload Handling                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          ↓ ↑                    ↓ ↑                  ↓ ↑
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │  IPFS/Pinata     │  │  Ethereum        │
│   Database       │  │  (File Storage)  │  │  (Sepolia)       │
│                  │  │                  │  │                  │
│  - User Data     │  │  - Documents     │  │  - Smart         │
│  - Metadata      │  │  - Files         │  │    Contracts     │
│  - Relations     │  │  - Images        │  │  - Verification  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 📂 Project Structure Deep Dive

### Root Level
```
Docu-Chain/
├── 📘 DocuChain PRD.txt       # Product Requirements Document (24k+ lines)
├── README.md                  # Project documentation
├── QUICKSTART.md              # Fast setup guide
├── SETUP.md                   # Detailed setup instructions
├── package.json               # Root package manager (workspace config)
├── backend/                   # Python Flask API
├── frontend/                  # React application
├── blockchain/                # Solidity smart contracts
├── database/                  # PostgreSQL schema & scripts
└── F1/                        # HTML prototypes/templates
```

---

## 🔧 Backend Structure (Python Flask)

### Directory Layout
```
backend/
├── run.py                     # Application entry point
├── config.py                  # Configuration management
├── requirements.txt           # Python dependencies
├── init_db.py                 # Database initialization script
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── models/               # Database models (SQLAlchemy)
│   │   ├── user.py          # User model
│   │   ├── document.py      # Document, DocumentShare, DocumentVersion
│   │   └── institution.py   # Institution, Department, Section
│   ├── routes/               # API endpoints (Blueprints)
│   │   ├── auth.py          # Authentication routes
│   │   ├── documents.py     # Document management
│   │   ├── users.py         # User operations
│   │   ├── approvals.py     # Approval workflows
│   │   ├── chat.py          # Real-time messaging
│   │   ├── circulars.py     # Circular announcements
│   │   └── institutions.py  # Institution/dept/section APIs
│   ├── services/             # Business logic layer
│   └── utils/                # Helper functions
└── uploads/                   # Temporary file storage
```

### Key Backend Components

#### 1. **run.py** - Application Entry Point
```python
from app import create_app, socketio, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

#### 2. **config.py** - Configuration Management
- **SECRET_KEY**: Flask session encryption
- **DATABASE_URI**: PostgreSQL connection string
  - Default: `postgresql://postgres:mk0492@localhost:5432/Docu-Chain`
- **JWT Configuration**: Token expiry (1 day access, 30 days refresh)
- **CORS Settings**: Allowed origins for frontend
- **File Upload**: 50MB max, allowed extensions
- **IPFS/Pinata**: API keys and gateway URLs
- **Blockchain**: Contract addresses, Sepolia RPC URL

#### 3. **app/__init__.py** - Flask Factory Pattern
```python
def create_app(config_name=None):
    app = Flask(__name__)
    
    # Initialize extensions
    db.init_app(app)           # SQLAlchemy
    migrate.init_app(app, db)  # Flask-Migrate
    jwt.init_app(app)          # JWT authentication
    CORS(app)                  # Cross-origin requests
    socketio.init_app(app)     # WebSocket support
    
    # Register blueprints (API routes)
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(documents.bp, url_prefix='/api/documents')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(approvals.bp, url_prefix='/api/approvals')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    app.register_blueprint(circulars.bp, url_prefix='/api/circulars')
    app.register_blueprint(institutions.bp, url_prefix='/api/institutions')
    
    return app
```

### Database Models

#### **User Model** (`app/models/user.py`)
```python
class User(db.Model):
    id = UUID (Primary Key)
    unique_id = String (Institution-specific ID)
    email = String (Unique)
    password_hash = String
    first_name, last_name = String
    role = String ('admin', 'faculty', 'student')
    institution_id = FK → institutions
    department_id = FK → departments
    section_id = FK → sections
    wallet_address = String (Ethereum address)
    status = String ('pending', 'active', 'banned')
    created_at, updated_at, last_login = DateTime
    
    Methods:
    - set_password(password)      # Hash password
    - check_password(password)    # Verify password
    - to_dict()                   # Serialize to JSON
```

#### **Document Model** (`app/models/document.py`)
```python
class Document(db.Model):
    id = UUID
    document_id = String (Blockchain ID)
    ipfs_hash = String (IPFS CID)
    file_name, file_size, document_type
    owner_id = FK → users
    owner_address = String (Ethereum)
    transaction_hash = String (Blockchain tx)
    block_number = Integer
    is_active = Boolean
    is_in_trash = Boolean
    trash_date = DateTime
    timestamp = BigInteger
    
class DocumentShare:
    document_id = FK
    shared_by_id, shared_with_id = FK → users
    permission = String ('read', 'write')
    transaction_hash = String
    
class DocumentVersion:
    document_id = FK
    version_number = Integer
    ipfs_hash = String
    transaction_hash = String
    description = Text
```

#### **Institution Model** (`app/models/institution.py`)
```python
class Institution(db.Model):
    id = UUID
    name, type, unique_id = String
    address, website, email, phone
    
class Department(db.Model):
    id = UUID
    institution_id = FK
    name = String
    head_of_department_id = FK → users
    
class Section(db.Model):
    id = UUID
    department_id = FK
    name = String
    class_teacher_id = FK → users
```

### API Routes

#### **Authentication Routes** (`/api/auth`)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/register` | POST | Register new user (pending approval) | ❌ |
| `/login` | POST | Login with email/password | ❌ |
| `/create-institution` | POST | Create institution + admin user | ❌ |
| `/me` | GET | Get current user info | ✅ JWT |
| `/logout` | POST | Logout (client-side token removal) | ✅ JWT |

**Login Flow:**
1. User submits email + password
2. Backend verifies credentials
3. Checks user status (must be 'active')
4. Updates `last_login` timestamp
5. Returns JWT token + user data
6. Frontend stores token in localStorage

#### **Institution Routes** (`/api/institutions`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/list` | GET | Get all institutions (for dropdown) |
| `/<id>/departments` | GET | Get departments of institution |
| `/validate` | POST | Validate institution name + unique_id |
| `/departments/<id>/sections` | GET | Get sections of department |

#### **Other Routes** (Placeholder - to be implemented)
- `/api/documents` - Document CRUD operations
- `/api/users` - User management (admin)
- `/api/approvals` - Approval workflow management
- `/api/chat` - Real-time messaging
- `/api/circulars` - Circular/announcement management

---

## 🎨 Frontend Structure (React)

### Directory Layout
```
frontend/
├── package.json               # Dependencies
├── vite.config.js            # Vite bundler config
├── tailwind.config.js        # TailwindCSS config
├── index.html                # Entry HTML
├── src/
│   ├── main.js               # Entry point
│   ├── App.js                # Main app component
│   ├── index.css             # Global styles
│   ├── components/           # Reusable components
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── common/           # Shared components
│   │   └── layout/           # Layout components
│   ├── contexts/             # React Context (State Management)
│   │   ├── AuthContext.js    # Authentication state
│   │   ├── ThemeContext.js   # Theme switching
│   │   └── Web3Context.js    # Blockchain connection
│   ├── pages/                # Route pages
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── faculty/          # Faculty dashboard pages
│   │   ├── student/          # Student dashboard pages
│   │   ├── auth/             # Auth pages (login/register)
│   │   └── shared/           # Shared pages
│   ├── services/             # API service layer
│   │   ├── api.js            # Axios instance
│   │   ├── auth.js           # Auth API calls
│   │   ├── documents.js      # Document API calls
│   │   └── blockchain.js     # Web3 interactions
│   ├── hooks/                # Custom React hooks
│   └── utils/                # Helper functions
└── build/                     # Production build output
```

### Key Frontend Components

#### 1. **App.js** - Main Application Router
```javascript
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            isAuthenticated ? getDashboardComponent() : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Role-based dashboard routing
const getDashboardComponent = () => {
  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    case 'student': return <StudentDashboard />;
  }
};
```

#### 2. **AuthContext.js** - Authentication State Management
Currently using **AuthContextLocal** (local storage mock) for development. Production version will use:

```javascript
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Functions:
  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
  };
  
  const register = async (userData) => { /* ... */ };
  const createInstitution = async (data) => { /* ... */ };
  const logout = async () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3. **api.js** - Axios Configuration
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor - Add JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 4. **Login Component** (`components/Login.js`)
Features:
- Email/password validation
- "Remember me" functionality (localStorage)
- MetaMask wallet connection
- Error handling with toast notifications
- Redirects to role-specific dashboard

#### 5. **AdminDashboard** (`pages/admin/AdminDashboard.js`)
Sections:
- **Overview**: System statistics
- **My Files**: Document management (24 files)
- **Chat Messages**: Real-time chat (5 unread)
- **Generate Document**: Create from templates
- **Document Verifier**: QR code verification
- **User Management**: CRUD operations
- **Account Requests**: Approve/reject new users (7 pending)
- **Add User**: Manual user creation
- **Institution Management**: Dept/section management
- **Blockchain Monitor**: Transaction tracking

---

## 🔗 Blockchain Layer (Ethereum)

### Directory Structure
```
blockchain/
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Node dependencies
├── contracts/                # Solidity smart contracts
│   ├── DocumentManager.sol   # Main document contract
│   └── ApprovalWorkflow.sol  # Approval process contract
├── scripts/
│   └── deploy.js            # Deployment script
└── test/                     # Contract tests
```

### Smart Contract: DocumentManager.sol

#### Purpose
Manages document storage, sharing, and verification on Ethereum blockchain.

#### Key Features
1. **Access Control**: Admin, Verifier roles using OpenZeppelin
2. **Reentrancy Guard**: Prevents reentrancy attacks
3. **Pausable**: Emergency stop mechanism

#### Structs
```solidity
struct Document {
    string ipfsHash;        // IPFS CID
    address owner;          // Ethereum address
    uint256 timestamp;      // Block timestamp
    string fileName;
    uint256 fileSize;
    bool isActive;          // Soft delete flag
    string documentType;    // certificate, transcript, etc.
}

struct DocumentShare {
    address sharedWith;
    string permission;      // "read" or "write"
    uint256 timestamp;
    bool isActive;
}
```

#### Main Functions

| Function | Description | Access |
|----------|-------------|--------|
| `uploadDocument()` | Upload new document, returns document ID | Any user |
| `shareDocument()` | Share document with another user | Owner only |
| `getDocument()` | Retrieve document details | Public view |
| `getOwnerDocuments()` | Get all documents of an address | Public view |
| `verifyDocument()` | Verify document authenticity | Public view |
| `updateDocument()` | Update IPFS hash (new version) | Owner only |
| `deactivateDocument()` | Soft delete document | Owner/Admin |
| `pause()` / `unpause()` | Emergency stop | Admin only |

#### Events
```solidity
event DocumentUploaded(bytes32 indexed documentId, address indexed owner, string ipfsHash, string fileName, uint256 timestamp);
event DocumentShared(bytes32 indexed documentId, address indexed owner, address indexed sharedWith, string permission, uint256 timestamp);
event DocumentDeactivated(bytes32 indexed documentId, address indexed owner, uint256 timestamp);
event DocumentUpdated(bytes32 indexed documentId, string newIpfsHash, uint256 timestamp);
```

#### Deployment Configuration
```javascript
// hardhat.config.js
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11155111
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337
  }
}
```

---

## 🗄️ Database Schema (PostgreSQL)

### Complete Table Structure

#### **Core Tables**

1. **institutions**
   - Institution details (name, type, unique_id)
   - Contact info (address, email, phone, website)

2. **departments**
   - Belongs to institution
   - Has head_of_department (FK to users)

3. **sections**
   - Belongs to department
   - Has class_teacher (FK to users)

4. **users**
   - User credentials and profile
   - Role: admin, faculty, student
   - Status: pending, active, banned
   - Links to institution, department, section
   - Wallet address for blockchain

#### **Document Management**

5. **folders**
   - Hierarchical folder structure
   - parent_folder_id for nesting
   - is_system_folder flag
   - Soft delete (is_deleted, deleted_at)

6. **documents**
   - Document metadata
   - IPFS hash (unique)
   - Blockchain transaction_id
   - Approval status
   - Soft delete support

7. **document_versions**
   - Version history
   - Each version has IPFS hash
   - Changes description

8. **document_shares**
   - Document/folder sharing
   - Permission levels (read, write)

#### **Approval Workflow**

9. **document_approval_requests**
   - Approval type: standard, digital_sign
   - Process: parallel, sequential
   - Status: pending, approved, rejected

10. **document_approvers**
    - Individual approvers in workflow
    - Sequence order for sequential approval
    - Signature data storage
    - Status tracking

#### **Communication**

11. **chat_groups**
    - Group types: institution, department, section, custom
    - Auto-join flag for default groups

12. **chat_group_members**
    - User membership in groups
    - Role: admin, member

13. **chat_messages**
    - Text, file, approval_request types
    - Can reference documents
    - Soft delete support

14. **circulars**
    - Institution-wide announcements
    - Priority levels
    - Target audience filtering
    - Status: draft, published

#### **System Tables**

15. **account_requests**
    - Pending user registrations
    - Admin approval workflow
    - Status: pending, approved, rejected

16. **document_templates**
    - Pre-defined document templates
    - Institution-specific or system-wide

17. **user_sessions**
    - JWT session management
    - Wallet address tracking
    - IP and user agent logging

18. **activity_logs**
    - Audit trail
    - User actions tracking
    - JSONB details field

19. **notifications**
    - User notifications
    - Read/unread status
    - JSONB data field

20. **user_preferences**
    - Theme selection
    - Notification settings
    - Language and timezone

21. **blockchain_transactions**
    - Transaction history
    - Gas tracking
    - Status: pending, confirmed, failed

### Database Relationships

```
institutions (1) ────> (M) departments
    │                       │
    │                       │
    (1)                    (1)
    │                       │
    ↓                       ↓
users (M)              sections (M)
    │                       │
    │                       │
    └──────────(M)──────────┘
            │
            ↓
       documents (M)
            │
            ├──> document_versions (M)
            ├──> document_shares (M)
            ├──> document_approval_requests (M)
            └──> chat_messages (M)
```

### Key Indexes
```sql
CREATE INDEX idx_users_institution_id ON users(institution_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_ipfs_hash ON documents(ipfs_hash);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
```

---

## 🔄 Key Workflows

### 1. **User Registration Flow**

```
┌──────────────┐
│ User submits │
│ registration │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ Backend validates:   │
│ - Email format       │
│ - Password strength  │
│ - Institution exists │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Create User record   │
│ Status: 'pending'    │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Notify admin         │
│ (notification table) │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Admin reviews in     │
│ Account Requests UI  │
└──────┬───────────────┘
       │
   ┌───┴───┐
   │       │
Approve  Reject
   │       │
   ↓       ↓
Status:  Status:
'active' 'rejected'
```

### 2. **Document Upload Flow**

```
┌──────────────────────┐
│ User selects file    │
│ in frontend          │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Upload to IPFS       │
│ (Pinata API)         │
│ Returns: IPFS hash   │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Call smart contract  │
│ uploadDocument()     │
│ with IPFS hash       │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Contract generates   │
│ unique document ID   │
│ Emits event          │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Backend stores in DB:│
│ - Document metadata  │
│ - IPFS hash          │
│ - Transaction hash   │
│ - Owner info         │
└──────────────────────┘
```

### 3. **Document Verification Flow**

```
┌──────────────────────┐
│ User scans QR code   │
│ or enters doc ID     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Frontend calls       │
│ /api/documents/verify│
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Backend queries:     │
│ 1. Database for      │
│    document record   │
│ 2. Smart contract    │
│    verifyDocument()  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Compare:             │
│ - IPFS hashes match  │
│ - Owner matches      │
│ - Document active    │
│ - Transaction valid  │
└──────┬───────────────┘
       │
   ┌───┴───┐
   │       │
Valid   Invalid
   │       │
   ↓       ↓
Display  Show
details  error
```

### 4. **Approval Workflow**

```
┌──────────────────────┐
│ User creates         │
│ approval request     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Select approvers     │
│ Set process type:    │
│ - Sequential OR      │
│ - Parallel           │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Notify approvers     │
│ (notifications +     │
│  chat messages)      │
└──────┬───────────────┘
       │
       ↓
   ┌────────────────┐
   │ Sequential?    │
   └───┬────────┬───┘
      YES      NO (Parallel)
       │        │
       ↓        ↓
   Approve   All must
   in order  approve
       │        │
       └───┬────┘
           │
           ↓
┌──────────────────────┐
│ All approved?        │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Update document      │
│ approval_status      │
│ = 'approved'         │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ Store signatures     │
│ Generate QR code     │
│ Notify requestor     │
└──────────────────────┘
```

---

## 🔐 Security Features

### 1. **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication
  - Access token: 1 day expiry
  - Refresh token: 30 days expiry
- **Password Hashing**: Werkzeug with salt
- **Role-Based Access**: Admin, Faculty, Student
- **Session Management**: Tracked in `user_sessions` table

### 2. **API Security**
- **CORS Configuration**: Whitelisted origins only
- **Rate Limiting**: (To be implemented)
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM + parameterized queries

### 3. **Blockchain Security**
- **Smart Contract**: OpenZeppelin security standards
  - AccessControl for role management
  - ReentrancyGuard to prevent attacks
  - Pausable for emergency stops
- **Transaction Verification**: All blockchain interactions verified
- **Wallet Integration**: MetaMask for secure key management

### 4. **File Security**
- **File Size Limits**: 50MB maximum
- **Allowed Extensions**: Whitelist-based
- **IPFS Pinning**: Permanent storage via Pinata
- **Virus Scanning**: (To be implemented)

### 5. **Data Privacy**
- **Personal Data**: Encrypted at rest (database-level)
- **Audit Logs**: All actions tracked in `activity_logs`
- **Soft Deletes**: Data retained for 30 days in trash

---

## 📊 Technology Stack Summary

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **React Router** | 6.28.0 | Client-side routing |
| **Axios** | 1.12.2 | HTTP client |
| **Ethers.js** | 6.9.0 | Ethereum library |
| **Web3.js** | 4.3.0 | Alternative Web3 provider |
| **React Hot Toast** | 2.6.0 | Notifications |
| **Vite** | Latest | Build tool (fast HMR) |
| **TailwindCSS** | Latest | Utility-first CSS |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 2.3.3 | Web framework |
| **Flask-SQLAlchemy** | 3.0.5 | ORM |
| **Flask-Migrate** | 4.0.5 | Database migrations |
| **Flask-JWT-Extended** | 4.5.3 | JWT auth |
| **Flask-SocketIO** | 5.3.4 | WebSocket support |
| **Flask-CORS** | 4.0.0 | CORS handling |
| **Psycopg2** | 2.9.9 | PostgreSQL adapter |
| **Gunicorn** | 21.2.0 | WSGI server (production) |
| **Eventlet** | 0.33.3 | Async support |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Solidity** | Smart contract language |
| **Hardhat** | Development framework |
| **OpenZeppelin** | Security standards |
| **Ethers.js** | Contract interaction |
| **Sepolia Testnet** | Testing network |
| **Infura** | RPC provider |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **UUID Extension** | Unique identifiers |
| **JSONB** | Flexible data storage |

### Storage
| Technology | Purpose |
|------------|---------|
| **IPFS** | Decentralized storage |
| **Pinata** | IPFS pinning service |

---

## 🚀 Development Workflow

### Local Development Setup

1. **Install Dependencies**
   ```powershell
   npm run install:all
   ```

2. **Configure Environment**
   - Copy `.env.example` files in backend/, frontend/, blockchain/
   - Update database credentials
   - Add Pinata API keys
   - Add Infura project ID

3. **Initialize Database**
   ```powershell
   cd backend
   python init_db.py
   ```

4. **Run Development Servers**
   ```powershell
   npm run dev  # Runs backend + frontend concurrently
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Database: localhost:5432

### Deployment Architecture

```
┌────────────────────────────────────────────────┐
│              Production Stack                  │
├────────────────────────────────────────────────┤
│                                                │
│  Frontend (Vercel/Netlify)                    │
│  - Static build (npm run build)                │
│  - CDN distribution                            │
│  - Auto-deploy on push                         │
│                                                │
│  Backend (Heroku/AWS/DigitalOcean)            │
│  - Gunicorn WSGI server                        │
│  - Nginx reverse proxy                         │
│  - SSL/TLS certificates                        │
│                                                │
│  Database (AWS RDS/Heroku Postgres)           │
│  - Automated backups                           │
│  - Connection pooling                          │
│                                                │
│  Blockchain (Ethereum Mainnet)                 │
│  - Deploy contracts via Hardhat                │
│  - Contract verification on Etherscan          │
│                                                │
│  Storage (Pinata/Infura IPFS)                 │
│  - Dedicated pinning                           │
│  - Custom gateway                              │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 📱 User Roles & Permissions

### Admin Role
**Access:**
- Full system control
- User management (CRUD)
- Institution/department/section management
- Account approval/rejection
- System analytics
- Blockchain monitoring
- All document operations

**Capabilities:**
- View all users
- Create/edit/delete users
- Approve pending registrations
- Manage organizational structure
- View system logs
- Generate reports
- Configure system settings

### Faculty Role
**Access:**
- Department documents
- Section-specific content
- Student document approvals
- Chat with students/faculty
- Circular creation
- Template usage

**Capabilities:**
- Upload documents
- Share with students/colleagues
- Create approval workflows
- Generate documents from templates
- View department analytics
- Manage section assignments

### Student Role
**Access:**
- Own documents
- Shared documents
- Class/section chat
- Circular notifications
- Document generation (limited)

**Capabilities:**
- Upload personal documents
- View shared files
- Request approvals (certificates, etc.)
- Chat with classmates
- View circulars
- Download official documents

---

## 🔍 Key Features Breakdown

### 1. File Management
- **Upload**: Drag-and-drop or click to upload
- **Folders**: Hierarchical organization
- **Sharing**: Granular permissions (read/write)
- **Versions**: Track document changes
- **Trash**: 30-day retention before permanent delete
- **Search**: Full-text search across filenames

### 2. Approval Workflows
- **Types**: Standard approval vs. Digital signature
- **Modes**: Sequential (one-by-one) vs. Parallel (all together)
- **Tracking**: Real-time status updates
- **Notifications**: Email + in-app notifications
- **Signatures**: Blockchain-verified digital signatures
- **QR Codes**: Generated for approved documents

### 3. Communication
- **Chat Groups**: Institution, Department, Section levels
- **Direct Messages**: One-on-one communication
- **File Sharing**: Attach documents in chat
- **Circulars**: Broadcast announcements
- **Notifications**: Real-time push notifications

### 4. Document Generation
- **Templates**: Pre-defined institutional formats
- **Auto-fill**: Populate from database
- **Customization**: Edit before finalization
- **Approval**: Submit for digital signatures
- **Download**: PDF with QR code

### 5. Blockchain Verification
- **QR Scanning**: Mobile-friendly verification
- **Document Lookup**: Search by ID/hash
- **Tamper Detection**: Hash comparison
- **Ownership Proof**: Blockchain-verified owner
- **Transaction History**: View full audit trail

---

## 🧪 Testing Strategy

### Unit Tests
- Backend: pytest for API endpoints
- Smart Contracts: Hardhat test suite
- Frontend: Jest + React Testing Library

### Integration Tests
- API integration tests
- Blockchain interaction tests
- Database transaction tests

### E2E Tests
- Playwright/Cypress for full user flows
- Critical paths: Registration → Login → Upload → Verify

---

## 📈 Future Roadmap

### Phase 1 (Current - MVP)
- ✅ User authentication
- ✅ Basic document upload
- ✅ Institution management
- 🚧 Document verification
- 🚧 Approval workflows

### Phase 2 (Q1 2025)
- Multi-factor authentication
- Advanced analytics dashboard
- Bulk user import
- Email notifications
- Mobile responsive design

### Phase 3 (Q2 2025)
- Mobile apps (iOS/Android)
- AI-powered document search
- Integration with Google Workspace
- API for third-party integrations
- Multi-language support

### Phase 4 (Q3 2025)
- Advanced reporting
- Custom workflow builder
- White-label solution
- Federated institution network
- Marketplace for templates

---

## 🐛 Known Issues & Limitations

1. **Blockchain Gas Costs**: High transaction fees on mainnet
   - **Solution**: Using Sepolia testnet for development
   
2. **IPFS Performance**: Gateway latency can vary
   - **Solution**: Pinata dedicated gateway + CDN

3. **Scalability**: PostgreSQL single instance
   - **Future**: Implement read replicas + sharding

4. **Real-time Chat**: SocketIO limitations for large-scale
   - **Future**: Migrate to Redis pub/sub

5. **File Size**: 50MB limit
   - **Reason**: IPFS pinning cost constraints

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview + setup |
| `QUICKSTART.md` | Fast 5-minute setup |
| `SETUP.md` | Detailed installation guide |
| `📘 DocuChain PRD.txt` | Complete product requirements (24k lines) |
| `AUTH_UI_COMPLETE.md` | Authentication UI documentation |
| `DYNAMIC_REGISTRATION_FEATURE.md` | Registration flow docs |
| `PROJECT_COMPLETE.md` | Project completion status |
| `TESTING_AUTH_UI.md` | Testing instructions |
| `LOGIN_CREDENTIALS.md` | Test user credentials |

---

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch
3. Make changes with descriptive commits
4. Write tests for new features
5. Update documentation
6. Submit pull request

---

## 📞 Support & Contact

- **GitHub**: mujju-11/Docu-Chain
- **Issues**: Use GitHub Issues
- **Discussions**: GitHub Discussions

---

## 📄 License

MIT License - See LICENSE file

---

## 🎓 Educational Context

This project is specifically designed for educational institutions with the following considerations:

1. **Institutional Hierarchy**: Schools/colleges have departments/sections
2. **User Roles**: Aligned with academic structure (admin, faculty, student)
3. **Document Types**: Transcripts, certificates, circulars, assignments
4. **Approval Flows**: Mimics real academic approval processes
5. **Communication**: Department/section-based chat groups

---

**End of Analysis**

*Generated with comprehensive reading of all project files*
*Last Updated: October 7, 2025*
