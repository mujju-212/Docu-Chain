"""
Fix Document Templates Schema
Add missing columns to document_templates table
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Check existing columns
    result = db.session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'document_templates'"
    ))
    existing_columns = [row[0] for row in result.fetchall()]
    print(f"Existing columns: {existing_columns}")
    
    # Add missing columns
    missing_columns = []
    
    if 'category' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN category VARCHAR(50) DEFAULT 'all'")
        print("Adding 'category' column...")
    
    if 'icon' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN icon VARCHAR(50) DEFAULT '📄'")
        print("Adding 'icon' column...")
    
    if 'color' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6'")
        print("Adding 'color' column...")
    
    if 'estimated_time' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN estimated_time VARCHAR(20) DEFAULT '5 min'")
        print("Adding 'estimated_time' column...")
    
    if 'fields' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN fields JSONB DEFAULT '[]'::jsonb")
        print("Adding 'fields' column...")
    
    if 'approval_chain' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN approval_chain JSONB DEFAULT '[]'::jsonb")
        print("Adding 'approval_chain' column...")
    
    if 'is_system' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN is_system BOOLEAN DEFAULT FALSE")
        print("Adding 'is_system' column...")
    
    if 'is_active' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
        print("Adding 'is_active' column...")
    
    if 'created_by' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN created_by UUID REFERENCES users(id)")
        print("Adding 'created_by' column...")
    
    if 'updated_at' not in existing_columns:
        missing_columns.append("ALTER TABLE document_templates ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        print("Adding 'updated_at' column...")
    
    # Execute the alterations
    for sql in missing_columns:
        try:
            db.session.execute(text(sql))
            print(f"  ✅ Executed: {sql[:50]}...")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    db.session.commit()
    print("\n✅ Schema update complete!")
    
    # Verify
    result = db.session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'document_templates'"
    ))
    final_columns = [row[0] for row in result.fetchall()]
    print(f"\nFinal columns: {final_columns}")
