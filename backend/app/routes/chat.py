from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Conversation, ConversationMember, Message, UserOnlineStatus, Document
from app.models.institution import Institution, Department
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_, and_, func
import uuid

bp = Blueprint('chat', __name__)


# ============== AUTO GROUP FUNCTIONS ==============

def ensure_auto_groups(user):
    """Ensure user is added to their institution and department groups automatically"""
    if not user:
        return
    
    # 1. Institution Group
    institution_group = Conversation.query.filter_by(
        type='group',
        is_auto_created=True,
        auto_type='institution',
        linked_id=user.institution_id
    ).first()
    
    if not institution_group:
        # Create institution group
        institution = Institution.query.get(user.institution_id)
        if institution:
            institution_group = Conversation(
                type='group',
                name=f"{institution.name} - All Members",
                description=f"Official group for all members of {institution.name}",
                is_auto_created=True,
                auto_type='institution',
                linked_id=user.institution_id,
                institution_id=user.institution_id,
                avatar='🏛️'
            )
            db.session.add(institution_group)
            db.session.flush()
    
    if institution_group:
        # Add user if not already a member
        existing_member = ConversationMember.query.filter_by(
            conversation_id=institution_group.id,
            user_id=user.id
        ).first()
        
        if not existing_member:
            member = ConversationMember(
                conversation_id=institution_group.id,
                user_id=user.id,
                role='admin' if user.role == 'admin' else 'member'
            )
            db.session.add(member)
    
    # 2. Department Group (if user has a department)
    if user.department_id:
        dept_group = Conversation.query.filter_by(
            type='group',
            is_auto_created=True,
            auto_type='department',
            linked_id=user.department_id
        ).first()
        
        if not dept_group:
            # Create department group
            department = Department.query.get(user.department_id)
            if department:
                dept_group = Conversation(
                    type='group',
                    name=f"{department.name} Department",
                    description=f"Official group for {department.name} department members",
                    is_auto_created=True,
                    auto_type='department',
                    linked_id=user.department_id,
                    institution_id=user.institution_id,
                    avatar='📚'
                )
                db.session.add(dept_group)
                db.session.flush()
        
        if dept_group:
            # Add user if not already a member
            existing_member = ConversationMember.query.filter_by(
                conversation_id=dept_group.id,
                user_id=user.id
            ).first()
            
            if not existing_member:
                member = ConversationMember(
                    conversation_id=dept_group.id,
                    user_id=user.id,
                    role='admin' if user.role in ['admin', 'faculty'] else 'member'
                )
                db.session.add(member)
    
    # 3. Admin gets added to ALL groups in their institution
    if user.role == 'admin':
        all_groups = Conversation.query.filter(
            Conversation.type == 'group',
            Conversation.institution_id == user.institution_id
        ).all()
        
        for group in all_groups:
            existing_member = ConversationMember.query.filter_by(
                conversation_id=group.id,
                user_id=user.id
            ).first()
            
            if not existing_member:
                member = ConversationMember(
                    conversation_id=group.id,
                    user_id=user.id,
                    role='admin'
                )
                db.session.add(member)
    
    db.session.commit()


# ============== USER SEARCH ==============

