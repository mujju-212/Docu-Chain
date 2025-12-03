"""
Dashboard API Routes - Provides stats and data for dashboard
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.document import Document, DocumentShare
from app.models.folder import Folder
from app.models.approval import ApprovalRequest, ApprovalStep
from app.models.blockchain_transaction import BlockchainTransaction
from app.models.activity_log import ActivityLog
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
import uuid as uuid_module

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


def get_uuid_from_identity(identity):
    """Convert JWT identity to UUID object"""
    if isinstance(identity, uuid_module.UUID):
        return identity
    try:
        return uuid_module.UUID(str(identity))
    except (ValueError, AttributeError):
        return None


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics based on user role
    Returns different stats for admin, faculty, and student
    """
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        role = (user.role or 'student').lower()
        institution_id = user.institution_id
        
        stats = {}
        
        if role == 'admin':
            stats = get_admin_stats(institution_id)
        elif role == 'faculty':
            stats = get_faculty_stats(current_user_id, institution_id)
        else:
            stats = get_student_stats(current_user_id)
        
        return jsonify({
            'success': True,
            'role': role,
            'stats': stats
        }), 200
        
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


def get_admin_stats(institution_id):
    """Get stats for admin dashboard"""
    # User counts
    total_students = User.query.filter(
        User.institution_id == institution_id,
        User.role == 'student',
        User.status == 'active'
    ).count()
    
    total_faculty = User.query.filter(
        User.institution_id == institution_id,
        User.role == 'faculty',
        User.status == 'active'
    ).count()
    
    total_admins = User.query.filter(
        User.institution_id == institution_id,
        User.role == 'admin',
        User.status == 'active'
    ).count()
    
    # Get unique departments
    departments = db.session.query(func.count(func.distinct(User.department_id))).filter(
        User.institution_id == institution_id,
        User.department_id.isnot(None)
    ).scalar() or 0
    
    # Document counts - all documents in institution
    institution_user_ids = [u.id for u in User.query.filter_by(institution_id=institution_id).all()]
    
    total_documents = Document.query.filter(
        Document.owner_id.in_(institution_user_ids),
        Document.is_active == True
    ).count()
    
    # Approval counts
    approved_docs = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id.in_(institution_user_ids),
        ApprovalRequest.status == 'APPROVED'
    ).count()
    
    pending_docs = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id.in_(institution_user_ids),
        ApprovalRequest.status == 'PENDING'
    ).count()
    
    rejected_docs = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id.in_(institution_user_ids),
        ApprovalRequest.status == 'REJECTED'
    ).count()
    
    # Blockchain transactions
    blockchain_txs = BlockchainTransaction.query.filter(
        BlockchainTransaction.user_id.in_(institution_user_ids),
        BlockchainTransaction.status == 'confirmed'
    ).count()
    
    # Active users today
    today = datetime.utcnow().date()
    active_today = User.query.filter(
        User.institution_id == institution_id,
        func.date(User.last_login) == today
    ).count()
    
    # Pending account requests
    pending_accounts = User.query.filter(
        User.institution_id == institution_id,
        User.status == 'pending'
    ).count()
    
    # Total shares
    total_shares = DocumentShare.query.join(Document).filter(
        Document.owner_id.in_(institution_user_ids)
    ).count()
    
    # Growth stats (this month vs last month)
    this_month = datetime.utcnow().replace(day=1)
    last_month = (this_month - timedelta(days=1)).replace(day=1)
    
    new_students_this_month = User.query.filter(
        User.institution_id == institution_id,
        User.role == 'student',
        User.created_at >= this_month
    ).count()
    
    new_docs_this_month = Document.query.filter(
        Document.owner_id.in_(institution_user_ids),
        Document.created_at >= this_month
    ).count()
    
    # Calculate total users
    total_users = total_students + total_faculty + total_admins
    
    return {
        'users': {
            'total': total_users,
            'students': total_students,
            'faculty': total_faculty,
            'admins': total_admins,
            'totalStudents': total_students,
            'totalFaculty': total_faculty,
            'totalAdmins': total_admins,
            'departments': departments,
            'activeToday': active_today,
            'pendingAccounts': pending_accounts,
            'newStudentsThisMonth': new_students_this_month
        },
        'documents': {
            'total': total_documents,
            'approved': approved_docs,
            'pending': pending_docs,
            'rejected': rejected_docs,
            'newThisMonth': new_docs_this_month
        },
        'approvals': {
            'approved': approved_docs,
            'pending': pending_docs,
            'rejected': rejected_docs
        },
        'blockchain': {
            'totalTransactions': blockchain_txs,
            'transactions': blockchain_txs,
            'status': 'connected'
        },
        'sharing': {
            'totalShares': total_shares
        },
        'shares': {
            'total': total_shares
        }
    }


