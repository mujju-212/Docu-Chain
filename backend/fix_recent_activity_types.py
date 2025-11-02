"""
Fix recent_activity table - change file_id and document_id to string to support UUIDs
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        print('🔧 Fixing recent_activity table column types...')
        
        # Change file_id from integer to varchar
        print('  - Changing file_id to VARCHAR(255)...')
        db.session.execute(text("""
            ALTER TABLE recent_activity 
            ALTER COLUMN file_id TYPE VARCHAR(255) USING file_id::VARCHAR
        """))
        
        # Change document_id from integer to varchar
        print('  - Changing document_id to VARCHAR(255)...')
        db.session.execute(text("""
            ALTER TABLE recent_activity 
            ALTER COLUMN document_id TYPE VARCHAR(255) USING document_id::VARCHAR
        """))
        
        db.session.commit()
        print('✅ Recent activity table fixed successfully!')
        
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        db.session.rollback()