@bp.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """Search for users within the same institution"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 401
    
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify({'users': []})
    
    # Search by name, email, phone, or unique_id
    users = User.query.filter(
        User.institution_id == current_user.institution_id,
        User.id != current_user.id,
        User.status == 'active',
        or_(
            func.concat(User.first_name, ' ', User.last_name).ilike(f'%{query}%'),
            User.email.ilike(f'%{query}%'),
            User.phone.ilike(f'%{query}%'),
            User.unique_id.ilike(f'%{query}%')
        )
    ).limit(20).all()
    
    # Get online status for each user
    user_list = []
    for user in users:
        online_status = UserOnlineStatus.query.get(user.id)
        user_data = {
            'id': str(user.id),
            'name': f"{user.first_name} {user.last_name}",
            'email': user.email,
            'phone': user.phone,
            'uniqueId': user.unique_id,
            'role': user.role,
            'departmentId': str(user.department_id) if user.department_id else None,
            'avatar': user.first_name[0].upper() if user.first_name else 'U',
            'online': online_status.is_online if online_status else False,
            'lastSeen': online_status.last_seen.isoformat() if online_status and online_status.last_seen else None
        }
        
        # Get department name
        if user.department_id:
            dept = Department.query.get(user.department_id)
            user_data['department'] = dept.name if dept else None
        
        user_list.append(user_data)
    
    return jsonify({'users': user_list})


# ============== CONVERSATIONS ==============

@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all conversations for the current user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    print(f"📡 Fetching conversations for user: {current_user.email}")
    
    # Ensure user is added to auto-groups (institution, department)
    ensure_auto_groups(current_user)
    
    conv_type = request.args.get('type')  # 'direct', 'group', 'circular'
    
    # Get conversations where user is a member
    member_query = ConversationMember.query.filter(
        ConversationMember.user_id == current_user.id
    ).all()
    
    conversation_ids = [m.conversation_id for m in member_query]
    print(f"📋 User is member of {len(conversation_ids)} conversations")
    
    conversations_query = Conversation.query.filter(
        Conversation.id.in_(conversation_ids)
    )
    
    if conv_type:
        conversations_query = conversations_query.filter(Conversation.type == conv_type)
    
    conversations = conversations_query.order_by(Conversation.last_message_at.desc()).all()
    print(f"✅ Found {len(conversations)} conversations")
    
    result = []
    for conv in conversations:
        conv_data = conv.to_dict(user_id=current_user.id)
        
        # Get member settings for this user
        member = ConversationMember.query.filter_by(
            conversation_id=conv.id,
            user_id=current_user.id
        ).first()
        
        if member:
            conv_data['isMuted'] = member.is_muted
            conv_data['isPinned'] = member.is_pinned
        
        # For direct messages, get the other user's info
        if conv.type == 'direct':
            other_user_id = conv.get_other_user(current_user.id)
            if other_user_id:
                other_user = User.query.get(other_user_id)
                if other_user:
                    online_status = UserOnlineStatus.query.get(other_user.id)
                    conv_data['userId'] = str(other_user.id)  # Important for WebSocket online status
                    conv_data['name'] = f"{other_user.first_name} {other_user.last_name}"
                    conv_data['role'] = other_user.role
                    conv_data['email'] = other_user.email
                    conv_data['phone'] = other_user.phone
                    conv_data['avatar'] = other_user.first_name[0].upper()
                    conv_data['online'] = online_status.is_online if online_status else False
                    conv_data['lastSeen'] = online_status.last_seen.isoformat() if online_status and online_status.last_seen else None
                    
                    # Get department
                    if other_user.department_id:
                        dept = Department.query.get(other_user.department_id)
                        conv_data['department'] = dept.name if dept else None
        else:
            # For groups, get member count
            conv_data['members'] = conv.members.count()
        
        result.append(conv_data)
    
    return jsonify({'conversations': result})


@bp.route('/circulars/feed', methods=['GET'])
@jwt_required()
def get_circulars_feed():
    """Get all circulars as a feed/timeline for the user's institution"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get all circulars for user's institution
    circulars = Conversation.query.filter(
        Conversation.type == 'circular',
        Conversation.institution_id == current_user.institution_id
    ).order_by(Conversation.created_at.desc()).all()
    
    feed_items = []
    for circular in circulars:
        # Get all messages (posts) in this circular
        messages = Message.query.filter_by(
            conversation_id=circular.id
        ).order_by(Message.created_at.desc()).all()
        
        # Get creator info
        creator = User.query.get(circular.created_by) if circular.created_by else None
        
        for msg in messages:
            sender = User.query.get(msg.sender_id)
            feed_items.append({
                'id': str(msg.id),
                'circularId': str(circular.id),
                'circularName': circular.name,
                'content': msg.content,
                'createdAt': msg.created_at.isoformat() if msg.created_at else None,
                'sender': {
                    'id': str(sender.id) if sender else None,
                    'name': f"{sender.first_name} {sender.last_name}" if sender else 'Unknown',
                    'role': sender.role if sender else None,
                    'avatar': sender.first_name[0].upper() if sender and sender.first_name else 'U'
                },
                'hasDocument': msg.document_id is not None,
                'document': {
                    'id': str(msg.document_id) if msg.document_id else None,
                    'name': msg.document_name,
                    'hash': msg.document_hash
                } if msg.document_id else None
            })
    
    # Sort all feed items by date
    feed_items.sort(key=lambda x: x['createdAt'] or '', reverse=True)
    
    # Also return list of circulars user can post to
    can_post = current_user.role in ['admin', 'faculty']
    
    return jsonify({
        'feed': feed_items,
        'canPost': can_post,
        'circulars': [{'id': str(c.id), 'name': c.name} for c in circulars]
    })


@bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create a new conversation (direct or group)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    conv_type = data.get('type', 'direct')
    
    if conv_type == 'direct':
        # Direct message - find or create
        user_id = data.get('userId')
        if not user_id:
            return jsonify({'error': 'userId is required for direct messages'}), 400
        
        # Check if conversation already exists
        existing = Conversation.query.filter(
            Conversation.type == 'direct',
            or_(
                and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
                and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id)
            )
        ).first()
        
        if existing:
            return jsonify({'conversation': existing.to_dict(user_id=current_user.id)})
        
        # Create new direct conversation
        other_user = User.query.get(user_id)
        if not other_user or other_user.institution_id != current_user.institution_id:
            return jsonify({'error': 'User not found'}), 404
        
        conversation = Conversation(
            type='direct',
            user1_id=current_user.id,
            user2_id=user_id,
            institution_id=current_user.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        # Add both users as members
        member1 = ConversationMember(
            conversation_id=conversation.id,
            user_id=current_user.id,
            role='member'
        )
        member2 = ConversationMember(
            conversation_id=conversation.id,
            user_id=user_id,
            role='member'
        )
        db.session.add(member1)
        db.session.add(member2)
        
    elif conv_type in ['group', 'circular']:
        # Group or circular
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Name is required for groups'}), 400
        
        member_ids = data.get('members', [])
        
        # For circulars, only admins can create
        if conv_type == 'circular' and current_user.role not in ['admin', 'faculty']:
            return jsonify({'error': 'Only admins and faculty can create circulars'}), 403
        
        conversation = Conversation(
            type=conv_type,
            name=name,
            description=data.get('description'),
            created_by=current_user.id,
            institution_id=current_user.institution_id,
            avatar=name[0].upper() if name else 'G'
        )
        db.session.add(conversation)
        db.session.flush()
        
        # Add creator as admin
        creator_member = ConversationMember(
            conversation_id=conversation.id,
            user_id=current_user.id,
            role='admin'
        )
        db.session.add(creator_member)
        
        # Add other members
        for member_id in member_ids:
            if member_id != str(current_user.id):
                member = ConversationMember(
                    conversation_id=conversation.id,
                    user_id=member_id,
                    role='member'
                )
                db.session.add(member)
    else:
        return jsonify({'error': 'Invalid conversation type'}), 400
    
    db.session.commit()
    
    return jsonify({'conversation': conversation.to_dict(user_id=current_user.id)}), 201


@bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """Get a specific conversation with details"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    conversation = Conversation.query.get(conversation_id)
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    # Check if user is a member
    member = ConversationMember.query.filter_by(
        conversation_id=conversation.id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    conv_data = conversation.to_dict(user_id=current_user.id)
    
    # Get all members for groups
    if conversation.type != 'direct':
        members = []
        for m in conversation.members.all():
            user = User.query.get(m.user_id)
            if user:
                online_status = UserOnlineStatus.query.get(user.id)
                members.append({
                    'id': str(user.id),
                    'name': f"{user.first_name} {user.last_name}",
                    'role': m.role,
                    'userRole': user.role,
                    'avatar': user.first_name[0].upper(),
                    'online': online_status.is_online if online_status else False
                })
        conv_data['membersList'] = members
    
    return jsonify({'conversation': conv_data})


@bp.route('/conversations/<conversation_id>/settings', methods=['PATCH'])
@jwt_required()
def update_conversation_settings(conversation_id):
    """Update user-specific conversation settings (mute, pin, etc.)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Conversation not found'}), 404
    
    if 'isMuted' in data:
        member.is_muted = data['isMuted']
    if 'isPinned' in data:
        member.is_pinned = data['isPinned']
    if 'isBlocked' in data:
        member.is_blocked = data['isBlocked']
    
    db.session.commit()
    
    return jsonify({'success': True})


# ============== MESSAGES ==============

@bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a conversation"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is a member
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    messages = Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Update last read
    member.last_read_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'messages': [m.to_dict() for m in reversed(messages.items)],
        'hasMore': messages.has_next,
        'total': messages.total
    })


@bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send a message to a conversation"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Check if user is a member
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Check if blocked
    if member.is_blocked:
        return jsonify({'error': 'You cannot send messages to this conversation'}), 403
    
    conversation = Conversation.query.get(conversation_id)
    
    content = data.get('content', '').strip()
    message_type = data.get('messageType', 'text')
    
    if not content and message_type == 'text':
        return jsonify({'error': 'Message content is required'}), 400
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content,
        message_type=message_type,
        document_id=data.get('documentId'),
        document_name=data.get('documentName'),
        document_hash=data.get('documentHash'),
        document_size=data.get('documentSize'),
        approval_request_id=data.get('approvalRequestId')
    )
    db.session.add(message)
    
    # Update conversation last message time
    conversation.last_message_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': message.to_dict()}), 201


@bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message (soft delete)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    message = Message.query.get(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    if message.sender_id != current_user.id:
        return jsonify({'error': 'You can only delete your own messages'}), 403
    
    message.is_deleted = True
    message.deleted_at = datetime.utcnow()
    message.content = 'This message was deleted'
    
    db.session.commit()
    
    return jsonify({'success': True})


# ============== SHARED DOCUMENTS ==============

@bp.route('/conversations/<conversation_id>/shared-documents', methods=['GET'])
@jwt_required()
def get_shared_documents(conversation_id):
    """Get all documents shared in a conversation, including approvals and signatures"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is a member
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get all messages with documents in this conversation
    all_doc_messages = Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False,
        or_(
            Message.message_type.in_([
                'document_share', 'document_generated',
                'approval_request', 'digital_signature_request',
                'approval_approved', 'approval_rejected', 'approval_signed'
            ]),
            Message.document_id.isnot(None)
        )
    ).order_by(Message.created_at.desc()).all()
    
    documents = []  # Shared documents
    approvals = []  # Pending approval requests
    signed = []     # Processed documents (approved/rejected/signed)
    
    for msg in all_doc_messages:
        sender = User.query.get(msg.sender_id)
        sender_name = f"{sender.first_name} {sender.last_name}" if sender else 'Unknown'
        is_own = str(msg.sender_id) == str(current_user.id)
        
        base_data = {
            'id': str(msg.document_id) if msg.document_id else str(msg.id),
            'name': msg.document_name or 'Document',
            'hash': msg.document_hash,
            'size': msg.document_size,
            'messageId': str(msg.id),
            'isOwn': is_own
        }
        
        if msg.message_type in ['document_share', 'document_generated']:
            documents.append({
                **base_data,
                'sharedAt': msg.created_at.isoformat() if msg.created_at else None,
                'sharedBy': sender_name
            })
        elif msg.message_type in ['approval_request', 'digital_signature_request']:
            approvals.append({
                **base_data,
                'requestedAt': msg.created_at.isoformat() if msg.created_at else None,
                'requestedBy': sender_name,
                'type': 'signature' if msg.message_type == 'digital_signature_request' else 'approval',
                'status': 'pending'
            })
        elif msg.message_type in ['approval_approved', 'approval_rejected', 'approval_signed']:
            status = 'rejected' if msg.message_type == 'approval_rejected' else \
                     'signed' if msg.message_type == 'approval_signed' else 'approved'
            signed.append({
                **base_data,
                'processedAt': msg.created_at.isoformat() if msg.created_at else None,
                'processedBy': sender_name,
                'status': status
            })
    
    return jsonify({
        'documents': documents,
        'approvals': approvals,
        'signed': signed
    })


# ============== ONLINE STATUS ==============

@bp.route('/status/online', methods=['POST'])
@jwt_required()
def update_online_status():
    """Update user's online status"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    status = UserOnlineStatus.query.get(current_user.id)
    
    if not status:
        status = UserOnlineStatus(
            user_id=current_user.id,
            is_online=True,
            last_seen=datetime.utcnow()
        )
        db.session.add(status)
    else:
        status.is_online = True
        status.last_seen = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True})


