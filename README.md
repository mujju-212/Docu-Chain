<div align="center">
  
<img src="assets/logo.png" alt="DocuChain Logo" width="200"/>

# DocuChain

### Blockchain-Powered Document Management & Verification System

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethereum.org/)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)](https://pinata.cloud/)

<br/>

**A decentralized document management platform for educational institutions with blockchain verification, IPFS storage, and multi-level approval workflows.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 🎯 What is DocuChain?

DocuChain solves the problem of document authenticity and verification in educational institutions. Traditional document systems are vulnerable to forgery and tampering. DocuChain provides:

- **Tamper-Proof Records** - Document hashes stored on Ethereum blockchain
- **Decentralized Storage** - Files stored on IPFS, not centralized servers
- **Instant Verification** - QR codes for anyone to verify document authenticity
- **Approval Workflows** - Multi-step approval processes with digital signatures

---

## ✨ Features

### 📁 Document Management
- Upload, organize, and manage documents in folders
- Version control with complete history
- Star/favorite documents for quick access
- Bulk operations (move, delete, share)
- Advanced search and filtering

### 🔗 Blockchain Integration
- Document hash stored on Ethereum Sepolia testnet
- Immutable proof of document existence and timestamp
- Smart contract-based access permissions
- On-chain approval workflows
- Complete transaction audit trail

### 🌐 IPFS Storage
- Decentralized file storage via Pinata
- Content-addressable storage (CID)
- Permanent document availability
- No single point of failure

### ✅ Verification System
- QR code generation for each document
- Public verification portal (no login required)
- Hash comparison verification
- Blockchain transaction proof

### 👥 Role-Based Access

| Role | Capabilities |
|:-----|:-------------|
| **Student** | Upload documents, request approvals, share with peers |
| **Faculty** | All student features + approve documents, manage classes |
| **Admin** | Full access + user management, institution settings |

### 💬 Communication
- Direct messaging between users
- Group chats and channels
- Circular announcements (admin)
- Share documents in chat

### 📝 Approval Workflows
- Sequential approval chains
- Parallel approval requests
- Digital signatures on blockchain
- Deadline tracking & notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, React Router 6, Ethers.js, Web3.js, Axios |
| **Backend** | Flask 3.0, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO |
| **Database** | PostgreSQL 15 |
| **Blockchain** | Solidity 0.8.19, Hardhat, Ethereum Sepolia |
| **Storage** | IPFS via Pinata |
| **Auth** | JWT tokens, bcrypt password hashing |

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **PostgreSQL** >= 13
- **MetaMask** browser extension
- **Git**

---

## 🚀 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mujju-212/Docu-Chain.git
cd Docu-Chain
```

### 2️⃣ Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE docuchain;
\q
```

### 3️⃣ Backend Setup

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

# Create .env file (copy from example)
cp .env.example .env
# Edit .env with your database credentials

# Initialize database tables
python init_db.py

# Start the server
python run.py
```

**Backend `.env` Configuration:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/docuchain
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### 4️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

**Frontend `.env` Configuration:**
```env
REACT_APP_API_URL=http://localhost:5000/api

# Pinata IPFS (Get keys from https://pinata.cloud)
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET_KEY=your-pinata-secret-key
REACT_APP_PINATA_JWT=your-pinata-jwt
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain (Sepolia)
REACT_APP_CONTRACT_ADDRESS=0xb19f78B9c32dceaA01DE778Fa46784F5437DF373
REACT_APP_APPROVAL_CONTRACT_ADDRESS=0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
```

### 5️⃣ MetaMask Setup

1. Install [MetaMask](https://metamask.io/) browser extension
2. Add Sepolia testnet network
3. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

---

## 📖 Usage

### Quick Start

1. **Register** - Create account and select your institution
2. **Connect Wallet** - Link MetaMask to enable blockchain features
3. **Upload Documents** - Files are stored on IPFS automatically
4. **Store on Blockchain** - Click "Store on Blockchain" for permanent verification
5. **Share & Verify** - Generate QR codes for instant verification

### User Workflows

**Student Flow:**
```
Register → Login → Upload Document → Request Approval → Track Status → Share
```

**Faculty Flow:**
```
Login → View Pending Approvals → Review Document → Approve/Reject → Notify
```

**Admin Flow:**
```
Login → Manage Users → Configure Settings → Post Circulars → Monitor Activity
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Documents
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/documents` | List user documents |
| POST | `/api/documents` | Upload document |
| GET | `/api/documents/:id` | Get document details |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/documents/:id/share` | Share document |
| GET | `/api/documents/:id/verify` | Verify document |

### Approvals
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/approvals` | List approval requests |
| POST | `/api/approvals` | Create approval request |
| POST | `/api/approvals/:id/approve` | Approve document |
| POST | `/api/approvals/:id/reject` | Reject document |

---

## 🔗 Smart Contracts

### DocumentManagerV2
Handles document storage and sharing on blockchain.

**Key Functions:**
- `uploadDocument()` - Store document hash
- `shareDocument()` - Grant access permissions
- `getDocument()` - Retrieve document data
- `verifyDocument()` - Verify document authenticity

### DocumentApprovalManager
Manages approval workflows on blockchain.

**Key Functions:**
- `requestApproval()` - Create approval request
- `approveDocument()` - Approve with signature
- `rejectDocument()` - Reject with reason
- `getApprovalStatus()` - Check approval status

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Docu-Chain.git
cd Docu-Chain
git remote add upstream https://github.com/mujju-212/Docu-Chain.git
```

### Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### Make Changes & Commit

```bash
git add .
git commit -m "feat: add your feature description"
```

### Push & Create PR

```bash
git push origin feature/your-feature-name
# Then open a Pull Request on GitHub
```

### Commit Convention

| Type | Description |
|:-----|:------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting |
| `refactor:` | Code refactoring |
| `test:` | Adding tests |
| `chore:` | Maintenance |

---

## 📁 Project Structure

```
Docu-Chain/
├── frontend/                 # React frontend
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── contexts/        # React contexts
│       ├── pages/           # Page components
│       ├── services/        # API & blockchain services
│       └── utils/           # Helper functions
│
├── backend/                  # Flask API
│   └── app/
│       ├── models/          # Database models
│       ├── routes/          # API endpoints
│       └── services/        # Business logic
│
├── blockchain/               # Smart contracts
│   ├── contracts/           # Solidity contracts
│   └── scripts/             # Deployment scripts
│
└── database/                 # DB setup scripts
```

---

## 🔒 Security

- JWT authentication with secure token handling
- Passwords hashed with bcrypt
- Environment variables for all secrets
- Smart contract access controls
- Input validation & sanitization

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Mujju** - [@mujju-212](https://github.com/mujju-212)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for secure document management

</div>