def get_faculty_stats(user_id, institution_id):
    """Get stats for faculty dashboard"""
    # My documents
    my_documents = Document.query.filter(
        Document.owner_id == user_id,
        Document.is_active == True
    ).count()
    
    # Pending approvals (documents waiting for my approval) - query ApprovalStep
    pending_approvals = db.session.query(ApprovalStep).join(ApprovalRequest).filter(
        ApprovalStep.approver_id == user_id,
        ApprovalStep.has_approved == False,
        ApprovalStep.has_rejected == False,
        ApprovalRequest.status == 'PENDING'
    ).count()
    
    # Approved by me - query ApprovalStep
    approved_by_me = ApprovalStep.query.filter(
        ApprovalStep.approver_id == user_id,
        ApprovalStep.has_approved == True
    ).count()
    
    # Rejected by me - query ApprovalStep
    rejected_by_me = ApprovalStep.query.filter(
        ApprovalStep.approver_id == user_id,
        ApprovalStep.has_rejected == True
    ).count()
    
    # Total approvals handled by me
    total_approvals = approved_by_me + rejected_by_me
    
    # My approval requests (as requester)
    my_pending_requests = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id == user_id,
        ApprovalRequest.status == 'PENDING'
    ).count()
    
    my_approved_requests = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id == user_id,
        ApprovalRequest.status == 'APPROVED'
    ).count()
    
    # Documents shared with me
    shared_with_me = DocumentShare.query.filter(
        DocumentShare.shared_with_id == user_id
    ).count()
    
    # Documents I shared
    my_doc_ids = [d.id for d in Document.query.filter_by(owner_id=user_id).all()]
    shared_by_me = DocumentShare.query.filter(
        DocumentShare.document_id.in_(my_doc_ids)
    ).count() if my_doc_ids else 0
    
    # Verified on blockchain
    verified_docs = Document.query.filter(
        Document.owner_id == user_id,
        Document.ipfs_hash.isnot(None),
        Document.is_active == True
    ).count()
    
    # Count students in institution (for faculty)
    student_count = User.query.filter(
        User.institution_id == institution_id,
        User.role == 'student',
        User.status == 'active'
    ).count()
    
    # Generated documents count (documents generated by faculty, not uploaded)
    generated_count = Document.query.filter(
        Document.owner_id == user_id,
        Document.is_active == True,
        Document.document_type == 'generated'
    ).count()
    
    return {
        'documents': {
            'total': my_documents,
            'myDocuments': my_documents,
            'shared_with_me': shared_with_me,
            'verifiedOnBlockchain': verified_docs
        },
        'approvals': {
            'pending': pending_approvals,
            'approved': approved_by_me,
            'rejected': rejected_by_me,
            'total': total_approvals,
            'pendingForMe': pending_approvals,
            'approvedByMe': approved_by_me,
            'rejectedByMe': rejected_by_me,
            'myPendingRequests': my_pending_requests,
            'myApprovedRequests': my_approved_requests
        },
        'students': {
            'count': student_count
        },
        'generated': {
            'count': generated_count
        },
        'sharing': {
            'sharedWithMe': shared_with_me,
            'sharedByMe': shared_by_me
        }
    }


