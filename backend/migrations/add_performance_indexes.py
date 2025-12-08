"""
Database migration to add performance indexes
Run: flask db migrate -m "Add performance indexes"
Then: flask db upgrade
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    """Add indexes for frequently queried columns"""
    
    # User table indexes
    op.create_index('idx_user_email', 'user', ['email'])
    op.create_index('idx_user_institution_id', 'user', ['institution_id'])
    op.create_index('idx_user_role_status', 'user', ['role', 'status'])
    
    # Document table indexes
    op.create_index('idx_document_owner_id', 'document', ['owner_id'])
    op.create_index('idx_document_folder_id', 'document', ['folder_id'])
    op.create_index('idx_document_is_active', 'document', ['is_active'])
    op.create_index('idx_document_owner_active', 'document', ['owner_id', 'is_active'])
    op.create_index('idx_document_created_at', 'document', ['created_at'])
    op.create_index('idx_document_updated_at', 'document', ['updated_at'])
    op.create_index('idx_document_starred', 'document', ['is_starred'])
    
    # DocumentShare table indexes
    op.create_index('idx_docshare_document_id', 'document_share', ['document_id'])
    op.create_index('idx_docshare_shared_with_id', 'document_share', ['shared_with_id'])
    op.create_index('idx_docshare_shared_by_id', 'document_share', ['shared_by_id'])
    op.create_index('idx_docshare_shared_at', 'document_share', ['shared_at'])
    
    # Folder table indexes
    op.create_index('idx_folder_owner_id', 'folder', ['owner_id'])
    op.create_index('idx_folder_parent_id', 'folder', ['parent_id'])
    op.create_index('idx_folder_owner_parent', 'folder', ['owner_id', 'parent_id'])
    
    # RecentActivity table indexes
    op.create_index('idx_recent_activity_user_id', 'recent_activity', ['user_id'])
    op.create_index('idx_recent_activity_created_at', 'recent_activity', ['created_at'])
    op.create_index('idx_recent_activity_user_created', 'recent_activity', ['user_id', 'created_at'])
    
    # Conversation table indexes
    op.create_index('idx_conversation_type', 'conversation', ['conversation_type'])
    op.create_index('idx_conversation_created_at', 'conversation', ['created_at'])
    
    # ConversationMember table indexes
    op.create_index('idx_conv_member_user_id', 'conversation_member', ['user_id'])
    op.create_index('idx_conv_member_conv_id', 'conversation_member', ['conversation_id'])
    op.create_index('idx_conv_member_user_conv', 'conversation_member', ['user_id', 'conversation_id'])
    
    # Message table indexes
    op.create_index('idx_message_conversation_id', 'message', ['conversation_id'])
    op.create_index('idx_message_sender_id', 'message', ['sender_id'])
    op.create_index('idx_message_created_at', 'message', ['created_at'])
    op.create_index('idx_message_conv_created', 'message', ['conversation_id', 'created_at'])
    
    # Notification table indexes
    op.create_index('idx_notification_user_id', 'notification', ['user_id'])
    op.create_index('idx_notification_is_read', 'notification', ['is_read'])
    op.create_index('idx_notification_created_at', 'notification', ['created_at'])
    op.create_index('idx_notification_user_read', 'notification', ['user_id', 'is_read'])
    
    # ApprovalRequest table indexes
    op.create_index('idx_approval_document_id', 'approval_request', ['document_id'])
    op.create_index('idx_approval_requester_id', 'approval_request', ['requester_id'])
    op.create_index('idx_approval_status', 'approval_request', ['status'])
    op.create_index('idx_approval_created_at', 'approval_request', ['created_at'])
    
    # ApprovalStep table indexes
    op.create_index('idx_approval_step_request_id', 'approval_step', ['request_id'])
    op.create_index('idx_approval_step_approver_id', 'approval_step', ['approver_id'])
    op.create_index('idx_approval_step_status', 'approval_step', ['status'])
    
    # BlockchainTransaction table indexes
    op.create_index('idx_blockchain_document_id', 'blockchain_transaction', ['document_id'])
    op.create_index('idx_blockchain_user_id', 'blockchain_transaction', ['user_id'])
    op.create_index('idx_blockchain_created_at', 'blockchain_transaction', ['created_at'])


def downgrade():
    """Remove indexes"""
    
    # User
    op.drop_index('idx_user_email')
    op.drop_index('idx_user_institution_id')
    op.drop_index('idx_user_role_status')
    
    # Document
    op.drop_index('idx_document_owner_id')
    op.drop_index('idx_document_folder_id')
    op.drop_index('idx_document_is_active')
    op.drop_index('idx_document_owner_active')
    op.drop_index('idx_document_created_at')
    op.drop_index('idx_document_updated_at')
    op.drop_index('idx_document_starred')
    
    # DocumentShare
    op.drop_index('idx_docshare_document_id')
    op.drop_index('idx_docshare_shared_with_id')
    op.drop_index('idx_docshare_shared_by_id')
    op.drop_index('idx_docshare_shared_at')
    
    # Folder
    op.drop_index('idx_folder_owner_id')
    op.drop_index('idx_folder_parent_id')
    op.drop_index('idx_folder_owner_parent')
    
    # RecentActivity
    op.drop_index('idx_recent_activity_user_id')
    op.drop_index('idx_recent_activity_created_at')
    op.drop_index('idx_recent_activity_user_created')
    
    # Conversation
    op.drop_index('idx_conversation_type')
    op.drop_index('idx_conversation_created_at')
    
    # ConversationMember
    op.drop_index('idx_conv_member_user_id')
    op.drop_index('idx_conv_member_conv_id')
    op.drop_index('idx_conv_member_user_conv')
    
    # Message
    op.drop_index('idx_message_conversation_id')
    op.drop_index('idx_message_sender_id')
    op.drop_index('idx_message_created_at')
    op.drop_index('idx_message_conv_created')
    
    # Notification
    op.drop_index('idx_notification_user_id')
    op.drop_index('idx_notification_is_read')
    op.drop_index('idx_notification_created_at')
    op.drop_index('idx_notification_user_read')
    
    # ApprovalRequest
    op.drop_index('idx_approval_document_id')
    op.drop_index('idx_approval_requester_id')
    op.drop_index('idx_approval_status')
    op.drop_index('idx_approval_created_at')
    
    # ApprovalStep
    op.drop_index('idx_approval_step_request_id')
    op.drop_index('idx_approval_step_approver_id')
    op.drop_index('idx_approval_step_status')
    
    # BlockchainTransaction
    op.drop_index('idx_blockchain_document_id')
    op.drop_index('idx_blockchain_user_id')
    op.drop_index('idx_blockchain_created_at')
