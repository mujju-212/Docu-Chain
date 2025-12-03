"""
Migration script to create blockchain_transactions and wallet_balances tables
Run this script to add blockchain monitoring tables to the database
"""
from app import create_app, db
from sqlalchemy import text

def create_blockchain_tables():
    """Create blockchain monitoring tables"""
    app = create_app()
    
    with app.app_context():
        # Check if tables already exist
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if 'blockchain_transactions' in existing_tables:
            print("⚠ blockchain_transactions table already exists")
        else:
            # Create blockchain_transactions table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS blockchain_transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tx_hash VARCHAR(100) UNIQUE NOT NULL,
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    wallet_address VARCHAR(50) NOT NULL,
                    transaction_type VARCHAR(50) NOT NULL,
                    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
                    document_name VARCHAR(255),
                    gas_used BIGINT,
                    gas_price BIGINT,
                    gas_cost_wei BIGINT,
                    gas_cost_eth DECIMAL(24, 18),
                    status VARCHAR(20) DEFAULT 'pending',
                    error_message TEXT,
                    block_number BIGINT,
                    block_timestamp TIMESTAMP,
                    extra_data JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✓ Created blockchain_transactions table")
            
            # Create indexes for better query performance
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user ON blockchain_transactions(user_id);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blockchain_tx_wallet ON blockchain_transactions(wallet_address);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blockchain_tx_type ON blockchain_transactions(transaction_type);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blockchain_tx_created ON blockchain_transactions(created_at DESC);
            """))
            print("✓ Created indexes for blockchain_transactions")
        
        if 'wallet_balances' in existing_tables:
            print("⚠ wallet_balances table already exists")
        else:
            # Create wallet_balances table
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS wallet_balances (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    wallet_address VARCHAR(50) NOT NULL,
                    balance_wei BIGINT DEFAULT 0,
                    balance_eth DECIMAL(24, 18) DEFAULT 0,
                    total_spent_wei BIGINT DEFAULT 0,
                    total_spent_eth DECIMAL(24, 18) DEFAULT 0,
                    today_spent_wei BIGINT DEFAULT 0,
                    today_spent_eth DECIMAL(24, 18) DEFAULT 0,
                    transaction_count INTEGER DEFAULT 0,
                    successful_transactions INTEGER DEFAULT 0,
                    failed_transactions INTEGER DEFAULT 0,
                    last_transaction_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, wallet_address)
                )
            """))
            print("✓ Created wallet_balances table")
            
            # Create indexes for wallet_balances
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_wallet_balance_user ON wallet_balances(user_id);
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_wallet_balance_address ON wallet_balances(wallet_address);
            """))
            print("✓ Created indexes for wallet_balances")
        
        db.session.commit()
        print("\n✅ Blockchain tables migration completed!")
        
        # List final state
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        blockchain_tables = [t for t in tables if 'blockchain' in t or 'wallet' in t]
        print(f"\nBlockchain-related tables in database:")
        for table in blockchain_tables:
            print(f"  - {table}")

if __name__ == '__main__':
    create_blockchain_tables()
