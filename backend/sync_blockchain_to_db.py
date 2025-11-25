"""Sync blockchain approval status to database"""
from app import create_app, db
from app.models.approval import ApprovalRequest, ApprovalStep
from datetime import datetime

app = create_app()
app.app_context().push()

# Find the request
REQUEST_ID = '0x506f7f574ecfe02251712c47e5bcedb9dca90569998094e5aaf5be90cba679ed'
TX_HASH = '0x0a83e80c3a460e19fac0ad5f8257731c24ae01c029f68c79a29b89c6d2eb600b'

req = ApprovalRequest.query.filter_by(request_id=REQUEST_ID).first()

if req:
    print(f'Found request: {req.document_name}')
    print(f'Current status: {req.status}')
    
    # Update request status
    req.status = 'APPROVED'
    req.blockchain_tx_hash = TX_HASH
    
    # Find the approval step for this approver
    # Get user ID from localStorage or find by wallet
    steps = ApprovalStep.query.filter_by(request_id=req.id).all()
    print(f'\nFound {len(steps)} approval steps')
    
    for step in steps:
        print(f'  Step {step.step_order}: Approver ID {step.approver_id}')
        print(f'    has_approved={step.has_approved}, has_rejected={step.has_rejected}')
        if not step.has_approved and not step.has_rejected:
            step.has_approved = True
            step.action_timestamp = int(datetime.utcnow().timestamp())
            step.blockchain_tx_hash = TX_HASH
            print(f'    ✅ Updated to APPROVED')
    
    db.session.commit()
    print(f'\n✅ Database synced with blockchain!')
    print(f'   Request status: {req.status}')
    print(f'   Transaction: {TX_HASH}')
else:
    print(f'❌ Request {REQUEST_ID} not found in database')
