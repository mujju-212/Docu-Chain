import React, { useState, useEffect, useCallback } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Department and section lists for filters
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Sections for edit form (filtered by department)
  const [editSections, setEditSections] = useState([]);
  
  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmType, setConfirmType] = useState('warning'); // warning, danger
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    total: 0,
    admins: 0,
    faculty: 0,
    students: 0,
    active: 0,
    suspended: 0,
    newThisWeek: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
        
        // Extract unique departments and sections for filters
        // Create department objects with id and name
        const deptMap = new Map();
        data.users.forEach(u => {
          if (u.departmentId && u.department) {
            deptMap.set(u.departmentId, { id: u.departmentId, name: u.department });
          }
        });
        const depts = Array.from(deptMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        const sects = [...new Set(data.users.map(u => u.section).filter(Boolean))];
        setDepartments(depts);
        setSections(sects.sort());
        
        // Calculate analytics
        calculateAnalytics(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Calculate analytics
  const calculateAnalytics = (usersList) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: usersList.length,
      admins: usersList.filter(u => u.role?.toLowerCase() === 'admin').length,
      faculty: usersList.filter(u => u.role?.toLowerCase() === 'faculty').length,
      students: usersList.filter(u => u.role?.toLowerCase() === 'student').length,
      active: usersList.filter(u => u.status?.toLowerCase() === 'active').length,
      suspended: usersList.filter(u => u.status?.toLowerCase() === 'suspended' || u.status?.toLowerCase() === 'banned').length,
      newThisWeek: usersList.filter(u => new Date(u.createdAt) >= weekAgo).length
    };
    
    setAnalytics(stats);
  };

  // Filter and sort users
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.fullName?.toLowerCase().includes(term) ||
        user.uniqueId?.toLowerCase().includes(term) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter) {
      result = result.filter(user => user.role?.toLowerCase() === roleFilter.toLowerCase());
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(user => user.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Department filter
    if (departmentFilter) {
      result = result.filter(user => user.department === departmentFilter);
    }

    // Section filter
    if (sectionFilter) {
      result = result.filter(user => user.section === sectionFilter);
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
        case 'activity-desc':
          return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter, sectionFilter, sortBy]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch sections for a department
  const fetchSectionsForDepartment = async (departmentId) => {
    if (!departmentId) {
      setEditSections([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/departments/${departmentId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEditSections(data.sections || []);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setEditSections([]);
    }
  };

  // Open user profile
  const openUserProfile = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      departmentId: user.departmentId || '',
      sectionId: user.sectionId || '',
      newPassword: ''
    });
    // Fetch sections for user's department
    if (user.departmentId) {
      fetchSectionsForDepartment(user.departmentId);
    } else {
      setEditSections([]);
    }
    setIsEditing(false);
    setShowProfileModal(true);
  };

  // Close profile modal
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
    setIsEditing(false);
    setEditFormData({});
  };

  // Handle edit form change
  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    
    // When department changes, fetch sections and clear section selection
    if (field === 'departmentId') {
      setEditFormData(prev => ({ ...prev, departmentId: value, sectionId: '' }));
      fetchSectionsForDepartment(value);
    }
  };

  // Save user edits
  const saveUserEdits = async () => {
    if (!selectedUser) return;
    
    // Validate password if provided
    if (editFormData.newPassword && editFormData.newPassword.length < 8) {
      showNotification('Password must be at least 8 characters', 'error');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (data.success) {
        // Get department and section names from lists
        const deptName = departments.find(d => d.id === editFormData.departmentId)?.name || null;
        const sectName = editSections.find(s => s.id === editFormData.sectionId)?.name || null;
        
        // Update user in local state
        const updatedUserData = {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          phone: editFormData.phone,
          departmentId: editFormData.departmentId,
          department: deptName,
          sectionId: editFormData.sectionId,
          section: sectName
        };
        
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...updatedUserData } : u
        ));
        setSelectedUser(prev => ({ ...prev, ...updatedUserData }));
        setIsEditing(false);
        
        // Clear password field
        setEditFormData(prev => ({ ...prev, newPassword: '' }));
        
        // Show appropriate message
        if (data.passwordChanged) {
          showNotification('User updated and password reset successfully', 'success');
        } else if (data.departmentChanged) {
          showNotification(data.message, 'success');
        } else {
          showNotification('User updated successfully', 'success');
        }
      } else {
        showNotification(data.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showNotification('Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
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

  // Request toggle user status (suspend/resume)
  const requestToggleStatus = () => {
    if (!selectedUser) return;
    
    const newStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'Resume' : 'Suspend';
    
    showConfirmation(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${selectedUser.firstName} ${selectedUser.lastName}?`,
      () => executeToggleStatus(newStatus),
      newStatus === 'suspended' ? 'warning' : 'success'
    );
  };

  // Execute toggle user status
  const executeToggleStatus = async (newStatus) => {
    if (!selectedUser) return;
    
    const action = newStatus === 'active' ? 'resume' : 'suspend';
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/${selectedUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, status: newStatus } : u
        ));
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
        calculateAnalytics(users.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
        showNotification(`User ${action}d successfully`, 'success');
      } else {
        showNotification(data.message || `Failed to ${action} user`, 'error');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      showNotification(`Failed to ${action} user`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Request delete user
  const requestDeleteUser = () => {
    if (!selectedUser) return;
    
    showConfirmation(
      'Delete User',
      `Are you sure you want to permanently delete ${selectedUser.firstName} ${selectedUser.lastName}? This action cannot be undone.`,
      executeDeleteUser,
      'danger'
    );
  };

  // Execute delete user
  const executeDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/admin/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        closeProfileModal();
        showNotification('User deleted successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showNotification('Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export users
  const exportUsers = () => {
    const exportData = filteredUsers.map(user => ({
      'Name': `${user.firstName} ${user.lastName}`,
      'Unique ID': user.uniqueId || '-',
      'Email': user.email,
      'Role': user.role,
      'Department': user.department || '-',
      'Section': user.role?.toLowerCase() === 'student' ? (user.section || '-') : 'N/A',
      'Phone': user.phone || '-',
      'Status': user.status,
      'Joined': formatDate(user.createdAt),
      'Last Login': user.lastLogin ? formatDate(user.lastLogin) : 'Never'
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${filteredUsers.length} users`, 'success');
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

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Notification
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `um-notification ${type}`;
    notification.innerHTML = `
      <i class="ri-${type === 'success' ? 'check' : type === 'error' ? 'close' : 'information'}-line"></i>
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
    setRoleFilter('');
    setStatusFilter('');
    setDepartmentFilter('');
    setSectionFilter('');
    setSortBy('name-asc');
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-left">
          <h1><i className="ri-user-settings-line"></i> User Management</h1>
          <p>Manage all users in your institution</p>
        </div>
        <div className="um-header-right">
          <button className="um-btn secondary" onClick={fetchUsers} disabled={loading}>
            <i className="ri-refresh-line"></i> Refresh
          </button>
          <button className="um-btn primary" onClick={exportUsers} disabled={filteredUsers.length === 0}>
            <i className="ri-download-line"></i> Export
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="um-analytics">
        <div className="um-stat-card total">
          <div className="um-stat-icon"><i className="ri-group-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.total}</span>
            <span className="um-stat-label">Total Users</span>
          </div>
        </div>
        <div className="um-stat-card students">
          <div className="um-stat-icon"><i className="ri-graduation-cap-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.students}</span>
            <span className="um-stat-label">Students</span>
          </div>
        </div>
        <div className="um-stat-card faculty">
          <div className="um-stat-icon"><i className="ri-user-star-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.faculty}</span>
            <span className="um-stat-label">Faculty</span>
          </div>
        </div>
        <div className="um-stat-card admins">
          <div className="um-stat-icon"><i className="ri-shield-user-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.admins}</span>
            <span className="um-stat-label">Admins</span>
          </div>
        </div>
        <div className="um-stat-card active">
          <div className="um-stat-icon"><i className="ri-user-follow-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.active}</span>
            <span className="um-stat-label">Active</span>
          </div>
        </div>
        <div className="um-stat-card new">
          <div className="um-stat-icon"><i className="ri-user-add-line"></i></div>
          <div className="um-stat-info">
            <span className="um-stat-value">{analytics.newThisWeek}</span>
            <span className="um-stat-label">New This Week</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="um-filters-container">
        <div className="um-search-box">
          <i className="ri-search-line"></i>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="um-clear-search" onClick={() => setSearchTerm('')}>
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>

        <div className="um-filters">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="um-filter-select"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="um-filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          {departments.length > 0 && (
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="um-filter-select"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          )}

          {sections.length > 0 && (
            <select 
              value={sectionFilter} 
              onChange={(e) => setSectionFilter(e.target.value)}
              className="um-filter-select"
            >
              <option value="">All Sections</option>
              {sections.map(sect => (
                <option key={sect} value={sect}>{sect}</option>
              ))}
            </select>
          )}

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="um-filter-select sort"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="activity-desc">Recently Active</option>
          </select>

          {(searchTerm || roleFilter || statusFilter || departmentFilter || sectionFilter) && (
            <button className="um-clear-filters" onClick={clearFilters}>
              <i className="ri-filter-off-line"></i> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="um-results-info">
        Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
      </div>

      {/* Error message */}
      {error && (
        <div className="um-error">
          <i className="ri-error-warning-line"></i>
          {error}
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="um-loading">
          <div className="um-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        /* Users Table */
        <div className="um-table-container">
          <table className="um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role & Department</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="um-no-results">
                    <i className="ri-user-search-line"></i>
                    <p>No users found</p>
                    <span>Try adjusting your search or filters</span>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} onClick={() => openUserProfile(user)}>
                    <td>
                      <div className="um-user-cell">
                        <div 
                          className="um-avatar"
                          style={{ background: `linear-gradient(135deg, ${getRoleColor(user.role)}40, ${getRoleColor(user.role)}20)`, color: getRoleColor(user.role) }}
                        >
                          {getInitials(user)}
                        </div>
                        <div className="um-user-info">
                          <span className="um-user-name">{user.firstName} {user.lastName}</span>
                          <span className="um-user-id">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="um-role-cell">
                        <span className="um-role-badge" style={{ background: getRoleColor(user.role) }}>
                          {user.role}
                        </span>
                        {user.department && <span className="um-dept">{user.department}</span>}
                        {user.role?.toLowerCase() === 'student' && user.section && (
                          <span className="um-section">Section {user.section}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="um-contact-cell">
                        <span className="um-email">{user.email}</span>
                        <span className="um-phone">{user.phone || 'No phone'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="um-date-cell">
                        <span>{formatDate(user.createdAt)}</span>
                        <span className="um-time-ago">{getTimeAgo(user.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="um-date-cell">
                        <span>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                        <span className="um-time-ago">{user.lastLogin ? getTimeAgo(user.lastLogin) : ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`um-status-badge ${user.status?.toLowerCase()}`}>
                        <i className={`ri-${user.status === 'active' ? 'checkbox-circle' : user.status === 'pending' ? 'time' : 'forbid'}-line`}></i>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="um-modal-overlay" onClick={closeProfileModal}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2><i className="ri-user-line"></i> User Profile</h2>
              <button className="um-modal-close" onClick={closeProfileModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="um-modal-body">
              {/* Profile Header */}
              <div className="um-profile-header">
                <div 
                  className="um-profile-avatar"
                  style={{ background: `linear-gradient(135deg, ${getRoleColor(selectedUser.role)}, ${getRoleColor(selectedUser.role)}99)` }}
                >
                  {getInitials(selectedUser)}
                </div>
                <div className="um-profile-basic">
                  <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <span className="um-profile-role" style={{ background: getRoleColor(selectedUser.role) }}>
                    <i className={`ri-${selectedUser.role === 'student' ? 'graduation-cap' : selectedUser.role === 'faculty' ? 'user-star' : 'shield-user'}-line`}></i>
                    {selectedUser.role}
                  </span>
                  <span className={`um-profile-status ${selectedUser.status?.toLowerCase()}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Profile Details / Edit Form */}
              {isEditing ? (
                <div className="um-edit-form">
                  <div className="um-form-grid">
                    <div className="um-form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => handleEditChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => handleEditChange('lastName', e.target.value)}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                      />
                    </div>
                    <div className="um-form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="um-form-group full-width">
                      <label>Department</label>
                      <select
                        value={editFormData.departmentId || ''}
                        onChange={(e) => handleEditChange('departmentId', e.target.value)}
                        className="um-department-select"
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                      {editFormData.departmentId && editFormData.departmentId !== selectedUser.departmentId && (
                        <p className="um-department-change-notice">
                          <i className="ri-information-line"></i>
                          User will be removed from old department group after 30 days and added to the new department group immediately.
                        </p>
                      )}
                    </div>
                    {selectedUser?.role === 'student' && (
                      <div className="um-form-group full-width">
                        <label>Section</label>
                        <select
                          value={editFormData.sectionId || ''}
                          onChange={(e) => handleEditChange('sectionId', e.target.value)}
                          className="um-section-select"
                          disabled={!editFormData.departmentId}
                        >
                          <option value="">-- Select Section --</option>
                          {editSections.map(sect => (
                            <option key={sect.id} value={sect.id}>{sect.name}</option>
                          ))}
                        </select>
                        {!editFormData.departmentId && (
                          <p className="um-field-hint">Select a department first</p>
                        )}
                      </div>
                    )}
                    <div className="um-form-group full-width">
                      <label>Reset Password</label>
                      <div className="um-password-input-group">
                        <input
                          type="password"
                          value={editFormData.newPassword || ''}
                          onChange={(e) => handleEditChange('newPassword', e.target.value)}
                          placeholder="Leave empty to keep current password"
                        />
                      </div>
                      <p className="um-field-hint">
                        <i className="ri-information-line"></i>
                        Minimum 8 characters. Leave empty to keep current password.
                      </p>
                    </div>
                  </div>
                  <div className="um-edit-actions">
                    <button className="um-btn primary" onClick={saveUserEdits} disabled={actionLoading}>
                      {actionLoading ? <span className="um-btn-spinner"></span> : <i className="ri-save-line"></i>}
                      Save Changes
                    </button>
                    <button className="um-btn secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="um-profile-details">
                  <div className="um-detail-section">
                    <h4><i className="ri-user-line"></i> Personal Information</h4>
                    <div className="um-detail-grid">
                      <div className="um-detail-item">
                        <span className="um-detail-label">Full Name</span>
                        <span className="um-detail-value">{selectedUser.firstName} {selectedUser.lastName}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">{selectedUser.role?.toLowerCase() === 'student' ? 'Student ID' : selectedUser.role?.toLowerCase() === 'faculty' ? 'Faculty ID' : 'Admin ID'}</span>
                        <span className="um-detail-value">{selectedUser.uniqueId || '-'}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Email</span>
                        <span className="um-detail-value">{selectedUser.email || '-'}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Role</span>
                        <span className="um-detail-value">{selectedUser.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="um-detail-section">
                    <h4><i className="ri-building-line"></i> Department & Section</h4>
                    <div className="um-detail-grid">
                      <div className="um-detail-item">
                        <span className="um-detail-label">Department</span>
                        <span className="um-detail-value">{selectedUser.department || 'Not assigned'}</span>
                      </div>
                      {selectedUser.role?.toLowerCase() === 'student' && (
                        <div className="um-detail-item">
                          <span className="um-detail-label">Section</span>
                          <span className="um-detail-value">{selectedUser.section || 'Not assigned'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="um-detail-section">
                    <h4><i className="ri-phone-line"></i> Contact Details</h4>
                    <div className="um-detail-grid">
                      <div className="um-detail-item">
                        <span className="um-detail-label">Email</span>
                        <span className="um-detail-value">{selectedUser.email}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Phone</span>
                        <span className="um-detail-value">{selectedUser.phone || 'Not provided'}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Wallet Address</span>
                        <span className="um-detail-value um-wallet">{selectedUser.walletAddress || 'Not connected'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="um-detail-section">
                    <h4><i className="ri-calendar-line"></i> Account Information</h4>
                    <div className="um-detail-grid">
                      <div className="um-detail-item">
                        <span className="um-detail-label">Joined</span>
                        <span className="um-detail-value">{formatDateTime(selectedUser.createdAt)}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Last Login</span>
                        <span className="um-detail-value">{selectedUser.lastLogin ? formatDateTime(selectedUser.lastLogin) : 'Never logged in'}</span>
                      </div>
                      <div className="um-detail-item">
                        <span className="um-detail-label">Status</span>
                        <span className={`um-detail-value um-status-text ${selectedUser.status?.toLowerCase()}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="um-modal-actions">
                <button className="um-btn primary" onClick={() => setIsEditing(true)}>
                  <i className="ri-edit-line"></i> Edit Details
                </button>
                <button 
                  className={`um-btn ${selectedUser.status === 'active' ? 'warning' : 'success'}`}
                  onClick={requestToggleStatus}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="um-btn-spinner"></span>
                  ) : (
                    <i className={`ri-${selectedUser.status === 'active' ? 'forbid' : 'checkbox-circle'}-line`}></i>
                  )}
                  {selectedUser.status === 'active' ? 'Suspend User' : 'Resume User'}
                </button>
                <button className="um-btn danger" onClick={requestDeleteUser} disabled={actionLoading}>
                  {actionLoading ? <span className="um-btn-spinner"></span> : <i className="ri-delete-bin-line"></i>}
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="um-confirm-overlay" onClick={cancelConfirmation}>
          <div className="um-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`um-confirm-icon ${confirmType}`}>
              <i className={`ri-${confirmType === 'danger' ? 'delete-bin' : confirmType === 'success' ? 'checkbox-circle' : 'alert'}-line`}></i>
            </div>
            <h3 className="um-confirm-title">{confirmTitle}</h3>
            <p className="um-confirm-message">{confirmMessage}</p>
            <div className="um-confirm-actions">
              <button className="um-btn secondary" onClick={cancelConfirmation}>
                Cancel
              </button>
              <button 
                className={`um-btn ${confirmType === 'danger' ? 'danger' : confirmType === 'success' ? 'success' : 'warning'}`}
                onClick={handleConfirm}
              >
                {confirmType === 'danger' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;