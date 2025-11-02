from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.user import User
from app.routes.auth import token_required
from werkzeug.exceptions import BadRequest
import logging

bp = Blueprint('users', __name__)
logger = logging.getLogger(__name__)

@bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        return jsonify({'success': True, 'user': user.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get profile'}), 500

@bp.route('/theme', methods=['PUT'])
@token_required
def update_theme():
    """Update user theme preference"""
    try:
        data = request.get_json()
        
        if not data or 'theme' not in data:
            return jsonify({'error': 'Theme is required'}), 400
        
        theme = data['theme']
        
        # Validate theme
        valid_themes = ['green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red']
        if theme not in valid_themes:
            return jsonify({'error': 'Invalid theme'}), 400
        
        # Get current user and update theme
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user.theme = theme
        db.session.commit()
        
        logger.info(f"User {user.email} changed theme to {theme}")
        
        return jsonify({
            'message': 'Theme updated successfully',
            'theme': theme
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating theme: {str(e)}")
        return jsonify({'error': 'Failed to update theme'}), 500

@bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed fields
        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']
        if 'phone' in data:
            user.phone = data['phone']
        if 'walletAddress' in data:
            user.wallet_address = data['walletAddress']
            logger.info(f"User {user.email} updated wallet address to {data['walletAddress']}")
        if 'theme' in data:
            valid_themes = ['green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red']
            if data['theme'] in valid_themes:
                user.theme = data['theme']
        
        db.session.commit()
        
        logger.info(f"User {user.email} updated profile")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@bp.route('/institution', methods=['GET'])
@token_required
def get_institution_users():
    """Get all users from the same institution for sharing functionality"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get all users from the same institution, excluding current user
        institution_users = User.query.filter(
            User.institution_id == current_user.institution_id,
            User.id != current_user_id,
            User.status == 'active'  # Only include active users
        ).all()
        
        # Format users for frontend
        users_data = []
        for user in institution_users:
            users_data.append({
                'id': user.id,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'fullName': f"{user.first_name} {user.last_name}",
                'role': user.role,
                'department': getattr(user, 'department', 'N/A'),
                'walletAddress': getattr(user, 'wallet_address', None)
            })
        
        return jsonify({
            'success': True,
            'users': users_data,
            'count': len(users_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting institution users: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Failed to get institution users'
        }), 500
