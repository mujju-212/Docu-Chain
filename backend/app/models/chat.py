from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Conversation(db.Model):
    """Represents a chat conversation (direct or group)"""
    __tablename__ = 'conversations'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.String(20), nullable=False)  # 'direct', 'group', 'circular'
    name = db.Column(db.String(255))  # For groups/circulars
    description = db.Column(db.Text)  # Group description
    
    # For auto-created groups
    is_auto_created = db.Column(db.Boolean, default=False)
    auto_type = db.Column(db.String(50))  # 'institution', 'department', 'section'
    linked_id = db.Column(UUID(as_uuid=True))  # institution_id, department_id, or section_id
    
    # For direct messages - store both user IDs for quick lookup
    user1_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    user2_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Creator (for groups)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Group settings
    avatar = db.Column(db.String(10))  # Emoji or initials
    is_muted = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)
    
    # Institution scope
    institution_id = db.Column(UUID(as_uuid=True), db.ForeignKey('institutions.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', back_populates='conversation', lazy='dynamic', order_by='Message.created_at')
    members = db.relationship('ConversationMember', back_populates='conversation', lazy='dynamic')
    creator = db.relationship('User', foreign_keys=[created_by])
    
    def get_other_user(self, user_id):
        """For direct conversations, get the other user"""
        if self.type != 'direct':
            return None
        return self.user1_id if str(self.user2_id) == str(user_id) else self.user2_id
    
    def to_dict(self, user_id=None):
        """Convert to dictionary"""
        last_message = self.messages.order_by(Message.created_at.desc()).first()
        
        # Count unread for the user
        unread_count = 0
        if user_id:
            member = ConversationMember.query.filter_by(
                conversation_id=self.id, 
                user_id=user_id
            ).first()
            if member:
                unread_count = self.messages.filter(
                    Message.created_at > member.last_read_at,
                    Message.sender_id != user_id
                ).count() if member.last_read_at else self.messages.filter(
                    Message.sender_id != user_id
                ).count()
        
        return {
            'id': str(self.id),
            'type': self.type,
            'name': self.name,
            'description': self.description,
            'isAutoCreated': self.is_auto_created,
            'autoType': self.auto_type,
            'avatar': self.avatar,
            'isMuted': self.is_muted,
            'isPinned': self.is_pinned,
            'createdBy': str(self.created_by) if self.created_by else None,
            'institutionId': str(self.institution_id),
            'lastMessage': last_message.content if last_message else None,
            'lastMessageAt': self.last_message_at.isoformat() if self.last_message_at else None,
            'unread': unread_count,
            'memberCount': self.members.count(),
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Conversation {self.id} ({self.type})>'


class ConversationMember(db.Model):
    """Represents a member of a conversation"""
    __tablename__ = 'conversation_members'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = db.Column(UUID(as_uuid=True), db.ForeignKey('conversations.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Member role in group
    role = db.Column(db.String(20), default='member')  # 'admin', 'member'
    
    # User-specific settings
    is_muted = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)
    is_blocked = db.Column(db.Boolean, default=False)
    
    # Read status
    last_read_at = db.Column(db.DateTime)
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = db.relationship('Conversation', back_populates='members')
    user = db.relationship('User')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('conversation_id', 'user_id', name='unique_conversation_member'),
    )
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'conversationId': str(self.conversation_id),
            'userId': str(self.user_id),
            'role': self.role,
            'isMuted': self.is_muted,
            'isPinned': self.is_pinned,
            'isBlocked': self.is_blocked,
            'lastReadAt': self.last_read_at.isoformat() if self.last_read_at else None,
            'joinedAt': self.joined_at.isoformat() if self.joined_at else None
        }


class Message(db.Model):
    """Represents a chat message"""
    __tablename__ = 'messages'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = db.Column(UUID(as_uuid=True), db.ForeignKey('conversations.id'), nullable=False)
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Message content
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(30), default='text')  # 'text', 'document_share', 'approval_request', 'system'
    
    # Document attachment (if any)
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'))
    document_name = db.Column(db.String(255))
    document_hash = db.Column(db.String(100))
    document_size = db.Column(db.String(20))
    
    # For approval requests
    approval_request_id = db.Column(UUID(as_uuid=True), db.ForeignKey('approval_requests.id'))
    
    # Auto-generated message metadata
    is_auto_generated = db.Column(db.Boolean, default=False)
    auto_message_type = db.Column(db.String(50))  # 'document_shared', 'approval_requested', 'approval_completed', etc.
    
    # Message status
    status = db.Column(db.String(20), default='sent')  # 'sent', 'delivered', 'read'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    edited_at = db.Column(db.DateTime)
    
    # Soft delete
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime)
    
    # Relationships
    conversation = db.relationship('Conversation', back_populates='messages')
    sender = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'conversationId': str(self.conversation_id),
            'senderId': str(self.sender_id),
            'senderName': f"{self.sender.first_name} {self.sender.last_name}" if self.sender else None,
            'content': self.content,
            'messageType': self.message_type,
            'documentId': str(self.document_id) if self.document_id else None,
            'documentName': self.document_name,
            'documentHash': self.document_hash,
            'documentSize': self.document_size,
            'hasDocument': bool(self.document_id or self.document_name),
            'document': {
                'id': str(self.document_id) if self.document_id else None,
                'name': self.document_name,
                'hash': self.document_hash,
                'size': self.document_size,
                'type': self.message_type
            } if self.document_id or self.document_name else None,
            'approvalRequestId': str(self.approval_request_id) if self.approval_request_id else None,
            'isAutoGenerated': self.is_auto_generated,
            'autoMessageType': self.auto_message_type,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'editedAt': self.edited_at.isoformat() if self.edited_at else None,
            'isDeleted': self.is_deleted
        }
    
    def __repr__(self):
        return f'<Message {self.id}>'


class UserOnlineStatus(db.Model):
    """Tracks user online status"""
    __tablename__ = 'user_online_status'
    
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), primary_key=True)
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User')
    
    def to_dict(self):
        return {
            'userId': str(self.user_id),
            'isOnline': self.is_online,
            'lastSeen': self.last_seen.isoformat() if self.last_seen else None
        }
