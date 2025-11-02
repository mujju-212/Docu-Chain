#!/usr/bin/env python3

"""
Check documents table structure and fix missing columns
"""

from app import create_app, db

def check_and_fix_documents_table():
    """Check and fix documents table structure"""
    
    app = create_app()
    with app.app_context():
        try:
            # Check current columns in documents table
            result = db.session.execute(db.text("SELECT column_name FROM information_schema.columns WHERE table_name = 'documents'"))
            current_columns = [row[0] for row in result]
            print("Current documents columns:", current_columns)
            
            # Required columns based on the Document model
            required_columns = [
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_id VARCHAR(66) UNIQUE",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ipfs_hash VARCHAR(100)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(50)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_address VARCHAR(42)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66)",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS block_number INTEGER",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_in_trash BOOLEAN DEFAULT FALSE",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS trash_date TIMESTAMP",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS timestamp BIGINT",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ]
            
            print("Adding missing columns to documents table...")
            for sql in required_columns:
                try:
                    db.session.execute(db.text(sql))
                    print(f"✅ {sql}")
                except Exception as e:
                    print(f"⚠️  {sql} - {e}")
                    
            db.session.commit()
            print("✅ Documents table structure updated")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()

if __name__ == "__main__":
    check_and_fix_documents_table()