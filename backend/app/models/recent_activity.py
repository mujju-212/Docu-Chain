"""
Recent Activity Model - Tracks user file activities
"""
from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

class RecentActivity(db.Model):
    """Model for tracking recent file activities"""
    __tablename__ = 'recent_activity'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    file_id = db.Column(db.String(255))  # Can be document UUID or folder ID string
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), default='file')
    action = db.Column(db.String(50), nullable=False)  # uploaded, opened, updated, etc.
    file_size = db.Column(db.String(50))
    owner = db.Column(db.String(100))
    document_id = db.Column(db.String(255))  # Document UUID as string
    ipfs_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('recent_activities', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'fileId': self.file_id,
            'name': self.file_name,
            'type': self.file_type,
            'action': self.action,
            'size': self.file_size,
            'owner': self.owner,
            'documentId': self.document_id,
            'ipfsHash': self.ipfs_hash,
            'time': self.created_at.isoformat() if self.created_at else None,
            'modified': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<RecentActivity {self.file_name} - {self.action}>'
