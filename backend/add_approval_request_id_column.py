"""
Add approval_request_id column to generated_documents table
"""
import psycopg2
from config import Config

def add_column():
    """Add approval_request_id column to generated_documents table"""
    
    conn = psycopg2.connect(Config.SQLALCHEMY_DATABASE_URI)
    cur = conn.cursor()
    
    try:
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'generated_documents' 
            AND column_name = 'approval_request_id'
        """)
        
        if cur.fetchone():
            print("Column 'approval_request_id' already exists")
        else:
            # Add the column
            cur.execute("""
                ALTER TABLE generated_documents 
                ADD COLUMN approval_request_id VARCHAR(100)
            """)
            conn.commit()
            print("Added 'approval_request_id' column to generated_documents table")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    add_column()
