"""
Remove UNIQUE constraint from documents.document_id column.

This is needed to allow multiple document records (copies) to reference 
the same blockchain document_id. Each copy is just an organizational reference 
to the same blockchain file in different folders.
"""

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        print("🔧 Removing UNIQUE constraint from documents.document_id...")
        
        # Drop the unique constraint
        db.session.execute(text("""
            ALTER TABLE documents 
            DROP CONSTRAINT IF EXISTS documents_document_id_key;
        """))
        
        db.session.commit()
        print("✅ Successfully removed UNIQUE constraint from documents.document_id")
        print("✅ Multiple copies can now reference the same blockchain document!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
