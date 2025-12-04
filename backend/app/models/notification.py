"""
Notification Model - Stores user notifications
"""
from app import db
from datetime import datetime
import uuid


class Notification(db.Model):
    """
    Notification model for storing user notifications
    Types: message, group_message, circular, approval_request, approval_response, 
           document_received, document_shared, system
    """
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Notification type
    type = db.Column(db.String(50), nullable=False, index=True)
    # message, group_message, circular, approval_request, approval_response, 
    # document_received, document_shared, document_generated, system
    
    # Content
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text)
    
    # Reference to related entity
    reference_id = db.Column(db.String(36))  # ID of related item (message, document, etc.)
    reference_type = db.Column(db.String(50))  # Type of reference (message, document, approval, etc.)
    
    # Sender info (for messages, shares, etc.)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    sender_name = db.Column(db.String(255))
    
    # Status
    is_read = db.Column(db.Boolean, default=False, index=True)
    read_at = db.Column(db.DateTime)
    
    # Extra data (renamed from metadata since it's reserved in SQLAlchemy)
    extra_data = db.Column(db.JSON, default={})
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('notifications', lazy='dynamic'))
    sender = db.relationship('User', foreign_keys=[sender_id])
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        created_at_str = (self.created_at.isoformat() + 'Z') if self.created_at else None
        read_at_str = (self.read_at.isoformat() + 'Z') if self.read_at else None
        return {
            'id': self.id,
            'userId': self.user_id,
            'user_id': self.user_id,  # snake_case for frontend compatibility
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'referenceId': self.reference_id,
            'reference_id': self.reference_id,  # snake_case
            'referenceType': self.reference_type,
            'reference_type': self.reference_type,  # snake_case
            'senderId': self.sender_id,
            'sender_id': self.sender_id,  # snake_case
            'senderName': self.sender_name,
            'sender_name': self.sender_name,  # snake_case
            'isRead': self.is_read,
            'is_read': self.is_read,  # snake_case for frontend compatibility
            'readAt': read_at_str,
            'read_at': read_at_str,  # snake_case
            'extraData': self.extra_data or {},
            'extra_data': self.extra_data or {},  # snake_case
            'createdAt': created_at_str,
            'created_at': created_at_str,  # snake_case for frontend compatibility
            'icon': self.get_icon(),
            'color': self.get_color()
        }
    
    def get_icon(self):
        """Get icon based on notification type"""
        icons = {
            'message': 'ri-chat-3-line',
            'group_message': 'ri-group-line',
            'circular': 'ri-megaphone-line',
            'approval_request': 'ri-file-list-3-line',
            'approval_response': 'ri-checkbox-circle-line',
            'document_received': 'ri-file-received-line',
            'document_shared': 'ri-share-line',
            'document_generated': 'ri-file-add-line',
            'system': 'ri-notification-3-line'
        }
        return icons.get(self.type, 'ri-notification-line')
    
    def get_color(self):
        """Get color based on notification type"""
        colors = {
            'message': '#3b82f6',
            'group_message': '#8b5cf6',
            'circular': '#f59e0b',
            'approval_request': '#06b6d4',
            'approval_response': '#10b981',
            'document_received': '#6366f1',
            'document_shared': '#ec4899',
            'document_generated': '#14b8a6',
            'system': '#6b7280'
        }
        return colors.get(self.type, '#6b7280')
    
    def __repr__(self):
        return f'<Notification {self.type} for {self.user_id}>'


def create_notification(user_id, notification_type, title, message=None, 
                       reference_id=None, reference_type=None,
                       sender_id=None, sender_name=None, extra_data=None):
    """
    Helper function to create a notification
    
    Args:
        user_id: ID of user to notify
        notification_type: Type of notification
        title: Notification title
        message: Optional detailed message
        reference_id: ID of related entity
        reference_type: Type of related entity
        sender_id: ID of sender (for messages, shares)
        sender_name: Name of sender
        extra_data: Additional data as dict
    
    Returns:
        Notification instance or None if error
    """
    try:
        notification = Notification(
            user_id=str(user_id),
            type=notification_type,
            title=title,
            message=message,
            reference_id=str(reference_id) if reference_id else None,
            reference_type=reference_type,
            sender_id=str(sender_id) if sender_id else None,
            sender_name=sender_name,
            extra_data=extra_data or {}
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception:
        db.session.rollback()
        return None
