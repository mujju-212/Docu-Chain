"""
Create Generated Documents Table
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Check if generated_documents table exists
    result = db.session.execute(text(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'generated_documents'"
    ))
    exists = result.fetchone()
    
    if exists:
        print("✅ generated_documents table already exists")
        # Check columns
        result = db.session.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'generated_documents'"
        ))
        cols = [row[0] for row in result.fetchall()]
        print(f"Columns: {cols}")
    else:
        print("Creating generated_documents table...")
        db.session.execute(text("""
            CREATE TABLE generated_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                request_id VARCHAR(50) UNIQUE NOT NULL,
                template_id UUID REFERENCES document_templates(id) NOT NULL,
                template_name VARCHAR(255) NOT NULL,
                requester_id UUID REFERENCES users(id) NOT NULL,
                institution_id UUID REFERENCES institutions(id) NOT NULL,
                form_data JSONB NOT NULL,
                generated_content TEXT,
                pdf_ipfs_hash VARCHAR(100),
                blockchain_tx_hash VARCHAR(100),
                status VARCHAR(20) DEFAULT 'draft',
                current_approver_index INTEGER DEFAULT 0,
                approval_history JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                completed_at TIMESTAMP
            )
        """))
        db.session.commit()
        print("✅ generated_documents table created!")
