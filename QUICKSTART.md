# Quick Start Guide - DocuChain

## 🚀 Fast Setup (5 minutes)

### 1. Install Everything
```powershell
npm run install:all
```

### 2. Create Environment Files

Copy and rename:
- `frontend/.env.example` → `frontend/.env`
- `backend/.env.example` → `backend/.env`
- `blockchain/.env.example` → `blockchain/.env`

**Minimum required changes:**
- `backend/.env`: Set `SECRET_KEY` and `JWT_SECRET_KEY` to random strings
- `blockchain/.env`: Add your Infura API key and MetaMask private key

### 3. Initialize Database
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python init_db.py
cd ..
```

### 4. Deploy Contracts (Optional - can skip for frontend development)
```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
cd ..
```

### 5. Run Application
```powershell
npm run dev
```

Visit: **http://localhost:5173**

---

## 📁 Project Commands

### Root Level
```powershell
npm run dev              # Run frontend + backend
npm run install:all      # Install all dependencies
npm run deploy:contracts # Deploy smart contracts
```

### Frontend
```powershell
cd frontend
npm run dev             # Development server (Vite)
npm run build           # Production build
npm run preview         # Preview production build
```

### Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python run.py           # Start Flask server
```

### Blockchain
```powershell
cd blockchain
npx hardhat compile     # Compile contracts
npx hardhat test        # Run tests
npx hardhat node        # Start local blockchain
npx hardhat run scripts/deploy.js --network sepolia  # Deploy
```

---

## 🔧 Environment Variables Quick Reference

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_CHAIN_ID=11155111
VITE_DOCUMENT_MANAGER_ADDRESS=<from deployment>
VITE_APPROVAL_WORKFLOW_ADDRESS=<from deployment>
```

### Backend (`.env`)
```env
FLASK_ENV=development
SECRET_KEY=<random-string>
JWT_SECRET_KEY=<random-string>
DATABASE_URL=sqlite:///docu_chain.db
PINATA_API_KEY=<your-key>
PINATA_SECRET_KEY=<your-key>
INFURA_API_KEY=<your-key>
```

### Blockchain (`.env`)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
PRIVATE_KEY=<your-metamask-private-key>
ETHERSCAN_API_KEY=<your-key>
```

---

## 🌐 Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Docs:** http://localhost:5000/api/docs (if implemented)

---

## 🏗️ Project Structure

```
Docu-Chain/
├── frontend/          # React app (Port 5173)
├── backend/           # Flask API (Port 5000)
├── blockchain/        # Smart contracts
├── package.json       # Root scripts
├── README.md          # Full documentation
├── SETUP.md           # Detailed setup guide
└── QUICKSTART.md      # This file
```

---

## 🔑 First Time Setup

1. **Create Institution** → Register first admin account
2. **Connect MetaMask** → Click "Connect Wallet" button
3. **Add Sepolia Network** → Use Chain ID 11155111
4. **Get Test ETH** → From [Sepolia Faucet](https://sepoliafaucet.com/)

---

## 🐛 Common Issues

**Python venv won't activate?**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Database errors?**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python init_db.py
```

**Contract deployment fails?**
- Check test ETH balance
- Verify Infura API key
- Ensure private key format: `0x...`

**CORS errors?**
- Check frontend URL in `backend/app/__init__.py`
- Default: `http://localhost:5173`

---

## 📚 More Help

- See `SETUP.md` for detailed instructions
- Check `README.md` for API documentation
- Review `.env.example` files for all configuration options

**Ready to build! 🎉**
