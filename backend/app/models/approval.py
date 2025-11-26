from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import logging
import secrets
import string

def generate_verification_code():
    """Generate a unique verification code like DCH-2025-A7X9K3"""
    year = datetime.utcnow().year
    # Generate 6 character alphanumeric code (uppercase)
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(6))
    return f"DCH-{year}-{random_part}"

class ApprovalRequest(db.Model):
    __tablename__ = 'approval_requests'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Verification code for QR (generated at request creation)
    verification_code = db.Column(db.String(20), unique=True, nullable=True, index=True)
    
    # Blockchain data
    request_id = db.Column(db.String(66), unique=True, nullable=False)  # bytes32 from contract
    document_id = db.Column(db.String(66), nullable=False)  # bytes32 from contract
    blockchain_tx_hash = db.Column(db.String(66))  # Transaction hash
    
    # Document information
    document_name = db.Column(db.String(255), nullable=False)
    document_ipfs_hash = db.Column(db.String(255), nullable=False)
    document_file_size = db.Column(db.BigInteger)
    document_file_type = db.Column(db.String(50))
    
    # Stamped document (Version 2 - with QR and stamps)
    stamped_document_ipfs_hash = db.Column(db.String(255), nullable=True)
    stamped_at = db.Column(db.DateTime, nullable=True)
    
    # Request details
    requester_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    requester = db.relationship('User', foreign_keys=[requester_id], backref='approval_requests_created')
    requester_wallet = db.Column(db.String(42), nullable=False)
    purpose = db.Column(db.Text)
    version = db.Column(db.String(20), default='v1.0')
    
    # Approval configuration
    process_type = db.Column(db.String(20), nullable=False)  # SEQUENTIAL, PARALLEL
    approval_type = db.Column(db.String(20), nullable=False)  # STANDARD, DIGITAL_SIGNATURE
    priority = db.Column(db.String(20), nullable=False)  # LOW, NORMAL, HIGH, URGENT
    
    # Status tracking
    status = db.Column(db.String(20), nullable=False, default='PENDING')  # DRAFT, PENDING, PARTIAL, APPROVED, REJECTED, CANCELLED, EXPIRED
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    expiry_timestamp = db.Column(db.BigInteger)  # Unix timestamp (0 = no expiry)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional metadata
    request_metadata = db.Column(JSONB)
    
    # Institution reference
    institution_id = db.Column(UUID(as_uuid=True), db.ForeignKey('institutions.id', ondelete='CASCADE'))
    institution = db.relationship('Institution')
    
    # Relationships
    approval_steps = db.relationship('ApprovalStep', back_populates='request', lazy='dynamic', cascade='all, delete-orphan')
    approved_document = db.relationship('ApprovedDocument', back_populates='request', uselist=False, cascade='all, delete-orphan')
    history = db.relationship('ApprovalHistory', back_populates='request', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'requestId': self.request_id,
            'verificationCode': self.verification_code,
            'documentId': self.document_id,
            'documentName': self.document_name,
            'documentSize': self.document_file_size,  # Add this field for frontend
            'documentIpfsHash': self.document_ipfs_hash,
            'stampedDocumentIpfsHash': self.stamped_document_ipfs_hash,
            'stampedAt': self.stamped_at.isoformat() if self.stamped_at else None,
            'documentFileSize': self.document_file_size,
            'documentFileType': self.document_file_type,
            'requesterId': str(self.requester_id),
            'requesterWallet': self.requester_wallet,
            'purpose': self.purpose,
            'version': self.version,
            'processType': self.process_type,
            'approvalType': self.approval_type,
            'priority': self.priority,
            'status': self.status,
            'isActive': self.is_active,
            'expiryTimestamp': self.expiry_timestamp,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'submittedAt': self.submitted_at.isoformat() if self.submitted_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'blockchainTxHash': self.blockchain_tx_hash,
            'metadata': self.request_metadata
        }
    
    def to_dict_detailed(self):
        try:
            data = self.to_dict()
            # approval_steps is lazy='dynamic', so we need to call .all() to get the list
            steps = []
            try:
                steps = [step.to_dict() for step in self.approval_steps.all()]
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(f"Error loading approval steps: {e}")
            
            data['steps'] = steps
            
            # Add requester details
            if self.requester:
                department_name = None
                if self.requester.department_id:
                    try:
                        from app.models.institution import Department
                        dept = Department.query.get(self.requester.department_id)
                        if dept:
                            department_name = dept.name
                    except:
                        pass
                
                data['requester'] = {
                    'id': str(self.requester.id),
                    'firstName': self.requester.first_name,
                    'lastName': self.requester.last_name,
                    'name': f"{self.requester.first_name} {self.requester.last_name}",
                    'email': self.requester.email,
                    'department': department_name or 'N/A',
                    'departmentId': str(self.requester.department_id) if self.requester.department_id else None,
                    'role': self.requester.role
                }
            
            if self.approved_document:
                data['approvedDocument'] = self.approved_document.to_dict()
            
            return data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in to_dict_detailed: {e}")
            # Return basic dict if detailed fails
            return self.to_dict()


