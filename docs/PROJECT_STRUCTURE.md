# DocuChain Project Structure

## 📁 Root Directory

### Essential Files
- `README.md` - Main project documentation
- `package.json` - Node.js dependencies for frontend
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variables template

### Main Folders
- `backend/` - Flask backend API
- `frontend/` - React frontend application
- `blockchain/` - Smart contracts (Solidity)
- `docs/` - Project documentation
- `database/` - Database migrations and schemas
- `tests/` - Test files
- `uploads/` - File upload storage

---

## 📁 Backend Directory (`/backend`)

### Core Application Files
- `run.py` - **Main application entry point** (Flask server)
- `config.py` - Configuration settings
- `requirements.txt` - Python dependencies
- `.env` - Environment variables (SECRET, DATABASE_URL, etc.)
- `.env.example` - Environment variables template

### Database Setup & Initialization
- `init_db.py` - **Initialize database tables**
- `create_default_folders.py` - **Create system folders for all users**

### Database Migration Scripts (Keep for reference)
- `add_recent_activity_table.py` - Added recent activity tracking
- `fix_documents_table.py` - Fixed document table schema
- `fix_document_id_nullable.py` - Made document_id nullable
- `fix_folders_table.py` - Fixed folder table schema
- `fix_ipfs_hash_nullable.py` - Made ipfs_hash nullable
- `fix_passwords.py` - Password reset utilities
- `fix_recent_activity_types.py` - Fixed activity types
- `fix_shares_table.py` - Fixed document sharing table
- `remove_document_id_unique_constraint.py` - Removed unique constraint
- `remove_ipfs_unique_constraint.py` - Removed IPFS unique constraint

### Utilities
- `list_routes.py` - List all API routes (debugging)
- `test_filemanager_comprehensive.py` - Comprehensive FileManager test suite

### Application Structure (`/backend/app`)
```
app/
├── __init__.py              # Flask app factory
├── models/                  # Database models
│   ├── user.py             # User model
│   ├── document.py         # Document & DocumentVersion models
│   ├── folder.py           # Folder model
│   └── document_share.py   # DocumentShare model
├── routes/                  # API endpoints
│   ├── auth.py             # Authentication (login, register, OTP)
│   ├── documents.py        # Document CRUD operations
│   ├── folders.py          # Folder management
│   ├── shares.py           # Document sharing
│   ├── recent.py           # Recent activity tracking
│   └── versions.py         # Version history
└── utils/                   # Helper functions
    └── email_service.py    # Email sending (OTP, notifications)
```

---

## 📁 Frontend Directory (`/frontend`)

### Main Application
```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components
│   │   ├── shared/        # Shared pages (FileManager, Dashboard)
│   │   └── Login.js       # Login page
│   ├── services/          # API & blockchain services
│   │   ├── blockchainServiceV2.js  # Blockchain interaction
│   │   ├── pinataService.js        # IPFS file storage
│   │   └── hybridFileManagerService.js  # File management
│   ├── utils/             # Utility functions
│   │   └── metamask.js    # MetaMask connection utilities
│   └── App.js             # Main app component
└── package.json           # Dependencies
```

---

## 📁 Blockchain Directory (`/blockchain`)

### Smart Contracts
- `contracts/DocumentManagerV2.sol` - Main document management contract
- `scripts/` - Deployment scripts
- `test/` - Contract tests

---

## 📁 Documentation (`/docs`)

### Important Guides
- `BLOCKCHAIN_SETUP_GUIDE.md` - How to deploy smart contracts
- `BLOCKCHAIN_SIMPLIFIED_INTEGRATION.md` - Blockchain integration guide
- `UPDATE_API_KEYS_GUIDE.md` - API keys setup (Pinata, etc.)
- `PRODUCTION_CLEANUP_CHECKLIST.md` - Pre-deployment checklist
- `FILEMANAGER_FINAL_STATUS.md` - FileManager feature status
- `PROJECT_STRUCTURE.md` - This file

---

## 🗑️ Cleaned Up Files

### Removed from Root (Temporary Documentation)
- All `METAMASK_*.md` files (temporary fix logs)
- All `WALLET_*.md` files (temporary implementation logs)
- All `*_FIX.md` files (temporary bug fix logs)
- All `*_COMPLETE.md` files (temporary completion logs)
- Test HTML files (`test_*.html`)
- Test Python files in root

### Removed from Backend (Test/Debug Scripts)
- All `check_*.py` files (debugging scripts)
- All `test_*.py` files (except comprehensive test)
- All `delete_*.py` files (cleanup scripts)
- All `move_*.py` files (migration scripts - already executed)
- `debug_*.py` files
- `simulate_*.py` files
- `update_*.py` files (specific migrations - already done)
- Alternate run scripts (`run_port5001.py`, `run_no_reload.py`)

---

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python create_default_folders.py
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Blockchain Setup
See `docs/BLOCKCHAIN_SETUP_GUIDE.md`

---

## 📝 Notes

### Essential Scripts to Keep
1. **init_db.py** - Initialize database (run once)
2. **create_default_folders.py** - Create system folders (run once per user)
3. **run.py** - Start backend server (run always)
4. **test_filemanager_comprehensive.py** - Verify system health

### Migration Scripts
All `fix_*.py` and `add_*.py` scripts are kept for:
- Reference for future similar changes
- Re-running if database is reset
- Understanding schema evolution

These can be removed after 6 months if not needed.

---

**Last Updated**: November 2, 2025  
**Cleaned By**: Project cleanup automation
