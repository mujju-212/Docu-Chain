"""
Database initialization script for DocuChain
Run this file to create all database tables
"""
from app import create_app, db

def init_database():
    """Initialize the database and create all tables"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database tables created successfully!")
        
        # Print created tables
        print("\nCreated tables:")
        for table in db.metadata.sorted_tables:
            print(f"  - {table.name}")

if __name__ == '__main__':
    init_database()
