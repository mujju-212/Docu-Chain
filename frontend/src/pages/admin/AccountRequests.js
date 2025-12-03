import React, { useState, useEffect, useCallback } from 'react';
import './AccountRequests.css';

const AccountRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmType, setConfirmType] = useState('warning');
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    thisWeek: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch all account requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Fetch all users and filter by status on client side
      const response = await fetch(`${API_URL}/users/admin/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account requests');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.users || []);
        calculateAnalytics(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching account requests:', err);
      setError('Failed to load account requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Calculate analytics
  const calculateAnalytics = (usersList) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      pending: usersList.filter(u => u.status === 'pending').length,
      approved: usersList.filter(u => u.status === 'active' || u.status === 'approved').length,
      rejected: usersList.filter(u => u.status === 'rejected').length,
      thisWeek: usersList.filter(u => 
        u.status === 'pending' && new Date(u.createdAt) >= weekAgo
      ).length
    };
    
    setAnalytics(stats);
  };

  // Filter and sort requests
  useEffect(() => {
    let result = [...requests];

    // Status filter - show all for 'all', otherwise filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'approved') {
        result = result.filter(user => user.status === 'active' || user.status === 'approved');
      } else {
        result = result.filter(user => user.status === statusFilter);
      }
    } else {
      // When showing all, only show pending, rejected, and recently approved (active)
      result = result.filter(user => 
        user.status === 'pending' || 
        user.status === 'rejected' || 
        user.status === 'active' ||
        user.status === 'approved'
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.uniqueId?.toLowerCase().includes(term) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter) {
      result = result.filter(user => user.role?.toLowerCase() === roleFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'name-desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredRequests(result);
  }, [requests, searchTerm, statusFilter, roleFilter, sortBy]);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Open user profile
  const openUserProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // Close profile modal
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  // Show confirmation modal
  const showConfirmation = (title, message, action, type = 'warning') => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmType(type);
    setShowConfirmModal(true);
  };

  // Handle confirmation
  const handleConfirm = async () => {
    setShowConfirmModal(false);
    if (confirmAction) {
      await confirmAction();
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Approve user request
  const requestApprove = (user, e) => {
    if (e) e.stopPropagation();
    showConfirmation(
      'Approve Account',
      `Are you sure you want to approve the account request for ${user.firstName} ${user.lastName}? They will be able to log in and access the system.`,
      () => executeStatusChange(user, 'active'),
      'success'
    );
  };

  // Reject user request
  const requestReject = (user, e) => {
    if (e) e.stopPropagation();
    showConfirmation(
      'Reject Account',
      `Are you sure you want to reject the account request for ${user.firstName} ${user.lastName}? They will not be able to access the system.`,
      () => executeStatusChange(user, 'rejected'),
      'danger'
    );
  };

  // Execute status change
  const executeStatusChange = async (user, newStatus) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setRequests(prev => prev.map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        ));
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
        calculateAnalytics(requests.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        showNotification(
          newStatus === 'active' ? 'Account approved successfully' : 'Account rejected',
          newStatus === 'active' ? 'success' : 'warning'
        );
        
        // Close modal if open and action completed from modal
        if (showProfileModal) {
          closeProfileModal();
        }
      } else {
        showNotification(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('Failed to update account status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return formatDate(dateString);
  };

  // Get initials
  const getInitials = (user) => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#ef4444';
      case 'faculty': return '#8b5cf6';
      case 'student': return '#10b981';
      default: return '#64748b';
    }
  };

  // Get status config
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: 'time-line', label: 'Pending' };
      case 'active':
      case 'approved':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'check-line', label: 'Approved' };
      case 'rejected':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: 'close-line', label: 'Rejected' };
      default:
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: 'question-line', label: status || 'Unknown' };
    }
  };

  // Notification
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `ar-notification ${type}`;
    notification.innerHTML = `
      <i class="ri-${type === 'success' ? 'check' : type === 'error' ? 'close' : type === 'warning' ? 'alert' : 'information'}-line"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('pending');
    setRoleFilter('');
    setSortBy('date-desc');
  };

  return (
    <div className="account-requests-container">
      {/* Header */}
      <div className="ar-header">
        <div className="ar-header-left">
          <h1><i className="ri-user-received-line"></i> Account Requests</h1>
          <p>Review and manage pending account registrations</p>
        </div>
        <div className="ar-header-right">
          <button className="ar-btn secondary" onClick={fetchRequests} disabled={loading}>
            <i className="ri-refresh-line"></i> Refresh
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="ar-analytics">
        <div className={`ar-stat-card pending ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
          <div className="ar-stat-icon"><i className="ri-time-line"></i></div>
          <div className="ar-stat-info">
            <span className="ar-stat-value">{analytics.pending}</span>
            <span className="ar-stat-label">Pending</span>
          </div>
        </div>
        <div className={`ar-stat-card approved ${statusFilter === 'approved' ? 'active' : ''}`} onClick={() => setStatusFilter('approved')}>
          <div className="ar-stat-icon"><i className="ri-check-double-line"></i></div>
          <div className="ar-stat-info">
            <span className="ar-stat-value">{analytics.approved}</span>
            <span className="ar-stat-label">Approved</span>
          </div>
        </div>
        <div className={`ar-stat-card rejected ${statusFilter === 'rejected' ? 'active' : ''}`} onClick={() => setStatusFilter('rejected')}>
          <div className="ar-stat-icon"><i className="ri-close-circle-line"></i></div>
          <div className="ar-stat-info">
            <span className="ar-stat-value">{analytics.rejected}</span>
            <span className="ar-stat-label">Rejected</span>
          </div>
        </div>
        <div className="ar-stat-card new" onClick={() => { setStatusFilter('pending'); setSortBy('date-desc'); }}>
          <div className="ar-stat-icon"><i className="ri-calendar-line"></i></div>
          <div className="ar-stat-info">
            <span className="ar-stat-value">{analytics.thisWeek}</span>
            <span className="ar-stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="ar-filters-container">
        <div className="ar-search-box">
          <i className="ri-search-line"></i>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="ar-clear-search" onClick={() => setSearchTerm('')}>
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>

        <div className="ar-filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ar-filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="ar-filter-select"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="ar-filter-select sort"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {(searchTerm || statusFilter !== 'pending' || roleFilter) && (
            <button className="ar-clear-filters" onClick={clearFilters}>
              <i className="ri-filter-off-line"></i> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="ar-results-info">
        Showing <strong>{filteredRequests.length}</strong> account request{filteredRequests.length !== 1 ? 's' : ''}
      </div>

      {/* Error message */}
      {error && (
        <div className="ar-error">
          <i className="ri-error-warning-line"></i>
          {error}
          <button onClick={fetchRequests}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="ar-loading">
          <div className="ar-spinner"></div>
          <p>Loading account requests...</p>
        </div>
      ) : (
        /* Requests Table */
        <div className="ar-table-container">
          <table className="ar-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Requested On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="ar-no-results">
                    <i className="ri-user-search-line"></i>
                    <p>No account requests found</p>
                    <span>
                      {statusFilter === 'pending' 
                        ? 'No pending requests at this time' 
                        : 'Try adjusting your search or filters'}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(user => {
                  const statusConfig = getStatusConfig(user.status);
                  return (
                    <tr key={user.id} onClick={() => openUserProfile(user)}>
                      <td>
                        <div className="ar-user-cell">
                          <div 
                            className="ar-avatar"
                            style={{ 
                              background: `linear-gradient(135deg, ${getRoleColor(user.role)}40, ${getRoleColor(user.role)}20)`, 
                              color: getRoleColor(user.role) 
                            }}
                          >
                            {getInitials(user)}
                          </div>
                          <div className="ar-user-info">
                            <span className="ar-user-name">{user.firstName} {user.lastName}</span>
                            <span className="ar-user-id">{user.uniqueId || 'No ID assigned'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="ar-role-badge" 
                          style={{ background: getRoleColor(user.role) }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="ar-contact-cell">
                          <span className="ar-email">{user.email}</span>
                          <span className="ar-phone">{user.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ar-date-cell">
                          <span>{formatDate(user.createdAt)}</span>
                          <span className="ar-time-ago">{getTimeAgo(user.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="ar-status-badge" 
                          style={{ 
                            color: statusConfig.color, 
                            background: statusConfig.bg 
                          }}
                        >
                          <i className={`ri-${statusConfig.icon}`}></i>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <div className="ar-actions" onClick={(e) => e.stopPropagation()}>
                          {user.status === 'pending' && (
                            <>
                              <button 
                                className="ar-action-btn approve" 
                                onClick={(e) => requestApprove(user, e)}
                                title="Approve"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                              <button 
                                className="ar-action-btn reject" 
                                onClick={(e) => requestReject(user, e)}
                                title="Reject"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </>
                          )}
                          {user.status === 'rejected' && (
                            <button 
                              className="ar-action-btn approve" 
                              onClick={(e) => requestApprove(user, e)}
                              title="Approve"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          )}
                          <button 
                            className="ar-action-btn view" 
                            onClick={(e) => { e.stopPropagation(); openUserProfile(user); }}
                            title="View Details"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="ar-modal-overlay" onClick={closeProfileModal}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2><i className="ri-user-line"></i> Account Request Details</h2>
              <button className="ar-modal-close" onClick={closeProfileModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="ar-modal-body">
              {/* Profile Header */}
              <div className="ar-profile-header">
                <div 
                  className="ar-profile-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${getRoleColor(selectedUser.role)}, ${getRoleColor(selectedUser.role)}99)` 
                  }}
                >
                  {getInitials(selectedUser)}
                </div>
                <div className="ar-profile-basic">
                  <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <div className="ar-profile-badges">
                    <span 
                      className="ar-profile-role" 
                      style={{ background: getRoleColor(selectedUser.role) }}
                    >
                      <i className={`ri-${
                        selectedUser.role === 'student' ? 'graduation-cap' : 
                        selectedUser.role === 'faculty' ? 'user-star' : 'shield-user'
                      }-line`}></i>
                      {selectedUser.role}
                    </span>
                    <span 
                      className="ar-profile-status"
                      style={{ 
                        color: getStatusConfig(selectedUser.status).color,
                        background: getStatusConfig(selectedUser.status).bg
                      }}
                    >
                      <i className={`ri-${getStatusConfig(selectedUser.status).icon}`}></i>
                      {getStatusConfig(selectedUser.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="ar-profile-details">
                <div className="ar-detail-section">
                  <h4><i className="ri-user-line"></i> Personal Information</h4>
                  <div className="ar-detail-grid">
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Full Name</span>
                      <span className="ar-detail-value">{selectedUser.firstName} {selectedUser.lastName}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">
                        {selectedUser.role?.toLowerCase() === 'student' ? 'Student ID' : 
                         selectedUser.role?.toLowerCase() === 'faculty' ? 'Faculty ID' : 'Admin ID'}
                      </span>
                      <span className="ar-detail-value">{selectedUser.uniqueId || 'Not assigned'}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Email</span>
                      <span className="ar-detail-value">{selectedUser.email}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Phone</span>
                      <span className="ar-detail-value">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Role</span>
                      <span className="ar-detail-value" style={{ textTransform: 'capitalize' }}>
                        {selectedUser.role}
                      </span>
                    </div>
                    {selectedUser.department && (
                      <div className="ar-detail-item">
                        <span className="ar-detail-label">Department</span>
                        <span className="ar-detail-value">{selectedUser.department}</span>
                      </div>
                    )}
                    {selectedUser.section && (
                      <div className="ar-detail-item">
                        <span className="ar-detail-label">Section</span>
                        <span className="ar-detail-value">{selectedUser.section}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ar-detail-section">
                  <h4><i className="ri-time-line"></i> Request Information</h4>
                  <div className="ar-detail-grid">
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Requested On</span>
                      <span className="ar-detail-value">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Time</span>
                      <span className="ar-detail-value">{getTimeAgo(selectedUser.createdAt)}</span>
                    </div>
                    <div className="ar-detail-item">
                      <span className="ar-detail-label">Current Status</span>
                      <span 
                        className="ar-detail-value ar-status-inline"
                        style={{ 
                          color: getStatusConfig(selectedUser.status).color
                        }}
                      >
                        <i className={`ri-${getStatusConfig(selectedUser.status).icon}`}></i>
                        {getStatusConfig(selectedUser.status).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              {(selectedUser.status === 'pending' || selectedUser.status === 'rejected') && (
                <div className="ar-modal-actions">
                  <button 
                    className="ar-btn success" 
                    onClick={() => requestApprove(selectedUser)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <span className="ar-btn-spinner"></span>
                    ) : (
                      <i className="ri-check-line"></i>
                    )}
                    Approve Account
                  </button>
                  {selectedUser.status === 'pending' && (
                    <button 
                      className="ar-btn danger" 
                      onClick={() => requestReject(selectedUser)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <span className="ar-btn-spinner"></span>
                      ) : (
                        <i className="ri-close-line"></i>
                      )}
                      Reject Account
                    </button>
                  )}
                  <button className="ar-btn secondary" onClick={closeProfileModal}>
                    Close
                  </button>
                </div>
              )}
              {selectedUser.status === 'active' && (
                <div className="ar-modal-actions">
                  <div className="ar-approved-message">
                    <i className="ri-check-double-line"></i>
                    This account has been approved and is now active.
                  </div>
                  <button className="ar-btn secondary" onClick={closeProfileModal}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="ar-modal-overlay" onClick={cancelConfirmation}>
          <div className="ar-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`ar-confirm-icon ${confirmType}`}>
              <i className={`ri-${
                confirmType === 'success' ? 'check' : 
                confirmType === 'danger' ? 'alert' : 'question'
              }-line`}></i>
            </div>
            <h3>{confirmTitle}</h3>
            <p>{confirmMessage}</p>
            <div className="ar-confirm-actions">
              <button 
                className={`ar-btn ${confirmType === 'success' ? 'success' : confirmType === 'danger' ? 'danger' : 'warning'}`}
                onClick={handleConfirm}
              >
                Confirm
              </button>
              <button className="ar-btn secondary" onClick={cancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountRequests;