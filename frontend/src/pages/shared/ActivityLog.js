import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../services/api';
import './ActivityLog.css';

const ActivityLog = ({ userRole = 'student' }) => {
  // Activity logs state
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    total_activities: 0,
    today_activities: 0,
    category_breakdown: {},
    action_type_breakdown: {},
    recent_count: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    pages: 1
  });
  
  // Filters
  const [filters, setFilters] = useState({
    category: 'all',
    actionType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // Modal state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'auth', label: 'Authentication' },
    { value: 'document', label: 'Documents' },
    { value: 'folder', label: 'Folders' },
    { value: 'approval', label: 'Approvals' },
    { value: 'share', label: 'Shares' },
    { value: 'profile', label: 'Profile' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'chat', label: 'Chat' },
    { value: 'admin', label: 'Admin' },
    { value: 'system', label: 'System' }
  ];

  // Action type options
  const actionTypeOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'failed_login', label: 'Failed Login' },
    { value: 'upload', label: 'Upload' },
    { value: 'download', label: 'Download' },
    { value: 'view', label: 'View' },
    { value: 'delete', label: 'Delete' },
    { value: 'share', label: 'Share' },
    { value: 'revoke_share', label: 'Revoke Share' },
    { value: 'request_approval', label: 'Request Approval' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'profile_update', label: 'Profile Update' },
    { value: 'password_change', label: 'Password Change' },
    { value: 'folder_create', label: 'Create Folder' }
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' }
  ];

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/activity-logs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page,
        per_page: pagination.perPage
      });
      
      // Add filters
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.actionType !== 'all') params.append('action_type', filters.actionType);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_URL}/activity-logs/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          pages: data.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, filters]);

  // Export activities to CSV
  const exportActivities = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.actionType !== 'all') params.append('action_type', filters.actionType);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      
      const response = await fetch(`${API_URL}/activity-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        a.download = `activity_log_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert('Failed to export activity log');
      }
    } catch (error) {
      console.error('Error exporting activities:', error);
      alert('Error exporting activity log');
    } finally {
      setExporting(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: 'all',
      actionType: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Get relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatTimestamp(timestamp);
  };

  // Get action icon
  const getActionIcon = (actionType) => {
    const icons = {
      login: '🔓',
      logout: '🔒',
      failed_login: '⚠️',
      upload: '📤',
      download: '📥',
      view: '👁️',
      delete: '🗑️',
      share: '🔗',
      revoke_share: '🚫',
      request_approval: '📝',
      approve: '✅',
      reject: '❌',
      profile_update: '👤',
      password_change: '🔑',
      folder_create: '📁',
      document_generate: '📄',
      blockchain_tx: '⛓️'
    };
    return icons[actionType] || '📋';
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      auth: '#3b82f6',
      document: '#10b981',
      folder: '#f59e0b',
      approval: '#8b5cf6',
      share: '#ec4899',
      profile: '#6366f1',
      blockchain: '#14b8a6',
      chat: '#f97316',
      admin: '#ef4444',
      system: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    const classes = {
      success: 'status-success',
      failed: 'status-failed',
      pending: 'status-pending'
    };
    return classes[status] || 'status-default';
  };

  // View activity details
  const viewActivityDetails = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  // Effects
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities, fetchStats]);

  return (
    <div className="activity-log-container">
      {/* Header */}
      <div className="activity-log-header">
        <div className="header-title">
          <h1>📋 Activity Log</h1>
          <p>Track all your activities and operations in DocuChain</p>
        </div>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={exportActivities}
            disabled={exporting}
          >
            {exporting ? '⏳ Exporting...' : '📥 Export CSV'}
          </button>
          <button 
            className="refresh-btn"
            onClick={() => { fetchActivities(); fetchStats(); }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {statsLoading ? '...' : stats.total_activities?.toLocaleString()}
            </div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>
        
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">
              {statsLoading ? '...' : stats.today_activities?.toLocaleString()}
            </div>
            <div className="stat-label">Today's Activities</div>
          </div>
        </div>
        
        <div className="stat-card recent">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">
              {statsLoading ? '...' : stats.recent_count || 0}
            </div>
            <div className="stat-label">Last 24 Hours</div>
          </div>
        </div>
        
        <div className="stat-card categories">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-value">
              {statsLoading ? '...' : Object.keys(stats.category_breakdown || {}).length}
            </div>
            <div className="stat-label">Active Categories</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {!statsLoading && stats.category_breakdown && Object.keys(stats.category_breakdown).length > 0 && (
        <div className="category-breakdown">
          <h3>Activity by Category</h3>
          <div className="category-bars">
            {Object.entries(stats.category_breakdown).map(([category, count]) => (
              <div key={category} className="category-bar-item">
                <div className="category-bar-label">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </div>
                <div className="category-bar-track">
                  <div 
                    className="category-bar-fill"
                    style={{ 
                      width: `${(count / stats.total_activities) * 100}%`,
                      backgroundColor: getCategoryColor(category)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Action Type</label>
            <select 
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
            >
              {actionTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>From Date</label>
            <input 
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>To Date</label>
            <input 
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          <div className="filter-group search-group">
            <label>Search</label>
            <input 
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <button className="reset-filters-btn" onClick={resetFilters}>
            ✖ Reset
          </button>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="activities-section">
        <div className="activities-header">
          <h3>Activity Timeline</h3>
          <span className="activity-count">
            Showing {activities.length} of {pagination.total} activities
          </span>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Activities Found</h3>
            <p>No activities match your current filters</p>
          </div>
        ) : (
          <div className="activities-timeline">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="activity-item"
                onClick={() => viewActivityDetails(activity)}
              >
                <div className="activity-icon">
                  {getActionIcon(activity.actionType)}
                </div>
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="activity-description">{activity.description}</span>
                    <span className={`activity-status ${getStatusBadge(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                  <div className="activity-meta">
                    <span 
                      className="activity-category"
                      style={{ backgroundColor: getCategoryColor(activity.actionCategory) }}
                    >
                      {activity.actionCategory}
                    </span>
                    <span className="activity-action-type">{activity.actionType.replace('_', ' ')}</span>
                    {activity.targetName && (
                      <span className="activity-target">
                        📎 {activity.targetName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="activity-time">
                  <span className="relative-time">{getRelativeTime(activity.createdAt)}</span>
                  <span className="full-time">{formatTimestamp(activity.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ← Previous
            </button>
            
            <div className="page-info">
              Page {pagination.page} of {pagination.pages}
            </div>
            
            <button 
              className="page-btn"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {getActionIcon(selectedActivity.actionType)} Activity Details
              </h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Action Type</label>
                  <span className="detail-value highlight">
                    {selectedActivity.actionType.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Category</label>
                  <span 
                    className="detail-value category-badge"
                    style={{ backgroundColor: getCategoryColor(selectedActivity.actionCategory) }}
                  >
                    {selectedActivity.actionCategory}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`detail-value status-badge ${getStatusBadge(selectedActivity.status)}`}>
                    {selectedActivity.status}
                  </span>
                </div>
                
                <div className="detail-item full-width">
                  <label>Description</label>
                  <span className="detail-value">{selectedActivity.description}</span>
                </div>
                
                {selectedActivity.targetName && (
                  <div className="detail-item">
                    <label>Target</label>
                    <span className="detail-value">
                      {selectedActivity.targetType}: {selectedActivity.targetName}
                    </span>
                  </div>
                )}
                
                <div className="detail-item">
                  <label>Timestamp</label>
                  <span className="detail-value">
                    {formatTimestamp(selectedActivity.createdAt)}
                  </span>
                </div>
                
                {selectedActivity.ipAddress && (
                  <div className="detail-item">
                    <label>IP Address</label>
                    <span className="detail-value mono">{selectedActivity.ipAddress}</span>
                  </div>
                )}
                
                {selectedActivity.userAgent && (
                  <div className="detail-item full-width">
                    <label>User Agent</label>
                    <span className="detail-value small">{selectedActivity.userAgent}</span>
                  </div>
                )}
                
                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div className="detail-item full-width">
                    <label>Additional Details</label>
                    <pre className="metadata-display">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="activity-log-footer">
        <div className="footer-info">
          <span>🔒 Activity logs are read-only and cannot be modified</span>
          <span>•</span>
          <span>Auto-refreshes every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;