"""Add theme column to users table

This script adds a theme column to the users table to support user theme preferences.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def add_theme_column():
    """Add theme column to users table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if column already exists
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='theme'
            """))
            
            if result.fetchone() is None:
                print("Adding theme column to users table...")
                
                # Add the theme column with default value
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN theme VARCHAR(20) DEFAULT 'green'
                """))
                
                # Update existing users to have the default theme
                db.session.execute(text("""
                    UPDATE users 
                    SET theme = 'green' 
                    WHERE theme IS NULL
                """))
                
                db.session.commit()
                print("✅ Theme column added successfully!")
            else:
                print("Theme column already exists.")
                
        except Exception as e:
            print(f"❌ Error adding theme column: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    add_theme_column()