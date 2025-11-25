from app import create_app, db
from app.models.user import User
from app.models.approval import ApprovalRequest, ApprovalStep

app = create_app()
app.app_context().push()

print("=" * 60)
print("USER AND APPROVAL STEP VERIFICATION")
print("=" * 60)

user = User.query.filter_by(email='meera.patel@mu.ac.in').first()
if user:
    print(f"✅ User found:")
    print(f"   ID: {user.id}")
    print(f"   Name: {user.first_name} {user.last_name}")
    print(f"   Email: {user.email}")
    print(f"   Role: {user.role}")
    print()
    
    # Check approval steps for this user
    steps = ApprovalStep.query.filter_by(approver_id=user.id).all()
    print(f"📋 Approval steps for this user: {len(steps)}")
    for step in steps:
        req = ApprovalRequest.query.get(step.request_id)
        print(f"\n   Step ID: {step.id}")
        print(f"   Document: {req.document_name if req else 'N/A'}")
        print(f"   Has Approved: {step.has_approved}")
        print(f"   Has Rejected: {step.has_rejected}")
        print(f"   Request Status: {req.status if req else 'N/A'}")
else:
    print("❌ User not found")

print("=" * 60)
