import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../services/api';
import './Profile.css';

const Profile = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [stats, setStats] = useState({
    documents: 0,
    shares: 0,
    activities: 0
  });

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setProfileData(data.user);
          setEditForm({
            first_name: data.user.first_name || data.user.firstName || '',
            last_name: data.user.last_name || data.user.lastName || '',
            phone: data.user.phone || ''
          });
        }
      }

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats({
            documents: statsData.stats.documents?.total || 0,
            shares: statsData.stats.shares?.total || 0,
            activities: statsData.stats.blockchain?.transactions || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen, fetchProfileData]);

  // Handle save profile
  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfileData(prev => ({ ...prev, ...editForm }));
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    onClose();
    logout();
  };

  const getUserName = () => {
    const firstName = profileData?.first_name || profileData?.firstName;
    const lastName = profileData?.last_name || profileData?.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (user?.name) return user.name;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'User';
  };

  const getUserRole = () => {
    return (profileData?.role || user?.role || 'USER').toUpperCase();
  };

  const getUserEmail = () => {
    return profileData?.email || user?.email || 'user@example.com';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay show" onClick={(e) => {
      if (e.target.classList.contains('profile-overlay')) {
        onClose();
      }
    }}>
      <div className="profile-modal">
        <div className="profile-header" style={{
          background: `linear-gradient(135deg, var(--g-700, #059669), var(--g-500, #10b981))`
        }}>
          <button className="profile-close" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
          <div className="profile-avatar">
            {getUserName().charAt(0).toUpperCase()}
          </div>
          <div className="profile-name">{getUserName()}</div>
          <div className="profile-role">{getUserRole()}</div>
          <div style={{ 
            fontSize: '10px', 
            marginTop: '8px', 
            opacity: 0.7 
          }}>
            Theme: {currentTheme}
          </div>
        </div>

        <div className="profile-content">
          {loading ? (
            <div className="profile-loading">
              <i className="ri-loader-4-line spin"></i>
              <span>Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Personal Information */}
              <div className="profile-section">
                <div className="profile-section-header">
                  <h3><i className="ri-user-line"></i> Personal Information</h3>
                  <button 
                    className="profile-edit-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <i className={isEditing ? 'ri-close-line' : 'ri-edit-line'}></i>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="profile-edit-form">
                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label>First Name</label>
                        <input 
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          placeholder="First name"
                        />
                      </div>
                      <div className="profile-form-group">
                        <label>Last Name</label>
                        <input 
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="profile-form-group">
                      <label>Phone</label>
                      <input 
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>
                    <button 
                      className="profile-save-btn"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line spin"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="ri-check-line"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="profile-detail">
                      <div className="profile-detail-icon">
                        <i className="ri-user-line"></i>
                      </div>
                      <div className="profile-detail-content">
                        <div className="profile-detail-label">Full Name</div>
                        <div className="profile-detail-value">{getUserName()}</div>
                      </div>
                    </div>

                    <div className="profile-detail">
                      <div className="profile-detail-icon">
                        <i className="ri-shield-user-line"></i>
                      </div>
                      <div className="profile-detail-content">
                        <div className="profile-detail-label">User ID</div>
                        <div className="profile-detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                          {profileData?.id || user?.id || 'Not available'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Contact Information */}
              <div className="profile-section">
                <h3><i className="ri-contacts-line"></i> Contact Information</h3>
                
                <div className="profile-detail">
                  <div className="profile-detail-icon">
                    <i className="ri-mail-line"></i>
                  </div>
                  <div className="profile-detail-content">
                    <div className="profile-detail-label">Email Address</div>
                    <div className="profile-detail-value">{getUserEmail()}</div>
                  </div>
                </div>

                <div className="profile-detail">
                  <div className="profile-detail-icon">
                    <i className="ri-phone-line"></i>
                  </div>
                  <div className="profile-detail-content">
                    <div className="profile-detail-label">Phone Number</div>
                    <div className="profile-detail-value">{profileData?.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="profile-section">
                <h3><i className="ri-bar-chart-line"></i> {getUserRole()} Statistics</h3>
                
                <div className="profile-stats">
                  <div className="profile-stat" style={{
                    background: `linear-gradient(135deg, var(--g-50, #ecfdf5), var(--g-100, #d1fae5))`
                  }}>
                    <div className="profile-stat-value" style={{
                      color: `var(--g-600, #059669)`
                    }}>{stats.documents}</div>
                    <div className="profile-stat-label">Documents</div>
                  </div>
                  <div className="profile-stat" style={{
                    background: `linear-gradient(135deg, var(--g-50, #ecfdf5), var(--g-100, #d1fae5))`
                  }}>
                    <div className="profile-stat-value" style={{
                      color: `var(--g-600, #059669)`
                    }}>{stats.shares}</div>
                    <div className="profile-stat-label">Shares</div>
                  </div>
                  <div className="profile-stat" style={{
                    background: `linear-gradient(135deg, var(--g-50, #ecfdf5), var(--g-100, #d1fae5))`
                  }}>
                    <div className="profile-stat-value" style={{
                      color: `var(--g-600, #059669)`
                    }}>{stats.activities}</div>
                    <div className="profile-stat-label">Blockchain Txns</div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="profile-section">
                <h3><i className="ri-settings-line"></i> System Information</h3>
                
                <div className="profile-detail">
                  <div className="profile-detail-icon">
                    <i className="ri-time-line"></i>
                  </div>
                  <div className="profile-detail-content">
                    <div className="profile-detail-label">Last Login</div>
                    <div className="profile-detail-value">{formatLastLogin(profileData?.lastLogin || profileData?.last_login)}</div>
                  </div>
                </div>

                <div className="profile-detail">
                  <div className="profile-detail-icon">
                    <i className="ri-calendar-line"></i>
                  </div>
                  <div className="profile-detail-content">
                    <div className="profile-detail-label">Account Created</div>
                    <div className="profile-detail-value">{formatDate(profileData?.createdAt || profileData?.created_at)}</div>
                  </div>
                </div>

                <div className="profile-detail">
                  <div className="profile-detail-icon">
                    <i className="ri-shield-check-line"></i>
                  </div>
                  <div className="profile-detail-content">
                    <div className="profile-detail-label">Account Status</div>
                    <div className="profile-detail-value">
                      <span className={`status-badge ${profileData?.status === 'active' || profileData?.is_active ? 'active' : 'inactive'}`}>
                        {profileData?.status === 'active' || profileData?.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="profile-section">
                <button className="profile-logout-btn" onClick={handleLogout}>
                  <i className="ri-logout-box-r-line"></i>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;