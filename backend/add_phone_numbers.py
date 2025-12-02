"""Add missing phone numbers to users in the database"""
from app import create_app, db
from app.models.user import User
import random

app = create_app()

# Sample phone number prefixes for India
phone_prefixes = ['9876', '9988', '8765', '7890', '9012', '8899', '9567', '8234', '9345', '8456']

with app.app_context():
    # Get all users without phone numbers
    users_without_phone = User.query.filter(User.phone.is_(None)).all()
    
    print(f"Found {len(users_without_phone)} users without phone numbers")
    
    for user in users_without_phone:
        # Generate a random 10-digit phone number
        prefix = random.choice(phone_prefixes)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        phone = f"+91 {prefix}{suffix}"
        
        user.phone = phone
        print(f"Added phone {phone} to {user.email}")
    
    db.session.commit()
    print(f"\nUpdated {len(users_without_phone)} users with phone numbers")
    
    # Verify
    print("\n=== VERIFICATION ===")
    users = User.query.limit(10).all()
    for u in users:
        print(f"{u.email}: Phone={u.phone}")
