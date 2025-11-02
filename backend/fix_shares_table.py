from app import create_app, db
from sqlalchemy import text

app = create_app()
app.app_context().push()

print("🔧 Adding missing columns to document_shares table...")

try:
    # Add transaction_hash column
    db.session.execute(text("""
        ALTER TABLE document_shares 
        ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66)
    """))
    print("  ✅ Added transaction_hash column")
    
    # Add block_number column
    db.session.execute(text("""
        ALTER TABLE document_shares 
        ADD COLUMN IF NOT EXISTS block_number INTEGER
    """))
    print("  ✅ Added block_number column")
    
    # Add shared_at column
    db.session.execute(text("""
        ALTER TABLE document_shares 
        ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """))
    print("  ✅ Added shared_at column")
    
    # Rename columns if needed (check if old names exist first)
    db.session.execute(text("""
        DO $$
        BEGIN
            IF EXISTS(SELECT * FROM information_schema.columns 
                      WHERE table_name='document_shares' AND column_name='shared_by') 
               AND NOT EXISTS(SELECT * FROM information_schema.columns 
                            WHERE table_name='document_shares' AND column_name='shared_by_id') THEN
                ALTER TABLE document_shares RENAME COLUMN shared_by TO shared_by_id;
            END IF;
        END $$;
    """))
    print("  ✅ Renamed shared_by to shared_by_id (if needed)")
    
    db.session.execute(text("""
        DO $$
        BEGIN
            IF EXISTS(SELECT * FROM information_schema.columns 
                      WHERE table_name='document_shares' AND column_name='shared_with') 
               AND NOT EXISTS(SELECT * FROM information_schema.columns 
                            WHERE table_name='document_shares' AND column_name='shared_with_id') THEN
                ALTER TABLE document_shares RENAME COLUMN shared_with TO shared_with_id;
            END IF;
        END $$;
    """))
    print("  ✅ Renamed shared_with to shared_with_id (if needed)")
    
    db.session.commit()
    print("\n✅ Database schema updated successfully!")
    
except Exception as e:
    db.session.rollback()
    print(f"\n❌ Error updating schema: {str(e)}")
