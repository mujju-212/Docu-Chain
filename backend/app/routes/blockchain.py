from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.blockchain_transaction import BlockchainTransaction, WalletBalance
from app.models.user import User
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, or_
from decimal import Decimal
import uuid as uuid_module

bp = Blueprint('blockchain', __name__, url_prefix='/api/blockchain')


def get_uuid_from_identity(identity):
    """Convert JWT identity to UUID object"""
    if isinstance(identity, uuid_module.UUID):
        return identity
    try:
        return uuid_module.UUID(str(identity))
    except (ValueError, AttributeError):
        return None


@bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get blockchain transactions for the current user with filters"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        tx_type = request.args.get('type', None)
        status = request.args.get('status', None)
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        search = request.args.get('search', None)
        
        # Base query - admin sees all, others see their own
        if user.role == 'admin':
            # Admin sees all transactions
            query = BlockchainTransaction.query
        else:
            # Regular users see only their own transactions
            query = BlockchainTransaction.query.filter(
                BlockchainTransaction.user_id == current_user_id
            )
        
        # Apply filters
        if tx_type and tx_type != 'all':
            query = query.filter(BlockchainTransaction.transaction_type == tx_type)
        
        if status and status != 'all':
            query = query.filter(BlockchainTransaction.status == status)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(BlockchainTransaction.created_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(BlockchainTransaction.created_at < to_date)
            except ValueError:
                pass
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                BlockchainTransaction.transaction_hash.ilike(search_pattern)
            )
        
        # Order by most recent first
        query = query.order_by(BlockchainTransaction.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        transactions = [tx.to_dict() for tx in pagination.items]
        
        return jsonify({
            'success': True,
            'transactions': transactions,
            'pagination': {
                'page': page,
                'perPage': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'hasNext': pagination.has_next,
                'hasPrev': pagination.has_prev
            }
        })
        
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/wallet-stats', methods=['GET'])
@jwt_required()
def get_wallet_stats():
    """Get wallet statistics for the current user"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        wallet_address = user.wallet_address
        today = date.today()
        
        # Base query based on role
        if user.role == 'admin':
            base_query = BlockchainTransaction.query
        else:
            base_query = BlockchainTransaction.query.filter(
                BlockchainTransaction.user_id == current_user_id
            )
        
        # Total transactions
        total_transactions = base_query.count()
        
        # By status
        successful = base_query.filter(BlockchainTransaction.status == 'confirmed').count()
        failed = base_query.filter(BlockchainTransaction.status == 'failed').count()
        pending = base_query.filter(BlockchainTransaction.status == 'pending').count()
        
        # Calculate total gas spent (gas_used * gas_price) for confirmed transactions
        total_gas_result = db.session.query(
            func.sum(BlockchainTransaction.gas_used * BlockchainTransaction.gas_price)
        ).filter(
            BlockchainTransaction.user_id == current_user_id,
            BlockchainTransaction.status == 'confirmed'
        ).scalar()
        
        total_spent_wei = total_gas_result or 0
        total_spent_eth = float(total_spent_wei) / 1e18 if total_spent_wei else 0
        
        # Today's spending
        today_gas_result = db.session.query(
            func.sum(BlockchainTransaction.gas_used * BlockchainTransaction.gas_price)
        ).filter(
            BlockchainTransaction.user_id == current_user_id,
            BlockchainTransaction.status == 'confirmed',
            func.date(BlockchainTransaction.created_at) == today
        ).scalar()
        
        today_spent_wei = today_gas_result or 0
        today_spent_eth = float(today_spent_wei) / 1e18 if today_spent_wei else 0
        
        # Transaction type breakdown
        type_stats = db.session.query(
            BlockchainTransaction.transaction_type,
            func.count(BlockchainTransaction.id)
        ).filter(
            BlockchainTransaction.user_id == current_user_id if user.role != 'admin' else True
        ).group_by(BlockchainTransaction.transaction_type).all()
        
        type_breakdown = {tx_type: count for tx_type, count in type_stats}
        
        # Recent spending trend (last 7 days)
        spending_trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_gas = db.session.query(
                func.sum(BlockchainTransaction.gas_used * BlockchainTransaction.gas_price)
            ).filter(
                BlockchainTransaction.user_id == current_user_id,
                BlockchainTransaction.status == 'confirmed',
                func.date(BlockchainTransaction.created_at) == day
            ).scalar() or 0
            
            spending_trend.append({
                'date': day.isoformat(),
                'spent': float(day_gas) / 1e18 if day_gas else 0
            })
        
        return jsonify({
            'success': True,
            'stats': {
                'walletAddress': wallet_address,
                'balanceEth': 0,  # Would need to be fetched from blockchain
                'totalSpentEth': total_spent_eth,
                'todaySpentEth': today_spent_eth,
                'totalTransactions': total_transactions,
                'successfulTransactions': successful,
                'failedTransactions': failed,
                'pendingTransactions': pending,
                'typeBreakdown': type_breakdown,
                'spendingTrend': spending_trend
            }
        })
        
    except Exception as e:
        print(f"Error getting wallet stats: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/transactions', methods=['POST'])
@jwt_required()
def record_transaction():
    """Record a new blockchain transaction"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Required fields
        tx_hash = data.get('txHash')
        transaction_type = data.get('transactionType')
        
        if not tx_hash or not transaction_type:
            return jsonify({'success': False, 'message': 'Transaction hash and type are required'}), 400
        
        # Check if transaction already exists
        existing = BlockchainTransaction.query.filter_by(transaction_hash=tx_hash).first()
        if existing:
            return jsonify({'success': False, 'message': 'Transaction already recorded'}), 409
        
        # Create transaction record
        transaction = BlockchainTransaction(
            transaction_hash=tx_hash,
            user_id=current_user_id,
            transaction_type=transaction_type,
            document_id=data.get('documentId'),
            gas_used=data.get('gasUsed'),
            gas_price=data.get('gasPrice'),
            block_number=data.get('blockNumber'),
            status=data.get('status', 'pending')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Transaction recorded successfully',
            'transaction': transaction.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error recording transaction: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/transactions/<tx_hash>/status', methods=['PUT'])
@jwt_required()
def update_transaction_status(tx_hash):
    """Update transaction status after confirmation"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
        
        transaction = BlockchainTransaction.query.filter_by(transaction_hash=tx_hash).first()
        
        if not transaction:
            return jsonify({'success': False, 'message': 'Transaction not found'}), 404
        
        # Verify ownership (user can only update their own transactions)
        if transaction.user_id != current_user_id:
            user = User.query.get(current_user_id)
            if not user or user.role != 'admin':
                return jsonify({'success': False, 'message': 'Not authorized'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'status' in data:
            transaction.status = data['status']
        
        if 'blockNumber' in data:
            transaction.block_number = data['blockNumber']
        
        if 'gasUsed' in data:
            transaction.gas_used = data['gasUsed']
        
        if 'gasPrice' in data:
            transaction.gas_price = data['gasPrice']
        
        if data.get('status') == 'success':
            transaction.confirmed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Transaction updated',
            'transaction': transaction.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating transaction: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/update-balance', methods=['POST'])
@jwt_required()
def update_wallet_balance():
    """Update wallet balance from frontend"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        wallet_address = data.get('walletAddress')
        balance_wei = data.get('balanceWei')
        balance_eth = data.get('balanceEth')
        
        if not wallet_address:
            return jsonify({'success': False, 'message': 'Wallet address is required'}), 400
        
        # Get or create wallet balance
        wallet_balance = WalletBalance.query.filter_by(user_id=current_user_id).first()
        
        if not wallet_balance:
            wallet_balance = WalletBalance(
                user_id=current_user_id,
                wallet_address=wallet_address
            )
            db.session.add(wallet_balance)
        
        # Update balance
        wallet_balance.wallet_address = wallet_address
        if balance_wei is not None:
            wallet_balance.balance_wei = balance_wei
        if balance_eth is not None:
            wallet_balance.balance_eth = Decimal(str(balance_eth))
        
        wallet_balance.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Balance updated',
            'balance': wallet_balance.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating balance: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/admin/analytics', methods=['GET'])
@jwt_required()
def get_admin_analytics():
    """Get platform-wide blockchain analytics (admin only)"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Total gas spent platform-wide
        total_gas_result = db.session.query(
            func.sum(BlockchainTransaction.gas_used * BlockchainTransaction.gas_price)
        ).filter(
            BlockchainTransaction.status == 'success'
        ).scalar()
        
        total_gas_wei = total_gas_result or 0
        total_gas_eth = float(total_gas_wei) / 1e18 if total_gas_wei else 0
        
        # Most active users
        active_users = db.session.query(
            BlockchainTransaction.user_id,
            func.count(BlockchainTransaction.id).label('tx_count')
        ).group_by(
            BlockchainTransaction.user_id
        ).order_by(
            func.count(BlockchainTransaction.id).desc()
        ).limit(10).all()
        
        # Get user details for active users
        active_users_data = []
        for user_id, tx_count in active_users:
            if user_id:
                active_user = User.query.get(user_id)
                if active_user:
                    active_users_data.append({
                        'userId': str(user_id),
                        'name': f"{active_user.first_name} {active_user.last_name}",
                        'email': active_user.email,
                        'role': active_user.role,
                        'transactionCount': tx_count
                    })
        
        # Total transactions count
        total_transactions = BlockchainTransaction.query.count()
        
        # Transaction type distribution
        type_distribution = db.session.query(
            BlockchainTransaction.transaction_type,
            func.count(BlockchainTransaction.id)
        ).group_by(BlockchainTransaction.transaction_type).all()
        
        # Daily transaction volume (last 30 days)
        today = date.today()
        daily_volume = []
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            count = BlockchainTransaction.query.filter(
                func.date(BlockchainTransaction.created_at) == day
            ).count()
            daily_volume.append({
                'date': day.isoformat(),
                'count': count
            })
        
        return jsonify({
            'success': True,
            'analytics': {
                'totalGasSpentEth': total_gas_eth,
                'totalTransactions': total_transactions,
                'activeUsers': active_users_data,
                'typeDistribution': {tx_type: count for tx_type, count in type_distribution},
                'dailyVolume': daily_volume
            }
        })
        
    except Exception as e:
        print(f"Error getting admin analytics: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/export', methods=['GET'])
@jwt_required()
def export_transactions():
    """Export transactions as CSV"""
    try:
        current_user_id = get_uuid_from_identity(get_jwt_identity())
        if not current_user_id:
            return jsonify({'success': False, 'message': 'Invalid user identity'}), 401
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get filters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        tx_type = request.args.get('type')
        status = request.args.get('status')
        
        # Build query
        if user.role == 'admin':
            query = BlockchainTransaction.query
        else:
            query = BlockchainTransaction.query.filter(
                BlockchainTransaction.user_id == current_user_id
            )
        
        # Apply filters
        if date_from:
            query = query.filter(BlockchainTransaction.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
        if date_to:
            query = query.filter(BlockchainTransaction.created_at < datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1))
        if tx_type and tx_type != 'all':
            query = query.filter(BlockchainTransaction.transaction_type == tx_type)
        if status and status != 'all':
            query = query.filter(BlockchainTransaction.status == status)
        
        transactions = query.order_by(BlockchainTransaction.created_at.desc()).all()
        
        # Build CSV data
        csv_rows = ['Transaction Hash,Type,Status,Gas Used,Gas Price (Wei),Gas Cost (ETH),Block Number,Date']
        
        for tx in transactions:
            gas_cost_eth = 0
            if tx.gas_used and tx.gas_price:
                gas_cost_eth = (tx.gas_used * tx.gas_price) / 1e18
            
            csv_rows.append(
                f'{tx.transaction_hash or ""},'
                f'{tx.transaction_type},'
                f'{tx.status},'
                f'{tx.gas_used or 0},'
                f'{tx.gas_price or 0},'
                f'{gas_cost_eth:.10f},'
                f'{tx.block_number or ""},'
                f'{tx.created_at.isoformat() if tx.created_at else ""}'
            )
        
        csv_content = '\n'.join(csv_rows)
        
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=blockchain_transactions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'}
        )
        
    except Exception as e:
        print(f"Error exporting transactions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
