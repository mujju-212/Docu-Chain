"""
Document Generation Routes
API endpoints for document templates and generation
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.institution import Institution
from app.models.document_template import DocumentTemplate, GeneratedDocument, generate_request_id
from app.models.approval import ApprovalRequest, ApprovalStep, ApprovalHistory, generate_verification_code
from datetime import datetime
import logging
import uuid
import hashlib

bp = Blueprint('document_generation', __name__)
logger = logging.getLogger(__name__)


# ========== TEMPLATES ENDPOINTS ==========

@bp.route('/templates', methods=['GET'])
@jwt_required()
def get_templates():
    """Get templates available for the current user based on role and institution"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Map user role to template categories
        # Each role sees their own templates + 'all' templates
        user_role = user.role
        role_categories = [user_role, 'all']
        
        # Faculty and staff can access both 'faculty' and 'staff' templates
        if user_role in ['faculty', 'staff']:
            role_categories.extend(['faculty', 'staff'])
        
        # Get templates for user's role and institution
        # System templates (institution_id is null) are available to all
        # Institution-specific templates are only for that institution
        templates = DocumentTemplate.query.filter(
            DocumentTemplate.is_active == True,
            db.or_(
                DocumentTemplate.institution_id == None,  # Global templates
                DocumentTemplate.institution_id == user.institution_id  # Institution specific
            ),
            DocumentTemplate.category.in_(role_categories)
        ).order_by(DocumentTemplate.name).all()
        
        return jsonify({
            'success': True,
            'data': [t.to_dict() for t in templates],
            'userRole': user_role
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/templates/<template_id>', methods=['GET'])
@jwt_required()
def get_template(template_id):
    """Get a specific template"""
    try:
        template = DocumentTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        return jsonify({
            'success': True,
            'data': template.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching template: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/templates', methods=['POST'])
@jwt_required()
def create_template():
    """Create a new template (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        template = DocumentTemplate(
            name=data['name'],
            description=data.get('description', ''),
            category=data.get('category', 'all'),
            icon=data.get('icon', '📄'),
            color=data.get('color', '#3b82f6'),
            estimated_time=data.get('estimatedTime', '5 min'),
            fields=data.get('fields', []),
            approval_chain=data.get('approvalChain', []),
            institution_id=user.institution_id,  # Templates are institution-specific
            created_by=user.id
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': template.to_dict(),
            'message': 'Template created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating template: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/templates/<template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Update a template (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        template = DocumentTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        if template.is_system:
            return jsonify({'success': False, 'error': 'Cannot modify system templates'}), 403
        
        data = request.get_json()
        
        template.name = data.get('name', template.name)
        template.description = data.get('description', template.description)
        template.category = data.get('category', template.category)
        template.icon = data.get('icon', template.icon)
        template.color = data.get('color', template.color)
        template.estimated_time = data.get('estimatedTime', template.estimated_time)
        template.fields = data.get('fields', template.fields)
        template.approval_chain = data.get('approvalChain', template.approval_chain)
        template.is_active = data.get('isActive', template.is_active)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': template.to_dict(),
            'message': 'Template updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating template: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/templates/<template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Delete a template (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        template = DocumentTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        if template.is_system:
            return jsonify({'success': False, 'error': 'Cannot delete system templates'}), 403
        
        db.session.delete(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting template: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== DOCUMENT GENERATION ENDPOINTS ==========

@bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_document():
    """Generate a new document from template and optionally save to File Manager"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        template_id = data.get('templateId')
        form_data = data.get('formData', {})
        requested_status = data.get('status', 'draft')  # Accept status from frontend
        
        template = DocumentTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Generate document content based on template
        institution = Institution.query.get(user.institution_id)
        generated_content = generate_document_content(template, form_data, user, institution)
        
        # Validate status - only allow 'draft' or 'completed' (for save action)
        valid_statuses = ['draft', 'completed', 'pending']
        doc_status = requested_status if requested_status in valid_statuses else 'draft'
        
        # Create GeneratedDocument record
        doc = GeneratedDocument(
            request_id=generate_request_id(),
            template_id=template.id,
            template_name=template.name,
            requester_id=user.id,
            institution_id=user.institution_id,
            form_data=form_data,
            generated_content=generated_content,
            status=doc_status,
            completed_at=datetime.utcnow() if doc_status == 'completed' else None
        )
        
        db.session.add(doc)
        db.session.flush()  # Get the doc.id before commit
        
        # Create a File Manager document entry for completed, pending (share/approval) status
        # This allows documents to be shared or sent for approval
        file_manager_doc = None
        if doc_status in ['completed', 'pending']:
            try:
                from app.models.folder import Folder
                from app.models.document import Document
                
                # Find the user's "Generated" folder
                generated_folder = Folder.query.filter_by(
                    owner_id=current_user_id,
                    name='Generated',
                    is_system_folder=True
                ).first()
                
                if generated_folder:
                    # Create a document entry in the File Manager
                    file_name = f"{template.name}_{doc.request_id}.pdf"
                    
                    # Generate a unique document ID for blockchain reference
                    doc_hash = hashlib.sha256(f'{doc.id}-{datetime.utcnow().timestamp()}'.encode()).hexdigest()
                    
                    file_manager_doc = Document(
                        document_id=f"0x{doc_hash[:64]}",
                        ipfs_hash=None,  # Will be set when uploaded to IPFS
                        name=f"{template.name} - {doc.request_id}",
                        file_name=file_name,
                        file_size=0,  # Will be updated when PDF is uploaded from frontend
                        document_type='application/pdf',
                        owner_id=user.id,
                        owner_address=user.wallet_address or '0x0000000000000000000000000000000000000000',
                        folder_id=generated_folder.id,
                        transaction_hash=f"0x{doc_hash}",  # Placeholder hash
                        block_number=0,
                        timestamp=int(datetime.utcnow().timestamp())
                    )
                    
                    db.session.add(file_manager_doc)
                    
                    # Link the file manager document to the generated document
                    doc.pdf_ipfs_hash = f"generated:{file_manager_doc.id}"
                    
                    logger.info(f"✅ Document saved to Generated folder for user {user.email}")
                else:
                    logger.warning(f"⚠️ Generated folder not found for user {user.email}")
                    
            except Exception as folder_error:
                logger.error(f"Error saving to Generated folder: {folder_error}")
                # Don't fail the whole request, just log the error
        
        db.session.commit()
        
        response_data = doc.to_dict_with_requester()
        if file_manager_doc:
            response_data['fileManagerDocument'] = {
                'id': str(file_manager_doc.id),
                'fileName': file_manager_doc.file_name,
                'folderId': str(file_manager_doc.folder_id)
            }
        
        message = 'Document generated successfully'
        if doc_status == 'completed':
            message = 'Document saved to Generated folder successfully'
        elif doc_status == 'pending' and file_manager_doc:
            message = 'Document ready for sharing/approval'
        
        return jsonify({
            'success': True,
            'data': response_data,
            'message': message
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error generating document: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/submit/<doc_id>', methods=['POST'])
@jwt_required()
def submit_document(doc_id):
    """Submit a generated document for approval - creates an approval request"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        doc = GeneratedDocument.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        if str(doc.requester_id) != str(current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Allow submission from 'draft', 'completed', or 'pending' status
        if doc.status not in ['draft', 'completed', 'pending']:
            return jsonify({'success': False, 'error': f'Document cannot be submitted (current status: {doc.status})'}), 400
        
        data = request.get_json() or {}
        recipient_ids = data.get('recipientIds', [])
        raw_approval_type = data.get('approvalType', 'STANDARD').upper()
        # Map frontend values to backend values
        approval_type_map = {
            'STANDARD': 'STANDARD',
            'DIGITAL': 'DIGITAL_SIGNATURE',
            'DIGITAL_SIGNATURE': 'DIGITAL_SIGNATURE'
        }
        approval_type = approval_type_map.get(raw_approval_type, 'STANDARD')
        logger.info(f"Approval type: raw={raw_approval_type}, mapped={approval_type}")
        
        submitted_ipfs_hash = data.get('ipfsHash')  # IPFS hash from frontend
        submitted_tx_hash = data.get('blockchainTxHash')  # TX hash from frontend
        submitted_file_size = data.get('fileSize', 0)  # File size from frontend
        submitted_blockchain_request_id = data.get('blockchainRequestId')  # Blockchain request ID from frontend
        
        if not recipient_ids:
            return jsonify({'success': False, 'error': 'At least one recipient is required'}), 400
        
        # Use blockchain request ID if provided, otherwise generate one
        if submitted_blockchain_request_id:
            request_id = submitted_blockchain_request_id
            logger.info(f"Using blockchain request ID from frontend: {request_id}")
        else:
            request_id = f"0x{hashlib.sha256(f'{doc.id}-{datetime.utcnow().timestamp()}'.encode()).hexdigest()}"
            logger.info(f"Generated fallback request ID: {request_id}")
        
        document_id = f"0x{hashlib.sha256(f'{doc.id}'.encode()).hexdigest()}"
        
        # Get IPFS hash - prefer submitted hash from frontend, then check existing
        ipfs_hash = submitted_ipfs_hash or 'pending'
        if not submitted_ipfs_hash:
            if doc.pdf_ipfs_hash and not doc.pdf_ipfs_hash.startswith('generated:'):
                ipfs_hash = doc.pdf_ipfs_hash
        
        # Get file size - prefer submitted size from frontend
        file_size = submitted_file_size or 0
        file_type = 'application/pdf'
        blockchain_tx = submitted_tx_hash
        
        # If we have a file manager doc reference, get info from there
        if doc.pdf_ipfs_hash and doc.pdf_ipfs_hash.startswith('generated:'):
            try:
                from app.models.document import Document as FileManagerDocument
                file_manager_doc_id = doc.pdf_ipfs_hash.replace('generated:', '')
                file_manager_doc = FileManagerDocument.query.get(file_manager_doc_id)
                if file_manager_doc:
                    if not file_size:
                        file_size = file_manager_doc.file_size or 0
                    file_type = file_manager_doc.document_type or 'application/pdf'
                    if file_manager_doc.ipfs_hash and ipfs_hash == 'pending':
                        ipfs_hash = file_manager_doc.ipfs_hash
                    if file_manager_doc.transaction_hash and not blockchain_tx:
                        blockchain_tx = file_manager_doc.transaction_hash
            except Exception as e:
                logger.warning(f"Could not get file manager doc info: {e}")
        
        # Create approval request
        approval_request = ApprovalRequest(
            request_id=request_id,
            document_id=document_id,
            verification_code=generate_verification_code(),
            document_name=doc.template.name if doc.template else 'Generated Document',
            document_ipfs_hash=ipfs_hash,
            document_file_size=file_size,
            document_file_type=file_type,
            blockchain_tx_hash=blockchain_tx,
            requester_id=user.id,
            requester_wallet=user.wallet_address or '0x0000000000000000000000000000000000000000',
            purpose=f"Generated {doc.template.name if doc.template else 'document'} request",
            process_type='SEQUENTIAL',
            approval_type=approval_type,  # Already mapped above
            priority='NORMAL',
            status='PENDING',
            institution_id=user.institution_id,
            request_metadata={
                'generatedDocumentId': str(doc.id),
                'templateId': str(doc.template_id) if doc.template_id else None,
                'templateName': doc.template.name if doc.template else None,
                'formData': doc.form_data,
                'generatedContent': doc.generated_content
            }
        )
        
        db.session.add(approval_request)
        db.session.flush()  # Get the approval_request.id
        
        # Create approval steps for each recipient
        for idx, recipient_id in enumerate(recipient_ids):
            approver = User.query.get(recipient_id)
            if approver:
                step = ApprovalStep(
                    request_id=approval_request.id,
                    blockchain_request_id=request_id,  # Use the generated blockchain request ID
                    step_order=idx + 1,
                    approver_id=approver.id,
                    approver_wallet=approver.wallet_address or '0x0000000000000000000000000000000000000000',
                    approver_role=approver.role or 'Approver',
                    has_approved=False,
                    has_rejected=False
                )
                db.session.add(step)
        
        # Add history entry
        history = ApprovalHistory(
            request_id=approval_request.id,
            event_type='SUBMITTED',
            event_description='Document submitted for approval',
            actor_id=user.id,
            actor_wallet=user.wallet_address,
            actor_role=user.role,
            old_status=None,
            new_status='PENDING',
            history_metadata={
                'message': 'Document submitted for approval',
                'recipients': len(recipient_ids)
            }
        )
        db.session.add(history)
        
        # Update generated document status
        doc.status = 'pending'
        doc.submitted_at = datetime.utcnow()
        doc.approval_request_id = str(approval_request.id)
        doc.approval_history = [{
            'action': 'submitted',
            'timestamp': datetime.utcnow().isoformat(),
            'userId': str(current_user_id),
            'approvalRequestId': str(approval_request.id),
            'note': 'Document submitted for approval'
        }]
        
        db.session.commit()
        
        # Record blockchain transaction if hash provided
        if submitted_tx_hash:
            try:
                from app.models.blockchain_transaction import BlockchainTransaction
                existing_tx = BlockchainTransaction.query.filter_by(
                    transaction_hash=submitted_tx_hash
                ).first()
                if not existing_tx:
                    blockchain_tx_record = BlockchainTransaction(
                        transaction_hash=submitted_tx_hash,
                        user_id=current_user_id,
                        transaction_type='request_approval',
                        gas_used=data.get('gasUsed'),
                        gas_price=data.get('gasPrice'),
                        block_number=data.get('blockNumber'),
                        status='confirmed'
                    )
                    db.session.add(blockchain_tx_record)
                    db.session.commit()
                    logger.info(f"Recorded blockchain transaction for approval request: {submitted_tx_hash}")
            except Exception as tx_error:
                logger.warning(f"Could not record blockchain transaction: {tx_error}")
        
        # Send chat messages to all recipients about the approval request
        try:
            from app.routes.chat import create_approval_request_message, create_digital_signature_request_message
            for recipient_id in recipient_ids:
                if approval_type == 'DIGITAL_SIGNATURE':
                    create_digital_signature_request_message(
                        sender_id=current_user_id,
                        recipient_id=recipient_id,
                        approval_request={
                            'id': str(approval_request.id),
                            'requestId': approval_request.request_id
                        },
                        document={
                            'id': str(approval_request.document_id) if approval_request.document_id else None,
                            'name': approval_request.document_name,
                            'ipfs_hash': approval_request.document_ipfs_hash,
                            'size': approval_request.document_file_size
                        }
                    )
                else:
                    create_approval_request_message(
                        sender_id=current_user_id,
                        recipient_id=recipient_id,
                        approval_request={
                            'id': str(approval_request.id),
                            'requestId': approval_request.request_id
                        },
                        document={
                            'id': str(approval_request.document_id) if approval_request.document_id else None,
                            'name': approval_request.document_name,
                            'ipfs_hash': approval_request.document_ipfs_hash,
                            'size': approval_request.document_file_size
                        }
                    )
            logger.info(f"Sent chat messages to {len(recipient_ids)} recipients for document generation approval")
        except Exception as chat_error:
            logger.warning(f"Could not send chat messages for document generation: {chat_error}")
        
        return jsonify({
            'success': True,
            'data': {
                'document': doc.to_dict_with_requester(),
                'approvalRequest': approval_request.to_dict() if hasattr(approval_request, 'to_dict') else {'id': str(approval_request.id)}
            },
            'message': 'Document submitted for approval successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting document: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/update-blockchain/<doc_id>', methods=['PUT'])
@jwt_required()
def update_document_blockchain(doc_id):
    """Update document with IPFS hash and blockchain transaction info"""
    try:
        current_user_id = get_jwt_identity()
        
        doc = GeneratedDocument.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        if str(doc.requester_id) != str(current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json() or {}
        
        # Update IPFS hash
        if data.get('ipfsHash'):
            doc.pdf_ipfs_hash = data['ipfsHash']
        
        # Update blockchain transaction hash
        if data.get('blockchainTxHash'):
            doc.blockchain_tx_hash = data['blockchainTxHash']
        
        # Also update the File Manager document if exists
        file_manager_doc_id = None
        
        # Get file manager doc ID from request or from doc.pdf_ipfs_hash
        if data.get('fileManagerDocId'):
            file_manager_doc_id = data['fileManagerDocId']
        elif doc.pdf_ipfs_hash and doc.pdf_ipfs_hash.startswith('generated:'):
            file_manager_doc_id = doc.pdf_ipfs_hash.replace('generated:', '')
        
        if file_manager_doc_id:
            try:
                from app.models.document import Document
                file_manager_doc = Document.query.get(file_manager_doc_id)
                if file_manager_doc:
                    if data.get('ipfsHash'):
                        file_manager_doc.ipfs_hash = data['ipfsHash']
                    if data.get('blockchainTxHash'):
                        file_manager_doc.transaction_hash = data['blockchainTxHash']
                    if data.get('blockchainDocId'):
                        file_manager_doc.document_id = data['blockchainDocId']
                    if data.get('fileSize'):
                        file_manager_doc.file_size = int(data['fileSize'])
                    logger.info(f"✅ Updated file manager doc {file_manager_doc_id} with size={data.get('fileSize')}")
            except Exception as e:
                logger.warning(f"Could not update file manager document: {e}")
        
        # Update the generated document's IPFS hash
        if data.get('ipfsHash'):
            doc.pdf_ipfs_hash = data['ipfsHash']
        
        db.session.commit()
        
        logger.info(f"✅ Updated document {doc_id} with blockchain info: IPFS={data.get('ipfsHash')}, TX={data.get('blockchainTxHash')}")
        
        return jsonify({
            'success': True,
            'data': doc.to_dict_with_requester(),
            'message': 'Document updated with blockchain information'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating document blockchain info: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/my-documents', methods=['GET'])
@jwt_required()
def get_my_documents():
    """Get current user's generated documents"""
    try:
        current_user_id = get_jwt_identity()
        
        status = request.args.get('status')  # Optional filter
        
        query = GeneratedDocument.query.filter_by(requester_id=current_user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        documents = query.order_by(GeneratedDocument.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [doc.to_dict_with_requester() for doc in documents]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/document/<doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    """Get a specific generated document"""
    try:
        current_user_id = get_jwt_identity()
        
        doc = GeneratedDocument.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        # Check access - requester or approver can view
        if str(doc.requester_id) != str(current_user_id):
            # TODO: Add approver access check
            pass
        
        return jsonify({
            'success': True,
            'data': doc.to_dict_with_requester()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching document: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/document/<doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    """Delete a draft document"""
    try:
        current_user_id = get_jwt_identity()
        
        doc = GeneratedDocument.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        if str(doc.requester_id) != str(current_user_id):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        if doc.status != 'draft':
            return jsonify({'success': False, 'error': 'Can only delete draft documents'}), 400
        
        db.session.delete(doc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting document: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get document generation analytics for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Documents Generated - Total count of all documents created by user
        generated = GeneratedDocument.query.filter_by(requester_id=current_user_id).count()
        
        # Sent for Approval - Documents with pending status
        sent_for_approval = GeneratedDocument.query.filter_by(
            requester_id=current_user_id, 
            status='pending'
        ).count()
        
        # Signed & Completed - Approved documents
        signed_completed = GeneratedDocument.query.filter_by(
            requester_id=current_user_id, 
            status='approved'
        ).count()
        
        # Saved to Files - Documents with IPFS hash (saved/stored)
        saved_to_files = GeneratedDocument.query.filter(
            GeneratedDocument.requester_id == current_user_id,
            GeneratedDocument.pdf_ipfs_hash.isnot(None)
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'generated': generated,
                'sentForApproval': sent_for_approval,
                'signedCompleted': signed_completed,
                'savedToFiles': saved_to_files
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/institution/approvers', methods=['GET'])
@jwt_required()
def get_institution_approvers():
    """Get potential approvers from user's institution (staff and admin users)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Import Department model
        from app.models.institution import Department
        
        # Get staff, faculty and admin users from the same institution
        approvers = User.query.filter(
            User.institution_id == user.institution_id,
            User.id != current_user_id,  # Exclude current user
            User.role.in_(['staff', 'admin', 'faculty']),  # Staff, faculty and admin can approve
            User.status == 'active'  # Only active users
        ).order_by(User.first_name).all()
        
        result = []
        for a in approvers:
            # Get department name if exists
            dept_name = None
            if a.department_id:
                dept = Department.query.get(a.department_id)
                dept_name = dept.name if dept else None
            
            result.append({
                'id': str(a.id),
                'name': f"{a.first_name} {a.last_name}",
                'firstName': a.first_name,
                'lastName': a.last_name,
                'email': a.email,
                'role': a.role,
                'department': dept_name or 'General',
                'walletAddress': a.wallet_address
            })
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching approvers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== HELPER FUNCTIONS ==========

def generate_document_content(template, form_data, user, institution):
    """Generate professional document HTML content based on template and form data"""
    
    # Get current date in proper format
    current_date = datetime.now().strftime('%d %B %Y')
    ref_number = f"REF/{datetime.now().strftime('%Y%m%d')}/{str(user.id)[:4].upper()}"
    
    # Get template name in lowercase for matching
    template_name_lower = template.name.lower() if template.name else ''
    
    # Determine template type and generate appropriate content
    if 'leave' in template_name_lower or 'application' in template_name_lower:
        return generate_leave_application(template, form_data, user, institution, current_date, ref_number)
    elif 'bonafide' in template_name_lower or 'bona fide' in template_name_lower:
        return generate_bonafide_certificate(template, form_data, user, institution, current_date, ref_number)
    elif 'certificate' in template_name_lower or 'completion' in template_name_lower:
        return generate_certificate(template, form_data, user, institution, current_date, ref_number)
    elif 'no objection' in template_name_lower or 'noc' in template_name_lower:
        return generate_noc(template, form_data, user, institution, current_date, ref_number)
    elif 'recommendation' in template_name_lower or 'lor' in template_name_lower:
        return generate_recommendation_letter(template, form_data, user, institution, current_date, ref_number)
    elif 'transcript' in template_name_lower or 'grade' in template_name_lower:
        return generate_transcript(template, form_data, user, institution, current_date, ref_number)
    elif 'fee' in template_name_lower or 'payment' in template_name_lower:
        return generate_fee_receipt(template, form_data, user, institution, current_date, ref_number)
    elif 'identity' in template_name_lower or 'id card' in template_name_lower:
        return generate_id_certificate(template, form_data, user, institution, current_date, ref_number)
    elif 'event' in template_name_lower or 'permission' in template_name_lower:
        return generate_event_permission(template, form_data, user, institution, current_date, ref_number)
    else:
        return generate_generic_document(template, form_data, user, institution, current_date, ref_number)


def get_document_styles():
    """Common styles for all documents"""
    return """
    <style>
        .document-container {
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 50px;
            background: white;
            color: #1a1a1a;
            line-height: 1.8;
        }
        .doc-header {
            text-align: center;
            border-bottom: 3px double #1e3a5f;
            padding-bottom: 25px;
            margin-bottom: 30px;
        }
        .doc-header .logo-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #1e3a5f, #2d5a87);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
        }
        .institution-name {
            font-size: 26px;
            font-weight: 700;
            color: #1e3a5f;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .institution-tagline {
            font-size: 13px;
            color: #64748b;
            margin: 5px 0;
            font-style: italic;
        }
        .institution-contact {
            font-size: 12px;
            color: #64748b;
            margin: 10px 0 0;
        }
        .doc-title {
            text-align: center;
            margin: 30px 0;
        }
        .doc-title h2 {
            font-size: 22px;
            font-weight: 700;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
            text-decoration: underline;
            text-underline-offset: 8px;
        }
        .doc-ref {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            padding: 12px 18px;
            background: #f8fafc;
            border-left: 4px solid #1e3a5f;
            font-size: 13px;
        }
        .doc-ref span {
            color: #475569;
        }
        .doc-ref strong {
            color: #1e3a5f;
        }
        .address-block {
            margin: 25px 0;
            line-height: 1.6;
        }
        .address-block p {
            margin: 0;
        }
        .subject-line {
            margin: 25px 0;
            font-weight: 600;
        }
        .subject-line strong {
            color: #1e3a5f;
        }
        .doc-body {
            margin: 25px 0;
            text-align: justify;
        }
        .doc-body p {
            margin: 15px 0;
            text-indent: 40px;
        }
        .doc-body p:first-child {
            text-indent: 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        .details-table td {
            padding: 12px 15px;
            border: 1px solid #e2e8f0;
            font-size: 14px;
        }
        .details-table td:first-child {
            width: 40%;
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            text-align: center;
            min-width: 200px;
        }
        .signature-line {
            border-top: 1px solid #1e3a5f;
            margin-top: 60px;
            padding-top: 10px;
        }
        .signature-block p {
            margin: 5px 0;
            font-size: 13px;
        }
        .signature-block .name {
            font-weight: 600;
            color: #1e3a5f;
        }
        .doc-footer {
            margin-top: 50px;
            padding: 20px;
            background: linear-gradient(135deg, #1e3a5f, #2d5a87);
            border-radius: 8px;
            text-align: center;
            color: white;
        }
        .doc-footer p {
            margin: 5px 0;
            font-size: 11px;
        }
        .doc-footer .brand {
            font-weight: 600;
            font-size: 12px;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(30, 58, 95, 0.03);
            font-weight: bold;
            pointer-events: none;
            white-space: nowrap;
        }
        .official-seal {
            width: 100px;
            height: 100px;
            border: 3px solid #1e3a5f;
            border-radius: 50%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #1e3a5f;
            text-align: center;
            padding: 10px;
        }
    </style>
    """


def generate_institution_header(institution):
    """Generate common institution header"""
    inst_name = institution.name.upper() if institution else 'INSTITUTION NAME'
    inst_initial = institution.name[0] if institution else 'I'
    inst_address = institution.address if institution and institution.address else 'Institution Address'
    inst_phone = institution.phone if institution and institution.phone else ''
    inst_email = institution.email if institution and institution.email else ''
    inst_website = institution.website if institution and institution.website else ''
    
    contact_parts = []
    if inst_phone:
        contact_parts.append(f"📞 {inst_phone}")
    if inst_email:
        contact_parts.append(f"📧 {inst_email}")
    if inst_website:
        contact_parts.append(f"🌐 {inst_website}")
    
    return f"""
    <div class="doc-header">
        <div class="logo-placeholder">{inst_initial}</div>
        <h1 class="institution-name">{inst_name}</h1>
        <p class="institution-tagline">{inst_address}</p>
        <p class="institution-contact">{' | '.join(contact_parts)}</p>
    </div>
    """


def generate_document_footer(ref_number):
    """Generate common document footer"""
    return f"""
    <div class="doc-footer">
        <p class="brand">📋 DocuChain - Blockchain Verified Document System</p>
        <p>This document is digitally generated and secured with blockchain verification</p>
        <p>Reference: {ref_number} | Verify at: verify.docuchain.io</p>
    </div>
    """


def generate_leave_application(template, form_data, user, institution, current_date, ref_number):
    """Generate leave application letter"""
    
    # Extract form data
    reason = form_data.get('reason', form_data.get('leaveReason', 'personal reasons'))
    from_date = form_data.get('fromDate', form_data.get('from_date', form_data.get('startDate', current_date)))
    to_date = form_data.get('toDate', form_data.get('to_date', form_data.get('endDate', current_date)))
    details = form_data.get('details', form_data.get('additionalDetails', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">LEAVE APPLICATION</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-ref">
            <span>Reference No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="address-block">
            <p><strong>To,</strong></p>
            <p>The Head of Department / Principal</p>
            <p>{institution.name if institution else 'Institution'}</p>
            <p>{institution.address if institution and institution.address else ''}</p>
        </div>
        
        <div class="subject-line">
            <strong>Subject:</strong> Application for Leave of Absence
        </div>
        
        <div class="doc-body">
            <p>Respected Sir/Madam,</p>
            
            <p>With due respect, I, <strong>{user.first_name} {user.last_name}</strong>, am writing this application to request leave from my regular duties/classes for the period mentioned below.</p>
            
            <table class="details-table">
                <tr>
                    <td>Applicant Name</td>
                    <td>{user.first_name} {user.last_name}</td>
                </tr>
                <tr>
                    <td>Email Address</td>
                    <td>{user.email}</td>
                </tr>
                <tr>
                    <td>Leave Start Date</td>
                    <td>{from_date}</td>
                </tr>
                <tr>
                    <td>Leave End Date</td>
                    <td>{to_date}</td>
                </tr>
                <tr>
                    <td>Reason for Leave</td>
                    <td>{reason}</td>
                </tr>
                {f'<tr><td>Additional Details</td><td>{details}</td></tr>' if details else ''}
            </table>
            
            <p>I assure you that I will complete all pending work and assignments upon my return. I shall be highly obliged if you kindly grant me leave for the above-mentioned period.</p>
            
            <p>Thank you for your kind consideration.</p>
        </div>
        
        <div class="signature-section">
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">{user.first_name} {user.last_name}</p>
                    <p>Applicant</p>
                    <p>Date: {current_date}</p>
                </div>
            </div>
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">_____________________</p>
                    <p>Authorized Signatory</p>
                    <p>(Office Stamp)</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_bonafide_certificate(template, form_data, user, institution, current_date, ref_number):
    """Generate bonafide certificate"""
    
    purpose = form_data.get('purpose', form_data.get('certificatePurpose', 'official purposes'))
    course = form_data.get('course', form_data.get('program', 'the enrolled program'))
    year = form_data.get('year', form_data.get('academicYear', 'current academic year'))
    department = form_data.get('department', 'General')
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">BONAFIDE</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>BONAFIDE CERTIFICATE</h2>
        </div>
        
        <div class="doc-ref">
            <span>Certificate No: <strong>{ref_number}</strong></span>
            <span>Date of Issue: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body" style="margin-top: 40px;">
            <p style="text-indent: 0; font-size: 16px; line-height: 2;">
                This is to certify that <strong style="color: #1e3a5f; text-decoration: underline;">{user.first_name} {user.last_name}</strong> 
                is a bonafide student of this institution.
            </p>
            
            <table class="details-table" style="margin: 35px 0;">
                <tr>
                    <td>Full Name</td>
                    <td><strong>{user.first_name} {user.last_name}</strong></td>
                </tr>
                <tr>
                    <td>Email ID</td>
                    <td>{user.email}</td>
                </tr>
                <tr>
                    <td>Course / Program</td>
                    <td>{course}</td>
                </tr>
                <tr>
                    <td>Academic Year</td>
                    <td>{year}</td>
                </tr>
                <tr>
                    <td>Department</td>
                    <td>{department}</td>
                </tr>
                <tr>
                    <td>Current Status</td>
                    <td><span style="color: #059669; font-weight: 600;">✓ Currently Enrolled</span></td>
                </tr>
            </table>
            
            <p style="text-indent: 0;">
                This certificate is issued upon the request of the student for the purpose of 
                <strong>{purpose}</strong>.
            </p>
            
            <p style="text-indent: 0;">
                The student is in good academic standing and has maintained satisfactory conduct during their tenure at this institution.
            </p>
        </div>
        
        <div class="signature-section" style="margin-top: 80px;">
            <div>
                <p style="margin: 0;">Place: {institution.address.split(',')[0] if institution and institution.address else 'City'}</p>
                <p style="margin: 5px 0;">Date: {current_date}</p>
            </div>
            <div class="signature-block">
                <div class="official-seal">OFFICIAL<br/>SEAL</div>
                <div class="signature-line" style="margin-top: 20px;">
                    <p class="name">Principal / Registrar</p>
                    <p>{institution.name if institution else 'Institution'}</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_certificate(template, form_data, user, institution, current_date, ref_number):
    """Generate general certificate"""
    
    cert_type = form_data.get('certificateType', template.name)
    details = form_data.get('details', form_data.get('description', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">CERTIFICATE</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>{cert_type.upper()}</h2>
        </div>
        
        <div class="doc-ref">
            <span>Certificate No: <strong>{ref_number}</strong></span>
            <span>Date of Issue: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body" style="margin-top: 40px;">
            <p style="text-indent: 0; font-size: 16px; line-height: 2; text-align: center; margin: 40px 0;">
                This is to certify that<br/><br/>
                <strong style="font-size: 22px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 5px;">
                    {user.first_name} {user.last_name}
                </strong>
            </p>
            
            <table class="details-table">
                <tr>
                    <td>Full Name</td>
                    <td>{user.first_name} {user.last_name}</td>
                </tr>
                <tr>
                    <td>Email</td>
                    <td>{user.email}</td>
                </tr>
                {f'<tr><td>Details</td><td>{details}</td></tr>' if details else ''}
            </table>
            
            <p>This certificate is awarded in recognition of the above and is valid for all official purposes.</p>
        </div>
        
        <div class="signature-section" style="margin-top: 80px;">
            <div>
                <p>Date: {current_date}</p>
            </div>
            <div class="signature-block">
                <div class="official-seal">OFFICIAL<br/>SEAL</div>
                <div class="signature-line" style="margin-top: 20px;">
                    <p class="name">Authorized Signatory</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_noc(template, form_data, user, institution, current_date, ref_number):
    """Generate No Objection Certificate"""
    
    purpose = form_data.get('purpose', form_data.get('nocPurpose', 'the stated purpose'))
    event_name = form_data.get('eventName', form_data.get('activity', ''))
    event_date = form_data.get('eventDate', form_data.get('date', ''))
    venue = form_data.get('venue', form_data.get('location', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">N.O.C.</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>NO OBJECTION CERTIFICATE</h2>
        </div>
        
        <div class="doc-ref">
            <span>NOC No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="address-block">
            <p><strong>To Whom It May Concern</strong></p>
        </div>
        
        <div class="doc-body">
            <p style="text-indent: 0;">
                This is to certify that <strong>{user.first_name} {user.last_name}</strong> 
                is associated with {institution.name if institution else 'our institution'} and we have 
                <strong style="color: #059669;">NO OBJECTION</strong> to their participation/involvement in the following:
            </p>
            
            <table class="details-table" style="margin: 30px 0;">
                <tr>
                    <td>Name</td>
                    <td>{user.first_name} {user.last_name}</td>
                </tr>
                <tr>
                    <td>Purpose</td>
                    <td>{purpose}</td>
                </tr>
                {f'<tr><td>Event/Activity</td><td>{event_name}</td></tr>' if event_name else ''}
                {f'<tr><td>Date</td><td>{event_date}</td></tr>' if event_date else ''}
                {f'<tr><td>Venue</td><td>{venue}</td></tr>' if venue else ''}
            </table>
            
            <p>This NOC is issued based on the request of the applicant and is valid for the specific purpose mentioned above.</p>
            
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>Note:</strong> This certificate does not exempt the holder from any statutory requirements or obligations.
            </p>
        </div>
        
        <div class="signature-section" style="margin-top: 60px;">
            <div>
                <p>Date: {current_date}</p>
                <p>Place: {institution.address.split(',')[0] if institution and institution.address else ''}</p>
            </div>
            <div class="signature-block">
                <div class="official-seal">OFFICIAL<br/>SEAL</div>
                <div class="signature-line" style="margin-top: 20px;">
                    <p class="name">Authorized Signatory</p>
                    <p>{institution.name if institution else ''}</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_recommendation_letter(template, form_data, user, institution, current_date, ref_number):
    """Generate Letter of Recommendation"""
    
    purpose = form_data.get('purpose', form_data.get('lorPurpose', 'higher studies'))
    relationship = form_data.get('relationship', 'student')
    duration = form_data.get('duration', form_data.get('knowingSince', ''))
    qualities = form_data.get('qualities', form_data.get('strengths', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">LOR</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>LETTER OF RECOMMENDATION</h2>
        </div>
        
        <div class="doc-ref">
            <span>Reference: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="address-block">
            <p><strong>To Whom It May Concern</strong></p>
        </div>
        
        <div class="doc-body">
            <p style="text-indent: 0;">Dear Sir/Madam,</p>
            
            <p>I am pleased to write this letter of recommendation for <strong>{user.first_name} {user.last_name}</strong> 
            who has been associated with {institution.name if institution else 'our institution'} as a {relationship}.</p>
            
            <table class="details-table" style="margin: 25px 0;">
                <tr>
                    <td>Candidate Name</td>
                    <td><strong>{user.first_name} {user.last_name}</strong></td>
                </tr>
                <tr>
                    <td>Purpose of Recommendation</td>
                    <td>{purpose}</td>
                </tr>
                {f'<tr><td>Duration of Association</td><td>{duration}</td></tr>' if duration else ''}
            </table>
            
            {f'<p>During this time, I have observed that {user.first_name} possesses the following notable qualities: <strong>{qualities}</strong></p>' if qualities else ''}
            
            <p>Based on my experience and observations, I strongly recommend {user.first_name} for {purpose}. 
            I am confident that they will prove to be a valuable addition to any organization or academic institution.</p>
            
            <p>Please feel free to contact me if you require any further information.</p>
            
            <p>Best Regards,</p>
        </div>
        
        <div class="signature-section" style="margin-top: 40px;">
            <div></div>
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">_____________________</p>
                    <p>Recommending Authority</p>
                    <p>{institution.name if institution else ''}</p>
                    <p style="font-size: 11px; color: #64748b;">Date: {current_date}</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_transcript(template, form_data, user, institution, current_date, ref_number):
    """Generate Academic Transcript Request"""
    
    purpose = form_data.get('purpose', 'official purposes')
    copies = form_data.get('copies', form_data.get('numberOfCopies', '1'))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">TRANSCRIPT</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>ACADEMIC TRANSCRIPT REQUEST</h2>
        </div>
        
        <div class="doc-ref">
            <span>Request No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body">
            <table class="details-table">
                <tr>
                    <td>Student Name</td>
                    <td><strong>{user.first_name} {user.last_name}</strong></td>
                </tr>
                <tr>
                    <td>Email</td>
                    <td>{user.email}</td>
                </tr>
                <tr>
                    <td>Purpose</td>
                    <td>{purpose}</td>
                </tr>
                <tr>
                    <td>Number of Copies</td>
                    <td>{copies}</td>
                </tr>
                <tr>
                    <td>Request Date</td>
                    <td>{current_date}</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">⏳ Pending Processing</span></td>
                </tr>
            </table>
            
            <p style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 30px;">
                <strong>Note:</strong> Academic transcripts will be prepared by the examination section and will be available within 5-7 working days.
            </p>
        </div>
        
        <div class="signature-section" style="margin-top: 50px;">
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">{user.first_name} {user.last_name}</p>
                    <p>Applicant Signature</p>
                </div>
            </div>
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">_____________________</p>
                    <p>Registrar / Controller of Examinations</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_fee_receipt(template, form_data, user, institution, current_date, ref_number):
    """Generate Fee Structure / Payment Document"""
    
    fee_type = form_data.get('feeType', form_data.get('paymentType', 'Tuition Fee'))
    amount = form_data.get('amount', form_data.get('feeAmount', ''))
    semester = form_data.get('semester', form_data.get('term', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">FEE</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>FEE STRUCTURE / PAYMENT DETAILS</h2>
        </div>
        
        <div class="doc-ref">
            <span>Receipt No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body">
            <table class="details-table">
                <tr>
                    <td>Student Name</td>
                    <td><strong>{user.first_name} {user.last_name}</strong></td>
                </tr>
                <tr>
                    <td>Email</td>
                    <td>{user.email}</td>
                </tr>
                <tr>
                    <td>Fee Type</td>
                    <td>{fee_type}</td>
                </tr>
                {f'<tr><td>Amount</td><td style="font-size: 18px; font-weight: bold; color: #1e3a5f;">₹ {amount}</td></tr>' if amount else ''}
                {f'<tr><td>Semester/Term</td><td>{semester}</td></tr>' if semester else ''}
                <tr>
                    <td>Status</td>
                    <td><span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">✓ Request Submitted</span></td>
                </tr>
            </table>
        </div>
        
        <div class="signature-section" style="margin-top: 50px;">
            <div>
                <p>Date: {current_date}</p>
            </div>
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">Accounts Section</p>
                    <p>{institution.name if institution else ''}</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_id_certificate(template, form_data, user, institution, current_date, ref_number):
    """Generate Identity Certificate"""
    
    purpose = form_data.get('purpose', 'identity verification')
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">ID CERT</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>IDENTITY CERTIFICATE</h2>
        </div>
        
        <div class="doc-ref">
            <span>Certificate No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body">
            <p style="text-indent: 0; text-align: center; font-size: 16px; margin: 30px 0;">
                This is to certify that the following person is associated with this institution:
            </p>
            
            <div style="display: flex; gap: 30px; margin: 30px 0; padding: 25px; background: #f8fafc; border-radius: 12px;">
                <div style="width: 120px; height: 150px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 12px;">
                    Photo<br/>Placeholder
                </div>
                <table class="details-table" style="flex: 1; margin: 0;">
                    <tr>
                        <td>Full Name</td>
                        <td><strong>{user.first_name} {user.last_name}</strong></td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>{user.email}</td>
                    </tr>
                    <tr>
                        <td>Role</td>
                        <td>{user.role.title()}</td>
                    </tr>
                    <tr>
                        <td>Purpose</td>
                        <td>{purpose}</td>
                    </tr>
                </table>
            </div>
            
            <p>This certificate is issued for the purpose of identity verification as requested.</p>
        </div>
        
        <div class="signature-section" style="margin-top: 50px;">
            <div>
                <p>Valid Until: {(datetime.now().replace(year=datetime.now().year + 1)).strftime('%d %B %Y')}</p>
            </div>
            <div class="signature-block">
                <div class="official-seal">OFFICIAL<br/>SEAL</div>
                <div class="signature-line" style="margin-top: 20px;">
                    <p class="name">Authorized Signatory</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_event_permission(template, form_data, user, institution, current_date, ref_number):
    """Generate Event Permission Document"""
    
    event_name = form_data.get('eventName', form_data.get('event', 'Event'))
    event_date = form_data.get('eventDate', form_data.get('date', ''))
    venue = form_data.get('venue', form_data.get('location', ''))
    participants = form_data.get('participants', form_data.get('expectedAttendees', ''))
    description = form_data.get('description', form_data.get('eventDescription', ''))
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">EVENT</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>EVENT PERMISSION REQUEST</h2>
        </div>
        
        <div class="doc-ref">
            <span>Request No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="address-block">
            <p><strong>To,</strong></p>
            <p>The Dean / Principal / Event Coordinator</p>
            <p>{institution.name if institution else 'Institution'}</p>
        </div>
        
        <div class="subject-line">
            <strong>Subject:</strong> Permission Request for Organizing Event
        </div>
        
        <div class="doc-body">
            <p style="text-indent: 0;">Respected Sir/Madam,</p>
            
            <p>I am writing to request permission to organize the following event:</p>
            
            <table class="details-table" style="margin: 25px 0;">
                <tr>
                    <td>Requested By</td>
                    <td><strong>{user.first_name} {user.last_name}</strong></td>
                </tr>
                <tr>
                    <td>Event Name</td>
                    <td><strong>{event_name}</strong></td>
                </tr>
                {f'<tr><td>Proposed Date</td><td>{event_date}</td></tr>' if event_date else ''}
                {f'<tr><td>Venue</td><td>{venue}</td></tr>' if venue else ''}
                {f'<tr><td>Expected Participants</td><td>{participants}</td></tr>' if participants else ''}
                {f'<tr><td>Event Description</td><td>{description}</td></tr>' if description else ''}
            </table>
            
            <p>I assure you that all necessary arrangements will be made and the event will be conducted in accordance with institutional guidelines.</p>
            
            <p>Kindly grant permission for the same.</p>
            
            <p>Thank you.</p>
        </div>
        
        <div class="signature-section" style="margin-top: 40px;">
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">{user.first_name} {user.last_name}</p>
                    <p>Applicant</p>
                </div>
            </div>
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">_____________________</p>
                    <p>Approved / Rejected By</p>
                    <p style="font-size: 11px;">Date: _______________</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """


def generate_generic_document(template, form_data, user, institution, current_date, ref_number):
    """Generate a generic document for unrecognized template types"""
    
    # Build professional form content with sections
    form_content = ''
    
    # Group fields for better presentation
    if template.fields:
        form_content = '<table class="details-table">'
        for field in template.fields:
            field_name = field.get('name')
            field_label = field.get('label')
            field_value = form_data.get(field_name, '')
            
            if field_value:
                if field.get('type') == 'textarea':
                    form_content += f"""
                    <tr>
                        <td colspan="2" style="background: #f8fafc;">
                            <strong style="display: block; margin-bottom: 8px; color: #1e3a5f;">{field_label}</strong>
                            <p style="margin: 0; white-space: pre-wrap;">{field_value}</p>
                        </td>
                    </tr>
                    """
                else:
                    form_content += f"""
                    <tr>
                        <td>{field_label}</td>
                        <td>{field_value}</td>
                    </tr>
                    """
        form_content += '</table>'
    
    return f"""
    {get_document_styles()}
    <div class="document-container" style="position: relative;">
        <div class="watermark">DOCUMENT</div>
        
        {generate_institution_header(institution)}
        
        <div class="doc-title">
            <h2>{template.name.upper()}</h2>
        </div>
        
        <div class="doc-ref">
            <span>Reference No: <strong>{ref_number}</strong></span>
            <span>Date: <strong>{current_date}</strong></span>
        </div>
        
        <div class="doc-body">
            <p style="text-indent: 0; margin-bottom: 25px;">
                Document generated for <strong>{user.first_name} {user.last_name}</strong> ({user.email})
            </p>
            
            {form_content if form_content else '<p>No additional details provided.</p>'}
        </div>
        
        <div class="signature-section" style="margin-top: 60px;">
            <div class="signature-block">
                <div class="signature-line">
                    <p class="name">{user.first_name} {user.last_name}</p>
                    <p>Applicant</p>
                    <p>Date: {current_date}</p>
                </div>
            </div>
            <div class="signature-block">
                <div class="official-seal">OFFICIAL<br/>SEAL</div>
                <div class="signature-line" style="margin-top: 20px;">
                    <p class="name">Authorized Signatory</p>
                    <p>{institution.name if institution else ''}</p>
                </div>
            </div>
        </div>
        
        {generate_document_footer(ref_number)}
    </div>
    """
