"""Check documents shared with admin user"""
from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.user import User
from sqlalchemy import desc

app = create_app()
with app.app_context():
    # Check recent shares for admin user
    admin = User.query.filter_by(email='admin@mu.ac.in').first()
    meera = User.query.filter_by(email='meera.patel@mu.ac.in').first()
    
    if admin and meera:
        print(f'Admin ID: {admin.id}')
        print(f'Meera ID: {meera.id}')
        
        # Check documents shared WITH admin (should show in Received)
        print()
        print('=== Documents shared WITH admin (should show in Received folder) ===')
        shares_with_admin = DocumentShare.query.filter_by(shared_with_id=admin.id).order_by(desc(DocumentShare.shared_at)).limit(5).all()
        for s in shares_with_admin:
            doc = db.session.get(Document, s.document_id)
            doc_name = doc.name if doc else 'MISSING DOCUMENT'
            tx = s.transaction_hash[:30] + '...' if s.transaction_hash and len(s.transaction_hash) > 30 else s.transaction_hash
            print(f'  - {doc_name}')
            print(f'    Permission: {s.permission}, TX: {tx}')
            print(f'    Shared At: {s.shared_at}')
            print()
        
        # Check documents shared BY admin (should show in Sent)
        print('=== Documents shared BY admin (should show in Sent folder) ===')
        shares_by_admin = DocumentShare.query.filter_by(shared_by_id=admin.id).order_by(desc(DocumentShare.shared_at)).limit(5).all()
        for s in shares_by_admin:
            doc = db.session.get(Document, s.document_id)
            recipient = db.session.get(User, s.shared_with_id)
            doc_name = doc.name if doc else 'MISSING DOCUMENT'
            recipient_email = recipient.email if recipient else 'MISSING USER'
            tx = s.transaction_hash[:30] + '...' if s.transaction_hash and len(s.transaction_hash) > 30 else s.transaction_hash
            print(f'  - {doc_name} -> {recipient_email}')
            print(f'    Permission: {s.permission}, TX: {tx}')
            print(f'    Shared At: {s.shared_at}')
            print()