def get_student_stats(user_id):
    """Get stats for student dashboard"""
    # My documents
    my_documents = Document.query.filter(
        Document.owner_id == user_id,
        Document.is_active == True
    ).count()
    
    # Verified on blockchain
    verified_docs = Document.query.filter(
        Document.owner_id == user_id,
        Document.ipfs_hash.isnot(None),
        Document.is_active == True
    ).count()
    
    # Generated documents (received certificates, etc.)
    generated_docs = Document.query.filter(
        Document.owner_id == user_id,
        Document.is_active == True,
        Document.document_type == 'generated'
    ).count()
    
    # My approval requests
    pending_requests = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id == user_id,
        ApprovalRequest.status == 'PENDING'
    ).count()
    
    approved_requests = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id == user_id,
        ApprovalRequest.status == 'APPROVED'
    ).count()
    
    rejected_requests = ApprovalRequest.query.filter(
        ApprovalRequest.requester_id == user_id,
        ApprovalRequest.status == 'REJECTED'
    ).count()
    
    # Documents shared with me
    shared_with_me = DocumentShare.query.filter(
        DocumentShare.shared_with_id == user_id
    ).count()
    
    # Documents I shared
    my_doc_ids = [d.id for d in Document.query.filter_by(owner_id=user_id).all()]
    shared_by_me = DocumentShare.query.filter(
        DocumentShare.document_id.in_(my_doc_ids)
    ).count() if my_doc_ids else 0
    
    return {
        'documents': {
            'total': my_documents,
            'myDocuments': my_documents,
            'shared_with_me': shared_with_me,
            'generated': generated_docs,
            'verifiedOnBlockchain': verified_docs
        },
        'approvals': {
            'pending': pending_requests,
            'approved': approved_requests,
            'rejected': rejected_requests
        },
        'shares': {
            'count': shared_by_me
        },
        'sharing': {
            'sharedWithMe': shared_with_me,
            'sharedByMe': shared_by_me
        }
    }


@bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Get recent activity for dashboard
    Returns uploads, shares, approvals, generated docs, etc.
    """
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        limit = request.args.get('limit', 10, type=int)
        role = (user.role or 'student').lower()
        
        activities = []
        
        if role == 'admin':
            # Admin sees institution-wide activity
            institution_user_ids = [u.id for u in User.query.filter_by(institution_id=user.institution_id).all()]
            
            activity_logs = ActivityLog.query.filter(
                ActivityLog.user_id.in_(institution_user_ids)
            ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
        else:
            # Regular users see their own activity
            activity_logs = ActivityLog.query.filter(
                ActivityLog.user_id == current_user_id
            ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
        
        for log in activity_logs:
            # Get user info
            log_user = User.query.get(log.user_id)
            user_name = 'Unknown User'
            if log_user:
                if log_user.first_name and log_user.last_name:
                    user_name = f"{log_user.first_name} {log_user.last_name}"
                else:
                    user_name = log_user.email.split('@')[0] if log_user.email else 'Unknown'
            
            # Format timestamp properly for frontend
            timestamp_str = None
            if log.created_at:
                timestamp_str = log.created_at.isoformat() + 'Z'
            
            activities.append({
                'id': str(log.id),
                'type': log.action_type,
                'activity_type': log.action_type,  # Frontend expects this
                'category': log.action_category,
                'description': log.description,
                'title': log.description,  # Frontend uses this too
                'targetName': log.target_name,
                'targetType': log.target_type,
                'user': user_name,
                'userId': str(log.user_id),
                'timestamp': timestamp_str,
                'created_at': timestamp_str,  # Frontend expects this
                'status': log.status
            })
        
        return jsonify({
            'success': True,
            'activities': activities
        }), 200
        
    except Exception as e:
        print(f"Error getting recent activity: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
