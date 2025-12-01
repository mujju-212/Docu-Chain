"""Test querying Received folder documents for admin"""
from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.folder import Folder
from app.models.user import User
from sqlalchemy import desc
import uuid

app = create_app()
with app.app_context():
    admin = User.query.filter_by(email='admin@mu.ac.in').first()
    
    if admin:
        admin_id = admin.id
        admin_id_str = str(admin.id)
        
        print(f'Admin ID (UUID): {admin_id}')
        print(f'Admin ID (str): {admin_id_str}')
        print(f'Admin ID type: {type(admin_id)}')
        
        # Get the Received folder
        shared_folder = Folder.query.filter_by(owner_id=admin_id, name='Shared', parent_id=None).first()
        received_folder = Folder.query.filter_by(owner_id=admin_id, name='Received', parent_id=shared_folder.id).first()
        
        print(f'Received Folder ID: {received_folder.id}')
        print()
        
        # Test the query that backend uses
        print('=== Testing backend query for Received folder ===')
        
        # Query 1: Using the actual admin_id (UUID)
        shared_docs_uuid = db.session.query(Document).join(
            DocumentShare, Document.id == DocumentShare.document_id
        ).filter(
            DocumentShare.shared_with_id == admin_id,
            Document.is_active == True
        ).order_by(Document.created_at.desc()).all()
        
        print(f'Query with UUID: {len(shared_docs_uuid)} documents')
        for doc in shared_docs_uuid:
            print(f'  - {doc.name}')
        
        # Query 2: Using string
        shared_docs_str = db.session.query(Document).join(
            DocumentShare, Document.id == DocumentShare.document_id
        ).filter(
            DocumentShare.shared_with_id == admin_id_str,
            Document.is_active == True
        ).order_by(Document.created_at.desc()).all()
        
        print(f'Query with string: {len(shared_docs_str)} documents')
        
        # Check what shared_with_id looks like in the database
        print()
        print('=== DocumentShare records for admin ===')
        shares = DocumentShare.query.filter_by(shared_with_id=admin_id).limit(3).all()
        for s in shares:
            print(f'  Share ID: {s.id}, shared_with_id: {s.shared_with_id} (type: {type(s.shared_with_id)})')
