"""
Migration script to add document_type column to messages table
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def run_migration():
    app = create_app()
    with app.app_context():
        try:
            # Check if column exists
            result = db.session.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'document_type'
            """))
            
            if result.fetchone():
                print("✅ document_type column already exists")
                return
            
            # Add the column
            db.session.execute(text("""
                ALTER TABLE messages ADD COLUMN document_type VARCHAR(50)
            """))
            db.session.commit()
            print("✅ Added document_type column to messages table")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()

if __name__ == '__main__':
    run_migration()
