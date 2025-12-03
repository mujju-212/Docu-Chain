from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.folder import Folder
from app.models.activity_log import log_activity
from app.routes.auth import token_required
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
import uuid

bp = Blueprint('folders', __name__)

# For now, we'll simulate folder creation without the actual Folder model
# since we removed it to fix the database relationship issues

@bp.route('/', methods=['POST'])
@token_required
def create_folder_flexible():
    """Create a new folder with authentication"""
    try:
        # Get user from JWT
        current_user_id = get_jwt_identity()
        print(f"Creating folder for user: {current_user_id}")
        
        if not current_user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
            
        data = request.get_json()
        print(f"DEBUG: Request data: {data}")
        
        folder_name = data.get('name', '').strip()
        parent_id = data.get('parent_id')
        description = data.get('description', '')
        
        if not folder_name:
            return jsonify({
                'success': False, 
                'error': 'Folder name is required'
            }), 400
        
        # Get user to verify they exist
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False, 
                'error': 'User not found'
            }), 404
        
        print(f"DEBUG: Found user: {user.email}")
        
        # Calculate path and level for hierarchy
        if parent_id:
            parent_folder = Folder.query.filter_by(
                id=parent_id, 
                owner_id=current_user_id,
                is_active=True
            ).first()
            
            if not parent_folder:
                return jsonify({
                    'success': False, 
                    'error': 'Parent folder not found'
                }), 404
            
            folder_path = f"{parent_folder.path}/{folder_name}"
            level = parent_folder.level + 1
        else:
            folder_path = f"/{folder_name}"
            level = 0
            
        # Check if folder with same name exists in the same parent
        existing_folder = Folder.query.filter_by(
            name=folder_name,
            parent_id=parent_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if existing_folder:
            return jsonify({
                'success': False, 
                'error': f'Folder "{folder_name}" already exists in this location'
            }), 400
        
        # Create new folder
        new_folder = Folder(
            name=folder_name,
            description=description,
            parent_id=parent_id,
            path=folder_path,
            level=level,
            owner_id=current_user_id
        )
        
        db.session.add(new_folder)
        db.session.commit()
        
        # Log the folder creation activity
        log_activity(
            user_id=current_user_id,
            action_type='folder_create',
            action_category='folder',
            description=f'Created folder: {folder_name}',
            target_id=str(new_folder.id),
            target_type='folder',
            target_name=folder_name,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            status='success',
            metadata={
                'path': folder_path,
                'parent_id': str(parent_id) if parent_id else None
            }
        )
        
        # Update parent folder's updated_at timestamp
        if parent_id:
            parent_folder = Folder.query.get(parent_id)
            if parent_folder:
                parent_folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        print(f"DEBUG: Folder created successfully: {new_folder.id}")
        
        # Use safe folder dict creation
        try:
            folder_dict = new_folder.to_dict()
        except Exception as e:
            print(f"Error in to_dict: {e}")
            folder_dict = {
                'id': str(new_folder.id),
                'name': new_folder.name,
                'description': new_folder.description or '',
                'parentId': str(new_folder.parent_id) if new_folder.parent_id else None,
                'path': new_folder.path or '/',
                'level': new_folder.level or 0,
                'ownerId': str(new_folder.owner_id),
                'createdAt': new_folder.created_at.isoformat() if new_folder.created_at else None,
                'updatedAt': new_folder.updated_at.isoformat() if new_folder.updated_at else None,
                'documentCount': 0,
                'subfolderCount': 0
            }
        
        print(f"DEBUG: Folder dict: {folder_dict}")
        
        return jsonify({
            'success': True,
            'folder': folder_dict,
            'message': f'Folder "{folder_name}" created successfully!'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"ERROR in create_folder: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/test', methods=['GET'])
def test_folders():
    """Test endpoint to get folders without authentication (for debugging)"""
    try:
        # Hardcode the user ID for testing
        test_user_id = '3df30a4b-5d84-4258-aab4-2fa3e05db5fe'
        
        # Query folders from database
        query = Folder.query.filter_by(
            owner_id=test_user_id,
            is_active=True
        )
        
        query = query.filter_by(parent_id=None)  # Root folders only
            
        folders = query.order_by(Folder.created_at.desc()).all()
        
        # Convert to dict format
        folder_list = []
        for folder in folders:
            try:
                folder_dict = folder.to_dict()
                folder_list.append(folder_dict)
            except Exception as e:
                print(f"Error converting folder {folder.id}: {e}")
                # Add basic folder info if to_dict fails
                folder_list.append({
                    'id': str(folder.id),
                    'name': folder.name,
                    'description': folder.description or '',
                    'parentId': None,
                    'path': folder.path or '/',
                    'level': folder.level or 0,
                    'ownerId': str(folder.owner_id),
                    'createdAt': folder.created_at.isoformat() if folder.created_at else None,
                    'documentCount': 0,
                    'subfolderCount': 0
                })
        
        return jsonify({
            'success': True,
            'folders': folder_list,
            'count': len(folder_list),
            'message': f'Test: Found {len(folder_list)} folders'
        }), 200
        
    except Exception as e:
        print(f"Error in test_folders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/', methods=['GET'])
@token_required
def list_folders_flexible():
    """Get folders for the current user"""
    try:
        # Get user from JWT
        current_user_id = get_jwt_identity()
        print(f"Listing folders for user: {current_user_id}")
        
        if not current_user_id:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
            
        parent_id = request.args.get('parent_id')
        
        # Query folders from database
        query = Folder.query.filter_by(
            owner_id=current_user_id,
            is_active=True
        )
        
        if parent_id:
            query = query.filter_by(parent_id=parent_id)
        else:
            query = query.filter_by(parent_id=None)  # Root folders only
            
        folders = query.order_by(Folder.created_at.desc()).all()
        
        # Convert to dict format with error handling
        folder_list = []
        for folder in folders:
            try:
                folder_dict = folder.to_dict()
                folder_list.append(folder_dict)
            except Exception as e:
                print(f"Error converting folder {folder.id}: {e}")
                # Add basic folder info if to_dict fails
                folder_list.append({
                    'id': str(folder.id),
                    'name': folder.name,
                    'description': folder.description or '',
                    'parentId': str(folder.parent_id) if folder.parent_id else None,
                    'path': folder.path or '/',
                    'level': folder.level or 0,
                    'ownerId': str(folder.owner_id),
                    'createdAt': folder.created_at.isoformat() if folder.created_at else None,
                    'updatedAt': folder.updated_at.isoformat() if folder.updated_at else None,
                    'documentCount': 0,
                    'subfolderCount': 0
                })
        
        return jsonify({
            'success': True,
            'folders': folder_list,
            'message': f'Folders retrieved successfully for {user.email}'
        }), 200
        
    except Exception as e:
        print(f"Error in list_folders: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/<folder_id>', methods=['PUT'])
@token_required
def update_folder(folder_id):
    """Update folder (rename or move)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Find folder owned by current user
        folder = Folder.query.filter_by(
            id=folder_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not folder:
            return jsonify({
                'success': False, 
                'error': 'Folder not found'
            }), 404
        
        # Check if this is a system folder (protected)
        if folder.is_system_folder:
            return jsonify({
                'success': False,
                'error': 'Cannot rename or move system folders'
            }), 403
        
        old_parent_id = folder.parent_id
        
        # Update name if provided
        if 'name' in data:
            new_name = data['name'].strip()
            if new_name:
                # Check if another folder with same name exists in same parent
                existing = Folder.query.filter_by(
                    name=new_name,
                    parent_id=folder.parent_id,
                    owner_id=current_user_id,
                    is_active=True
                ).filter(Folder.id != folder_id).first()
                
                if existing:
                    return jsonify({
                        'success': False,
                        'message': f'A folder named "{new_name}" already exists in this location'
                    }), 400
                
                folder.name = new_name
                # Update path
                if folder.parent_id:
                    parent = Folder.query.get(folder.parent_id)
                    folder.path = f"{parent.path}/{new_name}"
                else:
                    folder.path = f"/{new_name}"
        
        # Update parent (move) if provided
        if 'parent_id' in data:
            new_parent_id = data['parent_id']
            if new_parent_id != folder.parent_id:
                # Validate new parent exists
                if new_parent_id:
                    new_parent = Folder.query.filter_by(
                        id=new_parent_id,
                        owner_id=current_user_id,
                        is_active=True
                    ).first()
                    
                    if not new_parent:
                        return jsonify({
                            'success': False,
                            'error': 'New parent folder not found'
                        }), 404
                    
                    folder.parent_id = new_parent_id
                    folder.path = f"{new_parent.path}/{folder.name}"
                    folder.level = new_parent.level + 1
                else:
                    # Move to root
                    folder.parent_id = None
                    folder.path = f"/{folder.name}"
                    folder.level = 0
        
        folder.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Update old parent's timestamp if moved
        if old_parent_id and old_parent_id != folder.parent_id:
            old_parent = Folder.query.get(old_parent_id)
            if old_parent:
                old_parent.updated_at = datetime.utcnow()
        
        # Update new parent's timestamp if moved
        if folder.parent_id and folder.parent_id != old_parent_id:
            new_parent = Folder.query.get(folder.parent_id)
            if new_parent:
                new_parent.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Folder updated successfully',
            'folder': folder.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/<folder_id>', methods=['DELETE'])
@token_required
def delete_folder(folder_id):
    """Delete a folder (mark as inactive)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find folder owned by current user
        folder = Folder.query.filter_by(
            id=folder_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not folder:
            return jsonify({
                'success': False, 
                'error': 'Folder not found'
            }), 404
        
        # Check if this is a system folder (protected)
        if folder.is_system_folder:
            return jsonify({
                'success': False,
                'error': 'Cannot delete system folders'
            }), 403
        
        # Soft delete - mark as inactive instead of hard delete
        parent_id = folder.parent_id  # Store parent_id before deletion
        folder.is_active = False
        folder.is_in_trash = True
        folder.trash_date = datetime.utcnow()
        
        db.session.commit()
        
        # Update parent folder's updated_at timestamp
        if parent_id:
            parent_folder = Folder.query.get(parent_id)
            if parent_folder:
                parent_folder.updated_at = datetime.utcnow()
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Folder "{folder.name}" deleted successfully!'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@bp.route('/trash', methods=['GET'])
@token_required
def get_trash_folders():
    """Get all trashed folders for current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all trashed folders
        trashed_folders = Folder.query.filter_by(
            owner_id=current_user_id,
            is_in_trash=True
        ).order_by(Folder.trash_date.desc()).all()
        
        return jsonify({
            'success': True,
            'folders': [folder.to_dict() for folder in trashed_folders]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<folder_id>/star', methods=['PUT'])
@token_required
def toggle_star_folder(folder_id):
    """Toggle star status for a folder"""
    try:
        current_user_id = get_jwt_identity()
        
        # Find the folder
        folder = Folder.query.filter_by(
            id=folder_id,
            owner_id=current_user_id,
            is_active=True
        ).first()
        
        if not folder:
            return jsonify({
                'success': False,
                'error': 'Folder not found'
            }), 404
        
        # Toggle starred status
        folder.is_starred = not folder.is_starred
        folder.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'isStarred': folder.is_starred,
            'message': f'Folder {"starred" if folder.is_starred else "unstarred"} successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error toggling folder star: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/starred', methods=['GET'])
@token_required
def list_starred_folders():
    """Get all starred folders for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query for starred folders
        folders = Folder.query.filter_by(
            owner_id=current_user_id,
            is_active=True,
            is_in_trash=False,
            is_starred=True
        ).order_by(Folder.updated_at.desc()).all()
        
        folders_data = [folder.to_dict() for folder in folders]
        
        return jsonify({
            'success': True,
            'folders': folders_data,
            'count': len(folders_data)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching starred folders: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
