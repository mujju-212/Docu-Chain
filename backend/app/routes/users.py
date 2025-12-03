from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.user import User
from app.models.institution import Department, Section
from app.models.chat import Conversation, ConversationMember
from app.models.activity_log import log_activity
from app.routes.auth import token_required
from werkzeug.exceptions import BadRequest
from datetime import datetime, timedelta
import logging

bp = Blueprint('users', __name__)
logger = logging.getLogger(__name__)

@bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current user profile with full details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({
            'success': True, 
            'user': user.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get user'}), 500

@bp.route('/me', methods=['PUT'])
@token_required
def update_current_user():
    """Update current user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Update allowed fields (support both camelCase and snake_case)
        if 'first_name' in data or 'firstName' in data:
            user.first_name = data.get('first_name') or data.get('firstName')
        if 'last_name' in data or 'lastName' in data:
            user.last_name = data.get('last_name') or data.get('lastName')
        if 'phone' in data:
            user.phone = data['phone']
        if 'walletAddress' in data or 'wallet_address' in data:
            user.wallet_address = data.get('wallet_address') or data.get('walletAddress')
        if 'theme' in data:
            valid_themes = ['green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red']
            if data['theme'] in valid_themes:
                user.theme = data['theme']
        
        db.session.commit()
        
        # Log the profile update activity
        log_activity(
            user_id=current_user_id,
            action_type='profile_update',
            action_category='profile',
            description='Updated profile information',
            target_id=str(current_user_id),
            target_type='user',
            target_name=f'{user.first_name} {user.last_name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success'
        )
        
        logger.info(f"User {user.email} updated profile via /me endpoint")
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

@bp.route('/<user_id>', methods=['GET'])
@token_required
def get_user_by_id(user_id):
    """Get user by ID (for sharing - wallet address lookup)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Return user info (including wallet_address for blockchain sharing)
        return jsonify({
            'success': True, 
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'wallet_address': user.wallet_address,
                'walletAddress': user.wallet_address  # Also return camelCase for frontend
            }
        }), 200
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get user'}), 500

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
        valid_themes = ['green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red', 'indigo', 'cyan', 'rose', 'amber', 'slate']
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
            valid_themes = ['green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red', 'indigo', 'cyan', 'rose', 'amber', 'slate']
            if data['theme'] in valid_themes:
                user.theme = data['theme']
        
        db.session.commit()
        
        # Log the profile update activity
        updated_fields = [k for k in ['firstName', 'lastName', 'phone', 'walletAddress', 'theme'] if k in data]
        log_activity(
            user_id=current_user_id,
            action_type='profile_update',
            action_category='profile',
            description='Updated profile information',
            target_id=str(current_user_id),
            target_type='user',
            target_name=f'{user.first_name} {user.last_name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success',
            metadata={'updated_fields': updated_fields}
        )
        
        logger.info(f"User {user.email} updated profile")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password - requires current password verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Check that new password is different
        if user.check_password(new_password):
            return jsonify({'error': 'New password must be different from current password'}), 400
        
        # Set new password
        user.set_password(new_password)
        db.session.commit()
        
        # Log the password change activity
        log_activity(
            user_id=current_user_id,
            action_type='password_change',
            action_category='security',
            description='Changed account password',
            target_id=str(current_user_id),
            target_type='user',
            target_name=f'{user.first_name} {user.last_name}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success'
        )
        
        logger.info(f"User {user.email} changed their password")
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error changing password: {str(e)}")
        return jsonify({'error': 'Failed to change password'}), 500

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


@bp.route('/search', methods=['GET'])
@token_required
def search_users():
    """
    Search users by name, email, unique_id, or phone number.
    Query params:
        - q: search query (required)
        - limit: max results (default 10)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)  # Max 50 results
        
        if not query or len(query) < 2:
            return jsonify({
                'success': True,
                'users': [],
                'message': 'Query must be at least 2 characters'
            }), 200
        
        # Search pattern for ILIKE (case-insensitive)
        search_pattern = f'%{query}%'
        
        # Search users from the same institution
        # Search by: first_name, last_name, email, unique_id, phone
        from sqlalchemy import or_
        users = User.query.filter(
            User.institution_id == current_user.institution_id,
            User.id != current_user_id,  # Exclude current user
            User.status == 'active',
            or_(
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.unique_id.ilike(search_pattern),
                User.phone.ilike(search_pattern),
                # Also search full name by concatenating
                db.func.concat(User.first_name, ' ', User.last_name).ilike(search_pattern)
            )
        ).limit(limit).all()
        
        # Format users for frontend
        users_data = []
        for user in users:
            # Get department name if available
            department_name = None
            if user.department_id:
                dept = Department.query.get(user.department_id)
                department_name = dept.name if dept else None
            
            users_data.append({
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'fullName': f"{user.first_name} {user.last_name}",
                'uniqueId': user.unique_id,
                'role': user.role,
                'phone': user.phone,
                'department': department_name,
                'walletAddress': user.wallet_address
            })
        
        logger.info(f"User {current_user.email} searched for '{query}', found {len(users_data)} results")
        
        return jsonify({
            'success': True,
            'users': users_data,
            'count': len(users_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        return jsonify({
            'success': False, 
            'error': 'Failed to search users'
        }), 500


# ============ ADMIN ENDPOINTS ============

def admin_required(f):
    """Decorator to ensure user is admin"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


@bp.route('/admin/departments/<department_id>/sections', methods=['GET'])
@token_required
@admin_required
def get_sections_for_department(department_id):
    """Get sections for a specific department"""
    try:
        sections = Section.query.filter_by(department_id=department_id).order_by(Section.name).all()
        
        return jsonify({
            'success': True,
            'sections': [{'id': str(s.id), 'name': s.name} for s in sections]
        }), 200
    except Exception as e:
        logger.error(f"Error getting sections: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get sections'}), 500


@bp.route('/admin/list', methods=['GET'])
@token_required
@admin_required
def admin_list_users():
    """Get all users with filters for admin - same institution only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get query parameters for filtering
        role = request.args.get('role')
        status = request.args.get('status')
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sortBy', 'created_at')
        sort_order = request.args.get('sortOrder', 'desc')
        
        # Base query - users from same institution
        query = User.query.filter(User.institution_id == current_user.institution_id)
        
        # Apply filters
        if role and role != 'all':
            query = query.filter(User.role == role)
        if status and status != 'all':
            query = query.filter(User.status == status)
        
        # Search filter
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term),
                    User.unique_id.ilike(search_term)
                )
            )
        
        # Sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        users = query.all()
        
        # Format response
        users_data = []
        for user in users:
            # Get department and section names
            department_name = None
            section_name = None
            if user.department_id:
                dept = Department.query.get(user.department_id)
                department_name = dept.name if dept else None
            if user.section_id:
                sect = Section.query.get(user.section_id)
                section_name = sect.name if sect else None
            
            users_data.append({
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'fullName': f"{user.first_name} {user.last_name}",
                'uniqueId': user.unique_id,
                'role': user.role,
                'status': user.status or 'active',
                'phone': user.phone,
                'department': department_name,
                'section': section_name,
                'departmentId': str(user.department_id) if user.department_id else None,
                'sectionId': str(user.section_id) if user.section_id else None,
                'walletAddress': user.wallet_address,
                'createdAt': user.created_at.isoformat() if user.created_at else None,
                'lastLogin': user.last_login.isoformat() if user.last_login else None
            })
        
        return jsonify({
            'success': True,
            'users': users_data,
            'total': len(users_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing users for admin: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to list users'}), 500


@bp.route('/admin/analytics', methods=['GET'])
@token_required
@admin_required
def admin_user_analytics():
    """Get user analytics for admin dashboard"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Base query - same institution
        base_query = User.query.filter(User.institution_id == current_user.institution_id)
        
        # Get counts
        total = base_query.count()
        students = base_query.filter(User.role == 'student').count()
        faculty = base_query.filter(User.role == 'faculty').count()
        admins = base_query.filter(User.role == 'admin').count()
        active = base_query.filter(User.status == 'active').count()
        
        # New this week
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_this_week = base_query.filter(User.created_at >= week_ago).count()
        
        return jsonify({
            'success': True,
            'analytics': {
                'total': total,
                'students': students,
                'faculty': faculty,
                'admins': admins,
                'active': active,
                'newThisWeek': new_this_week
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get analytics'}), 500


@bp.route('/admin/<user_id>', methods=['GET'])
@token_required
@admin_required
def admin_get_user(user_id):
    """Get single user details for admin"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Ensure same institution
        if user.institution_id != current_user.institution_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'fullName': f"{user.first_name} {user.last_name}",
                'uniqueId': user.unique_id,
                'role': user.role,
                'status': user.status or 'active',
                'phone': user.phone,
                'walletAddress': user.wallet_address,
                'createdAt': user.created_at.isoformat() if user.created_at else None,
                'lastLogin': user.last_login.isoformat() if user.last_login else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user for admin: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get user'}), 500


@bp.route('/admin/<user_id>', methods=['PUT'])
@token_required
@admin_required
def admin_update_user(user_id):
    """Update user details - admin only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Ensure same institution
        if user.institution_id != current_user.institution_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        department_changed = False
        old_department_name = None
        new_department_name = None
        
        # Update allowed fields
        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']
        if 'phone' in data:
            user.phone = data['phone']
        if 'role' in data:
            # Prevent demoting last admin
            if user.role == 'admin' and data['role'] != 'admin':
                admin_count = User.query.filter(
                    User.institution_id == current_user.institution_id,
                    User.role == 'admin',
                    User.id != user.id
                ).count()
                if admin_count == 0:
                    return jsonify({'success': False, 'error': 'Cannot demote the last admin'}), 400
            user.role = data['role']
        
        # Handle department change
        if 'departmentId' in data:
            new_dept_id = data['departmentId'] if data['departmentId'] else None
            
            # Convert string to UUID if needed
            if new_dept_id:
                try:
                    import uuid as uuid_module
                    new_dept_id = uuid_module.UUID(new_dept_id)
                except (ValueError, AttributeError):
                    pass
            
            # Check if department is actually changing
            if str(user.department_id) != str(new_dept_id) if new_dept_id else user.department_id is not None:
                # Get old department name for logging
                if user.department_id:
                    old_dept = Department.query.get(user.department_id)
                    old_department_name = old_dept.name if old_dept else None
                
                # Store previous department for 30-day transition
                user.previous_department_id = user.department_id
                user.department_changed_at = datetime.utcnow()
                
                # Update to new department
                user.department_id = new_dept_id
                
                # Clear section when department changes
                user.section_id = None
                
                # Get new department name for logging
                if new_dept_id:
                    new_dept = Department.query.get(new_dept_id)
                    new_department_name = new_dept.name if new_dept else None
                    
                    # Add user to new department group immediately
                    new_dept_group = Conversation.query.filter_by(
                        type='group',
                        is_auto_created=True,
                        auto_type='department',
                        linked_id=new_dept_id
                    ).first()
                    
                    if new_dept_group:
                        # Check if not already a member
                        existing_member = ConversationMember.query.filter_by(
                            conversation_id=new_dept_group.id,
                            user_id=user.id
                        ).first()
                        
                        if not existing_member:
                            new_member = ConversationMember(
                                conversation_id=new_dept_group.id,
                                user_id=user.id,
                                role='admin' if user.role in ['admin', 'faculty'] else 'member'
                            )
                            db.session.add(new_member)
                            logger.info(f"User {user.email} added to new department group: {new_dept.name}")
                
                department_changed = True
                logger.info(f"User {user.email} department changed from {old_department_name} to {new_department_name}")
        
        # Handle section update (only if not changing department, as dept change clears section)
        if 'sectionId' in data and not department_changed:
            new_section_id = data['sectionId'] if data['sectionId'] else None
            if new_section_id:
                try:
                    import uuid as uuid_module
                    new_section_id = uuid_module.UUID(new_section_id)
                except (ValueError, AttributeError):
                    pass
            user.section_id = new_section_id
        
        # Handle password update
        password_changed = False
        if 'newPassword' in data and data['newPassword']:
            new_password = data['newPassword']
            if len(new_password) < 8:
                return jsonify({'success': False, 'error': 'Password must be at least 8 characters'}), 400
            user.set_password(new_password)
            password_changed = True
            logger.info(f"Admin {current_user.email} reset password for user {user.email}")
        
        db.session.commit()
        logger.info(f"Admin {current_user.email} updated user {user.email}")
        
        # Get updated department and section names for response
        department_name = None
        section_name = None
        if user.department_id:
            dept = Department.query.get(user.department_id)
            department_name = dept.name if dept else None
        if user.section_id:
            sect = Section.query.get(user.section_id)
            section_name = sect.name if sect else None
        
        response_data = {
            'success': True,
            'message': 'User updated successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role,
                'phone': user.phone,
                'departmentId': str(user.department_id) if user.department_id else None,
                'department': department_name,
                'sectionId': str(user.section_id) if user.section_id else None,
                'section': section_name
            }
        }
        
        if password_changed:
            response_data['passwordChanged'] = True
        
        if department_changed:
            response_data['departmentChanged'] = True
            response_data['message'] = f'User updated. Department changed from "{old_department_name or "None"}" to "{new_department_name or "None"}". User will remain in old department group for 30 days.'
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update user'}), 500


@bp.route('/admin/<user_id>/status', methods=['PUT'])
@token_required
@admin_required
def admin_update_user_status(user_id):
    """Update user status (suspend/resume/ban) - admin only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Ensure same institution
        if user.institution_id != current_user.institution_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Cannot modify own status
        if str(user.id) == str(current_user_id):
            return jsonify({'success': False, 'error': 'Cannot modify your own status'}), 400
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        new_status = data['status']
        valid_statuses = ['active', 'suspended', 'banned', 'pending']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        old_status = user.status
        user.status = new_status
        db.session.commit()
        
        logger.info(f"Admin {current_user.email} changed user {user.email} status from {old_status} to {new_status}")
        
        return jsonify({
            'success': True,
            'message': f'User status updated to {new_status}',
            'user': {
                'id': str(user.id),
                'status': user.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user status: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to update status'}), 500


@bp.route('/admin/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def admin_delete_user(user_id):
    """Delete user - admin only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Ensure same institution
        if user.institution_id != current_user.institution_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Cannot delete self
        if str(user.id) == str(current_user_id):
            return jsonify({'success': False, 'error': 'Cannot delete your own account'}), 400
        
        # Prevent deleting last admin
        if user.role == 'admin':
            admin_count = User.query.filter(
                User.institution_id == current_user.institution_id,
                User.role == 'admin',
                User.id != user.id
            ).count()
            if admin_count == 0:
                return jsonify({'success': False, 'error': 'Cannot delete the last admin'}), 400
        
        user_email = user.email
        db.session.delete(user)
        db.session.commit()
        
        logger.info(f"Admin {current_user.email} deleted user {user_email}")
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete user'}), 500


@bp.route('/admin/export', methods=['GET'])
@token_required
@admin_required
def admin_export_users():
    """Export users data - admin only"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get query parameters for filtering (same as list)
        role = request.args.get('role')
        status = request.args.get('status')
        search = request.args.get('search', '').strip()
        format_type = request.args.get('format', 'json')  # json or csv
        
        # Base query
        query = User.query.filter(User.institution_id == current_user.institution_id)
        
        # Apply filters
        if role and role != 'all':
            query = query.filter(User.role == role)
        if status and status != 'all':
            query = query.filter(User.status == status)
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        users = query.order_by(User.created_at.desc()).all()
        
        # Format data for export
        export_data = []
        for user in users:
            # Get department and section names
            department_name = None
            section_name = None
            if user.department_id:
                dept = Department.query.get(user.department_id)
                department_name = dept.name if dept else None
            if user.section_id:
                sect = Section.query.get(user.section_id)
                section_name = sect.name if sect else None
                
            export_data.append({
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'fullName': f"{user.first_name} {user.last_name}",
                'uniqueId': user.unique_id or '',
                'role': user.role,
                'status': user.status or 'active',
                'phone': user.phone or '',
                'department': department_name or '',
                'section': section_name or '',
                'createdAt': user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else ''
            })
        
        if format_type == 'csv':
            import io
            import csv
            
            output = io.StringIO()
            if export_data:
                writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
                writer.writeheader()
                writer.writerows(export_data)
            
            return jsonify({
                'success': True,
                'format': 'csv',
                'data': output.getvalue(),
                'count': len(export_data)
            }), 200
        else:
            return jsonify({
                'success': True,
                'format': 'json',
                'data': export_data,
                'count': len(export_data)
            }), 200
        
    except Exception as e:
        logger.error(f"Error exporting users: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to export users'}), 500


@bp.route('/admin/cleanup-department-transitions', methods=['POST'])
@token_required
@admin_required
def cleanup_department_transitions():
    """
    Remove users from old department groups after 30 days.
    This endpoint can be called manually by admin or scheduled via cron.
    """
    try:
        from datetime import timedelta
        
        # Calculate the cutoff date (30 days ago)
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        # Find users with pending department transitions older than 30 days
        users_to_cleanup = User.query.filter(
            User.previous_department_id.isnot(None),
            User.department_changed_at.isnot(None),
            User.department_changed_at <= cutoff_date
        ).all()
        
        cleanup_count = 0
        for user in users_to_cleanup:
            old_dept_id = user.previous_department_id
            
            # Find the old department group
            old_dept_group = Conversation.query.filter_by(
                type='group',
                is_auto_created=True,
                auto_type='department',
                linked_id=old_dept_id
            ).first()
            
            if old_dept_group:
                # Remove user from the old department group
                member = ConversationMember.query.filter_by(
                    conversation_id=old_dept_group.id,
                    user_id=user.id
                ).first()
                
                if member:
                    db.session.delete(member)
                    logger.info(f"Removed user {user.email} from old department group")
                    cleanup_count += 1
            
            # Clear the transition tracking fields
            user.previous_department_id = None
            user.department_changed_at = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Cleanup complete. Removed {cleanup_count} users from old department groups.',
            'usersProcessed': len(users_to_cleanup),
            'membersRemoved': cleanup_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during department transition cleanup: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to cleanup department transitions'}), 500


@bp.route('/admin/pending-department-transitions', methods=['GET'])
@token_required
@admin_required
def get_pending_department_transitions():
    """Get list of users with pending department transitions"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        users_with_pending = User.query.filter(
            User.institution_id == current_user.institution_id,
            User.previous_department_id.isnot(None),
            User.department_changed_at.isnot(None)
        ).all()
        
        transitions = []
        for user in users_with_pending:
            old_dept = Department.query.get(user.previous_department_id)
            new_dept = Department.query.get(user.department_id) if user.department_id else None
            
            days_since = (datetime.utcnow() - user.department_changed_at).days
            days_remaining = max(0, 30 - days_since)
            
            transitions.append({
                'userId': str(user.id),
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'oldDepartment': old_dept.name if old_dept else None,
                'newDepartment': new_dept.name if new_dept else None,
                'changedAt': user.department_changed_at.isoformat(),
                'daysRemaining': days_remaining,
                'willBeRemovedAt': (user.department_changed_at + timedelta(days=30)).isoformat()
            })
        
        return jsonify({
            'success': True,
            'transitions': transitions,
            'count': len(transitions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting pending transitions: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get pending transitions'}), 500
