from flask import Blueprint, request, jsonify
from app import db
from app.models import User, ApprovalRequest, ApprovalStep, ApprovedDocument, ApprovalHistory
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_
from uuid import UUID
import logging

bp = Blueprint('approvals', __name__)
logger = logging.getLogger(__name__)

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
            metadata=data.get('metadata')
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
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@bp.route('/approve/<request_id>', methods=['POST'])
@jwt_required()
def approve_document(request_id):
    """Approve document"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.query.get(current_user_id)
        approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
        step = ApprovalStep.query.filter_by(blockchain_request_id=request_id, approver_id=current_user_id).first()
        
        if not all([user, approval_request, step]):
            return jsonify({'error': 'Not found'}), 404
        
        step.has_approved = True
        step.action_timestamp = int(datetime.utcnow().timestamp())
        step.reason = data.get('reason', '')
        step.blockchain_tx_hash = data.get('blockchainTxHash')
        
        all_steps = ApprovalStep.query.filter_by(blockchain_request_id=request_id).all()
        approved = sum(1 for s in all_steps if s.has_approved)
        
        if approved == len(all_steps):
            approval_request.status = 'APPROVED'
            approval_request.completed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/reject/<request_id>', methods=['POST'])
@jwt_required()
def reject_document(request_id):
    """Reject document"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('reason'):
            return jsonify({'error': 'Reason required'}), 400
        
        user = User.query.get(current_user_id)
        approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
        step = ApprovalStep.query.filter_by(blockchain_request_id=request_id, approver_id=current_user_id).first()
        
        if not all([user, approval_request, step]):
            return jsonify({'error': 'Not found'}), 404
        
        step.has_rejected = True
        step.action_timestamp = int(datetime.utcnow().timestamp())
        step.reason = data['reason']
        step.blockchain_tx_hash = data.get('blockchainTxHash')
        
        approval_request.status = 'REJECTED'
        approval_request.completed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'success': True, 'data': approval_request.to_dict_detailed()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/status/<request_id>', methods=['GET'])
@jwt_required()
def get_approval_status(request_id):
    """Get status"""
    approval_request = ApprovalRequest.query.filter_by(request_id=request_id).first()
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
