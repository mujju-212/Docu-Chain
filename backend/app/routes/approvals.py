from flask import Blueprint, request, jsonify
from app import db
from app.models import User, ApprovalRequest, ApprovalStep, ApprovedDocument, ApprovalHistory
from app.models.approval import generate_verification_code
from app.services.pdf_stamping import pdf_stamping_service
from app.services.approval_folder_service import approval_folder_service
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_
from uuid import UUID
import logging
import requests as http_requests

bp = Blueprint('approvals', __name__)
logger = logging.getLogger(__name__)

def send_approval_request_chat_message(sender_id, recipient_id, approval_request, document):
    """Send an auto-generated chat message when an approval is requested"""
    try:
        from app.routes.chat import create_approval_request_message
        create_approval_request_message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            approval_request={
                'id': str(approval_request.id),
                'requestId': approval_request.request_id
            },
            document={
                'id': None,  # document_id is UUID, not blockchain ID
                'blockchain_document_id': approval_request.document_id,  # This is the blockchain bytes32 ID
                'name': approval_request.document_name,
                'ipfs_hash': approval_request.document_ipfs_hash,
                'size': approval_request.document_file_size
            }
        )
    except Exception as e:
        logger.warning(f"Failed to send chat message for approval request: {e}")

# ========== CREATE APPROVAL REQUEST ==========

