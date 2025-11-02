# Hybrid File System Setup Guide

You now have a **hybrid file management system** that combines the best of both worlds:

- **📁 Folders & Metadata** → Database (fast, queryable)
- **📄 Files** → IPFS + Blockchain (immutable, decentralized)
- **🔗 Transactions** → Database (tracking & analytics)

## Architecture Overview

```
Frontend (React)
    ↓
HybridFileManagerService
    ↓
├── Database API (Flask) ← Folders, metadata, transactions
└── Blockchain API (Web3) ← File content, IPFS hashes
```

## Quick Setup Steps

### 1. **Backend Setup**

```bash
# Navigate to backend
cd "d:\AVTIVE PROJ\Docu-Chain\backend"

# Run database migration
python migrate_hybrid_system.py

# Register new routes in app/__init__.py
```

Add to your `app/__init__.py`:
```python
from app.routes import documents
app.register_blueprint(documents.bp)
```

### 2. **Frontend Update**

The frontend is already updated to use `hybridFileManagerService`. Just ensure you have an auth token:

```javascript
// In your login success handler
localStorage.setItem('auth_token', response.data.token);
```

### 3. **Test the System**

1. **Start Backend**: `python run.py`
2. **Start Frontend**: `npm start`
3. **Login**: Ensure user has auth token
4. **Test Folder**: Create a folder (stored in database)
5. **Test File**: Upload a file (IPFS + blockchain + database metadata)

## What's Different Now

### **Before (Pure Blockchain)**
```
Create Folder → Blockchain Transaction → Gas Fees
Upload File → Blockchain Transaction → Gas Fees
Load Files → Query Blockchain → Slow
```

### **After (Hybrid)**
```
Create Folder → Database Insert → Fast & Free
Upload File → IPFS Upload + Blockchain + Database → Immutable + Fast queries
Load Files → Database Query → Instant
```

## Benefits

✅ **Cost Efficient**: Only files use gas, not folders  
✅ **Fast Loading**: Database queries instead of blockchain scanning  
✅ **Immutable Files**: IPFS + blockchain ensures file integrity  
✅ **Rich Metadata**: Full database capabilities for search/filter  
✅ **Transaction Tracking**: Complete audit trail in database  

## API Endpoints

- `GET /api/folders` - List user folders
- `POST /api/folders` - Create folder
- `GET /api/documents` - List user documents  
- `POST /api/documents/upload` - Upload file metadata after blockchain
- `GET /api/filesystem` - Get complete file system
- `GET /api/blockchain/transactions` - Get transaction history

## Troubleshooting

### Error: "Authentication Required"
- Ensure `localStorage.getItem('auth_token')` returns valid token
- Check backend JWT configuration

### Error: "Table doesn't exist"
- Run `python migrate_hybrid_system.py`
- Check database connection

### Error: "IPFS upload failed"
- Configure Pinata API keys in environment variables
- Check internet connection

## Next Steps

1. **Run Migration**: `python migrate_hybrid_system.py`
2. **Register Routes**: Update `app/__init__.py`
3. **Test Folder Creation**: Should work without blockchain
4. **Test File Upload**: Configure IPFS keys first
5. **Deploy Contract**: For blockchain file storage

The system is designed to work gracefully even if blockchain/IPFS isn't fully configured yet!