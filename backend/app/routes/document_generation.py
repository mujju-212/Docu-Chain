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
        
        # Get templates for user's role and institution
        # System templates (institution_id is null) are available to all
        # Institution-specific templates are only for that institution
        templates = DocumentTemplate.query.filter(
            DocumentTemplate.is_active == True,
            db.or_(
                DocumentTemplate.institution_id == None,  # Global templates
                DocumentTemplate.institution_id == user.institution_id  # Institution specific
            ),
            db.or_(
                DocumentTemplate.category == 'all',
                DocumentTemplate.category == user.role
            )
        ).order_by(DocumentTemplate.name).all()
        
        return jsonify({
            'success': True,
            'data': [t.to_dict() for t in templates]
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
    """Generate a new document from template"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        template_id = data.get('templateId')
        form_data = data.get('formData', {})
        
        template = DocumentTemplate.query.get(template_id)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Generate document content based on template
        institution = Institution.query.get(user.institution_id)
        generated_content = generate_document_content(template, form_data, user, institution)
        
        # Create document record
        doc = GeneratedDocument(
            request_id=generate_request_id(),
            template_id=template.id,
            template_name=template.name,
            requester_id=user.id,
            institution_id=user.institution_id,
            form_data=form_data,
            generated_content=generated_content,
            status='draft'
        )
        
        db.session.add(doc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': doc.to_dict_with_requester(),
            'message': 'Document generated successfully'
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
        
        if doc.status != 'draft':
            return jsonify({'success': False, 'error': 'Document already submitted'}), 400
        
        data = request.get_json() or {}
        recipient_ids = data.get('recipientIds', [])
        approval_type = data.get('approvalType', 'STANDARD').upper()
        
        if not recipient_ids:
            return jsonify({'success': False, 'error': 'At least one recipient is required'}), 400
        
        # Generate unique IDs for blockchain compatibility
        request_id = f"0x{hashlib.sha256(f'{doc.id}-{datetime.utcnow().timestamp()}'.encode()).hexdigest()}"
        document_id = f"0x{hashlib.sha256(f'{doc.id}'.encode()).hexdigest()}"
        
        # Create approval request
        approval_request = ApprovalRequest(
            request_id=request_id,
            document_id=document_id,
            verification_code=generate_verification_code(),
            document_name=doc.template.name if doc.template else 'Generated Document',
            document_ipfs_hash='pending',  # Will be set when uploaded
            requester_id=user.id,
            requester_wallet=user.wallet_address or 'pending',
            purpose=f"Generated {doc.template.name if doc.template else 'document'} request",
            process_type='SEQUENTIAL',
            approval_type=approval_type if approval_type in ['STANDARD', 'DIGITAL_SIGNATURE'] else 'STANDARD',
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
                    step_order=idx + 1,
                    approver_id=approver.id,
                    approver_wallet=approver.wallet_address or 'pending',
                    status='PENDING'
                )
                db.session.add(step)
        
        # Add history entry
        history = ApprovalHistory(
            request_id=approval_request.id,
            action='SUBMITTED',
            actor_id=user.id,
            details={
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
        
        total = GeneratedDocument.query.filter_by(requester_id=current_user_id).count()
        approved = GeneratedDocument.query.filter_by(requester_id=current_user_id, status='approved').count()
        pending = GeneratedDocument.query.filter_by(requester_id=current_user_id, status='pending').count()
        rejected = GeneratedDocument.query.filter_by(requester_id=current_user_id, status='rejected').count()
        drafts = GeneratedDocument.query.filter_by(requester_id=current_user_id, status='draft').count()
        
        return jsonify({
            'success': True,
            'data': {
                'total': total,
                'approved': approved,
                'pending': pending,
                'rejected': rejected,
                'drafts': drafts
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
    """Generate document HTML content based on template and form data"""
    
    # Get current date in proper format
    current_date = datetime.now().strftime('%d %B %Y')
    
    # Build institution header
    inst_header = f"""
    <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; color: #1e40af; font-weight: bold;">{institution.name if institution else 'Institution Name'}</h1>
        <p style="margin: 5px 0; color: #64748b; font-size: 14px;">{institution.address if institution and institution.address else 'Institution Address'}</p>
        <p style="margin: 5px 0; color: #64748b; font-size: 12px;">
            {f'Website: {institution.website}' if institution and institution.website else ''}
            {f' | Email: {institution.email}' if institution and institution.email else ''}
            {f' | Phone: {institution.phone}' if institution and institution.phone else ''}
        </p>
    </div>
    """
    
    # Build document title
    doc_title = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; text-decoration: underline;">
            {template.name}
        </h2>
        <p style="margin: 10px 0 0; color: #64748b; font-size: 12px;">Date: {current_date}</p>
    </div>
    """
    
    # Build form content
    form_content = '<div style="margin: 20px 0;">'
    
    for field in template.fields:
        field_name = field.get('name')
        field_label = field.get('label')
        field_value = form_data.get(field_name, '')
        
        if field.get('type') == 'textarea':
            form_content += f"""
            <div style="margin-bottom: 15px;">
                <p style="margin: 0; font-weight: 600; color: #374151; font-size: 14px;">{field_label}:</p>
                <p style="margin: 5px 0 0; color: #0f172a; font-size: 14px; line-height: 1.6;">{field_value}</p>
            </div>
            """
        else:
            form_content += f"""
            <div style="margin-bottom: 10px; display: flex;">
                <span style="font-weight: 600; color: #374151; font-size: 14px; min-width: 200px;">{field_label}:</span>
                <span style="color: #0f172a; font-size: 14px;">{field_value}</span>
            </div>
            """
    
    form_content += '</div>'
    
    # Build footer with signature area
    footer = f"""
    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Applicant's Signature</p>
            <p style="margin: 5px 0 0; font-size: 14px; font-weight: 600;">{user.first_name} {user.last_name}</p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">For Office Use Only</p>
            <p style="margin: 30px 0 0; font-size: 12px; color: #64748b;">Authorized Signatory</p>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">
            This document is generated digitally via DocuChain and will be verified through blockchain.
        </p>
    </div>
    """
    
    # Combine all parts
    full_content = f"""
    <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        {inst_header}
        {doc_title}
        {form_content}
        {footer}
    </div>
    """
    
    return full_content
