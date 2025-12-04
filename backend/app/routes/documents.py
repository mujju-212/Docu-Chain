from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.document import Document, DocumentShare, DocumentVersion
from app.models.folder import Folder
from app.models.blockchain_transaction import BlockchainTransaction
from app.models.activity_log import log_activity
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
        get_all = request.args.get('all', 'false').lower() == 'true'
        
        # Check if user is viewing special folders (Received/Sent under Shared folder ONLY)
        is_received_folder = False
        is_sent_folder = False
        
        if folder_id:
            folder = Folder.query.get(folder_id)
            
            # Convert both to strings for comparison (JWT returns string, DB has UUID)
            if folder and str(folder.owner_id) == str(current_user_id):
                # Check if this is under the "Shared" parent folder (not Document Approval)
                parent_folder = Folder.query.get(folder.parent_id) if folder.parent_id else None
                is_under_shared = parent_folder and parent_folder.name == 'Shared'
                
                if folder.name == 'Received' and is_under_shared:
                    is_received_folder = True
                elif folder.name == 'Sent' and is_under_shared:
                    is_sent_folder = True
        
        documents = []
        share_info_map = {}  # Map document_id to share info
        
        # If viewing Shared/Received folder, show documents shared WITH this user
        if is_received_folder:
            from app.models.document import DocumentShare
            # Use distinct to avoid duplicates if document was shared multiple times
            shared_docs_query = db.session.query(Document, DocumentShare).join(
                DocumentShare, Document.id == DocumentShare.document_id
            ).filter(
                DocumentShare.shared_with_id == current_user_id,
                Document.is_active == True
            ).order_by(Document.created_at.desc()).all()
            
            # Extract unique documents and build share info map
            seen_docs = set()
            for doc, share in shared_docs_query:
                if doc.id not in seen_docs:
                    documents.append(doc)
                    seen_docs.add(doc.id)
                    # Get shared_by user info
                    shared_by_user = User.query.get(share.shared_by_id)
                    share_info_map[str(doc.id)] = {
                        'permission': share.permission,
                        'sharedBy': shared_by_user.email if shared_by_user else None,
                        'sharedAt': share.shared_at.isoformat() if share.shared_at else None,
                        'transactionHash': share.transaction_hash
                    }
        
        # If viewing Shared/Sent folder, show documents shared BY this user
        elif is_sent_folder:
            from app.models.document import DocumentShare
            sent_docs_query = db.session.query(Document, DocumentShare).join(
                DocumentShare, Document.id == DocumentShare.document_id
            ).filter(
                DocumentShare.shared_by_id == current_user_id,
                Document.is_active == True
            ).order_by(Document.created_at.desc()).all()
            
            # Extract unique documents and build share info map
            seen_docs = set()
            for doc, share in sent_docs_query:
                if doc.id not in seen_docs:
                    documents.append(doc)
                    seen_docs.add(doc.id)
                    # Get shared_with user info
                    shared_with_user = User.query.get(share.shared_with_id)
                    share_info_map[str(doc.id)] = {
                        'permission': share.permission,
                        'sharedWith': shared_with_user.email if shared_with_user else None,
                        'sharedAt': share.shared_at.isoformat() if share.shared_at else None,
                        'transactionHash': share.transaction_hash
                    }
        
        else:
            # Build query for active documents owned by current user
            query = Document.query.filter_by(
                owner_id=current_user_id, 
                is_active=True,
                is_in_trash=False
            )
            
            # Filter by folder if specified, or get all documents if all=true
            if get_all:
                # Get ALL documents from all folders (for counting/filtering)
                pass  # No additional filter needed
            elif folder_id:
                query = query.filter_by(folder_id=folder_id)
            else:
                # If no folder_id specified, show root level documents (folder_id is None)
                query = query.filter(Document.folder_id.is_(None))
            
            documents = query.order_by(Document.created_at.desc()).all()
        
        # Convert to dict format using model's to_dict() method
        documents_data = []
        for doc in documents:
            doc_dict = doc.to_dict()
            # Add share info if available (for Received/Sent folders)
            doc_id_str = str(doc.id)
            if doc_id_str in share_info_map:
                doc_dict['shareInfo'] = share_info_map[doc_id_str]
                doc_dict['isShared'] = True
                doc_dict['permission'] = share_info_map[doc_id_str].get('permission', 'read')
            documents_data.append(doc_dict)
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'message': f'Found {len(documents_data)} documents'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/search', methods=['GET'])
@token_required
def search_documents():
    """
    Search documents recursively across all folders.
    Query params:
        - q: search query (required)
        - recursive: search in all subfolders (default true)
        - limit: max results (default 20)
    """
    try:
        current_user_id = get_jwt_identity()
        
        query = request.args.get('q', '').strip()
        recursive = request.args.get('recursive', 'true').lower() == 'true'
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 results
        
        if not query or len(query) < 2:
            return jsonify({
                'success': True,
                'documents': [],
                'message': 'Query must be at least 2 characters'
            }), 200
        
        # Search pattern for ILIKE (case-insensitive)
        search_pattern = f'%{query}%'
        
        from sqlalchemy import or_
        
        # Build base query - search user's own documents
        doc_query = Document.query.filter(
            Document.owner_id == current_user_id,
            Document.is_active == True,
            Document.is_in_trash == False,
            or_(
                Document.name.ilike(search_pattern),
                Document.file_name.ilike(search_pattern),
                Document.document_type.ilike(search_pattern)
            )
        )
        
        # Also search in documents shared WITH the current user
        from app.models.document import DocumentShare
        shared_doc_ids = db.session.query(DocumentShare.document_id).filter(
            DocumentShare.shared_with_id == current_user_id
        ).subquery()
        
        shared_docs_query = Document.query.filter(
            Document.id.in_(shared_doc_ids),
            Document.is_active == True,
            Document.is_in_trash == False,
            or_(
                Document.name.ilike(search_pattern),
                Document.file_name.ilike(search_pattern),
                Document.document_type.ilike(search_pattern)
            )
        )
        
        # Combine queries using union
        combined_query = doc_query.union(shared_docs_query).limit(limit)
        documents = combined_query.all()
        
        # Format documents with folder path info
        documents_data = []
        for doc in documents:
            doc_dict = doc.to_dict()
            
            # Add name field explicitly for frontend compatibility
            doc_dict['name'] = doc.name or doc.file_name
            doc_dict['filename'] = doc.file_name
            doc_dict['folder_name'] = None
            
            # Get folder path for navigation
            folder_path = []
            folder_name = None
            if doc.folder_id:
                folder = Folder.query.get(doc.folder_id)
                if folder:
                    folder_name = folder.name
                    # Build full path
                    current_folder = folder
                    while current_folder:
                        folder_path.insert(0, {
                            'id': str(current_folder.id),
                            'name': current_folder.name
                        })
                        if current_folder.parent_id:
                            current_folder = Folder.query.get(current_folder.parent_id)
                        else:
                            current_folder = None
            
            # Determine if it's a shared document
            is_shared = str(doc.owner_id) != str(current_user_id)
            
            doc_dict['folderPath'] = folder_path
            doc_dict['folderName'] = folder_name or 'Root'
            doc_dict['folder_name'] = folder_name or 'Root'
            doc_dict['isSharedDocument'] = is_shared
            
            # Get owner info for shared documents
            if is_shared:
                owner = User.query.get(doc.owner_id)
                if owner:
                    doc_dict['ownerName'] = f"{owner.first_name} {owner.last_name}"
                    doc_dict['ownerEmail'] = owner.email
            
            documents_data.append(doc_dict)
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'count': len(documents_data)
        }), 200
        
    except Exception as e:
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
        
        # Record blockchain transaction for monitoring
        if data.get('transaction_hash'):
            try:
                blockchain_tx = BlockchainTransaction(
                    transaction_hash=data.get('transaction_hash'),
                    block_number=data.get('block_number'),
                    user_id=current_user_id,
                    transaction_type='upload',
                    document_id=document.id,
                    gas_used=data.get('gas_used'),
                    gas_price=data.get('gas_price'),
                    status='confirmed'
                )
                db.session.add(blockchain_tx)
                db.session.commit()
            except Exception as tx_error:
                # Don't fail the upload if transaction recording fails
                pass
        
        # Update parent folder's updated_at timestamp
        if document.folder_id:
            from app.models.folder import Folder
            folder = Folder.query.get(document.folder_id)
            if folder:
                folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        # Log the upload activity
        log_activity(
            user_id=current_user_id,
            action_type='upload',
            action_category='document',
            description=f'Uploaded document: {document.file_name}',
            target_id=str(document.id),
            target_type='document',
            target_name=document.file_name,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success',
            metadata={
                'file_size': document.file_size,
                'file_type': document.document_type,
                'folder_id': str(document.folder_id) if document.folder_id else None,
                'ipfs_hash': document.ipfs_hash,
                'transaction_hash': document.transaction_hash
            }
        )
        
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
        document_name = document.file_name  # Store name for logging
        
        # Soft delete - mark as inactive and move to trash
        document.is_active = False
        document.is_in_trash = True
        document.trash_date = datetime.utcnow()
        
        db.session.commit()
        
        # Log the delete activity
        log_activity(
            user_id=current_user_id,
            action_type='delete',
            action_category='document',
            description=f'Moved document to trash: {document_name}',
            target_id=str(document_id),
            target_type='document',
            target_name=document_name,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success'
        )
        
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
        else:
            # Check for write permission via shares
            share = DocumentShare.query.filter_by(
                document_id=document_id,
                shared_with_id=current_user_id,
                permission='write'
            ).first()
            
            if share:
                has_permission = True
        
        if not has_permission:
            return jsonify({
                'success': False,
                'message': 'You do not have permission to update this document'
            }), 403
        
        old_folder_id = document.folder_id
        blockchain_document_id = document.document_id
        
        # Check if this is a content update (IPFS hash change)
        is_content_update = 'ipfs_hash' in data
        old_ipfs_hash = document.ipfs_hash
        old_file_name = document.file_name
        old_file_size = document.file_size
        
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
        
        # If this is a content update, create a version entry
        # Skip version creation if this is the initial upload (old_ipfs_hash is None)
        if is_content_update and old_ipfs_hash and old_ipfs_hash != data.get('ipfs_hash'):
            
            # Get the latest version number
            latest_version = DocumentVersion.query.filter_by(
                document_id=document.id
            ).order_by(DocumentVersion.version_number.desc()).first()
            
            new_version_number = (latest_version.version_number + 1) if latest_version else 1
            
            # Create version entry for the OLD content (before update)
            if latest_version is None:
                # This is the first update, so save the original version
                original_version = DocumentVersion(
                    document_id=document.id,
                    version_number=1,
                    ipfs_hash=old_ipfs_hash,
                    file_name=old_file_name,
                    file_size=old_file_size,
                    transaction_id=document.transaction_hash,
                    changes_description='Original version',
                    created_by=current_user_id
                )
                db.session.add(original_version)
                new_version_number = 2
            
            # Create version entry for the NEW content
            new_version = DocumentVersion(
                document_id=document.id,
                version_number=new_version_number,
                ipfs_hash=data.get('ipfs_hash'),
                file_name=data.get('name', document.file_name),
                file_size=data.get('file_size', document.file_size),
                transaction_id=data.get('transaction_hash'),
                changes_description=data.get('description', f'Version {new_version_number}'),
                created_by=current_user_id
            )
            db.session.add(new_version)
            db.session.commit()
        
        # If this is a content update, update ALL copies (all documents with same blockchain document_id)
        if is_content_update and blockchain_document_id:
            # Find all documents (copies) with the same blockchain document_id
            # Note: document.id is UUID, document_id parameter is string
            all_copies = Document.query.filter(
                Document.document_id == blockchain_document_id,
                Document.is_active == True,
                Document.id != document.id  # Use document.id (UUID object) not document_id (string parameter)
            ).all()
            
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
            
            db.session.commit()
        
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
        
        # Record blockchain transaction for monitoring (if transaction_hash is provided)
        if data.get('transaction_hash'):
            try:
                # Check if this transaction is already recorded
                existing_tx = BlockchainTransaction.query.filter_by(
                    transaction_hash=data.get('transaction_hash')
                ).first()
                
                if not existing_tx:
                    blockchain_tx = BlockchainTransaction(
                        transaction_hash=data.get('transaction_hash'),
                        block_number=data.get('block_number'),
                        user_id=current_user_id,
                        transaction_type='upload',
                        document_id=document.id,
                        gas_used=int(data.get('gas_used')) if data.get('gas_used') else None,
                        gas_price=int(data.get('gas_price')) if data.get('gas_price') else None,
                        status='confirmed'
                    )
                    db.session.add(blockchain_tx)
                    db.session.commit()
            except Exception as tx_error:
                pass  # Don't fail the update if transaction recording fails
                # Don't fail the update if transaction recording fails
        
        return jsonify({
            'success': True,
            'message': 'Document updated successfully' + (' (all copies updated)' if is_content_update else ''),
            'document': document.to_dict(),
            'copies_updated': len(all_copies) if is_content_update and blockchain_document_id else 0
        }), 200
        
    except Exception as e:
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
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<document_id>/star', methods=['PUT'])
@token_required
def toggle_star_document(document_id):
    """Toggle star status for a document"""
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
                'error': 'Document not found'
            }), 404
        
        # Toggle starred status
        document.is_starred = not document.is_starred
        document.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'isStarred': document.is_starred,
            'message': f'Document {"starred" if document.is_starred else "unstarred"} successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/starred', methods=['GET'])
