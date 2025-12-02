"""Check database columns for sections table"""
from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Check sections columns
    result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'sections'"))
    print('Sections columns:', [r[0] for r in result])
    
    # Check users with missing info
    result2 = db.session.execute(text("SELECT id, email, first_name, last_name, phone, role, department_id, section_id FROM users LIMIT 10"))
    print('\n=== USERS ===')
    for r in result2:
        print(f"Email: {r[1]}, Name: {r[2]} {r[3]}, Phone: {r[4]}, Role: {r[5]}, DeptID: {r[6]}, SectID: {r[7]}")
