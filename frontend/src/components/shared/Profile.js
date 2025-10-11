import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Profile.css';

const Profile = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'User';
  };

  const getUserRole = () => {
    return user?.role?.toUpperCase() || 'USER';
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
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
            Theme: {currentTheme} | G700: {getComputedStyle(document.documentElement).getPropertyValue('--g-700')}
          </div>
        </div>

        <div className="profile-content">
          {/* Personal Information */}
          <div className="profile-section">
            <h3><i className="ri-user-line"></i> Personal Information</h3>
            
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
                <div className="profile-detail-value">{user?.id || 'd34b8156-b1f7-4b09-8204-3bc3c38187e4'}</div>
              </div>
            </div>
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
                <div className="profile-detail-value">+1 (555) 123-4567</div>
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
                }}>156</div>
                <div className="profile-stat-label">Documents Created</div>
              </div>
              <div className="profile-stat" style={{
                background: `linear-gradient(135deg, var(--g-50, #ecfdf5), var(--g-100, #d1fae5))`
              }}>
                <div className="profile-stat-value" style={{
                  color: `var(--g-600, #059669)`
                }}>8</div>
                <div className="profile-stat-label">Departments Created</div>
              </div>
              <div className="profile-stat" style={{
                background: `linear-gradient(135deg, var(--g-50, #ecfdf5), var(--g-100, #d1fae5))`
              }}>
                <div className="profile-stat-value" style={{
                  color: `var(--g-600, #059669)`
                }}>342</div>
                <div className="profile-stat-label">System Actions</div>
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
                <div className="profile-detail-value">Today at 9:30 AM</div>
              </div>
            </div>

            <div className="profile-detail">
              <div className="profile-detail-icon">
                <i className="ri-calendar-line"></i>
              </div>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Account Created</div>
                <div className="profile-detail-value">January 15, 2024</div>
              </div>
            </div>

            <div className="profile-detail">
              <div className="profile-detail-icon">
                <i className="ri-shield-check-line"></i>
              </div>
              <div className="profile-detail-content">
                <div className="profile-detail-label">Account Status</div>
                <div className="profile-detail-value">Active & Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;