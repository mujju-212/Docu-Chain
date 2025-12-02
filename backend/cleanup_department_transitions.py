"""
Cleanup script to remove users from old department groups after 30 days.
This script should be run periodically (e.g., daily via cron job or scheduled task).

Usage:
    python cleanup_department_transitions.py
"""

from app import create_app, db
from app.models.user import User
from app.models.chat import Conversation, ConversationMember
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_department_transitions():
    """
    Remove users from their old department groups 30 days after department change.
    
    Logic:
    - Find users where previous_department_id is set and department_changed_at is > 30 days ago
    - For each user, remove them from the old department group
    - Clear the previous_department_id and department_changed_at fields
    """
    app = create_app()
    
    with app.app_context():
        try:
            # Calculate the cutoff date (30 days ago)
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            # Find users with pending department transitions older than 30 days
            users_to_cleanup = User.query.filter(
                User.previous_department_id.isnot(None),
                User.department_changed_at.isnot(None),
                User.department_changed_at <= cutoff_date
            ).all()
            
            logger.info(f"Found {len(users_to_cleanup)} users with department transitions older than 30 days")
            
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
            
            logger.info(f"✅ Cleanup complete! Removed {cleanup_count} users from old department groups")
            print(f"\n✅ Department transition cleanup complete!")
            print(f"   - Users processed: {len(users_to_cleanup)}")
            print(f"   - Members removed from old groups: {cleanup_count}")
            
            return cleanup_count
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Error during cleanup: {str(e)}")
            raise


def check_pending_transitions():
    """Check and display pending department transitions"""
    app = create_app()
    
    with app.app_context():
        try:
            users_with_pending = User.query.filter(
                User.previous_department_id.isnot(None),
                User.department_changed_at.isnot(None)
            ).all()
            
            print(f"\n📋 Pending Department Transitions: {len(users_with_pending)}")
            print("-" * 80)
            
            for user in users_with_pending:
                from app.models.institution import Department
                old_dept = Department.query.get(user.previous_department_id)
                new_dept = Department.query.get(user.department_id) if user.department_id else None
                
                days_since = (datetime.utcnow() - user.department_changed_at).days
                days_remaining = 30 - days_since
                
                print(f"User: {user.email}")
                print(f"  From: {old_dept.name if old_dept else 'None'} → To: {new_dept.name if new_dept else 'None'}")
                print(f"  Changed: {user.department_changed_at.strftime('%Y-%m-%d %H:%M')}")
                print(f"  Days remaining in old group: {max(0, days_remaining)}")
                print()
                
        except Exception as e:
            logger.error(f"Error checking pending transitions: {str(e)}")
            raise


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        check_pending_transitions()
    else:
        cleanup_department_transitions()
