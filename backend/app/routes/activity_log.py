"""
Activity Log Routes - API endpoints for viewing activity logs
Users can only view their own logs - NO edit/delete operations allowed
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.activity_log import ActivityLog, log_activity
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import uuid as uuid_module
import csv
import io

bp = Blueprint('activity_log', __name__, url_prefix='/api/activity-logs')


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
def get_activity_logs():
    """
    Get activity logs for the current user only
    Users can only see their own logs - this is enforced
    """
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        action_type = request.args.get('action_type', None)
        category = request.args.get('category', None)
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        search = request.args.get('search', None)
        
        # Always filter by current user - users can ONLY see their own logs
        query = ActivityLog.query.filter(ActivityLog.user_id == current_user_id)
        
        # Apply filters
        if action_type and action_type != 'all':
            query = query.filter(ActivityLog.action_type == action_type)
        
        if category and category != 'all':
            query = query.filter(ActivityLog.action_category == category)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(ActivityLog.created_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(ActivityLog.created_at < to_date)
            except ValueError:
                pass
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    ActivityLog.description.ilike(search_pattern),
                    ActivityLog.target_name.ilike(search_pattern)
                )
            )
        
        # Order by most recent first
        query = query.order_by(ActivityLog.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Get activity type and category options for filters
        action_types = db.session.query(ActivityLog.action_type).filter(
            ActivityLog.user_id == current_user_id
        ).distinct().all()
        
        categories = db.session.query(ActivityLog.action_category).filter(
            ActivityLog.user_id == current_user_id
        ).distinct().all()
        
        return jsonify({
            'success': True,
            'activities': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'page': page,
            'perPage': per_page,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev,
            'filters': {
                'actionTypes': [t[0] for t in action_types],
                'categories': [c[0] for c in categories]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_activity_stats():
    """Get activity statistics for the current user"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Total activities
        total = ActivityLog.query.filter(ActivityLog.user_id == current_user_id).count()
        
        # Today's activities
        today_count = ActivityLog.query.filter(
            ActivityLog.user_id == current_user_id,
            func.date(ActivityLog.created_at) == today
        ).count()
        
        # This week
        week_count = ActivityLog.query.filter(
            ActivityLog.user_id == current_user_id,
            func.date(ActivityLog.created_at) >= week_ago
        ).count()
        
        # By category
        category_stats = db.session.query(
            ActivityLog.action_category,
            func.count(ActivityLog.id)
        ).filter(
            ActivityLog.user_id == current_user_id
        ).group_by(ActivityLog.action_category).all()
        
        # By action type (top 5)
        action_stats = db.session.query(
            ActivityLog.action_type,
            func.count(ActivityLog.id)
        ).filter(
            ActivityLog.user_id == current_user_id
        ).group_by(ActivityLog.action_type).order_by(
            func.count(ActivityLog.id).desc()
        ).limit(5).all()
        
        # Daily activity trend (last 7 days)
        daily_trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = ActivityLog.query.filter(
                ActivityLog.user_id == current_user_id,
                func.date(ActivityLog.created_at) == day
            ).count()
            daily_trend.append({
                'date': day.isoformat(),
                'count': count
            })
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total,
                'today': today_count,
                'thisWeek': week_count,
                'byCategory': {cat: count for cat, count in category_stats},
                'topActions': [{'action': action, 'count': count} for action, count in action_stats],
                'dailyTrend': daily_trend
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/export', methods=['GET'])
@jwt_required()
def export_activity_logs():
    """
    Export activity logs as CSV
    Users can only export their own logs
    """
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get filters from query params
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        category = request.args.get('category', None)
        action_type = request.args.get('action_type', None)
        
        # Build query - always filtered by current user
        query = ActivityLog.query.filter(ActivityLog.user_id == current_user_id)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(ActivityLog.created_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(ActivityLog.created_at < to_date)
            except ValueError:
                pass
        
        if category and category != 'all':
            query = query.filter(ActivityLog.action_category == category)
        
        if action_type and action_type != 'all':
            query = query.filter(ActivityLog.action_type == action_type)
        
        # Get all matching logs
        logs = query.order_by(ActivityLog.created_at.desc()).all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            'Date & Time (UTC)',
            'Category',
            'Action Type',
            'Description',
            'Target',
            'Status',
            'IP Address'
        ])
        
        # Data rows
        for log in logs:
            writer.writerow([
                log.created_at.strftime('%Y-%m-%d %H:%M:%S') if log.created_at else '',
                log.action_category,
                log.action_type,
                log.description,
                log.target_name or '',
                log.status,
                log.ip_address or ''
            ])
        
        # Create response
        output.seek(0)
        
        # Generate filename with current timestamp
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f'activity_log_{user.first_name}_{user.last_name}_{timestamp}.csv'
        
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_activities():
    """Get most recent activities (for dashboard widgets)"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        limit = request.args.get('limit', 10, type=int)
        
        logs = ActivityLog.query.filter(
            ActivityLog.user_id == current_user_id
        ).order_by(
            ActivityLog.created_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'activities': [log.to_dict() for log in logs]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# NOTE: No PUT, PATCH, or DELETE endpoints
# Activity logs are IMMUTABLE - users cannot edit or delete them
# This is by design for audit trail integrity
