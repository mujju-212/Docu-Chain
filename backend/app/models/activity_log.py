"""
Activity Log Model - Comprehensive tracking of all user activities
This is an immutable audit trail - users can view but NOT edit/delete logs
"""
from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


class ActivityLog(db.Model):
    """Model for tracking all user activities - immutable audit trail"""
    __tablename__ = 'activity_logs'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User who performed the action
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    # Action categorization
    action_type = db.Column(db.String(50), nullable=False, index=True)
    # Types: 'login', 'logout', 'upload', 'download', 'view', 'delete', 'share', 
    #        'approve', 'reject', 'request_approval', 'profile_update', 'password_change',
    #        'folder_create', 'folder_delete', 'document_generate', 'blockchain_tx', etc.
    
    action_category = db.Column(db.String(50), nullable=False, index=True)
    # Categories: 'auth', 'document', 'folder', 'approval', 'share', 'profile', 
    #             'blockchain', 'chat', 'admin', 'system'
    
    # Human-readable description
    description = db.Column(db.Text, nullable=False)
    
    # Target of the action (optional)
    target_id = db.Column(db.String(255), nullable=True)  # UUID or ID of the target
    target_type = db.Column(db.String(50), nullable=True)  # 'document', 'folder', 'user', 'approval', etc.
    target_name = db.Column(db.String(500), nullable=True)  # Name/title for display
    
    # Additional data (JSONB for flexibility) - named extra_data to avoid SQLAlchemy reserved 'metadata'
    extra_data = db.Column(JSONB, default={})
    # Can store: old_value, new_value, file_size, ip_address, user_agent, etc.
    
    # IP and device info (for security)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    user_agent = db.Column(db.String(500), nullable=True)
    
    # Status of the action
    status = db.Column(db.String(20), default='success')  # 'success', 'failed', 'pending'
    
    # Timestamps - using server time
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('activity_logs', lazy='dynamic'))
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': str(self.id),
            'userId': str(self.user_id) if self.user_id else None,
            'actionType': self.action_type,
            'actionCategory': self.action_category,
            'description': self.description,
            'targetId': self.target_id,
            'targetType': self.target_type,
            'targetName': self.target_name,
            'metadata': self.extra_data or {},
            'ipAddress': self.ip_address,
            'userAgent': self.user_agent,
            'status': self.status,
            # Add 'Z' suffix to indicate UTC timezone for proper JavaScript parsing
            'createdAt': (self.created_at.isoformat() + 'Z') if self.created_at else None,
            # Formatted timestamp for display (in UTC)
            'formattedTime': self.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if self.created_at else None
        }
    
    @staticmethod
    def get_action_icon(action_type):
        """Get icon for action type (for frontend)"""
        icons = {
            'login': 'ri-login-box-line',
            'logout': 'ri-logout-box-line',
            'upload': 'ri-upload-cloud-2-line',
            'download': 'ri-download-cloud-2-line',
            'view': 'ri-eye-line',
            'delete': 'ri-delete-bin-line',
            'share': 'ri-share-line',
            'revoke_share': 'ri-link-unlink',
            'approve': 'ri-checkbox-circle-line',
            'reject': 'ri-close-circle-line',
            'request_approval': 'ri-file-list-3-line',
            'profile_update': 'ri-user-settings-line',
            'password_change': 'ri-lock-password-line',
            'folder_create': 'ri-folder-add-line',
            'folder_delete': 'ri-folder-reduce-line',
            'folder_rename': 'ri-folder-settings-line',
            'document_generate': 'ri-file-add-line',
            'blockchain_tx': 'ri-links-line',
            'message_send': 'ri-chat-3-line',
            'failed_login': 'ri-error-warning-line',
            'wallet_connect': 'ri-wallet-3-line'
        }
        return icons.get(action_type, 'ri-history-line')
    
    @staticmethod
    def get_category_color(category):
        """Get color for category (for frontend)"""
        colors = {
            'auth': '#6366f1',      # Indigo
            'document': '#10b981',   # Green
            'folder': '#f59e0b',     # Amber
            'approval': '#8b5cf6',   # Purple
            'share': '#06b6d4',      # Cyan
            'profile': '#ec4899',    # Pink
            'blockchain': '#14b8a6', # Teal
            'chat': '#3b82f6',       # Blue
            'admin': '#ef4444',      # Red
            'system': '#6b7280'      # Gray
        }
        return colors.get(category, '#6b7280')
    
    def __repr__(self):
        return f'<ActivityLog {self.action_type} by {self.user_id} at {self.created_at}>'


# Activity logging helper functions
def log_activity(user_id, action_type, action_category, description, 
                 target_id=None, target_type=None, target_name=None,
                 metadata=None, ip_address=None, user_agent=None, status='success'):
    """
    Helper function to log an activity
    
    Args:
        user_id: UUID of the user performing the action
        action_type: Type of action (login, upload, etc.)
        action_category: Category (auth, document, etc.)
        description: Human-readable description
        target_id: ID of the target (optional)
        target_type: Type of target (optional)
        target_name: Name of target for display (optional)
        metadata: Additional data as dict (optional) - stored as extra_data in DB
        ip_address: User's IP address (optional)
        user_agent: Browser/device info (optional)
        status: 'success', 'failed', or 'pending'
    
    Returns:
        ActivityLog instance or None if error
    """
    try:
        activity = ActivityLog(
            user_id=user_id,
            action_type=action_type,
            action_category=action_category,
            description=description,
            target_id=str(target_id) if target_id else None,
            target_type=target_type,
            target_name=target_name,
            extra_data=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )
        db.session.add(activity)
        db.session.commit()
        return activity
    except Exception:
        db.session.rollback()
        return None
