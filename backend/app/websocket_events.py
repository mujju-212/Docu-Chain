"""
WebSocket event handlers for real-time chat functionality.
"""

from flask_socketio import emit, join_room, leave_room
from flask import request
from app import socketio, db
from app.models import User
from app.models.chat import Conversation, ConversationMember, Message, UserOnlineStatus
from app.models.notification import create_notification
from datetime import datetime
import jwt
from flask import current_app

# Store connected users: {user_id: [socket_id1, socket_id2, ...]}
connected_users = {}

def get_user_from_token(token):
    """Decode JWT token and get user - compatible with Flask-JWT-Extended"""
    try:
        # Flask-JWT-Extended uses 'sub' field for identity, not 'user_id'
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = data.get('sub')  # Flask-JWT-Extended stores identity in 'sub'
        if user_id:
            return User.query.get(user_id)
        return None
    except Exception as e:
        return None


@socketio.on('connect')
def handle_connect():
    """Handle new socket connection"""
    token = request.args.get('token')
    if not token:
        return False
    
    user = get_user_from_token(token)
    if not user:
        return False
    
    user_id = str(user.id)
    
    # Add user to connected users
    if user_id not in connected_users:
        connected_users[user_id] = []
    connected_users[user_id].append(request.sid)
    
    # Update online status
    status = UserOnlineStatus.query.get(user.id)
    if not status:
        status = UserOnlineStatus(user_id=user.id, is_online=True, last_seen=datetime.utcnow())
        db.session.add(status)
    else:
        status.is_online = True
        status.last_seen = datetime.utcnow()
    db.session.commit()
    
    # Join user's conversation rooms
    conversations = ConversationMember.query.filter_by(user_id=user.id).all()
    for conv_member in conversations:
        join_room(f"conversation_{conv_member.conversation_id}")
    
    # Broadcast online status to all user's conversations
    for conv_member in conversations:
        emit('user_online', {
            'userId': user_id,
            'online': True,
            'lastSeen': datetime.utcnow().isoformat()
        }, room=f"conversation_{conv_member.conversation_id}", include_self=False)
    
    return True


@socketio.on('disconnect')
def handle_disconnect():
    """Handle socket disconnection"""
    # Find and remove user from connected users
    user_id = None
    for uid, sids in connected_users.items():
        if request.sid in sids:
            user_id = uid
            sids.remove(request.sid)
            if not sids:
                del connected_users[uid]
            break
    
    if user_id:
        # Check if user still has other connections
        if user_id not in connected_users or not connected_users[user_id]:
            # User fully disconnected, update status
            user = User.query.get(user_id)
            if user:
                status = UserOnlineStatus.query.get(user.id)
                if status:
                    status.is_online = False
                    status.last_seen = datetime.utcnow()
                    db.session.commit()
                
                # Broadcast offline status
                conversations = ConversationMember.query.filter_by(user_id=user.id).all()
                for conv_member in conversations:
                    emit('user_offline', {
                        'userId': user_id,
                        'online': False,
                        'lastSeen': datetime.utcnow().isoformat()
                    }, room=f"conversation_{conv_member.conversation_id}")


