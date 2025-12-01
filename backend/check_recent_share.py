"""Check the most recent share"""
from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.user import User
from sqlalchemy import desc

app = create_app()
with app.app_context():
    # Get most recent share
    recent_share = DocumentShare.query.order_by(desc(DocumentShare.shared_at)).first()
    
    if recent_share:
        doc = db.session.get(Document, recent_share.document_id)
        shared_by = db.session.get(User, recent_share.shared_by_id)
        shared_with = db.session.get(User, recent_share.shared_with_id)
        
        doc_name = doc.name if doc else 'MISSING'
        by_email = shared_by.email if shared_by else 'MISSING'
        with_email = shared_with.email if shared_with else 'MISSING'
        
        print('=== Most Recent Share ===')
        print(f'Document: {doc_name}')
        print(f'Document ID: {recent_share.document_id}')
        print(f'Shared By: {by_email}')
        print(f'Shared With: {with_email}')
        print(f'Permission: {recent_share.permission}')
        print(f'TX Hash: {recent_share.transaction_hash}')
        print(f'Shared At: {recent_share.shared_at}')
        if doc:
            print(f'Document is_active: {doc.is_active}')
