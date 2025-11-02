"""
Migration script to add recent_activity table for tracking user file activities
"""
import sys
import os
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app import create_app, db
from sqlalchemy import text

def add_recent_activity_table():
    """Add recent_activity table to database"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔄 Creating recent_activity table...")
            
            # Create recent_activity table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS recent_activity (
                    id SERIAL PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    file_id INTEGER,
                    file_name VARCHAR(255) NOT NULL,
                    file_type VARCHAR(50) DEFAULT 'file',
                    action VARCHAR(50) NOT NULL,
                    file_size VARCHAR(50),
                    owner VARCHAR(100),
                    document_id INTEGER,
                    ipfs_hash VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            
            # Create index on user_id and created_at for faster queries
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_recent_activity_user_created 
                ON recent_activity(user_id, created_at DESC)
            """))
            
            db.session.commit()
            print("✅ Recent activity table created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating recent_activity table: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    add_recent_activity_table()
