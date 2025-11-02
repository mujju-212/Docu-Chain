"""
Recent Activity Routes - API endpoints for tracking user file activities
"""
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models.recent_activity import RecentActivity
from app.models.user import User

bp = Blueprint('recent', __name__, url_prefix='/api/recent')

@bp.route('/', methods=['GET', 'OPTIONS'])
def get_recent_activities():
    """Get recent activities for the current user"""
    # Handle OPTIONS request (CORS preflight) - no auth required
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # For GET requests, require authentication
    try:
        # Get current user from JWT
        verify_jwt_in_request()
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get limit from query params (default 20)
        limit = request.args.get('limit', 20, type=int)
        
        # Get recent activities for this user, ordered by most recent first
        activities = RecentActivity.query.filter_by(user_id=current_user.id)\
            .order_by(RecentActivity.created_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            'success': True,
            'activities': [activity.to_dict() for activity in activities],
            'count': len(activities)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get recent activities: {str(e)}'
        }), 500


@bp.route('/', methods=['POST', 'OPTIONS'])
def add_recent_activity():
    """Add a new recent activity"""
    # Handle OPTIONS request (CORS preflight) - no auth required
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # For POST requests, require authentication
    try:
        # Get current user from JWT
        verify_jwt_in_request()
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
            
        data = request.get_json()
        
        # Validate required fields
        if not data.get('fileName') or not data.get('action'):
            return jsonify({
                'success': False,
                'message': 'fileName and action are required'
            }), 400
        
        # Check if activity already exists for this file (to update instead of duplicate)
        existing = RecentActivity.query.filter_by(
            user_id=current_user.id,
            file_id=data.get('fileId')
        ).first()
        
        if existing and existing.action == data.get('action'):
            # Update existing activity's timestamp
            existing.created_at = db.func.now()
            existing.file_name = data.get('fileName')
            existing.file_size = data.get('size')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'activity': existing.to_dict(),
                'message': 'Activity updated'
            }), 200
        
        # Create new activity
        activity = RecentActivity(
            user_id=current_user.id,
            file_id=data.get('fileId'),
            file_name=data.get('fileName'),
            file_type=data.get('fileType', 'file'),
            action=data.get('action'),
            file_size=data.get('size'),
            owner=data.get('owner', 'You'),
            document_id=data.get('documentId'),
            ipfs_hash=data.get('ipfsHash')
        )
        
        db.session.add(activity)
        
        # Keep only the latest 50 activities per user to avoid database bloat
        activities_count = RecentActivity.query.filter_by(user_id=current_user.id).count()
        if activities_count >= 50:
            # Delete oldest activities beyond 50
            oldest_activities = RecentActivity.query.filter_by(user_id=current_user.id)\
                .order_by(RecentActivity.created_at.asc())\
                .limit(activities_count - 50)\
                .all()
            for old_activity in oldest_activities:
                db.session.delete(old_activity)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'activity': activity.to_dict(),
            'message': 'Activity added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to add activity: {str(e)}'
        }), 500


@bp.route('/<int:activity_id>', methods=['DELETE', 'OPTIONS'])
def delete_recent_activity(activity_id):
    """Delete a specific recent activity"""
    # Handle OPTIONS request (CORS preflight) - no auth required
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # For DELETE requests, require authentication
    try:
        # Get current user from JWT
        verify_jwt_in_request()
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        activity = RecentActivity.query.filter_by(
            id=activity_id,
            user_id=current_user.id
        ).first()
        
        if not activity:
            return jsonify({
                'success': False,
                'message': 'Activity not found'
            }), 404
        
        db.session.delete(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Activity deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to delete activity: {str(e)}'
        }), 500


@bp.route('/clear', methods=['DELETE', 'OPTIONS'])
def clear_recent_activities():
    """Clear all recent activities for the current user"""
    # Handle OPTIONS request (CORS preflight) - no auth required
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    # For DELETE requests, require authentication
    try:
        verify_jwt_in_request()
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        RecentActivity.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All activities cleared successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to clear activities: {str(e)}'
        }), 500
