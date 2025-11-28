"""
Document Template Model
Templates for generating various institutional documents
"""
from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


class DocumentTemplate(db.Model):
    """Document templates for generating official documents"""
    __tablename__ = 'document_templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)  # student, faculty, admin, all
    icon = db.Column(db.String(50), default='📄')
    color = db.Column(db.String(20), default='#3b82f6')
    estimated_time = db.Column(db.String(20), default='5 min')
    
    # Template configuration
    fields = db.Column(JSONB, default=list)  # List of field definitions
    approval_chain = db.Column(JSONB, default=list)  # List of approvers
    
    # Institution specific (null = global template)
    institution_id = db.Column(UUID(as_uuid=True), db.ForeignKey('institutions.id'), nullable=True)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_system = db.Column(db.Boolean, default=False)  # System templates can't be deleted
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'icon': self.icon,
            'color': self.color,
            'estimatedTime': self.estimated_time,
            'fields': self.fields or [],
            'approvalChain': self.approval_chain or [],
            'institutionId': str(self.institution_id) if self.institution_id else None,
            'isActive': self.is_active,
            'isSystem': self.is_system,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class GeneratedDocument(db.Model):
    """Track generated documents"""
    __tablename__ = 'generated_documents'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = db.Column(db.String(50), unique=True, nullable=False)  # REQ-YYYY-MM-DD-XXX
    
    # Template reference
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('document_templates.id'), nullable=False)
    template_name = db.Column(db.String(255), nullable=False)
    
    # User information
    requester_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    institution_id = db.Column(UUID(as_uuid=True), db.ForeignKey('institutions.id'), nullable=False)
    
    # Document data
    form_data = db.Column(JSONB, nullable=False)  # Submitted form data
    generated_content = db.Column(db.Text)  # Generated document content/HTML
    
    # File references
    pdf_ipfs_hash = db.Column(db.String(100))  # Generated PDF stored on IPFS
    blockchain_tx_hash = db.Column(db.String(100))
    
    # Status
    status = db.Column(db.String(20), default='draft')  # draft, pending, approved, rejected, cancelled
    
    # Approval tracking
    current_approver_index = db.Column(db.Integer, default=0)
    approval_history = db.Column(JSONB, default=list)
    approval_request_id = db.Column(db.String(100))  # Link to ApprovalRequest
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    template = db.relationship('DocumentTemplate', backref='generated_documents')
    requester = db.relationship('User', backref='generated_documents', foreign_keys=[requester_id])
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'requestId': self.request_id,
            'templateId': str(self.template_id),
            'templateName': self.template_name,
            'requesterId': str(self.requester_id),
            'institutionId': str(self.institution_id),
            'formData': self.form_data,
            'generatedContent': self.generated_content,
            'pdfIpfsHash': self.pdf_ipfs_hash,
            'blockchainTxHash': self.blockchain_tx_hash,
            'status': self.status,
            'currentApproverIndex': self.current_approver_index,
            'approvalHistory': self.approval_history or [],
            'approvalRequestId': self.approval_request_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'submittedAt': self.submitted_at.isoformat() if self.submitted_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def to_dict_with_requester(self):
        data = self.to_dict()
        if self.requester:
            # Get department name if department_id exists
            dept_name = None
            if self.requester.department_id:
                from app.models.institution import Department
                dept = Department.query.get(self.requester.department_id)
                dept_name = dept.name if dept else None
            
            data['requester'] = {
                'id': str(self.requester.id),
                'name': f"{self.requester.first_name} {self.requester.last_name}",
                'email': self.requester.email,
                'role': self.requester.role,
                'department': dept_name
            }
        return data


def generate_request_id():
    """Generate unique request ID in format REQ-YYYY-MM-DD-XXX"""
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Get count of documents created today
    count = GeneratedDocument.query.filter(
        GeneratedDocument.request_id.like(f'REQ-{today}-%')
    ).count()
    
    return f'REQ-{today}-{str(count + 1).zfill(3)}'
