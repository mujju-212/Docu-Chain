"""
Cleanup script to remove improperly created generated documents
Run this script to clean up test/failed document entries
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def cleanup_generated_documents():
    """Remove all generated documents and their file manager entries using raw SQL"""
    app = create_app()
    
    with app.app_context():
        try:
            # Count documents before cleanup
            result = db.session.execute(text("SELECT COUNT(*) FROM generated_documents"))
            gen_doc_count = result.scalar()
            
            result = db.session.execute(text("""
                SELECT COUNT(*) FROM documents 
                WHERE folder_id IN (SELECT id FROM folders WHERE name = 'Generated' AND is_system_folder = true)
            """))
            fm_doc_count = result.scalar()
            
            print(f"\n📊 Current Status:")
            print(f"   - Generated Documents (template-based): {gen_doc_count}")
            print(f"   - Documents in 'Generated' folders: {fm_doc_count}")
            
            # Ask for confirmation
            confirm = input("\n⚠️  Do you want to delete ALL these documents? (yes/no): ")
            
            if confirm.lower() == 'yes':
                # Delete file manager documents in Generated folders
                db.session.execute(text("""
                    DELETE FROM documents 
                    WHERE folder_id IN (SELECT id FROM folders WHERE name = 'Generated' AND is_system_folder = true)
                """))
                
                # Delete generated documents
                db.session.execute(text("DELETE FROM generated_documents"))
                
                db.session.commit()
                
                print(f"\n✅ Cleanup Complete!")
                print(f"   - Deleted {gen_doc_count} generated documents")
                print(f"   - Deleted {fm_doc_count} file manager documents")
            else:
                print("\n❌ Cleanup cancelled.")
                
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error during cleanup: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    cleanup_generated_documents()
