"""
Make ipfs_hash column nullable in documents table
This allows creating document entries before IPFS upload completes
"""
import sys
from app import create_app, db
from sqlalchemy import text

def fix_ipfs_hash_column():
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Making ipfs_hash column nullable...")
            
            # Make ipfs_hash nullable
            db.session.execute(text("""
                ALTER TABLE documents 
                ALTER COLUMN ipfs_hash DROP NOT NULL;
            """))
            
            db.session.commit()
            print("✅ Successfully made ipfs_hash column nullable")
            
            # Verify the change
            result = db.session.execute(text("""
                SELECT column_name, is_nullable, data_type
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name = 'ipfs_hash';
            """))
            
            row = result.fetchone()
            if row:
                print(f"✅ Verification: ipfs_hash is now nullable={row[1]}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    fix_ipfs_hash_column()
