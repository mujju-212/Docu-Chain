<p align="center">
  <img src="frontend/public/logo192.png" alt="DocuChain Logo" width="120" height="120">
</p>

<h1 align="center">📄 DocuChain</h1>

<p align="center">
  <strong>Blockchain-Powered Document Management & Verification System</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-documentation">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Flask-3.0.0-000000?style=flat-square&logo=flask" alt="Flask">
  <img src="https://img.shields.io/badge/Solidity-0.8.19-363636?style=flat-square&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum" alt="Ethereum">
</p>

---

## 🎯 Overview

**DocuChain** is a decentralized document management system designed for educational institutions. It combines blockchain technology with IPFS storage to provide tamper-proof document verification, secure sharing, and multi-level approval workflows.

### Why DocuChain?

- 🔐 **Immutable Records**: Documents are hashed and stored on Ethereum blockchain
- 📁 **Decentralized Storage**: Files stored on IPFS via Pinata for censorship resistance
- ✅ **Instant Verification**: QR codes for instant document authenticity verification
- 👥 **Role-Based Access**: Student, Faculty, and Admin roles with granular permissions
- 📝 **Approval Workflows**: Sequential and parallel document approval processes
- 💬 **Real-Time Chat**: Built-in messaging with document sharing capabilities

---

## ✨ Features

### 📄 Document Management
- Upload, organize, and manage documents in folders
- Version control with complete history tracking
- Star/favorite documents for quick access
- Bulk operations (move, delete, share)

### 🔗 Blockchain Integration
- Document hash storage on Ethereum Sepolia testnet
- Smart contract-based sharing permissions
- On-chain approval workflows
- Transaction history and audit trail

### 🌐 IPFS Storage
- Decentralized file storage via Pinata
- Content-addressable storage (CID)
- Permanent document availability
- Gateway access for downloads

### ✅ Verification System
- QR code generation for each document
- Public verification portal
- Hash comparison verification
- Blockchain transaction proof

### 👥 Multi-Role System
| Role | Capabilities |
|------|-------------|
| **Student** | Upload documents, request approvals, share with peers |
| **Faculty** | All student features + approve documents, manage classes |
| **Admin** | Full access + user management, institution settings |

### 💬 Communication
- Direct messaging between users
- Group chats and channels
- Circular announcements
- Document sharing in chat

### 📝 Approval Workflows
- Sequential approval chains
- Parallel approval requests
- Digital signatures
- Deadline tracking
- Status notifications

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18.3 | UI Framework |
| React Router 6 | Navigation |
| Ethers.js 6 | Blockchain interaction |
| Web3.js 4 | MetaMask integration |
| Axios | API communication |
| Socket.IO Client | Real-time features |

### Backend
| Technology | Purpose |
|------------|---------|
| Flask 3.0 | Web framework |
| SQLAlchemy | ORM |
| PostgreSQL | Database |
| Flask-JWT-Extended | Authentication |
| Flask-SocketIO | WebSocket support |
| Flask-Mail | Email notifications |

### Blockchain
| Technology | Purpose |
|------------|---------|
| Solidity 0.8.19 | Smart contracts |
| Hardhat | Development framework |
| Ethereum Sepolia | Test network |
| OpenZeppelin | Security standards |

### Storage
| Technology | Purpose |
|------------|---------|
| Pinata | IPFS pinning service |
| IPFS Gateway | File retrieval |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **PostgreSQL** >= 13
- **MetaMask** browser extension
- **Git**

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mujju-212/Docu-Chain.git
cd Docu-Chain
```

### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE docuchain;
\q

# Or use the setup script (Windows)
cd database
.\setup.ps1
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
# Edit .env with your configuration

# Initialize database
python init_db.py

# Start the server
python run.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

### 5. Smart Contract Deployment (Optional)

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

---

## ⚙️ Configuration

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/docuchain

# JWT Secret
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# Email (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Flask
FLASK_ENV=development
FLASK_DEBUG=True
```

### Frontend `.env`