@token_required
def list_starred_documents():
    """Get all starred documents for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query for starred documents
        documents = Document.query.filter_by(
            owner_id=current_user_id,
            is_active=True,
            is_in_trash=False,
            is_starred=True
        ).order_by(Document.updated_at.desc()).all()
        
        documents_data = [doc.to_dict() for doc in documents]
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'count': len(documents_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/<document_id>/versions', methods=['GET'])
@token_required
def get_document_versions(document_id):
    """Get version history for a document"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find the document (check ownership or shared access)
        document = Document.query.filter_by(id=document_id, is_active=True).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found'
            }), 404
        
        # Check if user has permission to view (owner OR has read/write access)
        has_permission = False
        
        if str(document.owner_id) == str(current_user_id):
            has_permission = True
        else:
            # Check for shared access
            share = DocumentShare.query.filter_by(
                document_id=document_id,
                shared_with_id=current_user_id
            ).first()
            
            if share:
                has_permission = True
        
        if not has_permission:
            return jsonify({
                'success': False,
                'message': 'You do not have permission to view this document'
            }), 403
        
        # Get all versions for this document, ordered by version number descending (newest first)
        versions = DocumentVersion.query.filter_by(
            document_id=document.id
        ).order_by(DocumentVersion.version_number.desc()).all()
        
        # If no versions exist, return current document as version 1
        if not versions:
            current_version = {
                'versionNumber': 1,
                'ipfsHash': document.ipfs_hash,
                'fileName': document.file_name,
                'fileSize': document.file_size,
                'transactionId': document.transaction_hash,
                'description': 'Current version',
                'createdAt': document.created_at.isoformat() if document.created_at else None,
                'ipfsUrl': f"https://gateway.pinata.cloud/ipfs/{document.ipfs_hash}",
                'isCurrent': True
            }
            
            return jsonify({
                'success': True,
                'versions': [current_version],
                'count': 1
            }), 200
        
        # Convert versions to dict and mark the latest as current
        versions_data = []
        for i, version in enumerate(versions):
            version_dict = version.to_dict()
            version_dict['isCurrent'] = (i == 0)  # First version (highest number) is current
            versions_data.append(version_dict)
        
        return jsonify({
            'success': True,
            'versions': versions_data,
            'count': len(versions_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/<document_id>/log-access', methods=['POST'])
@token_required
def log_document_access(document_id):
    """
    Log when user views or downloads a document.
    Called from frontend when opening/downloading a file.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        action_type = data.get('action', 'view')  # 'view' or 'download'
        
        # Find the document
        document = Document.query.filter_by(id=document_id, is_active=True).first()
        
        if not document:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        # Log the activity
        log_activity(
            user_id=current_user_id,
            action_type=action_type,
            action_category='document',
            description=f'{"Viewed" if action_type == "view" else "Downloaded"} document: {document.file_name}',
            target_id=str(document.id),
            target_type='document',
            target_name=document.file_name,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success',
            metadata={
                'ipfs_hash': document.ipfs_hash,
                'file_type': document.document_type,
                'file_size': document.file_size
            }
        )
        
        return jsonify({'success': True, 'message': f'{action_type.capitalize()} logged'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
