"""Check recent document shares in the database"""
from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.user import User
from sqlalchemy import desc

app = create_app()
with app.app_context():
    print('=== Recent Document Shares ===')
    shares = DocumentShare.query.order_by(desc(DocumentShare.shared_at)).limit(10).all()
    
    if not shares:
        print('No shares found in database!')
    
    for s in shares:
        doc = Document.query.get(s.document_id)
        shared_by = User.query.get(s.shared_by_id)
        shared_with = User.query.get(s.shared_with_id)
        
        doc_name = doc.name if doc else 'MISSING'
        by_email = shared_by.email if shared_by else 'MISSING'
        with_email = shared_with.email if shared_with else 'MISSING'
        
        print(f'Share ID: {s.id}')
        print(f'  Document: {doc_name} (ID: {s.document_id})')
        print(f'  Shared By: {by_email}')
        print(f'  Shared With: {with_email}')
        print(f'  Permission: {s.permission}')
        print(f'  TX: {s.transaction_hash}')
        print(f'  Time: {s.shared_at}')
        print()
