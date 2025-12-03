from flask import Blueprint, request, jsonify
from app import db
from app.models.document import Document, DocumentShare
from app.models.user import User
from app.models.folder import Folder
from app.models.blockchain_transaction import BlockchainTransaction
from app.models.activity_log import log_activity
from app.models.notification import create_notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_

bp = Blueprint('shares', __name__, url_prefix='/api/shares')

def token_required(f):
    """Decorator for routes that require authentication"""
    return jwt_required()(f)

def send_share_chat_message(sender_id, recipient_id, document, permission='read', transaction_hash=None, block_number=None):
    """Send an auto-generated chat message when a document is shared"""
    try:
        from app.routes.chat import create_document_share_message
        create_document_share_message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            document={
                'id': str(document.id),
                'name': document.name,  # Fixed: was 'title', now 'name'
                'ipfs_hash': document.ipfs_hash,
                'size': document.file_size,
                'type': document.document_type
            },
            permission=permission,
            transaction_hash=transaction_hash,
            block_number=block_number,
            blockchain_document_id=document.document_id,
            message_content=f"📄 Shared document: {document.name}"
        )
    except Exception as e:
        print(f"⚠️ Failed to send chat message for share: {e}")

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
                
                # Send auto-generated chat message with blockchain info
                send_share_chat_message(
                    sender_id=current_user_id, 
                    recipient_id=user_id, 
                    document=document,
                    permission=permission,
                    transaction_hash=transaction_hash,
                    block_number=block_number
                )
                
                # Create notification for recipient
                sender = User.query.get(current_user_id)
                sender_name = f"{sender.first_name} {sender.last_name}" if sender else "Someone"
                create_notification(
                    user_id=user_id,
                    notification_type='document_shared',
                    title='Document Shared with You',
                    message=f'{sender_name} shared "{document.name}" with you',
                    sender_id=current_user_id,
                    sender_name=sender_name,
                    extra_data={
                        'document_id': str(document.id),
                        'document_name': document.name,
                        'shared_by': current_user_id,
                        'permission': permission
                    }
                )
                
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
        
        # Log the share activity
        recipient_names = [s['username'] for s in shares_created]
        log_activity(
            user_id=current_user_id,
            action_type='share',
            action_category='share',
            description=f'Shared document "{document.name}" with {len(shares_created)} user(s)',
            target_id=str(document.id),
            target_type='document',
            target_name=document.name,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success',
            metadata={
                'recipients': recipient_names,
                'transaction_hash': transaction_hash,
                'block_number': block_number
            }
        )
        
        # Record blockchain transaction for monitoring
        if transaction_hash:
            try:
                existing_tx = BlockchainTransaction.query.filter_by(
                    transaction_hash=transaction_hash
                ).first()
                
                if not existing_tx:
                    gas_used = data.get('gas_used')
                    gas_price = data.get('gas_price')
                    
                    blockchain_tx = BlockchainTransaction(
                        transaction_hash=transaction_hash,
                        block_number=block_number,
                        user_id=current_user_id,
                        transaction_type='share',
                        document_id=document.id,
                        gas_used=int(gas_used) if gas_used else None,
                        gas_price=int(gas_price) if gas_price else None,
                        status='confirmed'
                    )
                    db.session.add(blockchain_tx)
                    db.session.commit()
                    print(f"✅ Share blockchain transaction recorded: {transaction_hash}")
            except Exception as tx_error:
                print(f"⚠️ Could not record share blockchain transaction: {tx_error}")
        
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
        
        print(f"📥 Found {len(shares)} share records in database")
        
        shared_documents = []
        for share in shares:
            print(f"📥 Processing share: document_id={share.document_id}, shared_by={share.shared_by_id}")
            
            document = Document.query.filter_by(
                id=share.document_id,
                is_active=True
            ).first()
            
            if document:
                # Get the user who shared (not necessarily the owner)
                shared_by_user = User.query.get(share.shared_by_id)
                
                doc_data = document.to_dict()
                doc_data['shared_by'] = {
                    'id': str(share.shared_by_id),
                    'username': f"{shared_by_user.first_name} {shared_by_user.last_name}" if shared_by_user else 'Unknown',
                    'email': shared_by_user.email if shared_by_user else ''
                }
                doc_data['permission'] = share.permission
                doc_data['shared_at'] = share.shared_at.isoformat() if share.shared_at else None
                
                shared_documents.append(doc_data)
                print(f"✅ Added shared document: {document.file_name}")
            else:
                print(f"⚠️ Document {share.document_id} not found or inactive")
        
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
