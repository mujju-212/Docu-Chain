# 🔑 How to Update API Keys in .env

## Open: frontend/.env

## Replace these lines with your NEW API keys:

# OLD (replace these):
REACT_APP_PINATA_API_KEY=eyJhbGciOiJIUzI1NiIs...OLD_KEY...
REACT_APP_PINATA_SECRET_KEY=328c0d6a23124845e37c...OLD_SECRET...
VITE_PINATA_API_KEY=eyJhbGciOiJIUzI1NiIs...OLD_KEY...
VITE_PINATA_SECRET_KEY=328c0d6a23124845e37c...OLD_SECRET...

# NEW (use your new keys):
REACT_APP_PINATA_API_KEY=YOUR_NEW_API_KEY_HERE
REACT_APP_PINATA_SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE
VITE_PINATA_API_KEY=YOUR_NEW_API_KEY_HERE
VITE_PINATA_SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE

## Steps after updating:
1. Save the .env file
2. Restart your frontend development server:
   cd "d:\AVTIVE PROJ\Docu-Chain\frontend"
   npm run dev
3. Test again with test_pinata_api.html
4. Try file upload in FileManager

## Quick Test Commands:
# Test API keys:
start test_pinata_api.html

# Restart frontend:
cd frontend && npm run dev