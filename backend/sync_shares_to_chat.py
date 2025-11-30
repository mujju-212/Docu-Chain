"""
Sync existing document shares and approval requests to chat messages.
This script creates chat messages for all existing shares and approvals 
that don't already have corresponding chat messages.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.document import Document, DocumentShare
from app.models.approval import ApprovalRequest, ApprovalStep
from app.models.chat import Conversation, ConversationMember, Message
from app.models.user import User
from sqlalchemy import or_, and_
from datetime import datetime

app = create_app()

def get_or_create_conversation(user1_id, user2_id):
    """Find or create a direct conversation between two users"""
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == user1_id, Conversation.user2_id == user2_id),
            and_(Conversation.user1_id == user2_id, Conversation.user2_id == user1_id)
        )
    ).first()
    
    if not conversation:
        user1 = User.query.get(user1_id)
        conversation = Conversation(
            type='direct',
            user1_id=user1_id,
            user2_id=user2_id,
            institution_id=user1.institution_id if user1 else None
        )
        db.session.add(conversation)
        db.session.flush()
        
        # Add members
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=user1_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=user2_id))
    
    return conversation


def sync_document_shares():
    """Sync all document shares to chat messages"""
    print("\n📤 Syncing Document Shares to Chat...")
    
    shares = DocumentShare.query.all()
    synced = 0
    skipped = 0
    
    for share in shares:
        # Check if a chat message already exists for this share
        existing_msg = Message.query.filter(
            Message.message_type == 'document_share',
            Message.document_id == str(share.document_id),
            Message.sender_id == share.shared_by_id,
            Message.is_auto_generated == True
        ).first()
        
        if existing_msg:
            skipped += 1
            continue
        
        # Get the document
        document = Document.query.get(share.document_id)
        if not document:
            print(f"  ⚠️ Document {share.document_id} not found, skipping share")
            continue
        
        # Get or create conversation
        conversation = get_or_create_conversation(share.shared_by_id, share.shared_with_id)
        
        # Get sender name
        sender = User.query.get(share.shared_by_id)
        sender_name = f"{sender.first_name} {sender.last_name}" if sender else "Unknown"
        
        # Create the chat message
        message = Message(
            conversation_id=conversation.id,
            sender_id=share.shared_by_id,
            content=f"📄 Shared document: {document.name}",
            message_type='document_share',
            document_id=str(share.document_id),
            document_name=document.name,
            document_hash=document.ipfs_hash,
            document_size=document.file_size,
            is_auto_generated=True,
            auto_message_type='document_shared',
            created_at=share.shared_at or datetime.utcnow()
        )
        db.session.add(message)
        
        # Update conversation last_message_at
        if not conversation.last_message_at or (share.shared_at and share.shared_at > conversation.last_message_at):
            conversation.last_message_at = share.shared_at or datetime.utcnow()
        
        synced += 1
        print(f"  ✅ Synced share: {document.name} ({sender_name} → recipient)")
    
    db.session.commit()
    print(f"\n📤 Document Shares: {synced} synced, {skipped} already exist")
    return synced


def sync_approval_requests():
    """Sync all approval requests to chat messages"""
    print("\n📋 Syncing Approval Requests to Chat...")
    
    # Get all approval requests
    requests = ApprovalRequest.query.all()
    synced_requests = 0
    synced_responses = 0
    skipped = 0
    
    for req in requests:
        # Get all approval steps (approvers)
        steps = req.approval_steps.all()
        
        for step in steps:
            approver_id = step.approver_id
            
            # Check if request message already exists
            existing_request_msg = Message.query.filter(
                Message.message_type.in_(['approval_request', 'digital_signature_request']),
                Message.approval_request_id == str(req.id),
                Message.sender_id == req.requester_id
            ).first()
            
            if not existing_request_msg:
                # Get or create conversation
                conversation = get_or_create_conversation(req.requester_id, approver_id)
                
                # Determine message type
                msg_type = 'digital_signature_request' if req.approval_type == 'DIGITAL_SIGNATURE' else 'approval_request'
                emoji = '✍️' if req.approval_type == 'DIGITAL_SIGNATURE' else '📋'
                
                # Create request message (document_id should be None since approval uses blockchain ID, not UUID)
                message = Message(
                    conversation_id=conversation.id,
                    sender_id=req.requester_id,
                    content=f"{emoji} {'Digital signature' if req.approval_type == 'DIGITAL_SIGNATURE' else 'Approval'} request: {req.document_name}",
                    message_type=msg_type,
                    document_id=None,  # Approval uses blockchain document_id, not UUID
                    document_name=req.document_name,
                    document_hash=req.document_ipfs_hash,
                    document_size=req.document_file_size,
                    approval_request_id=str(req.id),
                    is_auto_generated=True,
                    auto_message_type=f'{msg_type}_sent',
                    created_at=req.created_at or datetime.utcnow()
                )
                db.session.add(message)
                
                # Update conversation
                if not conversation.last_message_at or (req.created_at and req.created_at > conversation.last_message_at):
                    conversation.last_message_at = req.created_at or datetime.utcnow()
                
                synced_requests += 1
                print(f"  ✅ Synced request: {req.document_name} ({req.approval_type})")
            else:
                skipped += 1
            
            # If the step has a response (approved/rejected), create response message
            step_responded = step.has_approved or step.has_rejected
            if step_responded:
                existing_response_msg = Message.query.filter(
                    Message.message_type.in_(['approval_approved', 'approval_rejected', 'approval_signed']),
                    Message.approval_request_id == str(req.id),
                    Message.sender_id == approver_id
                ).first()
                
                if not existing_response_msg:
                    conversation = get_or_create_conversation(approver_id, req.requester_id)
                    
                    # Determine response type
                    if step.has_rejected:
                        response_type = 'approval_rejected'
                        emoji = '❌'
                        status_text = 'Rejected'
                    elif req.approval_type == 'DIGITAL_SIGNATURE' and step.signature_hash:
                        response_type = 'approval_signed'
                        emoji = '✍️'
                        status_text = 'Digitally Signed'
                    else:
                        response_type = 'approval_approved'
                        emoji = '✅'
                        status_text = 'Approved'
                    
                    # Get response timestamp
                    responded_at = None
                    if step.action_timestamp:
                        responded_at = datetime.utcfromtimestamp(step.action_timestamp)
                    elif step.updated_at:
                        responded_at = step.updated_at
                    else:
                        responded_at = datetime.utcnow()
                    
                    # Create response message (document_id should be None since approval uses blockchain ID)
                    response_msg = Message(
                        conversation_id=conversation.id,
                        sender_id=approver_id,
                        content=f"{emoji} {status_text}: {req.document_name}" + (f"\n📝 Comment: {step.reason}" if step.reason else ""),
                        message_type=response_type,
                        document_id=None,  # Approval uses blockchain document_id, not UUID
                        document_name=req.document_name,
                        document_hash=req.stamped_document_ipfs_hash or req.document_ipfs_hash,
                        document_size=req.document_file_size,
                        approval_request_id=str(req.id),
                        is_auto_generated=True,
                        auto_message_type=response_type,
                        created_at=responded_at
                    )
                    db.session.add(response_msg)
                    
                    # Update conversation
                    if not conversation.last_message_at or responded_at > conversation.last_message_at:
                        conversation.last_message_at = responded_at
                    
                    synced_responses += 1
                    print(f"  ✅ Synced response: {req.document_name} → {status_text}")
    
    db.session.commit()
    print(f"\n📋 Approval Requests: {synced_requests} requests synced, {synced_responses} responses synced, {skipped} already exist")
    return synced_requests + synced_responses


def main():
    with app.app_context():
        print("=" * 60)
        print("🔄 SYNCING EXISTING SHARES & APPROVALS TO CHAT")
        print("=" * 60)
        
        shares_synced = sync_document_shares()
        approvals_synced = sync_approval_requests()
        
        print("\n" + "=" * 60)
        print(f"✅ SYNC COMPLETE!")
        print(f"   - Document Shares synced: {shares_synced}")
        print(f"   - Approvals synced: {approvals_synced}")
        print("=" * 60)


if __name__ == '__main__':
    main()