@bp.route('/status/offline', methods=['POST'])
@jwt_required()
def update_offline_status():
    """Update user's offline status"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    status = UserOnlineStatus.query.get(current_user.id)
    
    if status:
        status.is_online = False
        status.last_seen = datetime.utcnow()
        db.session.commit()
    
    return jsonify({'success': True})


# ============== GROUP MANAGEMENT ==============

@bp.route('/conversations/<conversation_id>/members', methods=['POST'])
@jwt_required()
def add_members(conversation_id):
    """Add members to a group"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    conversation = Conversation.query.get(conversation_id)
    
    if not conversation or conversation.type == 'direct':
        return jsonify({'error': 'Invalid conversation'}), 400
    
    # Check if user is admin
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role='admin'
    ).first()
    
    if not member:
        return jsonify({'error': 'Only admins can add members'}), 403
    
    data = request.get_json()
    member_ids = data.get('members', [])
    
    added = []
    for member_id in member_ids:
        # Check if already a member
        existing = ConversationMember.query.filter_by(
            conversation_id=conversation_id,
            user_id=member_id
        ).first()
        
        if not existing:
            user = User.query.get(member_id)
            if user and user.institution_id == current_user.institution_id:
                new_member = ConversationMember(
                    conversation_id=conversation_id,
                    user_id=member_id,
                    role='member'
                )
                db.session.add(new_member)
                added.append(member_id)
    
    db.session.commit()
    
    return jsonify({'added': added})


@bp.route('/conversations/<conversation_id>/members/<member_id>', methods=['DELETE'])
@jwt_required()
def remove_member(conversation_id, member_id):
    """Remove a member from a group"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    conversation = Conversation.query.get(conversation_id)
    
    if not conversation or conversation.type == 'direct':
        return jsonify({'error': 'Invalid conversation'}), 400
    
    # Check if user is admin or removing themselves
    is_admin = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role='admin'
    ).first()
    
    is_self = str(current_user.id) == member_id
    
    if not is_admin and not is_self:
        return jsonify({'error': 'Access denied'}), 403
    
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=member_id
    ).first()
    
    if member:
        db.session.delete(member)
        db.session.commit()
    
    return jsonify({'success': True})


@bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """Delete a conversation (admin only, custom groups only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    conversation = Conversation.query.get(conversation_id)
    
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    
    # Cannot delete direct conversations
    if conversation.type == 'direct':
        return jsonify({'error': 'Cannot delete direct conversations'}), 400
    
    # Cannot delete auto-created (default) groups
    if conversation.is_auto_created:
        return jsonify({'error': 'Cannot delete default institution groups'}), 400
    
    # Check if user is admin or creator
    is_admin = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role='admin'
    ).first()
    
    is_creator = str(conversation.created_by) == str(current_user.id)
    
    if not is_admin and not is_creator:
        return jsonify({'error': 'Only admins can delete the group'}), 403
    
    # Delete all members first
    ConversationMember.query.filter_by(conversation_id=conversation_id).delete()
    
    # Delete all messages
    Message.query.filter_by(conversation_id=conversation_id).delete()
    
    # Delete the conversation
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Group deleted successfully'})


# ============== AUTO GROUPS ==============