@bp.route('/request', methods=['POST'])
@jwt_required()
def create_approval_request():
    """Create a new approval request after blockchain transaction"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['requestId', 'documentId', 'documentName', 'documentIpfsHash', 
                          'requesterWallet', 'approvers', 'processType', 'approvalType', 
                          'priority', 'blockchainTxHash']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get current user
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate unique verification code
        verification_code = generate_verification_code()
        
        # Create approval request
        approval_request = ApprovalRequest(
            request_id=data['requestId'],
            document_id=data['documentId'],
            document_name=data['documentName'],
            document_ipfs_hash=data['documentIpfsHash'],
            document_file_size=data.get('documentFileSize'),
            document_file_type=data.get('documentFileType'),
            requester_id=current_user_id,
            requester_wallet=data['requesterWallet'],
            purpose=data.get('purpose', ''),
            version=data.get('version', 'v1.0'),
            process_type=data['processType'],
            approval_type=data['approvalType'],
            priority=data['priority'],
            status='PENDING',
            is_active=True,
            expiry_timestamp=data.get('expiryTimestamp', 0),
            submitted_at=datetime.utcnow(),
            blockchain_tx_hash=data['blockchainTxHash'],
            institution_id=user.institution_id,
            metadata=data.get('metadata'),
            verification_code=verification_code
        )
        
        db.session.add(approval_request)
        db.session.flush()
        
        # Create approval steps
        for approver_data in data['approvers']:
            # Get user by ID if provided, otherwise try wallet
            approver_user = None
            if 'userId' in approver_data:
                try:
                    # Convert string UUID to UUID object if needed
                    user_id = approver_data['userId']
                    if isinstance(user_id, str):
                        user_id = UUID(user_id)
                    approver_user = User.query.get(user_id)
                    logger.info(f"Found user by ID: {approver_user.name if approver_user else 'Not found'}")
                except Exception as e:
                    logger.error(f"Error finding user by ID: {e}")
            
            if not approver_user and 'wallet' in approver_data:
                approver_user = User.query.filter_by(wallet_address=approver_data['wallet']).first()
                logger.info(f"Found user by wallet: {approver_user.name if approver_user else 'Not found'}")
            
            if not approver_user:
                # Skip if user not found
                logger.warning(f"Approver not found: {approver_data}")
                continue
            
            step = ApprovalStep(
                request_id=approval_request.id,
                blockchain_request_id=data['requestId'],
                approver_id=approver_user.id,
                approver_wallet=approver_data.get('wallet', approver_user.wallet_address or '0x0000000000000000000000000000000000000000'),
                approver_role=approver_data.get('role', 'Approver'),
                step_order=approver_data.get('stepOrder', 1)
            )
            db.session.add(step)
        
        # Create history
        history = ApprovalHistory(
            request_id=approval_request.id,
            event_type='CREATED',
            event_description=f'Approval request created',
            actor_id=current_user_id,
            actor_wallet=data['requesterWallet'],
            new_status='PENDING',
            blockchain_tx_hash=data['blockchainTxHash']
        )
        db.session.add(history)
        
        db.session.commit()
        
        # Send chat messages to all approvers
        try:
            for step in ApprovalStep.query.filter_by(request_id=approval_request.id).all():
                send_approval_request_chat_message(
                    sender_id=current_user_id,
                    recipient_id=step.approver_id,
                    approval_request=approval_request,
                    document={'name': approval_request.document_name}
                )
            logger.info(f"Sent chat messages to approvers for request {approval_request.request_id}")
        except Exception as chat_error:
            logger.warning(f"Could not send chat messages: {chat_error}")
        
        # Add document reference to approval folders
        try:
            approval_folder_service.on_request_created(approval_request)
            logger.info(f"Added document to approval folders for request {approval_request.request_id}")
        except Exception as folder_error:
            logger.warning(f"Could not add to approval folders: {folder_error}")
        
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/approve/<request_id>', methods=['POST'])
@jwt_required()
def approve_document(request_id):
    """Approve document - supports both blockchain request_id and database UUID"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        is_legacy_request = data.get('isLegacyRequest', False)
        
        user = User.query.get(current_user_id)
        
        # Try to find approval request by blockchain request_id first
        approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
        step = ApprovalStep.query.filter_by(blockchain_request_id=request_id, approver_id=current_user_id).first()
        
        # If not found by blockchain ID, try finding by database UUID (automatic detection)
        if not approval_request:
            try:
                from uuid import UUID
                uuid_id = UUID(request_id)
                approval_request = ApprovalRequest.query.get(uuid_id)
                if approval_request:
                    # Find step by approval request ID
                    step = ApprovalStep.query.filter_by(request_id=approval_request.id, approver_id=current_user_id).first()
                    logger.info(f"Found approval request by UUID: {request_id}")
                    is_legacy_request = True  # Mark as legacy for step lookup later
            except (ValueError, AttributeError):
                logger.warning(f"Could not parse as UUID: {request_id}")
        
        if not all([user, approval_request, step]):
            logger.error(f"Approval not found - user: {user}, approval_request: {approval_request}, step: {step}")
            return jsonify({'error': 'Not found'}), 404
        
        # Check if this is a digital signature approval
        is_digital_signature = data.get('isDigitalSignature', False)
        digital_signature_data = data.get('digitalSignatureData')
        
        step.has_approved = True
        step.action_timestamp = int(datetime.utcnow().timestamp())
        step.reason = data.get('reason', '')
        step.blockchain_tx_hash = data.get('blockchainTxHash')
        
        # Store digital signature data if provided
        if is_digital_signature and digital_signature_data:
            step.signature_hash = data.get('signatureHash')  # The keccak256 hash of signature
        
        # Get all steps for this approval request
        # For legacy requests, look by request_id (database UUID)
        # For blockchain requests, look by blockchain_request_id
        if is_legacy_request:
            all_steps = ApprovalStep.query.filter_by(request_id=approval_request.id).all()
        else:
            all_steps = ApprovalStep.query.filter_by(blockchain_request_id=request_id).all()
            # If empty, fallback to request_id
            if not all_steps:
                all_steps = ApprovalStep.query.filter_by(request_id=approval_request.id).all()
        
        logger.info(f"📋 Found {len(all_steps)} approval steps for request")
        approved = sum(1 for s in all_steps if s.has_approved)
        
        if approved == len(all_steps):
            approval_request.status = 'APPROVED'
            approval_request.completed_at = datetime.utcnow()
            
            # Generate stamped PDF with QR code
            try:
                # Get approvers info for the stamp
                approvers_info = []
                for s in all_steps:
                    approver = User.query.get(s.approver_id)
                    if approver:
                        approver_info = {
                            'name': f"{approver.first_name} {approver.last_name}",
                            'role': s.approver_role or approver.role,
                            'timestamp': datetime.fromtimestamp(s.action_timestamp).isoformat() if s.action_timestamp else None,
                            'wallet_address': approver.wallet_address
                        }
                        # Add digital signature info if available
                        if hasattr(s, 'signature_hash') and s.signature_hash:
                            approver_info['signature_hash'] = s.signature_hash
                            approver_info['is_digital_signature'] = True
                        approvers_info.append(approver_info)
                
                # Prepare approval details for stamping
                approval_details = {
                    'verification_code': approval_request.verification_code,
                    'document_name': approval_request.document_name,
                    'approved_at': approval_request.completed_at.isoformat(),
                    'approvers': approvers_info,
                    'blockchain_tx': data.get('blockchainTxHash', approval_request.blockchain_tx_hash),
                    'approval_type': approval_request.approval_type,
                    'is_digital_signature': is_digital_signature
                }
                
                # Add digital signature data for embedding
                if is_digital_signature and digital_signature_data:
                    approval_details['digital_signature'] = {
                        'signature': digital_signature_data.get('signature'),
                        'signer_address': digital_signature_data.get('signerAddress'),
                        'timestamp': digital_signature_data.get('timestamp'),
                        'document_hash': digital_signature_data.get('documentHash'),
                        'verification_info': digital_signature_data.get('verificationInfo', {})
                    }
                
                # Generate stamped PDF
                logger.info(f"📄 Starting PDF stamping for document: {approval_request.document_name}")
                logger.info(f"📄 IPFS Hash: {approval_request.document_ipfs_hash}")
                logger.info(f"📄 Verification Code: {approval_request.verification_code}")
                logger.info(f"📄 Is Digital Signature: {is_digital_signature}")
                logger.info(f"📄 Approval Type from request: {approval_request.approval_type}")
                logger.info(f"📄 Digital Signature Data: {digital_signature_data}")
                
                # Use DIGITAL_SIGNATURE type if this is a digital signature approval
                effective_approval_type = 'DIGITAL_SIGNATURE' if is_digital_signature else approval_request.approval_type
                logger.info(f"📄 Effective Approval Type: {effective_approval_type}")
                
                stamped_pdf = pdf_stamping_service.stamp_pdf_from_url(
                    approval_request.document_ipfs_hash,
                    approval_details,
                    effective_approval_type
                )
                
                logger.info(f"📄 Stamped PDF result: {'Success' if stamped_pdf else 'Failed'}")
                
                if stamped_pdf:
                    # Upload stamped PDF to IPFS (Pinata)
                    from config import Config
                    pinata_jwt = Config.PINATA_JWT
                    
                    if pinata_jwt:
                        upload_url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
                        headers = {"Authorization": f"Bearer {pinata_jwt}"}
                        files = {
                            'file': (f"stamped_{approval_request.document_name}", stamped_pdf, 'application/pdf')
                        }
                        pinata_metadata = {
                            "name": f"Stamped_{approval_request.document_name}",
                            "keyvalues": {
                                "verification_code": approval_request.verification_code,
                                "original_hash": approval_request.document_ipfs_hash,
                                "type": "stamped_document"
                            }
                        }
                        import json
                        data_payload = {"pinataMetadata": json.dumps(pinata_metadata)}
                        
                        response = http_requests.post(upload_url, headers=headers, files=files, data=data_payload)
                        if response.status_code == 200:
                            ipfs_hash = response.json().get('IpfsHash')
                            approval_request.stamped_document_ipfs_hash = ipfs_hash
                            approval_request.stamped_at = datetime.utcnow()
                            logger.info(f"Stamped PDF uploaded to IPFS: {ipfs_hash}")
                        else:
                            logger.error(f"Failed to upload stamped PDF to IPFS: {response.text}")
                    else:
                        logger.warning("Pinata JWT not configured, skipping IPFS upload")
                else:
                    logger.warning("Failed to generate stamped PDF")
                    
            except Exception as stamp_error:
                # Log error but don't fail the approval
                logger.error(f"Error generating stamped PDF: {stamp_error}")
        
        db.session.commit()
        
        # Send chat message to requester about approval status
        try:
            from app.routes.chat import create_approval_status_message
            status_type = 'signed' if is_digital_signature else 'approved'
            create_approval_status_message(
                sender_id=current_user_id,
                recipient_id=approval_request.requester_id,
                approval_request={'id': str(approval_request.id)},
                document={
                    'id': None,  # document_id is UUID, not blockchain ID
                    'blockchain_document_id': approval_request.document_id,  # This is the blockchain bytes32 ID
                    'name': approval_request.document_name,
                    'ipfs_hash': approval_request.document_ipfs_hash or approval_request.stamped_document_ipfs_hash,
                    'size': approval_request.document_file_size
                },
                status=status_type,
                comment=data.get('reason', '')
            )
            logger.info(f"Sent approval status chat message to requester")
        except Exception as chat_error:
            logger.warning(f"Could not send approval status chat message: {chat_error}")
        
        # Update folder references
        try:
            # Update approver's folder (move to Approved)
            approval_folder_service.on_approved(approval_request, current_user_id)
            logger.info(f"Updated approval folders for approver {current_user_id}")
        except Exception as folder_error:
            logger.warning(f"Could not update approval folders: {folder_error}")
        
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/reject/<request_id>', methods=['POST'])
@jwt_required()
def reject_document(request_id):
    """Reject document - supports both blockchain request_id and database UUID"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        is_legacy_request = data.get('isLegacyRequest', False)
        
        if not data.get('reason'):
            return jsonify({'error': 'Reason required'}), 400
        
        user = User.query.get(current_user_id)
        approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
        step = ApprovalStep.query.filter_by(blockchain_request_id=request_id, approver_id=current_user_id).first()
        
        # If not found by blockchain ID, try finding by database UUID (automatic detection)
        if not approval_request:
            try:
                from uuid import UUID
                uuid_id = UUID(request_id)
                approval_request = ApprovalRequest.query.get(uuid_id)
                if approval_request:
                    step = ApprovalStep.query.filter_by(request_id=approval_request.id, approver_id=current_user_id).first()
                    logger.info(f"Found approval request for rejection by UUID: {request_id}")
            except (ValueError, AttributeError):
                logger.warning(f"Could not parse as UUID for rejection: {request_id}")
        
        if not all([user, approval_request, step]):
            return jsonify({'error': 'Not found'}), 404
        
        step.has_rejected = True
        step.action_timestamp = int(datetime.utcnow().timestamp())
        step.reason = data['reason']
        step.blockchain_tx_hash = data.get('blockchainTxHash')
        
        approval_request.status = 'REJECTED'
        approval_request.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send chat message to requester about rejection
        try:
            from app.routes.chat import create_approval_status_message
            create_approval_status_message(
                sender_id=current_user_id,
                recipient_id=approval_request.requester_id,
                approval_request={'id': str(approval_request.id)},
                document={
                    'id': None,  # document_id is UUID, not blockchain ID
                    'blockchain_document_id': approval_request.document_id,  # This is the blockchain bytes32 ID
                    'name': approval_request.document_name,
                    'ipfs_hash': approval_request.document_ipfs_hash,
                    'size': approval_request.document_file_size
                },
                status='rejected',
                comment=data.get('reason', '')
            )
            logger.info(f"Sent rejection status chat message to requester")
        except Exception as chat_error:
            logger.warning(f"Could not send rejection status chat message: {chat_error}")
        
        # Update folder references when rejected
        try:
            approval_folder_service.on_rejected(approval_request, current_user_id)
            logger.info(f"Updated approval folders on rejection")
        except Exception as folder_error:
            logger.warning(f"Could not update approval folders: {folder_error}")
        
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/cancel/<request_id>', methods=['POST'])
@jwt_required()
def cancel_document(request_id):
    """Cancel a pending approval request (only by the requester)"""
    try:
        current_user_id = get_jwt_identity()
        
        approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
        
        if not approval_request:
            return jsonify({'error': 'Approval request not found'}), 404
        
        # Only the requester can cancel
        if str(approval_request.requester_id) != str(current_user_id):
            return jsonify({'error': 'Only the requester can cancel this request'}), 403
        
        # Can only cancel pending requests
        if approval_request.status != 'PENDING':
            return jsonify({'error': 'Can only cancel pending requests'}), 400
        
        approval_request.status = 'CANCELLED'
        approval_request.completed_at = datetime.utcnow()
        
        # Create history entry
        history = ApprovalHistory(
            request_id=approval_request.id,
            event_type='CANCELLED',
            event_description='Approval request cancelled by requester',
            actor_id=current_user_id,
            new_status='CANCELLED'
        )
        db.session.add(history)
        
        db.session.commit()
        
        # Update folder references when canceled
        try:
            approval_folder_service.on_canceled(approval_request)
            logger.info(f"Updated approval folders on cancellation")
        except Exception as folder_error:
            logger.warning(f"Could not update approval folders: {folder_error}")
        
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/status/<request_id>', methods=['GET'])
@jwt_required()
def get_approval_status(request_id):
    """Get status - supports both blockchain request_id and database UUID"""
    # First try to find by blockchain request_id (0x format)
    approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
    
    # If not found and it looks like a UUID, try database ID
    if not approval_request:
        try:
            from uuid import UUID
            uuid_id = UUID(request_id)
            approval_request = ApprovalRequest.query.get(uuid_id)
            if approval_request:
                logger.info(f"Found approval request by database UUID: {request_id}")
        except (ValueError, AttributeError):
            pass
    
    if not approval_request:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200


@bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    """Get my sent requests"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Fetching requests for user: {current_user_id}")
        
        requests = ApprovalRequest.query.filter_by(requester_id=current_user_id).order_by(ApprovalRequest.created_at.desc()).all()
        logger.info(f"Found {len(requests)} requests")
        
        result = []
        for req in requests:
            try:
                req_dict = req.to_dict_detailed()
                result.append(req_dict)
            except Exception as e:
                logger.error(f"Error converting request {req.id} to dict: {e}")
                # Skip this request if conversion fails
                continue
        
        logger.info(f"Successfully converted {len(result)} requests")
        if result:
            logger.info(f"First request has {len(result[0].get('steps', []))} steps")
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.error(f"Error in get_my_requests: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """Get my approval tasks"""
    current_user_id = get_jwt_identity()
    logger.info(f"🔍 Getting tasks for user: {current_user_id}")
    
    steps = ApprovalStep.query.filter_by(approver_id=current_user_id).all()
    logger.info(f"📋 Found {len(steps)} approval steps for this user")
    
    request_ids = [s.request_id for s in steps]
    logger.info(f"📋 Request IDs: {request_ids}")
    
    requests = ApprovalRequest.query.filter(ApprovalRequest.id.in_(request_ids)).order_by(ApprovalRequest.created_at.desc()).all()
    logger.info(f"✅ Returning {len(requests)} approval requests")
    
    return jsonify({'success': True, 'data': [r.to_dict_detailed() for r in requests]}), 200


# ========== PUBLIC VERIFICATION ENDPOINT ==========

@bp.route('/verify/<verification_code>', methods=['GET'])
def verify_document(verification_code):
    """
    Public endpoint to verify a document by its verification code.
    No authentication required - this is meant to be accessed via QR code scan.
    """
    try:
        # Find the approval request by verification code
        approval_request = ApprovalRequest.query.filter_by(verification_code=verification_code).first()
        
        if not approval_request:
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'Invalid verification code',
                'message': 'No document found with this verification code.'
            }), 404
        
        # Get requester info
        requester = User.query.get(approval_request.requester_id)
        requester_info = {
            'name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
            'email': requester.email if requester else None,
            'institution': requester.institution.name if requester and requester.institution else None
        }
        
        # Get approval steps and approvers info
        steps = ApprovalStep.query.filter_by(request_id=approval_request.id).order_by(ApprovalStep.step_order).all()
        approvers_info = []
        for step in steps:
            approver = User.query.get(step.approver_id)
            approver_info = {
                'name': f"{approver.first_name} {approver.last_name}" if approver else 'Unknown',
                'role': step.approver_role or (approver.role if approver else 'Approver'),
                'has_approved': step.has_approved,
                'has_rejected': step.has_rejected,
                'action_timestamp': datetime.fromtimestamp(step.action_timestamp).isoformat() if step.action_timestamp else None,
                'reason': step.reason,
                'wallet_address': approver.wallet_address if approver else None,
                'signature_hash': step.signature_hash,
                'blockchain_tx_hash': step.blockchain_tx_hash
            }
            
            # Check if this is a digital signature (signature_hash is keccak256 of actual signature)
            if step.signature_hash and approval_request.approval_type == 'DIGITAL_SIGNATURE':
                approver_info['is_digital_signature'] = True
                approver_info['digital_signature'] = {
                    'signature_hash': step.signature_hash,
                    'signer_address': approver.wallet_address if approver else None,
                    'signed_at': datetime.fromtimestamp(step.action_timestamp).isoformat() if step.action_timestamp else None,
                    'tx_hash': step.blockchain_tx_hash,
                    'verification_method': 'ecrecover',
                    'verification_note': 'Signature can be verified by recovering the signer address using ecrecover'
                }
            
            approvers_info.append(approver_info)
        
        # Build verification response
        verification_data = {
            'verified': approval_request.status == 'APPROVED',
            'verification_code': verification_code,
            'document': {
                'name': approval_request.document_name,
                'ipfs_hash': approval_request.document_ipfs_hash,
                'stamped_ipfs_hash': approval_request.stamped_document_ipfs_hash,
                'file_type': approval_request.document_file_type,
                'file_size': approval_request.document_file_size
            },
            'approval': {
                'status': approval_request.status,
                'approval_type': approval_request.approval_type,
                'process_type': approval_request.process_type,
                'submitted_at': approval_request.submitted_at.isoformat() if approval_request.submitted_at else None,
                'completed_at': approval_request.completed_at.isoformat() if approval_request.completed_at else None,
                'stamped_at': approval_request.stamped_at.isoformat() if approval_request.stamped_at else None,
                'purpose': approval_request.purpose
            },
            'requester': requester_info,
            'approvers': approvers_info,
            'blockchain': {
                'request_id': approval_request.request_id,
                'tx_hash': approval_request.blockchain_tx_hash
            }
        }
        
        return jsonify({
            'success': True,
            'data': verification_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error verifying document: {e}")
        return jsonify({
            'success': False,
            'verified': False,
            'error': str(e)
        }), 500


# ========== VERIFY BY IPFS HASH ==========

@bp.route('/verify-by-hash/<ipfs_hash>', methods=['GET'])
@jwt_required()
def verify_by_ipfs_hash(ipfs_hash):
    """
    Verify a document by its IPFS hash.
    This finds the approval request associated with the document.
    """
    try:
        # Find the approval request by document IPFS hash
        approval_request = ApprovalRequest.query.filter_by(document_ipfs_hash=ipfs_hash).first()
        
        if not approval_request:
            return jsonify({
                'success': False,
                'error': 'No approval request found for this document'
            }), 404
        
        # Get requester info
        requester = User.query.get(approval_request.requester_id)
        requester_info = {
            'name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
            'email': requester.email if requester else None,
            'institution': requester.institution.name if requester and requester.institution else None
        }
        
        # Get approval steps
        steps = ApprovalStep.query.filter_by(request_id=approval_request.id).order_by(ApprovalStep.step_order).all()
        approvers_info = []
        for step in steps:
            approver = User.query.get(step.approver_id)
            approvers_info.append({
                'name': f"{approver.first_name} {approver.last_name}" if approver else 'Unknown',
                'role': step.approver_role or (approver.role if approver else 'Approver'),
                'has_approved': step.has_approved,
                'has_rejected': step.has_rejected,
                'action_timestamp': datetime.fromtimestamp(step.action_timestamp).isoformat() if step.action_timestamp else None,
                'reason': step.reason
            })
        
        # Build verification response
        verification_data = {
            'verified': approval_request.status == 'APPROVED',
            'verification_code': approval_request.verification_code,
            'document': {
                'name': approval_request.document_name,
                'ipfs_hash': approval_request.document_ipfs_hash,
                'stamped_ipfs_hash': approval_request.stamped_document_ipfs_hash,
                'file_type': approval_request.document_file_type,
                'file_size': approval_request.document_file_size
            },
            'approval': {
                'status': approval_request.status,
                'approval_type': approval_request.approval_type,
                'process_type': approval_request.process_type,
                'submitted_at': approval_request.submitted_at.isoformat() if approval_request.submitted_at else None,
                'completed_at': approval_request.completed_at.isoformat() if approval_request.completed_at else None,
                'stamped_at': approval_request.stamped_at.isoformat() if approval_request.stamped_at else None,
                'purpose': approval_request.purpose
            },
            'requester': requester_info,
            'approvers': approvers_info,
            'blockchain': {
                'request_id': approval_request.request_id,
                'tx_hash': approval_request.blockchain_tx_hash
            }
        }
        
        return jsonify({
            'success': True,
            'data': verification_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error verifying by IPFS hash: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== VERIFY FROM UPLOADED FILE ==========

@bp.route('/verify-file', methods=['POST'])
def verify_uploaded_file():
    """
    Verify a document by uploading the PDF file and extracting the verification code.
    This extracts the DCH code from the PDF text/metadata.
    This is a public endpoint - anyone can verify a document.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'success': False, 'error': 'Only PDF files are supported'}), 400
        
        # Try to extract verification code from PDF
        verification_code = None
        
        try:
            import PyPDF2
            import re
            import io
            
            # Read the PDF
            pdf_bytes = file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            
            # Search for verification code pattern in all pages
            code_pattern = r'DCH-\d{4}-[A-Z0-9]{6}'
            
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    match = re.search(code_pattern, text)
                    if match:
                        verification_code = match.group()
                        break
            
            # Also check PDF metadata
            if not verification_code and pdf_reader.metadata:
                for key, value in pdf_reader.metadata.items():
                    if value and isinstance(value, str):
                        match = re.search(code_pattern, value)
                        if match:
                            verification_code = match.group()
                            break
                            
        except Exception as pdf_error:
            logger.warning(f"Error reading PDF: {pdf_error}")
        
        if not verification_code:
            return jsonify({
                'success': False,
                'error': 'Could not find verification code in the PDF. Make sure this is a certified document with a DCH code.'
            }), 400
        
        # Now verify using the extracted code
        approval_request = ApprovalRequest.query.filter_by(verification_code=verification_code).first()
        
        if not approval_request:
            return jsonify({
                'success': False,
                'error': f'Verification code {verification_code} not found in our records.'
            }), 404
        
        # Get requester info
        requester = User.query.get(approval_request.requester_id)
        requester_info = {
            'name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
            'email': requester.email if requester else None,
            'institution': requester.institution.name if requester and requester.institution else None
        }
        
        # Get approval steps
        steps = ApprovalStep.query.filter_by(request_id=approval_request.id).order_by(ApprovalStep.step_order).all()
        approvers_info = []
        for step in steps:
            approver = User.query.get(step.approver_id)
            approvers_info.append({
                'name': f"{approver.first_name} {approver.last_name}" if approver else 'Unknown',
                'role': step.approver_role or (approver.role if approver else 'Approver'),
                'has_approved': step.has_approved,
                'has_rejected': step.has_rejected,
                'action_timestamp': datetime.fromtimestamp(step.action_timestamp).isoformat() if step.action_timestamp else None,
                'reason': step.reason
            })
        
        # Build verification response
        verification_data = {
            'verified': approval_request.status == 'APPROVED',
            'verification_code': verification_code,
            'document': {
                'name': approval_request.document_name,
                'ipfs_hash': approval_request.document_ipfs_hash,
                'stamped_ipfs_hash': approval_request.stamped_document_ipfs_hash,
                'file_type': approval_request.document_file_type,
                'file_size': approval_request.document_file_size
            },
            'approval': {
                'status': approval_request.status,
                'approval_type': approval_request.approval_type,
                'process_type': approval_request.process_type,
                'submitted_at': approval_request.submitted_at.isoformat() if approval_request.submitted_at else None,
                'completed_at': approval_request.completed_at.isoformat() if approval_request.completed_at else None,
                'stamped_at': approval_request.stamped_at.isoformat() if approval_request.stamped_at else None,
                'purpose': approval_request.purpose
            },
            'requester': requester_info,
            'approvers': approvers_info,
            'blockchain': {
                'request_id': approval_request.request_id,
                'tx_hash': approval_request.blockchain_tx_hash
            }
        }
        
        return jsonify({
            'success': True,
            'data': verification_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error verifying uploaded file: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
