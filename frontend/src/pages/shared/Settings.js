import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeSelector from '../../components/common/ThemeSelector';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'User';
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1><i className="ri-settings-3-line"></i> Settings</h1>
        <p>Manage your account preferences and application settings</p>
      </div>

      <div className="settings-content">
        {/* Theme Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2><i className="ri-palette-line"></i> Appearance</h2>
            <p>Customize the look and feel of your dashboard</p>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Theme Color</label>
                <span className="setting-description">Choose your preferred color scheme</span>
              </div>
              <div className="setting-control">
                <ThemeSelector />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2><i className="ri-notification-3-line"></i> Notifications</h2>
            <p>Manage how you receive updates and alerts</p>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Push Notifications</label>
                <span className="setting-description">Receive real-time notifications in your browser</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Email Alerts</label>
                <span className="setting-description">Get important updates via email</span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2><i className="ri-user-settings-line"></i> Account</h2>
            <p>Manage your account information and preferences</p>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Profile Name</label>
                <span className="setting-description">Your display name in the system</span>
              </div>
              <div className="setting-control">
                <input 
                  type="text" 
                  className="setting-input" 
                  value={getUserName()}
                  readOnly 
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Email Address</label>
                <span className="setting-description">Your account email for login and notifications</span>
              </div>
              <div className="setting-control">
                <input 
                  type="email" 
                  className="setting-input" 
                  value={user?.email || 'user@example.com'}
                  readOnly 
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2><i className="ri-shield-check-line"></i> Security</h2>
            <p>Keep your account safe and secure</p>
          </div>
          <div className="settings-section-content">
            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Password</label>
                <span className="setting-description">Change your account password</span>
              </div>
              <div className="setting-control">
                <button className="btn-secondary">Change Password</button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label className="setting-label">Two-Factor Authentication</label>
                <span className="setting-description">Add an extra layer of security to your account</span>
              </div>
              <div className="setting-control">
                <button className="btn-outline">Enable 2FA</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-footer">
        <button className="btn-primary">
          <i className="ri-save-line"></i>
          Save Changes
        </button>
        <button className="btn-secondary">
          <i className="ri-refresh-line"></i>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}