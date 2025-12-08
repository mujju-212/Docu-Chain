"""
EXAMPLE: Optimized Documents Route with Caching & Eager Loading
Replace slow routes in documents.py with these patterns
"""

from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.document import Document, DocumentShare
from app.models.folder import Folder
from app.routes.auth import token_required
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm import joinedload
from app.performance import cache_response, invalidate_cache
from datetime import datetime

bp = Blueprint('documents_optimized', __name__)

@bp.route('/', methods=['GET'])
@token_required
@cache_response(timeout=60)  # Cache for 1 minute
def list_documents_optimized():
    """
    OPTIMIZED: Get documents with eager loading and caching
    - Uses joinedload to prevent N+1 queries
    - Caches response for 1 minute
    - Adds pagination support
    """
    try:
        current_user_id = get_jwt_identity()
        folder_id = request.args.get('folder_id')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))  # Limit results
        
        # Build query with eager loading (prevents N+1 problem)
        query = Document.query.options(
            joinedload(Document.owner),  # Load owner in same query
            joinedload(Document.folder)  # Load folder in same query
        ).filter_by(
            owner_id=current_user_id,
            is_active=True
        )
        
        if folder_id:
            query = query.filter_by(folder_id=folder_id)
        else:
            query = query.filter(Document.folder_id.is_(None))
        
        # Use pagination instead of loading all documents
        paginated = query.order_by(
            Document.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        documents = []
        for doc in paginated.items:
            doc_data = {
                'id': str(doc.id),
                'filename': doc.filename,
                'file_type': doc.file_type,
                'file_size': doc.file_size,
                'created_at': doc.created_at.isoformat(),
                'updated_at': doc.updated_at.isoformat(),
                'folder_id': str(doc.folder_id) if doc.folder_id else None,
                'is_starred': doc.is_starred,
                # Owner already loaded via joinedload - no extra query
                'owner_email': doc.owner.email if doc.owner else None,
                # Folder already loaded via joinedload - no extra query
                'folder_name': doc.folder.name if doc.folder else None
            }
            documents.append(doc_data)
        
        return jsonify({
            'success': True,
            'documents': documents,
            'pagination': {
                'page': paginated.page,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/starred', methods=['GET'])
@token_required
@cache_response(timeout=30)  # Cache for 30 seconds
def get_starred_documents():
    """
    OPTIMIZED: Get starred documents with eager loading
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Single query with eager loading
        documents = Document.query.options(
            joinedload(Document.owner),
            joinedload(Document.folder)
        ).filter_by(
            owner_id=current_user_id,
            is_active=True,
            is_starred=True
        ).order_by(
            Document.updated_at.desc()
        ).limit(100).all()  # Limit to prevent loading thousands
        
        docs_data = []
        for doc in documents:
            docs_data.append({
                'id': str(doc.id),
                'filename': doc.filename,
                'file_type': doc.file_type,
                'created_at': doc.created_at.isoformat(),
                'owner_email': doc.owner.email if doc.owner else None,
                'folder_name': doc.folder.name if doc.folder else None
            })
        
        return jsonify({
            'success': True,
            'documents': docs_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/<document_id>/star', methods=['POST'])
@token_required
def toggle_star(document_id):
    """
    When document is starred/unstarred, invalidate cache
    """
    try:
        current_user_id = get_jwt_identity()
        
        document = Document.query.filter_by(
            id=document_id,
            owner_id=current_user_id
        ).first()
        
        if not document:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        document.is_starred = not document.is_starred
        db.session.commit()
        
        # Invalidate caches that include this document
        invalidate_cache('list_documents_optimized')
        invalidate_cache('get_starred_documents')
        
        return jsonify({
            'success': True,
            'is_starred': document.is_starred
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# PATTERN SUMMARY:
# 1. Use @cache_response() for GET endpoints
# 2. Use joinedload() to prevent N+1 queries
# 3. Use .limit() to prevent loading too much data
# 4. Use pagination for large datasets
# 5. Invalidate cache when data changes
# 6. Don't load related objects in loops - use joins
