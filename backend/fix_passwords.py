#!/usr/bin/env python3
"""
Fix passwords in the database to use Werkzeug hashing method
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from werkzeug.security import generate_password_hash

def fix_passwords():
    """Update all user passwords to use Werkzeug hashing"""
    app = create_app()
    
    with app.app_context():
        try:
            # Define the plain text passwords for each test user
            password_updates = {
                'admin@mu.ac.in': 'admin123',
                'admin@vit.edu': 'admin123', 
                'admin@dps.edu': 'admin123',
                'meera.patel@mu.ac.in': 'faculty123',
                'suresh.gupta@mu.ac.in': 'faculty123',
                'kavita.joshi@vit.edu': 'faculty123',
                'ravi.mehta@vit.edu': 'faculty123',
                'sunita.verma@dps.edu': 'faculty123',
                'aarav.sharma@student.mu.ac.in': 'student123',
                'ananya.singh@student.mu.ac.in': 'student123',
                'rohan.gupta@student.vit.edu': 'student123',
                'kavya.patel@student.vit.edu': 'student123',
                'arjun.kumar@student.dps.edu': 'student123',
                'isha.agarwal@student.dps.edu': 'student123'
            }
            
            updated_count = 0
            
            for email, plain_password in password_updates.items():
                user = User.query.filter_by(email=email).first()
                if user:
                    # Hash the password using Werkzeug method
                    user.password_hash = generate_password_hash(plain_password)
                    print(f"Updated password for {email}")
                    updated_count += 1
                else:
                    print(f"User not found: {email}")
            
            # Commit all changes
            db.session.commit()
            print(f"\nSuccessfully updated {updated_count} user passwords!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating passwords: {e}")
            return False
        
        return True

if __name__ == '__main__':
    print("Fixing user passwords...")
    if fix_passwords():
        print("Password fix completed successfully!")
    else:
        print("Password fix failed!")
        sys.exit(1)