def create_auto_groups_for_user(user):
    """Create or add user to auto-generated groups"""
    # Institution group
    inst_group = Conversation.query.filter_by(
        is_auto_created=True,
        auto_type='institution',
        linked_id=user.institution_id
    ).first()
    
    if not inst_group:
        institution = Institution.query.get(user.institution_id)
        inst_group = Conversation(
            type='group',
            name=f"{institution.name} - All Members",
            is_auto_created=True,
            auto_type='institution',
            linked_id=user.institution_id,
            institution_id=user.institution_id,
            avatar='🏫'
        )
        db.session.add(inst_group)
        db.session.flush()
    
    # Add user to institution group if not already a member
    inst_member = ConversationMember.query.filter_by(
        conversation_id=inst_group.id,
        user_id=user.id
    ).first()
    
    if not inst_member:
        inst_member = ConversationMember(
            conversation_id=inst_group.id,
            user_id=user.id,
            role='admin' if user.role == 'admin' else 'member'
        )
        db.session.add(inst_member)
    
    # Department group
    if user.department_id:
        dept_group = Conversation.query.filter_by(
            is_auto_created=True,
            auto_type='department',
            linked_id=user.department_id
        ).first()
        
        if not dept_group:
            department = Department.query.get(user.department_id)
            dept_group = Conversation(
                type='group',
                name=f"{department.name} - Department",
                is_auto_created=True,
                auto_type='department',
                linked_id=user.department_id,
                institution_id=user.institution_id,
                avatar='📚'
            )
            db.session.add(dept_group)
            db.session.flush()
        
        # Add user to department group if not already a member
        dept_member = ConversationMember.query.filter_by(
            conversation_id=dept_group.id,
            user_id=user.id
        ).first()
        
        if not dept_member:
            dept_member = ConversationMember(
                conversation_id=dept_group.id,
                user_id=user.id,
                role='admin' if user.role in ['admin', 'faculty'] else 'member'
            )
            db.session.add(dept_member)
    
    db.session.commit()


# ============== AUTO MESSAGES ==============

def create_document_share_message(sender_id, recipient_id, document, message_content=None):
    """Create an auto-generated message when a document is shared"""
    # Find or create direct conversation
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == sender_id, Conversation.user2_id == recipient_id),
            and_(Conversation.user1_id == recipient_id, Conversation.user2_id == sender_id)
        )
    ).first()
    
    if not conversation:
        sender = User.query.get(sender_id)
        conversation = Conversation(
            type='direct',
            user1_id=sender_id,
            user2_id=recipient_id,
            institution_id=sender.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        # Add members
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=sender_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=recipient_id))
    
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=message_content or f"Shared document: {document.get('name', 'Document')}",
        message_type='document_share',
        document_id=document.get('id'),
        document_name=document.get('name'),
        document_hash=document.get('ipfs_hash'),
        document_size=document.get('size'),
        is_auto_generated=True,
        auto_message_type='document_shared'
    )
    db.session.add(message)
    
    conversation.last_message_at = datetime.utcnow()
    db.session.commit()
    
    return message


def create_approval_request_message(sender_id, recipient_id, approval_request, document):
    """Create an auto-generated message when an approval is requested"""
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == sender_id, Conversation.user2_id == recipient_id),
            and_(Conversation.user1_id == recipient_id, Conversation.user2_id == sender_id)
        )
    ).first()
    
    if not conversation:
        sender = User.query.get(sender_id)
        conversation = Conversation(
            type='direct',
            user1_id=sender_id,
            user2_id=recipient_id,
            institution_id=sender.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=sender_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=recipient_id))
    
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=f"Requested approval for: {document.get('name', 'Document')}",
        message_type='approval_request',
        document_id=document.get('id'),
        document_name=document.get('name'),
        document_hash=document.get('ipfs_hash'),
        document_size=document.get('size'),
        approval_request_id=approval_request.get('id'),
        is_auto_generated=True,
        auto_message_type='approval_requested'
    )
    db.session.add(message)
    
    conversation.last_message_at = datetime.utcnow()
    db.session.commit()
    
    return message


def create_digital_signature_request_message(sender_id, recipient_id, approval_request, document):
    """Create an auto-generated message when a digital signature is requested"""
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == sender_id, Conversation.user2_id == recipient_id),
            and_(Conversation.user1_id == recipient_id, Conversation.user2_id == sender_id)
        )
    ).first()
    
    if not conversation:
        sender = User.query.get(sender_id)
        conversation = Conversation(
            type='direct',
            user1_id=sender_id,
            user2_id=recipient_id,
            institution_id=sender.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=sender_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=recipient_id))
    
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=f"Requested digital signature for: {document.get('name', 'Document')}",
        message_type='digital_signature_request',
        document_id=document.get('id'),
        document_name=document.get('name'),
        document_hash=document.get('ipfs_hash'),
        document_size=document.get('size'),
        approval_request_id=approval_request.get('id'),
        is_auto_generated=True,
        auto_message_type='digital_signature_requested'
    )
    db.session.add(message)
    
    conversation.last_message_at = datetime.utcnow()
    db.session.commit()
    
    return message