class ApprovalStep(db.Model):
    __tablename__ = 'approval_steps'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Link to approval request
    request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id', ondelete='CASCADE'), nullable=False)
    request = db.relationship('ApprovalRequest', back_populates='approval_steps')
    blockchain_request_id = db.Column(db.String(66), nullable=False)  # For blockchain lookup
    
    # Approver information
    approver_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    approver = db.relationship('User', foreign_keys=[approver_id], backref='approval_steps_assigned')
    approver_wallet = db.Column(db.String(42), nullable=False)
    approver_role = db.Column(db.String(100))  # e.g., "HOD", "Principal", "Dean"
    step_order = db.Column(db.Integer, nullable=False)  # For sequential: 1,2,3... For parallel: all same
    
    # Approval status
    has_approved = db.Column(db.Boolean, default=False)
    has_rejected = db.Column(db.Boolean, default=False)
    action_timestamp = db.Column(db.BigInteger)  # Unix timestamp from blockchain
    
    # Digital signature (optional)
    signature_hash = db.Column(db.String(66))  # bytes32 from contract
    
    # Reason/comment
    reason = db.Column(db.Text)
    
    # Blockchain transaction
    blockchain_tx_hash = db.Column(db.String(66))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        approver_data = {}
        try:
            if self.approver:
                # Get department name if department_id exists
                department_name = None
                if self.approver.department_id:
                    try:
                        from app.models.institution import Department
                        dept = Department.query.get(self.approver.department_id)
                        if dept:
                            department_name = dept.name
                    except:
                        pass
                
                approver_data = {
                    'id': str(self.approver.id),
                    'name': f"{self.approver.first_name} {self.approver.last_name}",
                    'email': self.approver.email,
                    'department': department_name or 'N/A',
                    'role': self.approver.role
                }
        except Exception as e:
            # If approver relation fails, just leave empty
            pass
        
        return {
            'id': str(self.id),
            'requestId': str(self.request_id),
            'blockchainRequestId': self.blockchain_request_id,
            'approverId': str(self.approver_id),
            'approver': approver_data,
            'approverWallet': self.approver_wallet,
            'approverRole': self.approver_role,
            'stepOrder': self.step_order,
            'hasApproved': self.has_approved,
            'hasRejected': self.has_rejected,
            'actionTimestamp': self.action_timestamp,
            'signatureHash': self.signature_hash,
            'reason': self.reason,
            'blockchainTxHash': self.blockchain_tx_hash,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class ApprovedDocument(db.Model):
    __tablename__ = 'approved_documents'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Link to approval request
    request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id', ondelete='CASCADE'), nullable=False)
    request = db.relationship('ApprovalRequest', back_populates='approved_document')
    blockchain_request_id = db.Column(db.String(66), unique=True, nullable=False)
    
    # Document references
    original_document_id = db.Column(db.String(66), nullable=False)  # Original document bytes32
    approved_document_id = db.Column(db.String(66), unique=True, nullable=False)  # New document bytes32
    
    # IPFS and verification
    original_ipfs_hash = db.Column(db.String(255), nullable=False)
    approved_ipfs_hash = db.Column(db.String(255), nullable=False)  # PDF with stamps
    document_hash = db.Column(db.String(66), nullable=False)  # SHA256 hash (bytes32)
    
    # QR Code data
    qr_code_data = db.Column(db.Text, nullable=False)  # JSON string
    qr_code_image_url = db.Column(db.Text)  # URL to QR code image
    
    # Approval details
    approval_timestamp = db.Column(db.BigInteger, nullable=False)  # Unix timestamp
    is_valid = db.Column(db.Boolean, default=True)
    
    # Blockchain transaction
    blockchain_tx_hash = db.Column(db.String(66))
    
    # Public verification
    public_verification_url = db.Column(db.Text)
    verification_code = db.Column(db.String(20), unique=True)  # Short code for verification
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    document_metadata = db.Column(JSONB)  # Stamps, signatures, etc.
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'requestId': str(self.request_id),
            'blockchainRequestId': self.blockchain_request_id,
            'originalDocumentId': self.original_document_id,
            'approvedDocumentId': self.approved_document_id,
            'originalIpfsHash': self.original_ipfs_hash,
            'approvedIpfsHash': self.approved_ipfs_hash,
            'documentHash': self.document_hash,
            'qrCodeData': self.qr_code_data,
            'qrCodeImageUrl': self.qr_code_image_url,
            'approvalTimestamp': self.approval_timestamp,
            'isValid': self.is_valid,
            'blockchainTxHash': self.blockchain_tx_hash,
            'publicVerificationUrl': self.public_verification_url,
            'verificationCode': self.verification_code,
            'metadata': self.document_metadata,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class ApprovalHistory(db.Model):
    __tablename__ = 'approval_history'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Link to approval request
    request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id', ondelete='CASCADE'), nullable=False)
    request = db.relationship('ApprovalRequest', back_populates='history')
    
    # Event details
    event_type = db.Column(db.String(50), nullable=False)  # CREATED, SUBMITTED, APPROVED, REJECTED, etc.
    event_description = db.Column(db.Text)
    
    # Actor information
    actor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    actor = db.relationship('User')
    actor_wallet = db.Column(db.String(42))
    actor_role = db.Column(db.String(100))
    
    # Status change
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    
    # Blockchain data
    blockchain_tx_hash = db.Column(db.String(66))
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Metadata
    history_metadata = db.Column(JSONB)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'requestId': str(self.request_id),
            'eventType': self.event_type,
            'eventDescription': self.event_description,
            'actorId': str(self.actor_id) if self.actor_id else None,
            'actorWallet': self.actor_wallet,
            'actorRole': self.actor_role,
            'oldStatus': self.old_status,
            'newStatus': self.new_status,
            'blockchainTxHash': self.blockchain_tx_hash,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'metadata': self.history_metadata
        }
