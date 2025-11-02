from flask import Blueprint, request, jsonify
from app import db
from app.models.document import Document, DocumentShare
from app.models.user import User
from app.models.folder import Folder
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_

bp = Blueprint('shares', __name__, url_prefix='/api/shares')

def token_required(f):
    """Decorator for routes that require authentication"""
    return jwt_required()(f)

@bp.route('/document/<document_id>', methods=['POST'])
@token_required
def share_document(document_id):
    """
    Share a document with users (Hybrid: Blockchain + Database)
    Expects: {
        "recipients": [
            {"user_id": "uuid", "permission": "read|write"}
        ],
        "transaction_hash": "0x...",  # From blockchain
        "block_number": 123
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"📤 Share request for document: {document_id}")
        print(f"📤 From user: {current_user_id}")
        print(f"📤 Recipients: {data.get('recipients', [])}")
        
        # Verify document exists and user owns it
        document = Document.query.filter_by(
            id=document_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found or you do not have permission'
            }), 404
        
        recipients = data.get('recipients', [])
        transaction_hash = data.get('transaction_hash')
        block_number = data.get('block_number')
        
        if not recipients:
            return jsonify({
                'success': False,
                'message': 'No recipients provided'
            }), 400
        
        shares_created = []
        
        # NOTE: We do NOT move the document - it stays in its original folder
        # The Sent/Received folders will show documents by querying DocumentShare table
        print(f"📁 Document stays in original folder: {document.folder_id}")
        print(f"� Document will appear in Sent folder via share tracking")
        
        for recipient in recipients:
            user_id = recipient.get('user_id')
            permission = recipient.get('permission', 'read')
            
            # Verify user exists
            user = User.query.get(user_id)
            if not user:
                print(f"⚠️ User {user_id} not found, skipping")
                continue
            
            # Check if share already exists
            existing_share = DocumentShare.query.filter_by(
                document_id=document_id,
                shared_with_id=user_id
            ).first()
            
            if existing_share:
                # Update existing share
                existing_share.permission = permission
                existing_share.transaction_hash = transaction_hash
                existing_share.block_number = block_number
                existing_share.shared_at = datetime.utcnow()
                print(f"✏️ Updated existing share with user: {user.email}")
            else:
                # Create new share
                new_share = DocumentShare(
                    document_id=document_id,
                    shared_by_id=current_user_id,
                    shared_with_id=user_id,
                    permission=permission,
                    transaction_hash=transaction_hash,
                    block_number=block_number
                )
                db.session.add(new_share)
                print(f"✅ Created new share with user: {user.email}")
                
                # Move document to "Received" folder for recipient
                received_folder = Folder.query.filter_by(
                    owner_id=user_id,
                    name='Received'
                ).first()
                
                if received_folder:
                    # Create a reference/copy in recipient's Received folder
                    # We'll update the document's folder for the recipient's view
                    print(f"📁 Document will appear in Received folder for {user.email}")
            
            shares_created.append({
                'user_id': user_id,
                'username': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'permission': permission
            })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Document shared with {len(shares_created)} users',
            'shares': shares_created
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error sharing document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/document/<document_id>', methods=['GET'])
@token_required
def get_document_shares(document_id):
    """Get all users a document is shared with"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify document exists and user has access
        document = Document.query.filter_by(
            id=document_id,
            is_active=True
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found'
            }), 404
        
        # Check if user owns document or has it shared with them
        if document.owner_id != current_user_id:
            has_access = DocumentShare.query.filter_by(
                document_id=document_id,
                shared_with_id=current_user_id
            ).first()
            
            if not has_access:
                return jsonify({
                    'success': False,
                    'message': 'You do not have permission to view shares'
                }), 403
        
        # Get all shares
        shares = DocumentShare.query.filter_by(
            document_id=document_id
        ).all()
        
        shares_data = []
        for share in shares:
            user = User.query.get(share.shared_with_id)
            if user:
                shares_data.append({
                    'id': str(share.id),
                    'user_id': str(share.shared_with_id),
                    'username': f"{user.first_name} {user.last_name}",
                    'email': user.email,
                    'wallet_address': user.wallet_address,
                    'permission': share.permission,
                    'shared_at': share.shared_at.isoformat() if share.shared_at else None,
                    'transaction_hash': share.transaction_hash,
                    'block_number': share.block_number
                })
        
        return jsonify({
            'success': True,
            'shares': shares_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting shares: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/shared-with-me', methods=['GET'])
@token_required
def get_shared_with_me():
    """Get all documents shared with the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        print(f"📥 Getting documents shared with user: {current_user_id}")
        
        # Get all shares where user is recipient
        shares = DocumentShare.query.filter_by(
            shared_with_id=current_user_id
        ).all()
        
        shared_documents = []
        for share in shares:
            document = Document.query.filter_by(
                id=share.document_id,
                is_active=True
            ).first()
            
            if document:
                owner = User.query.get(document.owner_id)
                
                doc_data = document.to_dict()
                doc_data['shared_by'] = {
                    'id': str(share.shared_by_id),
                    'username': f"{owner.first_name} {owner.last_name}" if owner else 'Unknown',
                    'email': owner.email if owner else ''
                }
                doc_data['permission'] = share.permission
                doc_data['shared_at'] = share.shared_at.isoformat() if share.shared_at else None
                
                shared_documents.append(doc_data)
        
        print(f"✅ Found {len(shared_documents)} shared documents")
        
        return jsonify({
            'success': True,
            'documents': shared_documents,
            'count': len(shared_documents)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting shared documents: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/document/<document_id>/user/<user_id>', methods=['DELETE'])
@token_required
def revoke_share(document_id, user_id):
    """Revoke document access from a user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify document ownership
        document = Document.query.filter_by(
            id=document_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'message': 'Document not found or you do not have permission'
            }), 404
        
        # Find and delete share
        share = DocumentShare.query.filter_by(
            document_id=document_id,
            shared_with_id=user_id
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'message': 'Share not found'
            }), 404
        
        db.session.delete(share)
        db.session.commit()
        
        print(f"✅ Revoked share for document {document_id} from user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Share revoked successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error revoking share: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/check-permission/<document_id>', methods=['GET'])
@token_required
def check_permission(document_id):
    """Check if current user has permission to access a document"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user owns the document
        document = Document.query.filter_by(
            id=document_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if document:
            return jsonify({
                'success': True,
                'has_access': True,
                'permission': 'owner',
                'can_read': True,
                'can_write': True,
                'can_share': True
            }), 200
        
        # Check if document is shared with user
        share = DocumentShare.query.filter_by(
            document_id=document_id,
            shared_with_id=current_user_id
        ).first()
        
        if share:
            return jsonify({
                'success': True,
                'has_access': True,
                'permission': share.permission,
                'can_read': True,
                'can_write': share.permission == 'write',
                'can_share': False
            }), 200
        
        return jsonify({
            'success': True,
            'has_access': False,
            'permission': None,
            'can_read': False,
            'can_write': False,
            'can_share': False
        }), 200
        
    except Exception as e:
        print(f"❌ Error checking permission: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
