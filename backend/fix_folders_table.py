#!/usr/bin/env python3

"""
Fix folders table structure
"""

from app import create_app, db

def fix_folders_table():
    """Add missing columns to folders table"""
    
    app = create_app()
    with app.app_context():
        try:
            # Check current columns
            result = db.session.execute(db.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'folders'"))
            current_columns = [row[0] for row in result]
            print("Current columns:", current_columns)
            
            # Required columns based on the Folder model
            required_columns = [
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES folders(id)",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS path VARCHAR(1000) NOT NULL DEFAULT '/'",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE", 
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_in_trash BOOLEAN DEFAULT FALSE",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS trash_date TIMESTAMP",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ]
            
            print("Adding missing columns...")
            for sql in required_columns:
                try:
                    db.session.execute(db.text(sql))
                    print(f"✅ {sql}")
                except Exception as e:
                    print(f"⚠️  {sql} - {e}")
                    
            db.session.commit()
            print("✅ Folders table structure updated")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()

if __name__ == "__main__":
    fix_folders_table()