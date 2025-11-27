from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Folder(db.Model):
    __tablename__ = 'folders'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Hierarchy
    parent_id = db.Column(UUID(as_uuid=True), db.ForeignKey('folders.id'), nullable=True)
    path = db.Column(db.String(1000), nullable=False)  # Full path like /folder1/subfolder
    level = db.Column(db.Integer, default=0)
    
    # Owner information
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', back_populates='folders')
    
    # Permissions
    is_public = db.Column(db.Boolean, default=False)
    is_shared = db.Column(db.Boolean, default=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_in_trash = db.Column(db.Boolean, default=False)
    is_starred = db.Column(db.Boolean, default=False)
    is_system_folder = db.Column(db.Boolean, default=False)  # Protected system folders
    trash_date = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship for hierarchy
    children = db.relationship('Folder', 
                              backref=db.backref('parent', remote_side=[id]),
                              lazy='dynamic',
                              cascade='all, delete-orphan')
    
    # Relationships
    documents = db.relationship('Document', back_populates='folder', lazy='dynamic')
    shares = db.relationship('FolderShare', back_populates='folder', lazy='dynamic')
    
    def to_dict(self, include_children=False):
        try:
            # Safely count documents and subfolders
            document_count = 0
            subfolder_count = 0
            
            # Check if this folder is under the "Shared" parent folder
            is_under_shared = False
            if self.parent_id:
                try:
                    from app import db
                    parent = db.session.get(Folder, self.parent_id)
                    is_under_shared = parent and parent.name == 'Shared'
                except:
                    pass
            
            # Special handling for "Received" folder under Shared - count documents shared WITH owner
            if self.name == 'Received' and is_under_shared:
                try:
                    from app.models.document import DocumentShare, Document
                    from app import db
                    # Count documents shared with this folder's owner
                    document_count = db.session.query(db.func.count(Document.id)).join(
                        DocumentShare, Document.id == DocumentShare.document_id
                    ).filter(
                        DocumentShare.shared_with_id == self.owner_id,
                        Document.is_active == True
                    ).scalar() or 0
                except Exception as e:
                    print(f"Error counting shared documents for Received folder: {e}")
                    document_count = 0
            
            # Special handling for "Sent" folder under Shared - count documents shared BY owner
            elif self.name == 'Sent' and is_under_shared:
                try:
                    from app.models.document import DocumentShare, Document
                    from app import db
                    # Count documents shared by this folder's owner
                    document_count = db.session.query(db.func.count(Document.id)).join(
                        DocumentShare, Document.id == DocumentShare.document_id
                    ).filter(
                        DocumentShare.shared_by_id == self.owner_id,
                        Document.is_active == True
                    ).scalar() or 0
                except Exception as e:
                    print(f"Error counting shared documents for Sent folder: {e}")
                    document_count = 0
            
            else:
                # Normal folder - count documents in this folder
                try:
                    document_count = self.documents.filter_by(is_active=True, is_in_trash=False).count()
                except Exception:
                    # If relationship fails, query directly
                    from app import db
                    document_count = db.session.query(db.func.count('*')).filter(
                        db.text("folder_id = :folder_id AND is_active = true AND is_in_trash = false")
                    ).params(folder_id=str(self.id)).scalar() or 0
            
            try:
                subfolder_count = self.children.filter_by(is_active=True, is_in_trash=False).count()
            except Exception:
                # If relationship fails, count directly
                from app import db
                subfolder_count = db.session.query(db.func.count('*')).select_from(db.text('folders')).filter(
                    db.text("parent_id = :parent_id AND is_active = true AND is_in_trash = false")
                ).params(parent_id=str(self.id)).scalar() or 0
            
            result = {
                'id': str(self.id),
                'name': self.name,
                'description': self.description,
                'parentId': str(self.parent_id) if self.parent_id else None,
                'path': self.path,
                'level': self.level,
                'ownerId': str(self.owner_id),
                'isPublic': self.is_public,
                'isShared': self.is_shared,
                'isActive': self.is_active,
                'isInTrash': self.is_in_trash,
                'isStarred': self.is_starred,
                'isSystemFolder': self.is_system_folder,  # Protected system folders
                'trashDate': self.trash_date.isoformat() if self.trash_date else None,
                'createdAt': self.created_at.isoformat() if self.created_at else None,
                'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
                'documentCount': document_count,
                'subfolderCount': subfolder_count
            }
            
            if include_children:
                try:
                    result['children'] = [child.to_dict() for child in 
                                        self.children.filter_by(is_active=True, is_in_trash=False)]
                    result['documents'] = [doc.to_dict() for doc in 
                                         self.documents.filter_by(is_active=True, is_in_trash=False)]
                except Exception:
                    result['children'] = []
                    result['documents'] = []
            
            return result
        except Exception as e:
            # Fallback for any issues
            return {
                'id': str(self.id),
                'name': self.name,
                'description': self.description or '',
                'parentId': str(self.parent_id) if self.parent_id else None,
                'path': self.path or '/',
                'level': self.level or 0,
                'ownerId': str(self.owner_id),
                'isPublic': False,
                'isShared': False,
                'isActive': True,
                'isInTrash': False,
                'isSystemFolder': self.is_system_folder,  # Protected system folders
                'trashDate': None,
                'createdAt': self.created_at.isoformat() if self.created_at else None,
                'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
                'documentCount': 0,
                'subfolderCount': 0
            }
    
    def get_full_path(self):
        """Get the complete path from root to this folder"""
        if self.parent_id is None:
            return f"/{self.name}"
        else:
            parent = Folder.query.get(self.parent_id)
            return f"{parent.get_full_path()}/{self.name}"
    
    def update_children_paths(self):
        """Update paths of all children when this folder's path changes"""
        new_path = self.get_full_path()
        self.path = new_path
        
        for child in self.children:
            child.update_children_paths()


class FolderShare(db.Model):
    __tablename__ = 'folder_shares'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    folder_id = db.Column(UUID(as_uuid=True), db.ForeignKey('folders.id'), nullable=False)
    shared_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    shared_with_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    permission = db.Column(db.String(20), nullable=False)  # read, write, admin
    
    # Timestamps
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    folder = db.relationship('Folder', back_populates='shares')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'folderId': str(self.folder_id),
            'sharedById': str(self.shared_by_id),
            'sharedWithId': str(self.shared_with_id),
            'permission': self.permission,
            'sharedAt': self.shared_at.isoformat() if self.shared_at else None,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None
        }


