"""
Script to remove UNIQUE constraint from ipfs_hash column in documents table
This allows multiple folder references to point to the same blockchain file
"""

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Drop the unique constraint on ipfs_hash
        db.session.execute(text('''
            ALTER TABLE documents 
            DROP CONSTRAINT IF EXISTS documents_ipfs_hash_key;
        '''))
        
        db.session.commit()
        print("✅ Successfully removed UNIQUE constraint from ipfs_hash")
        print("📁 Multiple folder references can now point to the same blockchain file")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
