from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid

class BlockchainTransaction(db.Model):
    """Model to store all blockchain transactions for monitoring"""
    __tablename__ = 'blockchain_transactions'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Transaction details - using transaction_hash to match existing table
    transaction_hash = db.Column(db.String(255), nullable=True, index=True)
    block_number = db.Column(db.BigInteger, nullable=True)
    
    # User who initiated the transaction
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    
    # Transaction type
    transaction_type = db.Column(db.String(50), nullable=False, index=True)
    # Types: 'upload', 'share', 'request_approval', 'approve', 'reject', 'revoke_share', 'verify'
    
    # Related document (if applicable)
    document_id = db.Column(UUID(as_uuid=True), db.ForeignKey('documents.id'), nullable=True)
    
    # Gas and cost details
    gas_used = db.Column(db.BigInteger, nullable=True)
    gas_price = db.Column(db.BigInteger, nullable=True)  # in wei
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    # Status: 'pending', 'confirmed', 'failed'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        # Calculate gas cost if we have gas_used and gas_price
        gas_cost_wei = None
        gas_cost_eth = None
        if self.gas_used and self.gas_price:
            gas_cost_wei = self.gas_used * self.gas_price
            gas_cost_eth = gas_cost_wei / 1e18
        
        return {
            'id': str(self.id),
            'txHash': self.transaction_hash,
            'blockNumber': self.block_number,
            'userId': str(self.user_id) if self.user_id else None,
            'transactionType': self.transaction_type,
            'documentId': str(self.document_id) if self.document_id else None,
            'gasUsed': self.gas_used,
            'gasPrice': self.gas_price,
            'gasCostWei': gas_cost_wei,
            'gasCostEth': gas_cost_eth,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'confirmedAt': self.confirmed_at.isoformat() if self.confirmed_at else None
        }
    
    @staticmethod
    def get_transaction_type_label(tx_type):
        """Get human-readable label for transaction type"""
        labels = {
            'upload': 'Document Upload',
            'share': 'Share Document',
            'request_approval': 'Request Approval',
            'approve': 'Approve Document',
            'reject': 'Reject Document',
            'revoke_share': 'Revoke Share',
            'verify': 'Verify Document'
        }
        return labels.get(tx_type, tx_type.replace('_', ' ').title())


class WalletBalance(db.Model):
    """Model to cache and track wallet balances"""
    __tablename__ = 'wallet_balances'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, unique=True)
    
    wallet_address = db.Column(db.String(42), nullable=False, unique=True, index=True)
    
    # Balance in wei and ETH
    balance_wei = db.Column(db.BigInteger, nullable=True)
    balance_eth = db.Column(db.Numeric(precision=18, scale=18), nullable=True)
    
    # Spending statistics
    total_spent_wei = db.Column(db.BigInteger, default=0)
    total_spent_eth = db.Column(db.Numeric(precision=18, scale=18), default=0)
    
    today_spent_wei = db.Column(db.BigInteger, default=0)
    today_spent_eth = db.Column(db.Numeric(precision=18, scale=18), default=0)
    today_date = db.Column(db.Date, nullable=True)  # To reset daily spending
    
    # Transaction counts
    total_transactions = db.Column(db.Integer, default=0)
    successful_transactions = db.Column(db.Integer, default=0)
    failed_transactions = db.Column(db.Integer, default=0)
    pending_transactions = db.Column(db.Integer, default=0)
    
    # Last updated
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'userId': str(self.user_id) if self.user_id else None,
            'walletAddress': self.wallet_address,
            'balanceWei': self.balance_wei,
            'balanceEth': float(self.balance_eth) if self.balance_eth else 0,
            'totalSpentWei': self.total_spent_wei or 0,
            'totalSpentEth': float(self.total_spent_eth) if self.total_spent_eth else 0,
            'todaySpentWei': self.today_spent_wei or 0,
            'todaySpentEth': float(self.today_spent_eth) if self.today_spent_eth else 0,
            'totalTransactions': self.total_transactions or 0,
            'successfulTransactions': self.successful_transactions or 0,
            'failedTransactions': self.failed_transactions or 0,
            'pendingTransactions': self.pending_transactions or 0,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
