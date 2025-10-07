from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Institution(db.Model):
    __tablename__ = 'institutions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=False)  # school, university, college, coaching
    unique_id = db.Column(db.String(50), unique=True, nullable=False)
    
    # Contact information
    address = db.Column(db.Text)
    website = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    
    # Status and approval
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', back_populates='institution', lazy='dynamic')
    departments = db.relationship('Department', back_populates='institution', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'unique_id': self.unique_id,
            'address': self.address,
            'website': self.website,
            'email': self.email,
            'phone': self.phone,
            'status': self.status,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Institution {self.name}>'


class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'), nullable=False)
    head_of_department_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    institution = db.relationship('Institution', back_populates='departments')
    sections = db.relationship('Section', back_populates='department', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'institutionId': self.institution_id,
            'headOfDepartmentId': self.head_of_department_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Section(db.Model):
    __tablename__ = 'sections'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    class_teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    department = db.relationship('Department', back_populates='sections')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'departmentId': self.department_id,
            'classTeacherId': self.class_teacher_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