class BlockchainTransaction(db.Model):
    __tablename__ = 'blockchain_transactions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_hash = db.Column(db.String(66), unique=True, nullable=False)
    block_number = db.Column(db.Integer)
    transaction_type = db.Column(db.String(50), nullable=False)  # file_upload, file_share, etc.
    
    # Related entities
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Transaction details
    gas_used = db.Column(db.BigInteger)
    gas_price = db.Column(db.BigInteger)
    transaction_fee = db.Column(db.String(50))  # In ETH
    
    # IPFS information (if applicable)
    ipfs_hash = db.Column(db.String(100))
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.BigInteger)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, failed
    error_message = db.Column(db.Text)
    
    # Timestamps
    initiated_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    
    # Relationships
    document = db.relationship('Document', backref='transactions')
    user = db.relationship('User', backref='blockchain_transactions')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'transactionHash': self.transaction_hash,
            'blockNumber': self.block_number,
            'transactionType': self.transaction_type,
            'documentId': str(self.document_id) if self.document_id else None,
            'userId': str(self.user_id),
            'gasUsed': self.gas_used,
            'gasPrice': self.gas_price,
            'transactionFee': self.transaction_fee,
            'ipfsHash': self.ipfs_hash,
            'fileName': self.file_name,
            'fileSize': self.file_size,
            'status': self.status,
            'errorMessage': self.error_message,
            'initiatedAt': self.initiated_at.isoformat() if self.initiated_at else None,
            'confirmedAt': self.confirmed_at.isoformat() if self.confirmed_at else None
        }