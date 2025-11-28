"""
Database migration script to create chat-related tables.
Run this script to set up the chat system tables.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.chat import Conversation, ConversationMember, Message, UserOnlineStatus

def create_chat_tables():
    """Create chat tables if they don't exist"""
    app = create_app()
    
    with app.app_context():
        # Create all tables (only creates if they don't exist)
        db.create_all()
        
        print("✅ Chat tables created successfully!")
        print("   - conversations")
        print("   - conversation_members")
        print("   - messages")
        print("   - user_online_status")

if __name__ == '__main__':
    create_chat_tables()
