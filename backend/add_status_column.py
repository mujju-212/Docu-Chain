#!/usr/bin/env python3

from app import db, create_app
from sqlalchemy import text
import traceback

app = create_app()

with app.app_context():
    try:
        db.session.rollback()
        print('Adding status column to institutions table...')
        
        # Add status column
        db.session.execute(text("ALTER TABLE institutions ADD COLUMN status VARCHAR(20) DEFAULT 'pending'"))
        db.session.commit()
        print('Status column added successfully')
        
        # Add is_active column  
        db.session.execute(text("ALTER TABLE institutions ADD COLUMN is_active BOOLEAN DEFAULT true"))
        db.session.commit()
        print('is_active column added successfully')
        
        print('Database migration completed successfully!')
        
    except Exception as e:
        print(f'Error: {e}')
        traceback.print_exc()
        db.session.rollback()