"""
Notifications API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.notification import Notification, create_notification
from app.models.user import User
from datetime import datetime
import uuid as uuid_module

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


def get_uuid_from_identity(identity):
    """Convert JWT identity to UUID object"""
    if isinstance(identity, uuid_module.UUID):
        return identity
    try:
        return uuid_module.UUID(str(identity))
    except (ValueError, AttributeError):
        return None


@bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for current user"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        # Query parameters
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        notification_type = request.args.get('type')
        limit = request.args.get('limit', 50, type=int)
        
        # Build query
        query = Notification.query.filter(Notification.user_id == str(current_user_id))
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        if notification_type:
            query = query.filter(Notification.type == notification_type)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'notifications': [n.to_dict() for n in notifications],
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/count', methods=['GET'])
@jwt_required()
def get_notification_count():
    """Get unread notification count for current user"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        unread_count = Notification.query.filter(
            Notification.user_id == str(current_user_id),
            Notification.is_read == False
        ).count()
        
        # Get counts by type
        type_counts = {}
        type_query = db.session.query(
            Notification.type, 
            db.func.count(Notification.id)
        ).filter(
            Notification.user_id == str(current_user_id),
            Notification.is_read == False
        ).group_by(Notification.type).all()
        
        for ntype, count in type_query:
            type_counts[ntype] = count
        
        return jsonify({
            'success': True,
            'unreadCount': unread_count,
            'byType': type_counts
        }), 200
        
    except Exception as e:
        print(f"Error getting notification count: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        notification = Notification.query.filter(
            Notification.id == notification_id,
            Notification.user_id == str(current_user_id)
        ).first()
        
        if not notification:
            return jsonify({'success': False, 'message': 'Notification not found'}), 404
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        Notification.query.filter(
            Notification.user_id == str(current_user_id),
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        }), 200
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        notification = Notification.query.filter(
            Notification.id == notification_id,
            Notification.user_id == str(current_user_id)
        ).first()
        
        if not notification:
            return jsonify({'success': False, 'message': 'Notification not found'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        }), 200
        
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/clear-read', methods=['DELETE'])
@jwt_required()
def clear_read_notifications():
    """Delete all read notifications"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        deleted = Notification.query.filter(
            Notification.user_id == str(current_user_id),
            Notification.is_read == True
        ).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Deleted {deleted} read notifications'
        }), 200
        
    except Exception as e:
        print(f"Error clearing read notifications: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
