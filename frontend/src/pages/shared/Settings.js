import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../services/api';
import ThemeSelector from '../../components/common/ThemeSelector';
import './Settings.css';

export default function Settings() {
  const { user, updateUser } = useAuth();
  
  // Active tab
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailAlerts: true,
    documentUpdates: true,
    approvalRequests: true,
    chatMessages: true,
    systemAnnouncements: true
  });
  const [notificationSuccess, setNotificationSuccess] = useState('');

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      
      // Load notification preferences from localStorage
      const savedNotifications = localStorage.getItem('notificationPreferences');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    }
  }, [user]);

  // Get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProfileSuccess('Profile updated successfully!');
        // Update local user data
        if (updateUser) {
          updateUser(data.user);
        }
        // Also update localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          name: `${profileData.firstName} ${profileData.lastName}`
        }));
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.error || data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    localStorage.setItem('notificationPreferences', JSON.stringify(newNotifications));
    setNotificationSuccess('Preferences saved!');
    setTimeout(() => setNotificationSuccess(''), 2000);
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength - 1, 4)] || '',
      color: colors[Math.min(strength - 1, 4)] || ''
    };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'ri-user-line' },
    { id: 'security', label: 'Security', icon: 'ri-shield-check-line' },
    { id: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
    { id: 'appearance', label: 'Appearance', icon: 'ri-palette-line' }
  ];

  return (
    <div className="settings-page">
      {/* Settings Header */}
      <div className="settings-page-header">
        <h1><i className="ri-settings-3-line"></i> Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="settings-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><i className="ri-user-line"></i> Profile Information</h2>
                <p>Update your personal information</p>
              </div>

              <form onSubmit={handleProfileUpdate} className="settings-form">
                {profileError && (
                  <div className="settings-alert error">
                    <i className="ri-error-warning-line"></i>
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="settings-alert success">
                    <i className="ri-check-line"></i>
                    {profileSuccess}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="disabled"
                  />
                  <span className="form-hint">Email cannot be changed</span>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={user?.role || 'User'}
                    disabled
                    className="disabled"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <i className="ri-loader-4-line spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><i className="ri-shield-check-line"></i> Change Password</h2>
                <p>Keep your account secure by updating your password regularly</p>
              </div>

              <form onSubmit={handlePasswordChange} className="settings-form">
                {passwordError && (
                  <div className="settings-alert error">
                    <i className="ri-error-warning-line"></i>
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="settings-alert success">
                    <i className="ri-check-line"></i>
                    {passwordSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <i className={showCurrentPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter your new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <i className={showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                  {passwordData.newPassword && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <span className="form-error">Passwords do not match</span>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length >= 6 && (
                    <span className="form-success"><i className="ri-check-line"></i> Passwords match</span>
                  )}
                </div>

                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={passwordData.newPassword.length >= 6 ? 'met' : ''}>
                      <i className={passwordData.newPassword.length >= 6 ? 'ri-check-line' : 'ri-close-line'}></i>
                      At least 6 characters
                    </li>
                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'met' : ''}>
                      <i className={/[A-Z]/.test(passwordData.newPassword) ? 'ri-check-line' : 'ri-close-line'}></i>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(passwordData.newPassword) ? 'met' : ''}>
                      <i className={/[a-z]/.test(passwordData.newPassword) ? 'ri-check-line' : 'ri-close-line'}></i>
                      One lowercase letter
                    </li>
                    <li className={/\d/.test(passwordData.newPassword) ? 'met' : ''}>
                      <i className={/\d/.test(passwordData.newPassword) ? 'ri-check-line' : 'ri-close-line'}></i>
                      One number
                    </li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    {passwordLoading ? (
                      <>
                        <i className="ri-loader-4-line spin"></i>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <i className="ri-lock-password-line"></i>
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><i className="ri-notification-3-line"></i> Notification Preferences</h2>
                <p>Choose how you want to be notified</p>
              </div>

              <div className="settings-form">
                {notificationSuccess && (
                  <div className="settings-alert success">
                    <i className="ri-check-line"></i>
                    {notificationSuccess}
                  </div>
                )}

                <div className="notification-group">
                  <h3>General</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <label>Push Notifications</label>
                      <span>Receive real-time notifications in your browser</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.pushEnabled}
                        onChange={() => handleNotificationToggle('pushEnabled')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label>Email Alerts</label>
                      <span>Get important updates via email</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.emailAlerts}
                        onChange={() => handleNotificationToggle('emailAlerts')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="notification-group">
                  <h3>Activity Notifications</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <label>Document Updates</label>
                      <span>When documents are shared, modified, or verified</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.documentUpdates}
                        onChange={() => handleNotificationToggle('documentUpdates')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label>Approval Requests</label>
                      <span>When someone requests your approval</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.approvalRequests}
                        onChange={() => handleNotificationToggle('approvalRequests')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label>Chat Messages</label>
                      <span>When you receive new messages</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.chatMessages}
                        onChange={() => handleNotificationToggle('chatMessages')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <label>System Announcements</label>
                      <span>Important updates and announcements</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifications.systemAnnouncements}
                        onChange={() => handleNotificationToggle('systemAnnouncements')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><i className="ri-palette-line"></i> Appearance</h2>
                <p>Customize the look and feel of your dashboard</p>
              </div>

              <div className="settings-form">
                <div className="appearance-section">
                  <h3>Theme Color</h3>
                  <p>Choose your preferred accent color</p>
                  <div className="theme-selector-wrapper">
                    <ThemeSelector />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}