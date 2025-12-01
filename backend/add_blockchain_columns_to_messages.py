"""
Migration script to add blockchain sharing columns to the messages table.
Run this script to add new columns for blockchain transaction data.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def migrate():
    app = create_app()
    
    with app.app_context():
        print("🔄 Adding blockchain columns to messages table...")
        
        # Check if columns already exist
        try:
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'messages' 
                AND column_name IN ('share_permission', 'transaction_hash', 'block_number', 'blockchain_document_id')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            print(f"📋 Existing blockchain columns: {existing_columns}")
        except Exception as e:
            print(f"⚠️ Could not check existing columns: {e}")
            existing_columns = []
        
        # Add share_permission column
        if 'share_permission' not in existing_columns:
            try:
                db.session.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN share_permission VARCHAR(20)
                """))
                print("✅ Added share_permission column")
            except Exception as e:
                print(f"⚠️ share_permission column might already exist: {e}")
        else:
            print("✓ share_permission column already exists")
        
        # Add transaction_hash column
        if 'transaction_hash' not in existing_columns:
            try:
                db.session.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN transaction_hash VARCHAR(100)
                """))
                print("✅ Added transaction_hash column")
            except Exception as e:
                print(f"⚠️ transaction_hash column might already exist: {e}")
        else:
            print("✓ transaction_hash column already exists")
        
        # Add block_number column
        if 'block_number' not in existing_columns:
            try:
                db.session.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN block_number INTEGER
                """))
                print("✅ Added block_number column")
            except Exception as e:
                print(f"⚠️ block_number column might already exist: {e}")
        else:
            print("✓ block_number column already exists")
        
        # Add blockchain_document_id column
        if 'blockchain_document_id' not in existing_columns:
            try:
                db.session.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN blockchain_document_id VARCHAR(70)
                """))
                print("✅ Added blockchain_document_id column")
            except Exception as e:
                print(f"⚠️ blockchain_document_id column might already exist: {e}")
        else:
            print("✓ blockchain_document_id column already exists")
        
        db.session.commit()
        print("\n✅ Migration completed successfully!")
        print("\n📝 New columns added to messages table:")
        print("   - share_permission: 'read' or 'write' permission level")
        print("   - transaction_hash: Blockchain transaction hash (0x...)")
        print("   - block_number: Ethereum block number")
        print("   - blockchain_document_id: bytes32 document ID on blockchain")

if __name__ == '__main__':
    migrate()
