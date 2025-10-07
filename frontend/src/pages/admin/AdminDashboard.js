import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    // Load RemixIcon CSS
    if (!document.querySelector('link[href*="remixicon"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask to connect your wallet');
    }
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Admin User';
  };

  return (
    <div className="admin-container">
      <div className={`frame ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">A</div>
            <div className="info">
              <div className="name">EduChain</div>
              <div className="role">ADMIN</div>
            </div>
          </div>

          <div className="sidebar-content">
            <div className="section-title">Dashboard</div>
            <nav className="menu">
              <a className="active">
                <i className="ri-dashboard-line"></i> <span>Overview</span>
              </a>
              <a>
                <i className="ri-folder-line"></i> <span>My Files</span>
                <span className="badge alert">24</span>
              </a>
              <a>
                <i className="ri-chat-3-line"></i> <span>Chat Messages</span>
                <span className="badge alert">5</span>
              </a>
              <a>
                <i className="ri-file-add-line"></i> <span>Generate Document</span>
              </a>
              <a>
                <i className="ri-shield-check-line"></i> <span>Document Verifier</span>
              </a>
            </nav>

            <div className="section-title">Administration</div>
            <nav className="menu">
              <a>
                <i className="ri-user-line"></i> <span>User Management</span>
              </a>
              <a>
                <i className="ri-user-settings-line"></i> <span>Account Requests</span>
                <span className="badge alert">7</span>
              </a>
              <a>
                <i className="ri-user-add-line"></i> <span>Add User</span>
              </a>
              <a>
                <i className="ri-building-4-line"></i> <span>Institution Management</span>
              </a>
              <a>
                <i className="ri-links-line"></i> <span>Blockchain Monitor</span>
              </a>
              <a>
                <i className="ri-broadcast-line"></i> <span>Circulars</span>
              </a>
            </nav>

            <div className="section-title">System</div>
            <nav className="menu">
              <a>
                <i className="ri-file-list-3-line"></i> <span>Activity Logs</span>
              </a>
              <a>
                <i className="ri-settings-3-line"></i> <span>System Settings</span>
              </a>
              <a>
                <i className="ri-question-line"></i> <span>Help & Support</span>
              </a>
              <a onClick={logout}>
                <i className="ri-logout-circle-line"></i> <span>Logout</span>
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="hamburger-menu" onClick={toggleSidebar}>
              <i className="ri-menu-line"></i>
            </div>

            {/* Connect Wallet Button */}
            <button 
              className={`btn ${walletConnected ? 'success' : 'primary'}`}
              onClick={connectWallet}
              style={{ marginLeft: '10px' }}
            >
              <i className="ri-wallet-3-line"></i>
              {walletConnected 
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                : 'Connect Wallet'}
            </button>

            <div className="search">
              <i className="ri-search-line"></i>
              <input type="text" placeholder="Search documents, users, or actions..." />
            </div>

            <div className="top-actions">
              <button className="icon-btn has-alert">
                <i className="ri-notification-3-line"></i>
              </button>
              
              <div className="profile" onClick={() => setProfileModalOpen(true)} style={{cursor: 'pointer'}}>
                <div className="avatar">
                  {getUserName().charAt(0).toUpperCase()}
                </div>
                <div className="who">
                  <b>{getUserName()}</b>
                  <small>{user?.role || 'Administrator'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="content">
            {/* Welcome Header */}
            <div className="page-title">
              <h1 style={{fontWeight: 800, fontSize: '28px'}}>Welcome back, {getUserName()}!</h1>
              <p>Here's what's happening with your institution today.</p>
            </div>

            {/* First Row - Main Stats (Students, Faculty, Departments, Admins) */}
            <div className="content-grid">
              <div className="card stat gradient">
                <div className="value">1,247</div>
                <div className="top">
                  <div>Total Students</div>
                  <i className="ri-graduation-cap-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-arrow-up-line"></i> +23 this month
                </div>
              </div>

              <div className="card stat">
                <div className="value">89</div>
                <div className="top">
                  <div>Faculty & Staff</div>
                  <i className="ri-user-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-check-line"></i> Active members
                </div>
              </div>

              <div className="card stat">
                <div className="value">12</div>
                <div className="top">
                  <div>Departments</div>
                  <i className="ri-building-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-information-line"></i> Active departments
                </div>
              </div>

              <div className="card stat">
                <div className="value">5</div>
                <div className="top">
                  <div>Total Admins</div>
                  <i className="ri-admin-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-shield-check-line"></i> System admins
                </div>
              </div>
            </div>

            {/* Document Status Overview Heading */}
            <div className="section-heading">
              <h2 style={{fontSize: '20px', fontWeight: 700, margin: '32px 0 16px 0', color: 'var(--text)'}}>Document Status Overview</h2>
            </div>

            {/* Document Status Overview Section - Same size as above cards */}
            <div className="content-grid">
              <div className="card stat">
                <div className="value">3,026</div>
                <div className="top">
                  <div>Total Documents</div>
                  <i className="ri-file-list-line upto"></i>
                </div>
                <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                  <i className="ri-file-line"></i> All documents
                </div>
              </div>

              <div className="card stat">
                <div className="value">2,847</div>
                <div className="top">
                  <div>Approved</div>
                  <i className="ri-checkbox-circle-line upto"></i>
                </div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> Verified
                </div>
              </div>

              <div className="card stat">
                <div className="value">156</div>
                <div className="top">
                  <div>Pending</div>
                  <i className="ri-time-line upto"></i>
                </div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-hourglass-line"></i> In review
                </div>
              </div>

              <div className="card stat">
                <div className="value">23</div>
                <div className="top">
                  <div>Rejected</div>
                  <i className="ri-close-circle-line upto"></i>
                </div>
                <div className="delta" style={{background:'#ffe7e7',color:'#9b1c1c',borderColor:'#ffcaca'}}>
                  <i className="ri-error-warning-line"></i> Declined
                </div>
              </div>
            </div>

            {/* Recent Activities Section */}
            <div className="activity-section">
              <div className="activity-header">
                <h3>Recent Administrative Activity</h3>
                <div className="activity-actions">
                  <button className="btn btn-sm" id="refreshActivity" onClick={() => {
                    const btn = document.getElementById('refreshActivity');
                    btn.innerHTML = '<i class="ri-loader-line"></i> Loading...';
                    btn.disabled = true;
                    setTimeout(() => {
                      btn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
                      btn.disabled = false;
                      alert('Activity feed refreshed!');
                    }, 1000);
                  }}>
                    <i className="ri-refresh-line"></i> Refresh
                  </button>
                  <button className="btn btn-sm" id="viewAllActivity" onClick={() => {
                    alert('Opening detailed activity log...\n\nThis would navigate to a comprehensive activity history page with filtering and search capabilities.');
                  }}>
                    <i className="ri-external-link-line"></i> View All
                  </button>
                </div>
              </div>

              <div className="activity-feed" id="activityFeed">
                <div className="activity-item" onClick={() => alert('Activity Details:\n\nDocument Approved\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                    <i className="ri-file-check-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Document Approved</div>
                    <div className="activity-description">Transcript_2024.pdf approved for John Doe (Computer Science)</div>
                  </div>
                  <div className="activity-time">2 min ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nAccount Request Approved\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                    <i className="ri-user-add-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Account Request Approved</div>
                    <div className="activity-description">New student account created for Jane Smith (Mathematics Department)</div>
                  </div>
                  <div className="activity-time">8 min ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nNew Message Received\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                    <i className="ri-chat-3-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">New Message Received</div>
                    <div className="activity-description">Message from Dr. Smith regarding document verification process</div>
                  </div>
                  <div className="activity-time">15 min ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nSecurity Update\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: '#fef3c7', color: '#92400e'}}>
                    <i className="ri-shield-check-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Security Update</div>
                    <div className="activity-description">System security protocols updated successfully</div>
                  </div>
                  <div className="activity-time">25 min ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nBulk Document Upload\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: '#e0e7ff', color: '#3730a3'}}>
                    <i className="ri-upload-cloud-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Bulk Document Upload</div>
                    <div className="activity-description">50 new documents uploaded by registrar office</div>
                  </div>
                  <div className="activity-time">1 hour ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nSystem Notification\n\nThis would open a detailed view of the selected activity with full context and related actions.')}>
                  <div className="activity-icon" style={{background: '#d1fae5', color: '#065f46'}}>
                    <i className="ri-notification-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">System Notification</div>
                    <div className="activity-description">Scheduled maintenance completed successfully</div>
                  </div>
                  <div className="activity-time">2 hours ago</div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="profile-overlay show" onClick={(e) => {
          if (e.target.classList.contains('profile-overlay')) {
            setProfileModalOpen(false);
          }
        }}>
          <div className="profile-modal">
            <div className="profile-header">
              <button className="profile-close" onClick={() => setProfileModalOpen(false)}>
                <i className="ri-close-line"></i>
              </button>
              <div className="profile-avatar">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="profile-name">{getUserName()}</div>
              <div className="profile-role">{user?.role?.toUpperCase() || 'SYSTEM ADMINISTRATOR'}</div>
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
                    <div className="profile-detail-value">{user?.id || 'USR-2024-001'}</div>
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
                    <div className="profile-detail-value">{user?.email || 'admin@university.edu'}</div>
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

              {/* Admin Statistics */}
              <div className="profile-section">
                <h3><i className="ri-bar-chart-line"></i> Admin Statistics</h3>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="profile-stat-value">156</div>
                    <div className="profile-stat-label">Documents Approved</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">24</div>
                    <div className="profile-stat-label">Users Added</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">8</div>
                    <div className="profile-stat-label">Departments Created</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-value">342</div>
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
                    <div className="profile-detail-label">Security Status</div>
                    <div className="profile-detail-value">Verified & Secure</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;