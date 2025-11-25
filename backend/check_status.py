from app import create_app, db
from app.models.approval import ApprovalRequest

app = create_app()
app.app_context().push()

req = ApprovalRequest.query.first()
data = req.to_dict_detailed()

print('=' * 60)
print('BACKEND API DATA CHECK')
print('=' * 60)
print(f'Request Status: {data["status"]}')
print(f'Step hasApproved: {data["steps"][0]["hasApproved"]}')
print(f'Step hasRejected: {data["steps"][0]["hasRejected"]}')
print('=' * 60)
if data["status"] == "APPROVED" and data["steps"][0]["hasApproved"]:
    print('✅ Backend is returning CORRECT data!')
    print('📋 Issue is in Frontend:')
    print('   1. Vite dev server must be running')
    print('   2. Hard refresh browser (Ctrl+Shift+R)')
    print('   3. Check console logs for status')
else:
    print('❌ Backend data is wrong!')
print('=' * 60)
