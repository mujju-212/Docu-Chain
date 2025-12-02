"""Update database constraint to allow 'suspended' status"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Drop the old constraint and add new one with 'suspended'
    db.session.execute(text('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check'))
    db.session.execute(text("""
        ALTER TABLE users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'banned', 'active', 'suspended'))
    """))
    db.session.commit()
    print('Constraint updated successfully!')
    
    # Verify
    result = db.session.execute(text("""
        SELECT pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'users' AND c.conname = 'users_status_check'
    """))
    for row in result:
        print('New constraint:', row[0])
