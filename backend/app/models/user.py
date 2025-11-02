from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unique_id = db.Column(db.String(50), nullable=False)  # Student/Faculty/Admin ID
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, faculty, student
    
    # Institution relationship
    institution_id = db.Column(UUID(as_uuid=True), db.ForeignKey('institutions.id'), nullable=False)
    institution = db.relationship('Institution', back_populates='users')
    
    # Profile information
    phone = db.Column(db.String(20))
    department_id = db.Column(UUID(as_uuid=True), db.ForeignKey('departments.id'))
    section_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sections.id'))
    
    # Wallet information
    wallet_address = db.Column(db.String(42))
    
    # User preferences
    theme = db.Column(db.String(20), default='green')  # green, blue, purple, orange, pink, teal, red
    
    # Account status
    status = db.Column(db.String(20), default='active')  # pending, approved, rejected, banned, active
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    documents = db.relationship('Document', back_populates='owner', lazy='dynamic')
    folders = db.relationship('Folder', back_populates='owner', lazy='dynamic')
    # shared_documents = db.relationship('DocumentShare', back_populates='shared_with_user', lazy='dynamic')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'role': self.role,
            'institutionId': str(self.institution_id),
            'departmentId': str(self.department_id) if self.department_id else None,
            'sectionId': str(self.section_id) if self.section_id else None,
            'phone': self.phone,
            'uniqueId': self.unique_id,
            'walletAddress': self.wallet_address,
            'theme': self.theme,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'lastLogin': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'
