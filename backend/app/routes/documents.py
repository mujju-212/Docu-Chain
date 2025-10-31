from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.document import Document, DocumentShare
from app.routes.auth import token_required
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
from sqlalchemy import func
import uuid

bp = Blueprint('documents', __name__)

@bp.route('/', methods=['GET'])
@token_required
def list_documents():
    """Get documents for the current user, optionally filtered by folder_id"""
    try:
        current_user_id = get_jwt_identity()
        folder_id = request.args.get('folder_id')
        
        print(f"🔍 Listing documents for user: {current_user_id}, folder: {folder_id}")
        
        # Build query for active documents owned by current user
        query = Document.query.filter_by(
            owner_id=current_user_id, 
            is_active=True,
            is_in_trash=False
        )
        
        # Filter by folder if specified
        if folder_id:
            query = query.filter_by(folder_id=folder_id)
        else:
            # If no folder_id specified, show root level documents (folder_id is None)
            query = query.filter(Document.folder_id.is_(None))
        
        documents = query.order_by(Document.created_at.desc()).all()
        
        print(f"📄 Found {len(documents)} documents")
        
        # Convert to dict format using model's to_dict() method
        documents_data = []
        for doc in documents:
            doc_dict = doc.to_dict()
            documents_data.append(doc_dict)
            print(f"📄 Document: {doc.file_name} in folder: {doc.folder_id}")
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'message': f'Found {len(documents_data)} documents'
        }), 200
        
    except Exception as e:
        print(f"❌ Error listing documents: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/upload', methods=['POST'])
@token_required
def upload_document():
    """Upload document metadata (file content is stored on blockchain/IPFS)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"📤 Uploading document for user: {current_user_id}")
        print(f"📤 Document data: {data}")
        
        # Create new document record
        document = Document(
            document_id=data.get('document_id'),
            ipfs_hash=data.get('ipfs_hash'),
            name=data.get('file_name'),  # Use file_name as the document name
            file_name=data.get('file_name'),
            file_size=data.get('file_size'),
            document_type=data.get('file_type'),
            owner_id=current_user_id,
            owner_address=data.get('owner_address', '0x0000000000000000000000000000000000000000'),
            folder_id=data.get('folder_id') if data.get('folder_id') else None,
            transaction_hash=data.get('transaction_hash'),
            block_number=data.get('block_number'),
            timestamp=int(datetime.utcnow().timestamp())
        )
        
        # Save to database
        db.session.add(document)
        db.session.commit()
        
        # Update parent folder's updated_at timestamp
        if document.folder_id:
            from app.models.folder import Folder
            folder = Folder.query.get(document.folder_id)
            if folder:
                folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        print(f"✅ Document saved to database with ID: {document.id}")
        
        # Return the saved document data
        document_data = {
            'id': str(document.id),
            'document_id': document.document_id,
            'file_name': document.file_name,
            'file_size': document.file_size,
            'document_type': document.document_type,
            'folder_id': str(document.folder_id) if document.folder_id else None,
            'owner_id': str(document.owner_id),
            'ipfs_hash': document.ipfs_hash,
            'transaction_hash': document.transaction_hash,
            'block_number': document.block_number,
            'created_at': document.created_at.isoformat()
        }
        
        return jsonify({
            'success': True,
            'document': document_data,
            'message': f'Document "{document.file_name}" uploaded successfully!'
        }), 201
        
    except Exception as e:
        print(f"❌ Error uploading document: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/<document_id>', methods=['DELETE'])
@token_required
def delete_document(document_id):
    """Delete a document (soft delete - move to trash)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find the document
        document = Document.query.filter_by(
            id=document_id, 
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found or you do not have permission to delete it'
            }), 404
        
        folder_id = document.folder_id  # Store folder_id before soft deleting
        
        # Soft delete - mark as inactive and move to trash
        document.is_active = False
        document.is_in_trash = True
        document.trash_date = datetime.utcnow()
        
        db.session.commit()
        
        # Update parent folder's updated_at timestamp
        if folder_id:
            from app.models.folder import Folder
            folder = Folder.query.get(folder_id)
            if folder:
                folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document moved to trash successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error deleting document: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<document_id>', methods=['PUT'])
