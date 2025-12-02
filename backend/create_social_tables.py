"""
Create tables for likes, comments, and saved posts
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

app = create_app()

def create_social_tables():
    with app.app_context():
        # Create the message_likes table
        db.session.execute(db.text('''
            CREATE TABLE IF NOT EXISTS message_likes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, user_id)
            )
        '''))
        
        # Create the message_comments table
        db.session.execute(db.text('''
            CREATE TABLE IF NOT EXISTS message_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                parent_id UUID REFERENCES message_comments(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                edited_at TIMESTAMP,
                is_deleted BOOLEAN DEFAULT FALSE
            )
        '''))
        
        # Create the saved_posts table
        db.session.execute(db.text('''
            CREATE TABLE IF NOT EXISTS saved_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, user_id)
            )
        '''))
        
        # Create indexes for performance
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_message_likes_message ON message_likes(message_id)
        '''))
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_message_likes_user ON message_likes(user_id)
        '''))
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_message_comments_message ON message_comments(message_id)
        '''))
        db.session.execute(db.text('''
            CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id)
        '''))
        
        db.session.commit()
        print("✅ Successfully created social tables:")
        print("   - message_likes")
        print("   - message_comments")
        print("   - saved_posts")

if __name__ == '__main__':
    create_social_tables()