@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Join a specific conversation room"""
    conversation_id = data.get('conversationId')
    if conversation_id:
        join_room(f"conversation_{conversation_id}")


@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    """Leave a specific conversation room"""
    conversation_id = data.get('conversationId')
    if conversation_id:
        leave_room(f"conversation_{conversation_id}")


@socketio.on('send_message')
def handle_send_message(data):
    """Handle sending a new message via WebSocket"""
    token = request.args.get('token')
    user = get_user_from_token(token)
    
    if not user:
        emit('error', {'message': 'Unauthorized'})
        return
    
    conversation_id = data.get('conversationId')
    content = data.get('content', '').strip()
    message_type = data.get('messageType', 'text')
    
    if not conversation_id or not content:
        emit('error', {'message': 'Missing required fields'})
        return
    
    # Verify user is member of conversation
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=user.id
    ).first()
    
    if not member:
        emit('error', {'message': 'Access denied'})
        return
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=user.id,
        content=content,
        message_type=message_type,
        document_id=data.get('documentId'),
        document_name=data.get('documentName'),
        document_hash=data.get('documentHash'),
        document_size=data.get('documentSize'),
        status='sent'
    )
    db.session.add(message)
    
    # Update conversation
    conversation = Conversation.query.get(conversation_id)
    if conversation:
        conversation.last_message_at = datetime.utcnow()
    
    db.session.commit()
    
    # Create notifications for other members
    try:
        if conversation.type == 'direct':
            # For direct messages, notify the other person
            other_member = ConversationMember.query.filter(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user.id
            ).first()
            if other_member:
                create_notification(
                    user_id=str(other_member.user_id),
                    notification_type='message',
                    title='New Message',
                    message=f'{user.first_name} {user.last_name}: {content[:50]}{"..." if len(content) > 50 else ""}',
                    sender_id=str(user.id),
                    sender_name=f'{user.first_name} {user.last_name}',
                    extra_data={
                        'conversation_id': str(conversation_id),
                        'message_id': str(message.id),
                        'sender_id': str(user.id)
                    }
                )
        elif conversation.type == 'group':
            # For groups, notify all members except sender
            members = ConversationMember.query.filter(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != user.id,
                ConversationMember.is_muted == False
            ).limit(50).all()
            for m in members:
                create_notification(
                    user_id=str(m.user_id),
                    notification_type='group_message',
                    title=f'New Message in {conversation.name or "Group"}',
                    message=f'{user.first_name}: {content[:50]}{"..." if len(content) > 50 else ""}',
                    sender_id=str(user.id),
                    sender_name=f'{user.first_name} {user.last_name}',
                    extra_data={
                        'conversation_id': str(conversation_id),
                        'message_id': str(message.id),
                        'sender_id': str(user.id),
                        'group_name': conversation.name
                    }
                )
    except Exception as notif_error:
        pass  # Don't fail the message send if notification fails
    
    # Broadcast message to all in conversation EXCEPT the sender
    message_data = message.to_dict()
    message_data['senderName'] = f"{user.first_name} {user.last_name}"
    
    emit('new_message', message_data, room=f"conversation_{conversation_id}", include_self=False)
    
    # Send confirmation to sender with message ID
    emit('message_sent', {
        'tempId': data.get('tempId'),
        'message': message_data
    })
    
    # Update delivery status after a short delay
    emit('message_delivered', {
        'messageId': str(message.id),
        'status': 'delivered'
    }, room=f"conversation_{conversation_id}")


@socketio.on('typing_start')
def handle_typing_start(data):
    """Handle typing indicator start"""
    token = request.args.get('token')
    user = get_user_from_token(token)
    
    if not user:
        return
    
    conversation_id = data.get('conversationId')
    if conversation_id:
        emit('user_typing', {
            'userId': str(user.id),
            'userName': f"{user.first_name} {user.last_name}",
            'isTyping': True
        }, room=f"conversation_{conversation_id}", include_self=False)


@socketio.on('typing_stop')
def handle_typing_stop(data):
    """Handle typing indicator stop"""
    token = request.args.get('token')
    user = get_user_from_token(token)
    
    if not user:
        return
    
    conversation_id = data.get('conversationId')
    if conversation_id:
        emit('user_typing', {
            'userId': str(user.id),
            'userName': f"{user.first_name} {user.last_name}",
            'isTyping': False
        }, room=f"conversation_{conversation_id}", include_self=False)


@socketio.on('mark_read')
def handle_mark_read(data):
    """Mark messages as read"""
    token = request.args.get('token')
    user = get_user_from_token(token)
    
    if not user:
        return
    
    conversation_id = data.get('conversationId')
    message_ids = data.get('messageIds', [])
    
    if not conversation_id:
        return
    
    # Update member's last read time
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=user.id
    ).first()
    
    if member:
        member.last_read_at = datetime.utcnow()
        db.session.commit()
    
    # Notify sender that messages were read
    for msg_id in message_ids:
        message = Message.query.get(msg_id)
        if message and message.sender_id != user.id:
            message.status = 'read'
            db.session.commit()
            
            emit('message_read', {
                'messageId': str(msg_id),
                'readBy': str(user.id),
                'status': 'read'
            }, room=f"conversation_{conversation_id}")


def broadcast_message(conversation_id, message_data):
    """Utility function to broadcast a message to a conversation"""
    socketio.emit('new_message', message_data, room=f"conversation_{conversation_id}")
