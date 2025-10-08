# DocuChain Test Scripts

This folder contains all testing scripts for the DocuChain project.

## 🧪 Test Files

### Authentication Tests
- **test_all_fixes.py** - Comprehensive authentication system testing
- **test_updated_auth.py** - Updated authentication flow testing
- **test_frontend_errors.py** - Frontend error handling validation

### Email System Tests
- **test_professional_emails.py** - Professional email template testing

### API Tests
- **test_api.py** - Backend API endpoint testing
- **test_api.ps1** - PowerShell API testing script

## 🚀 Running Tests

### Prerequisites
1. Ensure Flask backend is running:
   ```bash
   cd backend
   python run.py
   ```

2. Ensure database is initialized:
   ```bash
   cd backend
   python init_db.py
   ```

### Execute Tests
```bash
# Run all authentication tests
python tests/test_all_fixes.py

# Test email system
python tests/test_professional_emails.py

# Test API endpoints
python tests/test_api.py

# PowerShell API test
.\tests\test_api.ps1
```

## ✅ Test Coverage

- **Authentication Flow**: Registration, login, password reset
- **Email System**: Professional templates, deliverability
- **API Endpoints**: All auth routes and error handling
- **Frontend Integration**: Error messages and user experience
- **Database Operations**: User creation, validation, updates

## 🔧 Test Environment

- **Backend URL**: http://localhost:5000
- **Test Database**: SQLite (docuchain.db)
- **Email Provider**: Resend API (development mode)
- **Test Credentials**: See `/docs/LOGIN_CREDENTIALS.md`