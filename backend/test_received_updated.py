"""Test updated backend query for Received folder"""
from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.folder import Folder
from app.models.user import User

app = create_app()
with app.app_context():
    admin = User.query.filter_by(email='admin@mu.ac.in').first()
    
    # Simulate backend request for Received folder
    current_user_id = str(admin.id)
    
    # Get Received folder
    shared_folder = Folder.query.filter_by(owner_id=admin.id, name='Shared', parent_id=None).first()
    received_folder = Folder.query.filter_by(owner_id=admin.id, name='Received', parent_id=shared_folder.id).first()
    
    # Verify folder detection
    parent_folder = Folder.query.get(received_folder.parent_id)
    is_under_shared = parent_folder and parent_folder.name == 'Shared'
    is_received = received_folder.name == 'Received' and is_under_shared
    
    print(f'Folder: {received_folder.name}')
    print(f'Parent: {parent_folder.name}')
    print(f'Is under Shared: {is_under_shared}')
    print(f'Is Received folder: {is_received}')
    print()
    
    if is_received:
        # Query documents
        shared_docs_query = db.session.query(Document, DocumentShare).join(
            DocumentShare, Document.id == DocumentShare.document_id
        ).filter(
            DocumentShare.shared_with_id == current_user_id,
            Document.is_active == True
        ).order_by(Document.created_at.desc()).all()
        
        seen_docs = set()
        documents = []
        share_info_map = {}
        
        for doc, share in shared_docs_query:
            if doc.id not in seen_docs:
                documents.append(doc)
                seen_docs.add(doc.id)
                shared_by_user = db.session.get(User, share.shared_by_id)
                share_info_map[str(doc.id)] = {
                    'permission': share.permission,
                    'sharedBy': shared_by_user.email if shared_by_user else None,
                    'sharedAt': share.shared_at.isoformat() if share.shared_at else None,
                }
        
        print(f'Found {len(documents)} documents:')
        for doc in documents:
            info = share_info_map.get(str(doc.id), {})
            print(f'  - {doc.name}')
            print(f'    Permission: {info.get("permission")}, From: {info.get("sharedBy")}')
            print(f'    Shared at: {info.get("sharedAt")}')
