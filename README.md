# 🔗 DocuChain - Blockchain Document Management System

A comprehensive blockchain-based document management system designed for educational institutions with role-based access control, IPFS storage, and Ethereum smart contracts.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Testing](#testing)
- [User Roles](#user-roles)
- [Core Features](#core-features)

## 🎯 Overview

DocuChain is a decentralized document management platform that enables educational institutions to:
- Securely store documents on IPFS
- Verify document authenticity using blockchain
- Manage multi-role access (Admin, Faculty, Students)
- Enable document approval workflows with digital signatures
- Generate institutional documents from templates
- Track document version history on blockchain

## ✨ Features

### 🔐 Authentication & Authorization
- MetaMask wallet integration
- Email/OTP verification
- Three-tier role system (Admin, Faculty, Student)
- Institution-specific unique ID system

### 📁 File Management
- IPFS decentralized storage via Pinata
- Folder organization with drag-and-drop
- File sharing with granular permissions
- Version control on blockchain
- Trash system with 30-day recovery

### 💬 Communication
- Real-time chat with file sharing
- Department and section group chats
- Institution-wide circular system
- Notification system

### ✅ Document Approval Workflow
- Multi-signature approval process
- Sequential and parallel approval modes
- Digital signature integration
- QR code verification
- Approval status tracking

### 📄 Document Generation
- Pre-defined institutional templates
- Auto-fill institution details
- Draft system with blockchain storage
- Circular generation tool

### 🔍 Verification Tool
- Document authenticity checking
- QR code scanning
- Tamper detection
- Ownership verification

### 👥 User Management (Admin)
- Account approval system
- User CRUD operations
- Department and section management
- Analytics dashboard

## 🏗️ Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │◄────►│   Backend    │◄────►│   Database   │
│   (React)    │      │   (Flask)    │      │  (PostgreSQL)│
└──────┬───────┘      └──────┬───────┘      └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   MetaMask   │      │ IPFS/Pinata  │
│   Wallet     │      │   Gateway    │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│  Ethereum    │
│   Sepolia    │
└──────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API + React Query
- **Routing**: React Router v6
- **Blockchain**: Web3.js, ethers.js
- **UI Components**: Custom + Headless UI

### Backend
- **Framework**: Flask 2.3+
- **Database**: PostgreSQL (production), SQLite (dev)
- **ORM**: SQLAlchemy
- **Authentication**: Flask-JWT-Extended
- **Real-time**: Socket.IO
- **Storage**: Pinata IPFS API

### Blockchain
- **Network**: Ethereum Sepolia Testnet
- **Smart Contracts**: Solidity 0.8.x
- **Development**: Hardhat
- **Testing**: Chai, Mocha
- **Wallet**: MetaMask integration

## 📂 Project Structure

```
Docu-Chain/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Buttons, Modals, etc.
│   │   │   ├── layout/      # Header, Sidebar, Footer
│   │   │   ├── dashboard/   # Dashboard widgets
│   │   │   └── file/        # File-related components
│   │   ├── pages/           # Route pages
│   │   │   ├── auth/        # Login, Register, CreateInstitution
│   │   │   ├── admin/       # Admin dashboard & tools
│   │   │   ├── faculty/     # Faculty dashboard
│   │   │   └── student/     # Student dashboard
│   │   ├── services/        # API calls
│   │   │   ├── api.js       # Axios instance
│   │   │   ├── auth.js      # Auth endpoints
│   │   │   ├── documents.js # Document endpoints
│   │   │   └── blockchain.js# Web3 interactions
│   │   ├── contexts/        # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── Web3Context.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx          # Root component
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Flask application
│   ├── app/
│   │   ├── __init__.py      # App factory
│   │   ├── routes/          # API routes
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── documents.py # Document management
│   │   │   ├── users.py     # User management
│   │   │   ├── approvals.py # Approval workflow
│   │   │   └── chat.py      # Chat & messaging
│   │   ├── models/          # Database models
│   │   │   ├── user.py
│   │   │   ├── institution.py
│   │   │   ├── document.py
│   │   │   └── approval.py
│   │   ├── services/        # Business logic
│   │   │   ├── ipfs_service.py
│   │   │   ├── blockchain_service.py
│   │   │   ├── email_service.py
│   │   │   └── pdf_service.py
│   │   └── utils/           # Helper functions
│   │       ├── security.py  # Password hashing
│   │       ├── validators.py
│   │       └── decorators.py
│   ├── migrations/          # Alembic migrations
│   ├── config.py            # Configuration
│   ├── run.py               # Entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
│
├── blockchain/              # Smart contracts
│   ├── contracts/
│   │   ├── DocumentManager.sol     # Main contract
│   │   ├── ApprovalWorkflow.sol    # Approval logic
│   │   ├── InstitutionRegistry.sol # Institution management
│   │   └── AccessControl.sol       # Role management
│   ├── scripts/
│   │   ├── deploy.js        # Deployment script
│   │   └── verify.js        # Contract verification
│   ├── test/                # Contract tests
│   ├── hardhat.config.js    # Hardhat configuration
│   └── package.json
│
├── docs/                    # 📚 Documentation
│   ├── features/           # Feature documentation
│   ├── development/        # Development guides
│   ├── testing/            # Testing documentation
│   └── README.md           # Documentation index
│
├── tests/                   # 🧪 Test Scripts
│   ├── test_*.py           # Python test scripts
│   ├── test_*.ps1          # PowerShell test scripts
│   └── README.md           # Testing guide
│
├── .gitignore
├── package.json             # Root package.json
├── README.md
└── .env.example             # Global environment template
```

## 🚀 Quick Start

Get DocuChain running in minutes:

1. **Clone & Setup**
   ```bash
   git clone https://github.com/mujju-212/Docu-Chain.git
   cd Docu-Chain
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python init_db.py
   python run.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📚 Documentation

Comprehensive documentation is organized in the `/docs` folder:

- **[Setup Guide](docs/SETUP.md)** - Detailed installation instructions
- **[Quick Start](docs/QUICKSTART.md)** - Get running immediately  
- **[Login Credentials](docs/LOGIN_CREDENTIALS.md)** - Test account access
- **[Features](docs/features/)** - Feature-specific documentation
- **[Development](docs/development/)** - Development guides and analysis

## 🧪 Testing

Test scripts are available in the `/tests` folder:

- **Authentication Tests** - Complete auth flow validation
- **Email System Tests** - Professional email template testing  
- **API Tests** - Backend endpoint validation
- **Frontend Tests** - UI and error handling tests

Run tests with: `python tests/test_all_fixes.py`

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **PostgreSQL** >= 14 (or SQLite for development)
- **MetaMask** browser extension
- **Git**
- **Pinata Account** (for IPFS)
- **Infura Account** (for Ethereum RPC)

## 🚀 Installation

### 1. Clone the Repository

```powershell
git clone https://github.com/mujju-212/Docu-Chain.git
cd Docu-Chain
```

### 2. Install All Dependencies

```powershell
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install blockchain dependencies
cd blockchain
npm install
cd ..

# Install backend dependencies (Windows)
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## ⚙️ Configuration

### 1. Backend Environment (.env in backend/)

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/docuchain
# Or for development:
# DATABASE_URL=sqlite:///docuchain.db

# IPFS/Pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt

# Blockchain
CONTRACT_ADDRESS=0x1203dc6f5d10556449e194c0c14f167bb3d72208
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CHAIN_ID=11155111

# Email (for OTP)
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_TEMPLATE_ID=your-emailjs-template-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. Frontend Environment (.env in frontend/)

```env
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x1203dc6f5d10556449e194c0c14f167bb3d72208
VITE_CHAIN_ID=11155111
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### 3. Blockchain Environment (.env in blockchain/)

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your-deployer-private-key
ETHERSCAN_API_KEY=your-etherscan-api-key
```

## 🏃 Running the Application

### Development Mode

#### Option 1: Run All Services Concurrently

```powershell
npm run dev
```

#### Option 2: Run Services Individually

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\activate
python run.py
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Terminal 3 - Local Blockchain (Optional):**
```powershell
cd blockchain
npx hardhat node
# Local blockchain runs on http://localhost:8545
```

### Deploy Smart Contracts

```powershell
# Deploy to Sepolia testnet
npm run deploy:contracts

# Or manually:
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

### Initialize Database

```powershell
cd backend
.\venv\Scripts\activate
flask db upgrade
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

## 👥 User Roles

### 1. Admin
- Create and manage institution
- Approve/reject account requests
- User management (CRUD operations)
- Department and section management
- Full access to all features

### 2. Faculty/Staff
- Upload and manage documents
- Request document approvals
- Generate documents from templates
- Create circulars
- Manage student documents
- Access department groups

### 3. Students
- Upload personal documents
- Request approvals from faculty
- View shared documents
- Access class and department groups
- Verify documents

## 🔧 Core Features Breakdown

### Institution Registration Flow
1. Admin fills institution details (name, type, address, unique ID)
2. Admin creates own account with institution
3. System generates institution-wide group chat
4. Department/section groups auto-created as added

### Account Creation Flow
1. User selects role and fills form
2. Enters correct institution name + unique ID
3. Form sent to admin for review
4. Admin approves/rejects → Email notification sent
5. User can login after approval

### Document Upload Flow
1. Connect MetaMask wallet
2. Select file → Upload to IPFS (Pinata)
3. Receive IPFS hash (QmXXX...)
4. Create blockchain transaction
5. Store metadata in database
6. Document appears in "My Files"

### Document Approval Flow
1. User selects document from blockchain
2. Choose recipients + roles (HOD, Principal, etc.)
3. Set approval type (Standard / Digital Signature)
4. Choose process (Sequential / Parallel)
5. Generate request → Goes to approvers
6. Approver reviews → Signs/Approves
7. New version generated with QR + signatures
8. Final document sent to requestor

### File Sharing Flow
1. Select file/folder from File Manager
2. Choose recipient (by search or connection)
3. Set permissions (Read / Read+Write)
4. Blockchain records sharing event
5. Recipient sees in "Shared With Me"
6. Chat interface shows sharing activity

## 🧪 Testing

### Backend Tests
```powershell
cd backend
pytest
```

### Smart Contract Tests
```powershell
cd blockchain
npx hardhat test
```

### Frontend Tests
```powershell
cd frontend
npm run test
```

## 📱 Responsive Design

DocuChain is fully responsive and works on:
- 💻 Desktop (1920px+)
- 💼 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

## 🎨 Theme Support

Multiple color themes available:
- 🟢 Green (Default)
- 🔵 Blue
- 🟣 Purple
- 🔴 Red
- ⚫ Dark Mode

Users can switch themes in Settings.

## 🔒 Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ MetaMask signature verification
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Session management
- ✅ Input validation
- ✅ HTTPS enforcement (production)

## 📊 Database Schema

Key tables:
- `institutions` - Institution details
- `users` - User accounts
- `documents` - Document metadata
- `document_shares` - Sharing permissions
- `approvals` - Approval workflow
- `departments` - Department structure
- `sections` - Section/class management
- `messages` - Chat messages
- `circulars` - Institutional circulars
- `activity_logs` - User activity tracking

## 🌐 API Documentation

Once running, API docs available at:
- Swagger UI: `http://localhost:5000/api/docs`
- ReDoc: `http://localhost:5000/api/redoc`

## 🐛 Troubleshooting

### MetaMask Not Connecting
- Ensure MetaMask is installed
- Switch to Sepolia network
- Clear browser cache

### Transaction Failing
- Check Sepolia ETH balance
- Verify gas settings
- Confirm network connectivity

### IPFS Upload Failed
- Verify Pinata API keys
- Check file size limits
- Ensure network connectivity

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `flask db upgrade`

## 📚 Additional Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [React Documentation](https://react.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [IPFS Documentation](https://docs.ipfs.tech/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Author

**mujju-212**
- GitHub: [@mujju-212](https://github.com/mujju-212)

## 🙏 Acknowledgments

- Ethereum Foundation
- IPFS/Pinata
- OpenZeppelin
- React Team
- Flask Community

---

**Note**: This is a educational/institutional project. Ensure proper security audits before production deployment.

For support, email: support@docuchain.example.com