def create_document_generated_message(sender_id, recipient_id, document, generated_doc_name):
    """Create an auto-generated message when a document is generated for a recipient"""
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == sender_id, Conversation.user2_id == recipient_id),
            and_(Conversation.user1_id == recipient_id, Conversation.user2_id == sender_id)
        )
    ).first()
    
    if not conversation:
        sender = User.query.get(sender_id)
        conversation = Conversation(
            type='direct',
            user1_id=sender_id,
            user2_id=recipient_id,
            institution_id=sender.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=sender_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=recipient_id))
    
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=f"Generated document for you: {generated_doc_name}",
        message_type='document_generated',
        document_id=document.get('id'),
        document_name=document.get('name') or generated_doc_name,
        document_hash=document.get('ipfs_hash'),
        document_size=document.get('size'),
        is_auto_generated=True,
        auto_message_type='document_generated'
    )
    db.session.add(message)
    
    conversation.last_message_at = datetime.utcnow()
    db.session.commit()
    
    return message


def create_approval_status_message(sender_id, recipient_id, approval_request, document, status, comment=None):
    """Create an auto-generated message when an approval status changes"""
    conversation = Conversation.query.filter(
        Conversation.type == 'direct',
        or_(
            and_(Conversation.user1_id == sender_id, Conversation.user2_id == recipient_id),
            and_(Conversation.user1_id == recipient_id, Conversation.user2_id == sender_id)
        )
    ).first()
    
    if not conversation:
        sender = User.query.get(sender_id)
        conversation = Conversation(
            type='direct',
            user1_id=sender_id,
            user2_id=recipient_id,
            institution_id=sender.institution_id
        )
        db.session.add(conversation)
        db.session.flush()
        
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=sender_id))
        db.session.add(ConversationMember(conversation_id=conversation.id, user_id=recipient_id))
    
    status_emoji = {
        'approved': '✅',
        'rejected': '❌',
        'signed': '✍️'
    }.get(status.lower(), '📄')
    
    content = f"{status_emoji} {status.capitalize()}: {document.get('name', 'Document')}"
    if comment:
        content += f"\n📝 Comment: {comment}"
    
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=content,
        message_type=f'approval_{status.lower()}',
        document_id=document.get('id'),
        document_name=document.get('name'),
        document_hash=document.get('ipfs_hash'),
        document_size=document.get('size'),
        approval_request_id=approval_request.get('id'),
        is_auto_generated=True,
        auto_message_type=f'approval_{status.lower()}'
    )
    db.session.add(message)
    
    conversation.last_message_at = datetime.utcnow()
    db.session.commit()
    
    return message


# ============== POLLING FOR NEW MESSAGES ==============

@bp.route('/conversations/<conversation_id>/poll', methods=['GET'])
@jwt_required()
def poll_messages(conversation_id):
    """Poll for new messages since a timestamp"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    since = request.args.get('since')  # ISO timestamp
    
    member = ConversationMember.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user.id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    query = Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    )
    
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            query = query.filter(Message.created_at > since_dt)
        except ValueError:
            pass
    
    messages = query.order_by(Message.created_at.asc()).limit(100).all()
    
    return jsonify({
        'messages': [m.to_dict() for m in messages],
        'serverTime': datetime.utcnow().isoformat()
    })


@bp.route('/unread', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get total unread message count across all conversations"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    members = ConversationMember.query.filter_by(user_id=current_user.id).all()
    
    total_unread = 0
    for member in members:
        if member.last_read_at:
            count = Message.query.filter(
                Message.conversation_id == member.conversation_id,
                Message.created_at > member.last_read_at,
                Message.sender_id != current_user.id,
                Message.is_deleted == False
            ).count()
        else:
            count = Message.query.filter(
                Message.conversation_id == member.conversation_id,
                Message.sender_id != current_user.id,
                Message.is_deleted == False
            ).count()
        total_unread += count
    
    return jsonify({'unread': total_unread})
