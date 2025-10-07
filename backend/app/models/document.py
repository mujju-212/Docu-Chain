from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = db.Column(db.String(66), unique=True, nullable=False)  # Blockchain document ID
    ipfs_hash = db.Column(db.String(100), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    document_type = db.Column(db.String(50))
    
    # Owner information
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', back_populates='documents')
    owner_address = db.Column(db.String(42), nullable=False)
    
    # Blockchain information
    transaction_hash = db.Column(db.String(66), nullable=False)
    block_number = db.Column(db.Integer)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_in_trash = db.Column(db.Boolean, default=False)
    trash_date = db.Column(db.DateTime)
    
    # Timestamps
    timestamp = db.Column(db.BigInteger, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shares = db.relationship('DocumentShare', back_populates='document', lazy='dynamic')
    versions = db.relationship('DocumentVersion', back_populates='document', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'documentId': self.document_id,
            'ipfsHash': self.ipfs_hash,
            'fileName': self.file_name,
            'fileSize': self.file_size,
            'documentType': self.document_type,
            'ownerId': self.owner_id,
            'ownerAddress': self.owner_address,
            'transactionHash': self.transaction_hash,
            'blockNumber': self.block_number,
            'isActive': self.is_active,
            'isInTrash': self.is_in_trash,
            'timestamp': self.timestamp,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'ipfsUrl': f"https://gateway.pinata.cloud/ipfs/{self.ipfs_hash}"
        }


class DocumentShare(db.Model):
    __tablename__ = 'document_shares'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=False)
    shared_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    shared_with_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    permission = db.Column(db.String(20), nullable=False)  # read, write
    
    # Blockchain information
    transaction_hash = db.Column(db.String(66))
    block_number = db.Column(db.Integer)
    
    # Timestamps
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    document = db.relationship('Document', back_populates='shares')
    # shared_with_user = db.relationship('User', back_populates='shared_documents', foreign_keys=[shared_with_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'documentId': self.document_id,
            'sharedById': self.shared_by_id,
            'sharedWithId': self.shared_with_id,
            'permission': self.permission,
            'transactionHash': self.transaction_hash,
            'sharedAt': self.shared_at.isoformat() if self.shared_at else None
        }


class DocumentVersion(db.Model):
    __tablename__ = 'document_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    ipfs_hash = db.Column(db.String(100), nullable=False)
    transaction_hash = db.Column(db.String(66))
    description = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    document = db.relationship('Document', back_populates='versions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'documentId': self.document_id,
            'versionNumber': self.version_number,
            'ipfsHash': self.ipfs_hash,
            'transactionHash': self.transaction_hash,
            'description': self.description,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'ipfsUrl': f"https://gateway.pinata.cloud/ipfs/{self.ipfs_hash}"
        }