@token_required
def update_document(document_id):
    """Update a document (e.g., move to different folder or update file content)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Find the document (either owned by user OR shared with write permission)
        document = Document.query.filter_by(id=document_id, is_active=True).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found'
            }), 404
        
        # Check if user has permission to update (owner OR write permission)
        has_permission = False
        
        # Check ownership
        if str(document.owner_id) == str(current_user_id):
            has_permission = True
            print(f"✅ User is document owner")
        else:
            # Check for write permission via shares
            share = DocumentShare.query.filter_by(
                document_id=document_id,
                shared_with_id=current_user_id,
                permission='write'
            ).first()
            
            if share:
                has_permission = True
                print(f"✅ User has write permission via share")
        
        if not has_permission:
            return jsonify({
                'success': False,
                'message': 'You do not have permission to update this document'
            }), 403
        
        old_folder_id = document.folder_id
        blockchain_document_id = document.document_id
        
        print(f"📝 Update request for database ID: {document_id}")
        print(f"📝 Document blockchain ID: {blockchain_document_id}")
        print(f"📝 Current IPFS hash: {document.ipfs_hash}")
        print(f"📝 Update data: {data}")
        
        # Check if this is a content update (IPFS hash change)
        is_content_update = 'ipfs_hash' in data
        
        # Update fields for this specific document
        if 'folder_id' in data:
            document.folder_id = data['folder_id']
        if 'name' in data:
            document.name = data['name']
            document.file_name = data['name']
        if 'ipfs_hash' in data:
            document.ipfs_hash = data['ipfs_hash']
        if 'document_id' in data:
            document.document_id = data['document_id']
        if 'file_size' in data:
            document.file_size = data['file_size']
        if 'file_type' in data:
            document.file_type = data['file_type']
        
        # Update timestamp
        document.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # If this is a content update, update ALL copies (all documents with same blockchain document_id)
        if is_content_update and blockchain_document_id:
            print(f"🔄 Content update detected! Updating all copies with document_id: {blockchain_document_id}")
            
            # Find all documents (copies) with the same blockchain document_id
            # Note: document.id is UUID, document_id parameter is string
            all_copies = Document.query.filter(
                Document.document_id == blockchain_document_id,
                Document.is_active == True,
                Document.id != document.id  # Use document.id (UUID object) not document_id (string parameter)
            ).all()
            
            print(f"📋 Found {len(all_copies)} other copies to update")
            print(f"📋 Documents with same blockchain ID:")
            
            # Update all copies with the new IPFS hash and file info
            for copy in all_copies:
                if 'ipfs_hash' in data:
                    copy.ipfs_hash = data['ipfs_hash']
                if 'name' in data:
                    copy.name = data['name']
                    copy.file_name = data['name']
                if 'file_size' in data:
                    copy.file_size = data['file_size']
                if 'file_type' in data:
                    copy.file_type = data['file_type']
                copy.updated_at = datetime.utcnow()
                print(f"  ✅ Updated copy in folder: {copy.folder_id}")
            
            db.session.commit()
            print(f"✅ All {len(all_copies) + 1} copies updated successfully")
        
        # Update both old and new folder's updated_at timestamp
        from app.models.folder import Folder
        if old_folder_id:
            old_folder = Folder.query.get(old_folder_id)
            if old_folder:
                old_folder.updated_at = datetime.utcnow()
        
        if document.folder_id and document.folder_id != old_folder_id:
            new_folder = Folder.query.get(document.folder_id)
            if new_folder:
                new_folder.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document updated successfully' + (' (all copies updated)' if is_content_update else ''),
            'document': document.to_dict(),
            'copies_updated': len(all_copies) if is_content_update and blockchain_document_id else 0
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating document: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trash', methods=['GET'])
@token_required
def get_trash_documents():
    """Get all trashed documents for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all trashed documents
        trashed_docs = Document.query.filter_by(
            owner_id=current_user_id,
            is_in_trash=True
        ).order_by(Document.trash_date.desc()).all()
        
        return jsonify({
            'success': True,
            'documents': [doc.to_dict() for doc in trashed_docs]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<document_id>/copy', methods=['POST'])
@token_required
def copy_document(document_id):
    """
    Copy a document - Creates a reference to the same blockchain file in a different folder.
    This is NOT creating a new file, just organizing the same file in multiple locations.
    When the original is updated on blockchain, ALL copies will see the update.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"📋 Copy document request for: {document_id}")
        print(f"📋 Target folder: {data.get('folder_id')}")
        
        # Find the original document
        original_doc = Document.query.filter_by(
            id=document_id, 
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not original_doc:
            return jsonify({
                'success': False,
                'message': 'Document not found or you do not have permission'
            }), 404
        
        print(f"📋 Original document blockchain ID: {original_doc.document_id}")
        print(f"📋 Original IPFS hash: {original_doc.ipfs_hash}")
        # Create a reference (copy) - Points to the SAME blockchain file
        # Same document_id and ipfs_hash means it's the same blockchain document
        # Only the folder_id is different (organizational difference)
        new_document = Document(
            document_id=original_doc.document_id,  # SAME blockchain document ID
            ipfs_hash=original_doc.ipfs_hash,       # SAME IPFS content
            name=original_doc.name,                  # Keep same name or allow custom
            file_name=original_doc.file_name,        # Keep same filename
            file_size=original_doc.file_size,
            document_type=original_doc.document_type,
            owner_id=current_user_id,
            owner_address=original_doc.owner_address,
            folder_id=data.get('folder_id', original_doc.folder_id),  # Different folder
            transaction_hash=original_doc.transaction_hash,
            block_number=original_doc.block_number,
            timestamp=int(datetime.utcnow().timestamp())
        )
        
        db.session.add(new_document)
        db.session.commit()
        
        print(f"✅ Created copy with database ID: {new_document.id}")
        print(f"✅ Copy has blockchain document_id: {new_document.document_id}")
        print(f"✅ Copy has IPFS hash: {new_document.ipfs_hash}")
        
        # Update parent folder's updated_at timestamp
        if new_document.folder_id:
            from app.models.folder import Folder
            folder = Folder.query.get(new_document.folder_id)
            if folder:
                folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document reference created successfully (same blockchain file, different folder)',
            'document': new_document.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Error copying document: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
