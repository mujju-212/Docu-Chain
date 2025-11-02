"""
Make document_id column nullable in documents table
This allows creating document entries before blockchain upload completes
"""
import sys
from app import create_app, db
from sqlalchemy import text

def fix_document_id_column():
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Making document_id column nullable...")
            
            # Make document_id nullable
            db.session.execute(text("""
                ALTER TABLE documents 
                ALTER COLUMN document_id DROP NOT NULL;
            """))
            
            db.session.commit()
            print("✅ Successfully made document_id column nullable")
            
            # Verify the change
            result = db.session.execute(text("""
                SELECT column_name, is_nullable, data_type
                FROM information_schema.columns
                WHERE table_name = 'documents'
                AND column_name IN ('document_id', 'ipfs_hash')
                ORDER BY column_name;
            """))
            
            print("\n✅ Verification:")
            for row in result:
                print(f"   - {row[0]}: nullable={row[1]}, type={row[2]}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    fix_document_id_column()
