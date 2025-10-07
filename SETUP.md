# DocuChain Setup Guide

Complete step-by-step instructions to set up and run the DocuChain project on Windows.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)
- **MetaMask** Browser Extension - [Install](https://metamask.io/)
- **PostgreSQL** (optional, SQLite used by default) - [Download](https://www.postgresql.org/download/)

---

## Step 1: Clone/Navigate to Project

```powershell
cd "d:\AVTIVE PROJ\Docu-Chain"
```

---

## Step 2: Install All Dependencies

Run the following command from the project root to install dependencies for all three components:

```powershell
npm run install:all
```

This will:
- Install root workspace dependencies
- Install frontend (React/Vite) dependencies
- Install backend (Flask) dependencies in a virtual environment
- Install blockchain (Hardhat) dependencies

### Manual Installation (if needed)

#### Frontend:
```powershell
cd frontend
npm install
cd ..
```

#### Backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

#### Blockchain:
```powershell
cd blockchain
npm install
cd ..
```

---

## Step 3: Environment Configuration

### Frontend Environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_CHAIN_ID=11155111
```

### Backend Environment

Create `backend/.env`:

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database (SQLite by default)
DATABASE_URL=sqlite:///docu_chain.db

# PostgreSQL (Optional - uncomment to use)
# DATABASE_URL=postgresql://username:password@localhost:5432/docu_chain

# IPFS/Pinata Configuration
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt

# Blockchain Configuration
BLOCKCHAIN_NETWORK=sepolia
INFURA_API_KEY=your-infura-api-key
CONTRACT_ADDRESS=will-be-set-after-deployment

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Blockchain Environment

Create `blockchain/.env`:

```env
# Ethereum RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY

# Private Key (NEVER commit this!)
PRIVATE_KEY=your-metamask-private-key-here

# Etherscan API (for contract verification)
ETHERSCAN_API_KEY=your-etherscan-api-key

# Contract Addresses (will be populated after deployment)
DOCUMENT_MANAGER_ADDRESS=
APPROVAL_WORKFLOW_ADDRESS=
```

---

## Step 4: Database Setup

Initialize the database:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python
```

In Python shell:
```python
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
exit()
```

Or create a migration script `backend/init_db.py`:

```python
from app import create_app, db

app = create_app()
with app.app_context():
    db.create_all()
    print("✓ Database initialized successfully!")
```

Run it:
```powershell
python init_db.py
```

---

## Step 5: Blockchain Deployment

### Get Testnet ETH

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your MetaMask wallet address
3. Request test ETH (needed for contract deployment)

### Deploy Smart Contracts

```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
- Deploy `DocumentManager.sol` contract
- Deploy `ApprovalWorkflow.sol` contract
- Save contract addresses to `blockchain/deployments/sepolia.json`
- Verify contracts on Etherscan (if API key provided)

### Update Environment Variables

After deployment, copy the contract addresses from `blockchain/deployments/sepolia.json` and update:

**Backend (`backend/.env`):**
```env
CONTRACT_ADDRESS=<DocumentManager address from deployment>
APPROVAL_CONTRACT_ADDRESS=<ApprovalWorkflow address from deployment>
```

**Frontend (`frontend/.env`):**
```env
VITE_DOCUMENT_MANAGER_ADDRESS=<DocumentManager address>
VITE_APPROVAL_WORKFLOW_ADDRESS=<ApprovalWorkflow address>
```

---

## Step 6: Running the Application

### Development Mode (All Services)

From the project root:

```powershell
npm run dev
```

This starts:
- **Frontend** on http://localhost:5173
- **Backend** on http://localhost:5000

### Running Services Individually

#### Frontend Only:
```powershell
cd frontend
npm run dev
```

#### Backend Only:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python run.py
```

#### Blockchain Development Network:
```powershell
cd blockchain
npx hardhat node
```

---

## Step 7: MetaMask Configuration

1. Open MetaMask extension
2. Click network dropdown → "Add Network"
3. Add Sepolia Testnet:
   - **Network Name:** Sepolia
   - **RPC URL:** https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   - **Chain ID:** 11155111
   - **Currency Symbol:** ETH
   - **Block Explorer:** https://sepolia.etherscan.io

4. Import your deployment account (if needed)
5. Ensure you have test ETH for transactions

---

## Step 8: Initial Setup in Application

1. Navigate to http://localhost:5173
2. Click "Create Institution" (first-time setup)
3. Fill in institution details:
   - Institution Name
   - Admin Email
   - Admin Password
4. Click "Create" - this will:
   - Create institution record
   - Create admin user account
   - Set up blockchain permissions

5. Login with admin credentials
6. Add departments, users, and configure settings

---

## Verification Checklist

- [ ] All dependencies installed (`npm run install:all`)
- [ ] Environment files created (`.env` in all three folders)
- [ ] Database initialized and tables created
- [ ] Smart contracts deployed to Sepolia testnet
- [ ] Contract addresses updated in environment files
- [ ] MetaMask configured with Sepolia network
- [ ] Test ETH available in wallet
- [ ] Frontend running on http://localhost:5173
- [ ] Backend running on http://localhost:5000
- [ ] Can create institution and login

---

## Common Issues & Solutions

### Issue: Python venv activation fails
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Module not found" errors in backend
**Solution:** Ensure virtual environment is activated:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: Contract deployment fails
**Solution:**
- Check you have enough test ETH
- Verify Infura API key is correct
- Ensure private key has proper format (0x prefix)

### Issue: MetaMask not connecting
**Solution:**
- Ensure you're on Sepolia network
- Click "Connect Wallet" button
- Approve connection in MetaMask popup

### Issue: CORS errors in browser console
**Solution:** Backend CORS is configured for `http://localhost:5173`. If using different port, update `backend/app/__init__.py`:
```python
CORS(app, origins=['http://localhost:YOUR_PORT'])
```

---

## Project Structure

```
Docu-Chain/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth, Web3, Theme)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and blockchain services
│   │   └── main.jsx         # Entry point
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
├── backend/                  # Flask backend API
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── __init__.py      # App factory
│   ├── venv/                # Python virtual environment
│   ├── .env                 # Backend environment variables
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Application entry point
│
├── blockchain/               # Smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   ├── .env                 # Blockchain environment variables
│   └── hardhat.config.js    # Hardhat configuration
│
├── package.json             # Root workspace configuration
├── README.md                # Project documentation
└── SETUP.md                 # This file
```

---

## Next Steps

1. **Implement Remaining Features:**
   - Complete UI components for all pages
   - Implement document upload/download
   - Build approval workflow UI
   - Add QR code generation
   - Implement chat feature

2. **Testing:**
   - Write unit tests for smart contracts
   - Add API endpoint tests
   - Create E2E tests with Cypress

3. **Security:**
   - Add rate limiting
   - Implement proper input validation
   - Set up security headers
   - Configure CSP policies

4. **Deployment:**
   - Set up production database
   - Configure production environment variables
   - Deploy contracts to mainnet
   - Set up CI/CD pipelines
   - Deploy to cloud hosting

---

## Support

For issues and questions:
- Check existing issues on GitHub
- Review README.md for API documentation
- Contact development team

**Happy Coding! 🚀**
