"""
Migration script to create activity_logs table
Run this script to add activity logging to the database
"""
from app import create_app, db
from sqlalchemy import text

def create_activity_logs_table():
    """Create the activity_logs table for comprehensive activity tracking"""
    app = create_app()
    
    with app.app_context():
        # Check if table already exists
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if 'activity_logs' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('activity_logs')]
            print(f"⚠ activity_logs table already exists with columns: {columns}")
            
            # Check if it's the old schema (has 'action' instead of 'action_type')
            if 'action' in columns and 'action_type' not in columns:
                print("🔄 Old schema detected - dropping and recreating table...")
                db.session.execute(text("DROP TABLE IF EXISTS activity_logs CASCADE"))
                db.session.commit()
            elif 'action_type' in columns:
                print("✓ Table has correct schema")
                db.session.commit()
                return
            else:
                print("🔄 Schema mismatch - dropping and recreating table...")
                db.session.execute(text("DROP TABLE IF EXISTS activity_logs CASCADE"))
                db.session.commit()
        
        # Create activity_logs table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    action_type VARCHAR(50) NOT NULL,
                    action_category VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    target_id VARCHAR(255),
                    target_type VARCHAR(50),
                    target_name VARCHAR(500),
                    extra_data JSONB DEFAULT '{}',
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(500),
                    status VARCHAR(20) DEFAULT 'success',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            print("✓ Created activity_logs table")
            
            # Create indexes for better query performance
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
                ON activity_logs(user_id);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type 
                ON activity_logs(action_type);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_activity_logs_category 
                ON activity_logs(action_category);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
                ON activity_logs(created_at DESC);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
                ON activity_logs(user_id, created_at DESC);
            """))
            print("✓ Created indexes for activity_logs")
        
        db.session.commit()
        print("\n✅ Activity logs table migration completed!")
        
        # Verify
        inspector = db.inspect(db.engine)
        if 'activity_logs' in inspector.get_table_names():
            columns = inspector.get_columns('activity_logs')
            print(f"\nTable structure:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")

if __name__ == '__main__':
    create_activity_logs_table()
