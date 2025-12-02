"""
Add department change tracking columns to users table.
These columns track when a user's department changes and their previous department.
"""

from app import create_app, db
from sqlalchemy import text
from datetime import datetime

def add_department_change_tracking():
    """Add previous_department_id and department_changed_at columns to users table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('previous_department_id', 'department_changed_at')
            """)
            result = db.session.execute(check_query)
            existing_columns = [row[0] for row in result.fetchall()]
            
            if 'previous_department_id' not in existing_columns:
                print("Adding previous_department_id column...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN previous_department_id UUID REFERENCES departments(id)
                """))
                print("✓ previous_department_id column added")
            else:
                print("✓ previous_department_id column already exists")
            
            if 'department_changed_at' not in existing_columns:
                print("Adding department_changed_at column...")
                db.session.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN department_changed_at TIMESTAMP
                """))
                print("✓ department_changed_at column added")
            else:
                print("✓ department_changed_at column already exists")
            
            db.session.commit()
            print("\n✅ Department change tracking columns added successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {str(e)}")
            raise

if __name__ == '__main__':
    add_department_change_tracking()
