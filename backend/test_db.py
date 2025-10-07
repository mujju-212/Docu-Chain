#!/usr/bin/env python3
"""Test database connection and check tables"""

from app import create_app
from app.models.user import User
from app.models.institution import Institution
from sqlalchemy.exc import ProgrammingError

def test_db():
    app = create_app()
    
    with app.app_context():
        try:
            # Test table existence and count records
            user_count = User.query.count()
            inst_count = Institution.query.count()
            
            print("✅ DATABASE CONNECTION: SUCCESS")
            print(f"📊 Users table: {user_count} records")
            print(f"🏢 Institutions table: {inst_count} records")
            
            # Get sample data
            if inst_count > 0:
                sample_institutions = Institution.query.limit(3).all()
                print("\n🏢 Sample Institutions:")
                for inst in sample_institutions:
                    print(f"  - {inst.name} (ID: {inst.id}, Type: {inst.type})")
            
            if user_count > 0:
                sample_users = User.query.limit(3).all()
                print("\n👤 Sample Users:")
                for user in sample_users:
                    print(f"  - {user.email} ({user.role}, Status: {user.status})")
            
            return True
            
        except Exception as e:
            print(f"❌ DATABASE ERROR: {e}")
            return False

if __name__ == "__main__":
    test_db()