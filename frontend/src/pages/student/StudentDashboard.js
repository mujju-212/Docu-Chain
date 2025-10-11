import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../shared/Settings';
import Profile from '../../components/shared/Profile';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 250 && newWidth <= 500) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
    return 'Student User';
  };

  return (
    <div className="admin-container student-dashboard">
      <div 
        className={`frame ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          '--sidebar-width': sidebarCollapsed ? '80px' : `${sidebarWidth}px`,
          gridTemplateColumns: sidebarCollapsed ? '80px 1fr' : `${sidebarWidth}px 1fr`
        }}
      >
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">D</div>
            <div className="info">
              <div className="name">DocuChain</div>
              <div className="role">STUDENT</div>
            </div>
          </div>

          <div className="sidebar-content">
            <div className="section-title">Dashboard</div>
            <nav className="menu">
              <a 
                className={currentPage === 'dashboard' ? 'active' : ''}
                onClick={() => setCurrentPage('dashboard')}
                style={{cursor: 'pointer'}}
              >
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

            <div className="section-title">System</div>
            <nav className="menu">
              <a
                className={currentPage === 'settings' ? 'active' : ''}
                onClick={() => setCurrentPage('settings')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-settings-3-line"></i> <span>Settings</span>
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

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
            title="Drag to resize sidebar"
          />
        )}

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
                  <small>{user?.role || 'Student'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="content">
            {currentPage === 'settings' ? (
              <Settings />
            ) : (
              <div className="dashboard-content">
            {/* Welcome Header */}
            <div className="page-title">
              <h1 style={{fontWeight: 800, fontSize: '28px'}}>Welcome back, {getUserName()}!</h1>
              <p>Here's your academic dashboard overview.</p>
            </div>

            {/* First Row - Main Document Stats */}
            <div className="content-grid">
              <div className="card stat gradient">
                <div className="value">45</div>
                <div className="top">
                  <div>Total Documents</div>
                  <i className="ri-file-list-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-arrow-up-line"></i> +5 this week
                </div>
              </div>

              <div className="card stat">
                <div className="value">12</div>
                <div className="top">
                  <div>Sent for Approval</div>
                  <i className="ri-send-plane-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-time-line"></i> Awaiting review
                </div>
              </div>

              <div className="card stat">
                <div className="value">8</div>
                <div className="top">
                  <div>Shared with Me</div>
                  <i className="ri-share-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-information-line"></i> New shares
                </div>
              </div>

              <div className="card stat">
                <div className="value">5</div>
                <div className="top">
                  <div>I Shared Documents</div>
                  <i className="ri-share-forward-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-check-line"></i> Active shares
                </div>
              </div>
            </div>

            {/* Second Row - Document Status Stats */}
            <div className="content-grid">
              <div className="card stat">
                <div className="value">7</div>
                <div className="top">
                  <div>Pending</div>
                  <i className="ri-time-line upto"></i>
                </div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-hourglass-line"></i> In review
                </div>
              </div>

              <div className="card stat">
                <div className="value">28</div>
                <div className="top">
                  <div>Approved</div>
                  <i className="ri-checkbox-circle-line upto"></i>
                </div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> Verified
                </div>
              </div>

              <div className="card stat">
                <div className="value">2</div>
                <div className="top">
                  <div>Rejected</div>
                  <i className="ri-close-circle-line upto"></i>
                </div>
                <div className="delta" style={{background:'#ffe7e7',color:'#9b1c1c',borderColor:'#ffcaca'}}>
                  <i className="ri-error-warning-line"></i> Need revision
                </div>
              </div>

              <div className="card stat">
                <div className="value">24</div>
                <div className="top">
                  <div>Generated Documents</div>
                  <i className="ri-file-add-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-arrow-up-line"></i> +3 this week
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
            )}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <Profile 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default StudentDashboard;