```env
# API
REACT_APP_API_URL=http://localhost:5000/api

# Pinata IPFS
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET_KEY=your-pinata-secret-key
REACT_APP_PINATA_JWT=your-pinata-jwt
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain (Sepolia Testnet)
REACT_APP_CONTRACT_ADDRESS=your-contract-address
REACT_APP_APPROVAL_CONTRACT_ADDRESS=your-approval-contract-address
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
```

---

## 📖 Usage

### Getting Started

1. **Create an Institution**
   - Navigate to `/register`
   - Select "Create New Institution"
   - Fill in institution details
   - You'll be the primary admin

2. **Register Users**
   - Students/Faculty register and select your institution
   - Admin approves user registrations
   - Users receive email confirmation

3. **Connect MetaMask**
   - Install MetaMask browser extension
   - Connect to Sepolia testnet
   - Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

4. **Upload Documents**
   - Navigate to File Manager
   - Upload files (stored on IPFS)
   - Optionally store hash on blockchain

5. **Share & Verify**
   - Share documents with other users
   - Generate QR codes for verification
   - Verify documents via public portal

### User Workflows

#### Student
```
Login → File Manager → Upload Document → Request Approval → Track Status
```

#### Faculty
```
Login → Dashboard → Review Pending Approvals → Approve/Reject → Notify Student
```

#### Admin
```
Login → Admin Panel → Manage Users → Configure Settings → Monitor Activity
```

---

## 📡 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Get current user |

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List user documents |
| `/api/documents` | POST | Upload document |
| `/api/documents/<id>` | GET | Get document details |
| `/api/documents/<id>` | DELETE | Delete document |
| `/api/documents/<id>/share` | POST | Share document |
| `/api/documents/<id>/verify` | GET | Verify document |

### Folders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/folders` | GET | List folders |
| `/api/folders` | POST | Create folder |
| `/api/folders/<id>` | PUT | Update folder |
| `/api/folders/<id>` | DELETE | Delete folder |

### Approvals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/approvals` | GET | List approvals |
| `/api/approvals` | POST | Create approval request |
| `/api/approvals/<id>/approve` | POST | Approve document |
| `/api/approvals/<id>/reject` | POST | Reject document |

---

## 🔗 Smart Contracts

### DocumentManagerV2
- **Network**: Sepolia Testnet
- **Functions**:
  - `uploadDocument()` - Store document hash
  - `shareDocument()` - Grant access permissions
  - `updateDocument()` - Update document version
  - `getDocument()` - Retrieve document data

### DocumentApprovalManager
- **Network**: Sepolia Testnet
- **Functions**:
  - `requestApproval()` - Create approval request
  - `approveDocument()` - Approve document
  - `rejectDocument()` - Reject document
  - `getApprovalStatus()` - Check approval status

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

Click the "Fork" button at the top right of this page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/Docu-Chain.git
cd Docu-Chain
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Describe your changes

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 📁 Project Structure

```
Docu-Chain/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Wallet, Theme)
│   │   ├── pages/           # Page components by role
│   │   ├── services/        # API and blockchain services
│   │   ├── utils/           # Helper functions
│   │   └── contracts/       # Contract ABIs
│   └── package.json
│
├── backend/                  # Flask backend API
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── requirements.txt
│   └── run.py
│
├── blockchain/               # Smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.js
│
└── database/                 # Database scripts
    ├── setup_database.sql
    └── sample_data.sql
```

---

## 🔒 Security

- JWT-based authentication with secure token handling
- Password hashing using bcrypt
- Environment variables for sensitive data
- Smart contract access controls
- Input validation and sanitization

### Reporting Vulnerabilities

If you discover a security vulnerability, please email the maintainer instead of creating a public issue.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for smart contract libraries
- [Pinata](https://pinata.cloud/) for IPFS pinning services
- [Infura](https://infura.io/) for Ethereum node access
- [Hardhat](https://hardhat.org/) for smart contract development

---

## 📞 Contact

**Mujju** - [@mujju-212](https://github.com/mujju-212)

Project Link: [https://github.com/mujju-212/Docu-Chain](https://github.com/mujju-212/Docu-Chain)

---

<p align="center">
  Made with ❤️ for secure document management
</p>
