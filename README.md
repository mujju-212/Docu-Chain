<div align="center">
  
<img src="assets/logo.png" alt="DocuChain Logo" width="180"/>

# 🔗 DocuChain

### **Revolutionizing Document Verification with Blockchain Technology**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethereum.org/)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)](https://pinata.cloud/)

<br/>

🚀 **A next-generation decentralized document management platform** designed for educational institutions, combining the power of **Ethereum blockchain**, **IPFS decentralized storage**, and **smart contract-based approval workflows** to create an unbreakable chain of trust for your documents.

<br/>

[🎯 Overview](#-project-overview) • [✨ Features](#-key-features) • [🛠️ Tech Stack](#%EF%B8%8F-technology-stack) • [🚀 Installation](#-quick-start) • [📖 Usage](#-how-it-works) • [🤝 Contributing](#-contributing)

<br/>

---

</div>

## 🎯 Project Overview

### The Problem We Solve

In today's digital world, **document fraud** is a growing concern, especially in educational institutions:

| Problem | Impact |
|:--------|:-------|
| 📄 **Fake Certificates** | Employers struggle to verify authentic credentials |
| ⏰ **Slow Verification** | Manual verification takes days or weeks |
| 🔓 **Centralized Storage** | Single point of failure, vulnerable to hacks |
| 📝 **Paper Approvals** | Inefficient, hard to track, easily lost |
| ❌ **No Audit Trail** | Impossible to track document history |

### Our Solution

**DocuChain** transforms document management through blockchain technology:

```
📄 Document → 🔐 Hash Generated → ⛓️ Stored on Ethereum → 🌐 File on IPFS → ✅ Instant Verification
```

<div align="center">

| Before DocuChain | After DocuChain |
|:-----------------|:----------------|
| ❌ Documents can be forged | ✅ Cryptographically secured on blockchain |
| ❌ Verification takes days | ✅ Instant QR code verification |
| ❌ Files stored on central servers | ✅ Decentralized IPFS storage |
| ❌ Paper-based approvals | ✅ Smart contract workflows |
| ❌ No proof of authenticity | ✅ Immutable blockchain proof |

</div>

---

## ✨ Key Features

### 📁 Smart Document Management

<table>
<tr>
<td width="50%">

**Organize & Manage**
- 📂 Create folders and subfolders
- ⭐ Star important documents
- 🔍 Advanced search & filters
- 📋 Bulk operations (move, delete, share)
- 📊 Version history tracking

</td>
<td width="50%">

**Secure Storage**
- 🔐 End-to-end encryption
- 🌐 IPFS decentralized storage
- ♾️ Permanent availability
- 🔗 Content-addressed files
- 💾 Automatic backups

</td>
</tr>
</table>

### ⛓️ Blockchain-Powered Security

Every document uploaded to DocuChain gets:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📄 Your Document                                              │
│        ↓                                                        │
│   🔐 SHA-256 Hash Generated                                     │
│        ↓                                                        │
│   ⛓️ Hash Stored on Ethereum Blockchain                        │
│        ↓                                                        │
│   📝 Smart Contract Records:                                    │
│      • Document Hash                                            │
│      • Timestamp                                                │
│      • Owner Address                                            │
│      • IPFS Content ID                                          │
│        ↓                                                        │
│   ✅ Immutable Proof of Existence                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why Blockchain?**
- 🔒 **Immutable** - Once stored, cannot be altered or deleted
- 🌍 **Decentralized** - No single entity controls your documents
- ⏱️ **Timestamped** - Proof of when document was created
- 🔍 **Transparent** - Anyone can verify authenticity
- 🛡️ **Tamper-Proof** - Any modification is immediately detectable

### ✅ Instant QR Verification

<table>
<tr>
<td width="60%">

**How It Works:**
1. 📤 Upload & store document on blockchain
2. 📱 System generates unique QR code
3. 🔗 QR links to verification portal
4. ✅ Anyone can scan to verify authenticity

**No Login Required!**
- Employers can verify credentials instantly
- Universities can confirm transcripts
- Anyone can check document authenticity

</td>
<td width="40%">

```
┌──────────────────┐
│    ▄▄▄▄▄▄▄▄▄    │
│    █ ▄▄▄ █ █    │
│    █ ███ █ █    │
│    █▄▄▄▄▄█▄█    │
│    ▄▄▄▄▄ ▄▄▄    │
│    █ ▄▄▄ █ █    │
│    █▄▄▄▄▄█▄█    │
│                  │
│   Scan to Verify │
└──────────────────┘
```

</td>
</tr>
</table>

### 📝 Smart Approval Workflows

Replace paper-based approvals with blockchain-powered workflows:

```
Student                    Faculty                     HOD                      Verified
   │                          │                         │                          │
   │  ① Request Approval      │                         │                          │
   │─────────────────────────►│                         │                          │
   │                          │  ② Review & Approve     │                          │
   │                          │─────────────────────────►│                         │
   │                          │                         │  ③ Final Approval        │
   │                          │                         │─────────────────────────►│
   │                          │                         │                          │
   │◄─────────────────────────────────────────────────────────────────────────────│
   │                    ④ Document Verified on Blockchain                         │
```

**Features:**
- 🔄 Sequential & parallel approval chains
- ✍️ Digital signatures on blockchain
- ⏰ Deadline tracking & reminders
- 📧 Automatic notifications
- 📊 Complete audit trail

### 👥 Role-Based Access Control

<table>
<tr>
<th>👨‍🎓 Student</th>
<th>👨‍🏫 Faculty</th>
<th>👨‍💼 Admin</th>
</tr>
<tr>
<td>

- Upload documents
- Request approvals
- Share with peers
- Track approval status
- Generate QR codes
- View blockchain proof

</td>
<td>

- All student features
- Approve/reject documents
- Manage class documents
- Bulk verifications
- Department announcements
- View approval history

</td>
<td>

- Full system access
- User management
- Institution settings
- Post circulars
- Analytics dashboard
- System configuration

</td>
</tr>
</table>

### 💬 Built-in Communication

<table>
<tr>
<td width="50%">

**Messaging**
- 💬 Direct messages
- 👥 Group chats
- 📎 Share documents in chat
- 🔔 Real-time notifications

</td>
<td width="50%">

**Announcements**
- 📢 Institution-wide circulars
- 📋 Department notices
- 📌 Pinned announcements
- 📧 Email notifications

</td>
</tr>
</table>

---

## 🛠️ Technology Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 18)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Dashboard   │  │ File Manager │  │  Approvals   │  │   Verify     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                              │                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Web3.js / Ethers.js (MetaMask)                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│   Flask API     │       │    Ethereum     │       │       IPFS          │
│   (Backend)     │       │    (Sepolia)    │       │     (Pinata)        │
│                 │       │                 │       │                     │
│ • Auth/JWT      │       │ • Document Hash │       │ • File Storage      │
│ • File Upload   │       │ • Approvals     │       │ • Content Addr.     │
│ • User Mgmt     │       │ • Permissions   │       │ • Decentralized     │
└────────┬────────┘       └─────────────────┘       └─────────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
│                 │
│ • Users         │
│ • Documents     │
│ • Approvals     │
│ • Chat/Messages │
└─────────────────┘
```

### Technology Details

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 18.3.1 | Modern UI with hooks & context |
| **Routing** | React Router 6 | Client-side navigation |
| **Web3** | Ethers.js, Web3.js | Blockchain interaction |
| **Styling** | Material-UI, CSS | Beautiful, responsive design |
| **Backend** | Flask 3.0 | RESTful API server |
| **ORM** | SQLAlchemy | Database operations |
| **Auth** | Flask-JWT-Extended | Secure authentication |
| **Realtime** | Flask-SocketIO | Live notifications |
| **Database** | PostgreSQL 15 | Reliable data storage |
| **Blockchain** | Solidity 0.8.19 | Smart contracts |
| **Dev Tools** | Hardhat | Contract development |
| **Network** | Ethereum Sepolia | Test network |
| **Storage** | IPFS (Pinata) | Decentralized files |

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** v18.0.0 or higher
- ✅ **Python** 3.9 or higher
- ✅ **PostgreSQL** 13 or higher
- ✅ **MetaMask** browser extension
- ✅ **Git** installed

### Installation Steps

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mujju-212/Docu-Chain.git
cd Docu-Chain
```

#### 2️⃣ Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE docuchain;
\q
```

#### 3️⃣ Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
python init_db.py

# Start server
python run.py
```

<details>
<summary>📝 Backend .env Configuration</summary>

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/docuchain
JWT_SECRET_KEY=your-super-secret-key-here
FLASK_ENV=development
```

</details>

#### 4️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

<details>
<summary>📝 Frontend .env Configuration</summary>

```env
REACT_APP_API_URL=http://localhost:5000/api

# Pinata IPFS (Get from https://pinata.cloud)
REACT_APP_PINATA_API_KEY=your-pinata-api-key
REACT_APP_PINATA_SECRET_KEY=your-pinata-secret-key
REACT_APP_PINATA_JWT=your-pinata-jwt
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain (Sepolia Testnet)
REACT_APP_CONTRACT_ADDRESS=0xb19f78B9c32dceaA01DE778Fa46784F5437DF373
REACT_APP_APPROVAL_CONTRACT_ADDRESS=0x8E1626654e1B04ADF941EbbcEc7E92728327aA54
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
```

</details>

#### 5️⃣ MetaMask Setup

1. Install [MetaMask](https://metamask.io/) extension
2. Add Sepolia network (Chain ID: 11155111)
3. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

---

## 📖 How It Works

### User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   1️⃣ REGISTER              2️⃣ CONNECT WALLET         3️⃣ UPLOAD DOCUMENT    │
│   ───────────              ─────────────────         ─────────────────     │
│   Create account           Link MetaMask             Files stored on       │
│   Select role              Enable blockchain         IPFS automatically    │
│                                                                             │
│         │                        │                         │                │
│         └────────────────────────┼─────────────────────────┘                │
│                                  │                                          │
│                                  ▼                                          │
│                                                                             │
│   4️⃣ BLOCKCHAIN STORAGE    5️⃣ GENERATE QR           6️⃣ SHARE & VERIFY     │
│   ────────────────────     ────────────             ───────────────        │
│   Hash stored on           Unique QR code           Anyone can verify      │
│   Ethereum Sepolia         for verification         authenticity           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Examples

<details>
<summary>👨‍🎓 <b>Student: Upload & Get Certificate Verified</b></summary>

1. **Login** to your DocuChain account
2. **Navigate** to File Manager
3. **Upload** your certificate (PDF, image, etc.)
4. **Click** "Store on Blockchain" button
5. **Confirm** MetaMask transaction
6. **Wait** for blockchain confirmation
7. **Generate** QR code for sharing
8. **Share** with employers or institutions

</details>

<details>
<summary>👨‍🏫 <b>Faculty: Approve Student Documents</b></summary>

1. **Login** with faculty credentials
2. **View** pending approval requests
3. **Review** document details & IPFS content
4. **Verify** student identity
5. **Approve** or **Reject** with comments
6. **Sign** on blockchain (MetaMask)
7. **Student** receives notification automatically

</details>

<details>
<summary>✅ <b>Employer: Verify a Certificate</b></summary>

1. **Scan** QR code on certificate
2. **View** verification page (no login needed)
3. **Check** blockchain transaction proof
4. **Verify** document hash matches
5. **See** approval chain & timestamps
6. **Confirm** authenticity instantly

</details>

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `GET` | `/api/auth/me` | Get current user |

### Documents

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents` | Upload document |
| `GET` | `/api/documents/:id` | Get document details |
| `DELETE` | `/api/documents/:id` | Delete document |
| `POST` | `/api/documents/:id/share` | Share document |
| `GET` | `/api/documents/:id/verify` | Verify authenticity |

### Approvals

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/approvals` | List approval requests |
| `POST` | `/api/approvals` | Create approval request |
| `POST` | `/api/approvals/:id/approve` | Approve document |
| `POST` | `/api/approvals/:id/reject` | Reject document |

---

## 📜 Smart Contracts

### Deployed on Ethereum Sepolia

| Contract | Address |
|:---------|:--------|
| **DocumentManagerV2** | `0xb19f78B9c32dceaA01DE778Fa46784F5437DF373` |
| **DocumentApprovalManager** | `0x8E1626654e1B04ADF941EbbcEc7E92728327aA54` |

### Contract Functions

<details>
<summary><b>DocumentManagerV2</b></summary>

```solidity
// Store document hash on blockchain
function uploadDocument(bytes32 _hash, string _ipfsHash) external

// Share document with another address
function shareDocument(uint256 _docId, address _recipient) external

// Verify document authenticity
function verifyDocument(uint256 _docId) external view returns (bool)

// Get document details
function getDocument(uint256 _docId) external view returns (Document)
```

</details>

<details>
<summary><b>DocumentApprovalManager</b></summary>

```solidity
// Request document approval
function requestApproval(uint256 _docId, address[] _approvers) external

// Approve document with digital signature
function approveDocument(uint256 _requestId) external

// Reject document with reason
function rejectDocument(uint256 _requestId, string _reason) external

// Check approval status
function getApprovalStatus(uint256 _requestId) external view returns (Status)
```

</details>

---

## 📁 Project Structure

```
Docu-Chain/
│
├── 📂 frontend/                    # React Frontend Application
│   ├── 📂 public/                  # Static assets
│   │   └── docuchain-logo.png      # Application logo
│   └── 📂 src/
│       ├── 📂 components/          # Reusable UI components
│       ├── 📂 contexts/            # React Context providers
│       ├── 📂 pages/               # Page components
│       ├── 📂 services/            # API & blockchain services
│       └── 📂 utils/               # Helper functions
│
├── 📂 backend/                     # Flask Backend API
│   ├── 📂 app/
│   │   ├── 📂 models/              # SQLAlchemy models
│   │   ├── 📂 routes/              # API endpoints
│   │   └── 📂 services/            # Business logic
│   ├── requirements.txt            # Python dependencies
│   └── run.py                      # Application entry point
│
├── 📂 blockchain/                  # Smart Contracts
│   ├── 📂 contracts/               # Solidity source files
│   ├── 📂 scripts/                 # Deployment scripts
│   └── hardhat.config.js           # Hardhat configuration
│
├── 📂 assets/                      # Repository assets
│   └── logo.png                    # Logo for README
│
└── 📂 database/                    # Database setup
    └── setup_database.sql          # Initial schema
```

---

## 🔒 Security Features

| Feature | Implementation |
|:--------|:---------------|
| 🔐 **Authentication** | JWT tokens with secure httpOnly cookies |
| 🔑 **Password Security** | bcrypt hashing with salt |
| 🛡️ **API Protection** | Rate limiting & input validation |
| 📝 **Smart Contract Security** | Access control modifiers |
| 🔒 **Environment Variables** | Secrets never in code |
| ✅ **Blockchain Verification** | Immutable proof of documents |

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/Docu-Chain.git
cd Docu-Chain
git remote add upstream https://github.com/mujju-212/Docu-Chain.git
```

### 2. Create Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes & Commit

```bash
git add .
git commit -m "feat: add amazing feature"
```

### 4. Push & Create PR

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub!

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

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Mujju**

[![GitHub](https://img.shields.io/badge/GitHub-mujju--212-181717?style=for-the-badge&logo=github)](https://github.com/mujju-212)

</div>

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

<br/>

**DocuChain** - *Securing Documents with Blockchain Technology*

<br/>

Made with ❤️ for secure, transparent, and tamper-proof document management

</div>
