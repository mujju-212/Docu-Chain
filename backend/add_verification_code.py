"""
Add verification_code and stamped_document fields to approval_requests table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

def add_verification_code_column():
    app = create_app()
    with app.app_context():
        try:
            # Add verification_code column
            db.session.execute(db.text("""
                ALTER TABLE approval_requests 
                ADD COLUMN IF NOT EXISTS verification_code VARCHAR(20) UNIQUE;
            """))
            print("✅ Added verification_code column")
            
            # Add index for verification_code
            db.session.execute(db.text("""
                CREATE INDEX IF NOT EXISTS idx_approval_requests_verification_code 
                ON approval_requests(verification_code);
            """))
            print("✅ Added index on verification_code")
            
            # Add stamped_document_ipfs_hash column
            db.session.execute(db.text("""
                ALTER TABLE approval_requests 
                ADD COLUMN IF NOT EXISTS stamped_document_ipfs_hash VARCHAR(255);
            """))
            print("✅ Added stamped_document_ipfs_hash column")
            
            # Add stamped_at column
            db.session.execute(db.text("""
                ALTER TABLE approval_requests 
                ADD COLUMN IF NOT EXISTS stamped_at TIMESTAMP;
            """))
            print("✅ Added stamped_at column")
            
            db.session.commit()
            print("\n✅ All columns added successfully!")
            
            # Generate verification codes for existing requests
            from app.models.approval import ApprovalRequest, generate_verification_code
            requests = ApprovalRequest.query.filter(ApprovalRequest.verification_code.is_(None)).all()
            
            for req in requests:
                # Generate unique code
                while True:
                    code = generate_verification_code()
                    existing = ApprovalRequest.query.filter_by(verification_code=code).first()
                    if not existing:
                        break
                req.verification_code = code
                print(f"  Generated code {code} for request {req.document_name}")
            
            db.session.commit()
            print(f"\n✅ Generated verification codes for {len(requests)} existing requests")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")
            raise

if __name__ == '__main__':
    add_verification_code_column()
