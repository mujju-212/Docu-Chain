"""Check database constraints on users table"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    result = db.session.execute(text("""
        SELECT pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'users' AND c.conname = 'users_status_check'
    """))
    for row in result:
        print('Constraint:', row[0])
