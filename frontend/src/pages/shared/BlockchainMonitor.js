import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { API_URL } from '../../services/api';
import './BlockchainMonitor.css';

const BlockchainMonitor = ({ userRole = 'student' }) => {
  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Stats state
  const [stats, setStats] = useState({
    totalSpentEth: 0,
    todaySpentEth: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    typeBreakdown: {},
    spendingTrend: []
  });
  
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 15,
    total: 0,
    pages: 1
  });
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // Admin analytics (only for admin)
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Transaction type options
  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'upload', label: 'Document Upload' },
    { value: 'share', label: 'Share Document' },
    { value: 'request_approval', label: 'Request Approval' },
    { value: 'approve', label: 'Approve Document' },
    { value: 'reject', label: 'Reject Document' },
    { value: 'revoke_share', label: 'Revoke Share' },
    { value: 'verify', label: 'Verify Document' }
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        setWalletConnected(true);
        
        // Get balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(address);
        const balanceEth = parseFloat(ethers.formatEther(balance));
        setWalletBalance(balanceEth);
        
        // Update balance in backend
        await updateWalletBalance(address, balance.toString(), balanceEth);
      } else {
        alert('Please install MetaMask to use blockchain features!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Update wallet balance in backend
  const updateWalletBalance = async (address, balanceWei, balanceEth) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/blockchain/update-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          walletAddress: address,
          balanceWei: balanceWei,
          balanceEth: balanceEth
        })
      });
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Fetch wallet stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/blockchain/wallet-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        if (data.stats.walletAddress) {
          setWalletAddress(data.stats.walletAddress);
          setWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.perPage.toString()
      });
      
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(
        `${API_URL}/blockchain/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, filters]);

  // Fetch admin analytics
  const fetchAdminAnalytics = useCallback(async () => {
    if (userRole !== 'admin') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/blockchain/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAdminAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    }
  }, [userRole]);

  // Export transactions
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      
      const response = await fetch(
        `${API_URL}/blockchain/export?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'blockchain_transactions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchAdminAnalytics();
    
    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          
          // Get balance
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getBalance(accounts[0]).then(balance => {
            setWalletBalance(parseFloat(ethers.formatEther(balance)));
          });
        }
      });
    }
  }, [fetchStats, fetchTransactions, fetchAdminAnalytics]);

  // Refetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page, fetchTransactions]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format ETH value
  const formatEth = (value) => {
    if (!value) return '0.0000';
    return parseFloat(value).toFixed(4);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get transaction type label
  const getTypeLabel = (type) => {
    const found = transactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Get transaction type icon
  const getTypeIcon = (type) => {
    const icons = {
      upload: 'ri-upload-cloud-2-line',
      share: 'ri-share-line',
      request_approval: 'ri-file-list-3-line',
      approve: 'ri-checkbox-circle-line',
      reject: 'ri-close-circle-line',
      revoke_share: 'ri-link-unlink',
      verify: 'ri-shield-check-line'
    };
    return icons[type] || 'ri-exchange-line';
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const classes = {
      success: 'status-success',
      confirmed: 'status-success',
      pending: 'status-pending',
      failed: 'status-failed'
    };
    return classes[status] || '';
  };

  // Truncate address
  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // View transaction details
  const viewTransactionDetails = (tx) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  // Open in Etherscan
  const openInEtherscan = (txHash) => {
    // Use appropriate network - this assumes mainnet, adjust for testnet
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
  };

  return (
    <div className="blockchain-monitor-container">
      {/* Header */}
      <div className="bm-header">
        <div className="bm-header-left">
          <h1>
            <i className="ri-bar-chart-box-line"></i>
            Blockchain Monitor
          </h1>
          <p>Track your blockchain transactions and gas spending</p>
        </div>
        <div className="bm-header-right">
          {walletConnected ? (
            <div className="wallet-connected">
              <i className="ri-wallet-3-line"></i>
              <span>{truncateAddress(walletAddress)}</span>
              <span className="wallet-balance">{formatEth(walletBalance)} ETH</span>
            </div>
          ) : (
            <button className="bm-btn primary" onClick={connectWallet}>
              <i className="ri-wallet-3-line"></i> Connect Wallet
            </button>
          )}
          <button className="bm-btn secondary" onClick={handleExport}>
            <i className="ri-download-2-line"></i> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bm-stats-grid">
        <div className="bm-stat-card balance">
          <div className="stat-icon">
            <i className="ri-wallet-3-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value">{formatEth(walletBalance)} ETH</span>
          </div>
        </div>
        
        <div className="bm-stat-card today">
          <div className="stat-icon">
            <i className="ri-calendar-check-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Spent</span>
            <span className="stat-value">{formatEth(stats.todaySpentEth)} ETH</span>
          </div>
        </div>
        
        <div className="bm-stat-card total">
          <div className="stat-icon">
            <i className="ri-money-dollar-circle-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{formatEth(stats.totalSpentEth)} ETH</span>
          </div>
        </div>
        
        <div className="bm-stat-card success">
          <div className="stat-icon">
            <i className="ri-checkbox-circle-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Successful</span>
            <span className="stat-value">{stats.successfulTransactions}</span>
          </div>
        </div>
        
        <div className="bm-stat-card failed">
          <div className="stat-icon">
            <i className="ri-close-circle-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Failed</span>
            <span className="stat-value">{stats.failedTransactions}</span>
          </div>
        </div>
      </div>

      {/* Admin Analytics Section */}
      {userRole === 'admin' && adminAnalytics && (
        <div className="bm-admin-analytics">
          <h3><i className="ri-pie-chart-line"></i> Institution Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-label">Total Gas Spent (Institution)</span>
              <span className="analytics-value">{formatEth(adminAnalytics.totalGasSpentEth)} ETH</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-label">Total Transactions</span>
              <span className="analytics-value">{adminAnalytics.totalTransactions}</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-label">Failure Rate</span>
              <span className="analytics-value">{adminAnalytics.failureRate}%</span>
            </div>
          </div>
          
          {adminAnalytics.activeUsers && adminAnalytics.activeUsers.length > 0 && (
            <div className="active-users-section">
              <h4>Most Active Users</h4>
              <div className="active-users-list">
                {adminAnalytics.activeUsers.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="active-user-item">
                    <span className="user-rank">#{index + 1}</span>
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role}</span>
                    <span className="user-txs">{user.transactionCount} txns</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bm-filters">
        <div className="bm-filter-row">
          <div className="bm-filter-group">
            <label>Transaction Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              {transactionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="bm-filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div className="bm-filter-group">
            <label>From Date</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="bm-filter-group">
            <label>To Date</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          <div className="bm-filter-group search">
            <label>Search</label>
            <div className="search-input-wrapper">
              <i className="ri-search-line"></i>
              <input 
                type="text" 
                placeholder="Search by tx hash or document..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <button className="bm-btn secondary clear-btn" onClick={clearFilters}>
            <i className="ri-refresh-line"></i> Clear
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bm-transactions-section">
        <div className="bm-section-header">
          <h3><i className="ri-exchange-line"></i> Transaction History</h3>
          <span className="transaction-count">{pagination.total} transactions</span>
        </div>
        
        <div className="bm-table-container">
          {loading ? (
            <div className="bm-loading">
              <i className="ri-loader-4-line ri-spin"></i>
              <span>Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bm-empty">
              <i className="ri-inbox-line"></i>
              <h4>No transactions found</h4>
              <p>Your blockchain transactions will appear here</p>
            </div>
          ) : (
            <table className="bm-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Document</th>
                  <th>Tx Hash</th>
                  <th>Gas Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="date-cell">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="type-cell">
                      <span className={`type-badge type-${tx.transactionType}`}>
                        <i className={getTypeIcon(tx.transactionType)}></i>
                        {getTypeLabel(tx.transactionType)}
                      </span>
                    </td>
                    <td className="document-cell">
                      {tx.documentName || 'N/A'}
                    </td>
                    <td className="hash-cell">
                      <span 
                        className="tx-hash" 
                        onClick={() => openInEtherscan(tx.txHash)}
                        title={tx.txHash}
                      >
                        {truncateAddress(tx.txHash)}
                        <i className="ri-external-link-line"></i>
                      </span>
                    </td>
                    <td className="cost-cell">
                      <span className="gas-cost">
                        {formatEth(tx.gasCostEth)} ETH
                      </span>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusClass(tx.status)}`}>
                        {(tx.status === 'success' || tx.status === 'confirmed') && <i className="ri-checkbox-circle-fill"></i>}
                        {tx.status === 'pending' && <i className="ri-time-line"></i>}
                        {tx.status === 'failed' && <i className="ri-close-circle-fill"></i>}
                        {tx.status === 'confirmed' ? 'success' : tx.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => viewTransactionDetails(tx)}
                        title="View Details"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bm-pagination">
            <button 
              className="pagination-btn"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              <i className="ri-arrow-left-s-line"></i> Previous
            </button>
            
            <div className="pagination-info">
              Page {pagination.page} of {pagination.pages}
            </div>
            
            <button 
              className="pagination-btn"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="bm-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="bm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bm-modal-header">
              <h3>
                <i className={getTypeIcon(selectedTransaction.transactionType)}></i>
                Transaction Details
              </h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            <div className="bm-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Transaction Hash</span>
                  <span className="detail-value hash">
                    {selectedTransaction.txHash}
                    <button 
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(selectedTransaction.txHash)}
                    >
                      <i className="ri-file-copy-line"></i>
                    </button>
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className={`detail-value type-badge type-${selectedTransaction.transactionType}`}>
                    <i className={getTypeIcon(selectedTransaction.transactionType)}></i>
                    {getTypeLabel(selectedTransaction.transactionType)}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status-badge ${getStatusClass(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Date & Time</span>
                  <span className="detail-value">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                
                {selectedTransaction.confirmedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Confirmed At</span>
                    <span className="detail-value">{formatDate(selectedTransaction.confirmedAt)}</span>
                  </div>
                )}
                
                <div className="detail-item">
                  <span className="detail-label">Block Number</span>
                  <span className="detail-value">{selectedTransaction.blockNumber || 'Pending'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">From Address</span>
                  <span className="detail-value">{selectedTransaction.walletAddress}</span>
                </div>
                
                {selectedTransaction.recipientAddress && (
                  <div className="detail-item">
                    <span className="detail-label">To Address</span>
                    <span className="detail-value">{selectedTransaction.recipientAddress}</span>
                  </div>
                )}
                
                <div className="detail-item">
                  <span className="detail-label">Document</span>
                  <span className="detail-value">{selectedTransaction.documentName || 'N/A'}</span>
                </div>
                
                <div className="detail-item full-width">
                  <span className="detail-label">Gas Details</span>
                  <div className="gas-details">
                    <div className="gas-item">
                      <span>Gas Used:</span>
                      <span>{selectedTransaction.gasUsed?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="gas-item">
                      <span>Gas Price:</span>
                      <span>{selectedTransaction.gasPrice ? `${selectedTransaction.gasPrice / 1e9} Gwei` : 'N/A'}</span>
                    </div>
                    <div className="gas-item highlight">
                      <span>Total Cost:</span>
                      <span>{formatEth(selectedTransaction.gasCostEth)} ETH</span>
                    </div>
                  </div>
                </div>
                
                {selectedTransaction.errorMessage && (
                  <div className="detail-item full-width error">
                    <span className="detail-label">Error Message</span>
                    <span className="detail-value error-text">{selectedTransaction.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bm-modal-footer">
              <button 
                className="bm-btn secondary"
                onClick={() => openInEtherscan(selectedTransaction.txHash)}
              >
                <i className="ri-external-link-line"></i> View on Etherscan
              </button>
              <button 
                className="bm-btn primary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainMonitor;