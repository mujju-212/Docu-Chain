import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Settings from '../shared/Settings';
import FileManager from '../shared/FileManagerNew';
import Profile from '../../components/shared/Profile';
import './FacultyDashboard.css';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Check if MetaMask is connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
          }
        });
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
    return 'Faculty User';
  };

  return (
    <div className="admin-container faculty-dashboard">
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
            <div className="logo">F</div>
            <div className="info">
              <div className="name">DocuChain</div>
              <div className="role">FACULTY</div>
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
              <a 
                className={currentPage === 'filemanager' ? 'active' : ''}
                onClick={() => setCurrentPage('filemanager')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-folder-line"></i> <span>My Files</span>
                <span className="badge alert">47</span>
              </a>
              <a>
                <i className="ri-chat-3-line"></i> <span>Chat</span>
                <span className="badge alert">8</span>
              </a>
              <a>
                <i className="ri-shield-check-line"></i> <span>Document Verifier</span>
                <span className="badge alert">12</span>
              </a>
              <a>
                <i className="ri-file-add-line"></i> <span>Document Generation</span>
              </a>
              <a>
                <i className="ri-notification-4-line"></i> <span>Circular</span>
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
              <input type="text" placeholder="Search documents, students, verification requests..." />
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
                  <small>{user?.role || 'Faculty'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="content">
            {currentPage === 'settings' ? (
              <Settings />
            ) : currentPage === 'filemanager' ? (
              <FileManager />
            ) : (
              <div className="dashboard-content">
            {/* Welcome Header */}
            <div className="page-title">
              <h1 style={{fontWeight: 800, fontSize: '28px'}}>Welcome back, {getUserName()}!</h1>
              <p>Manage your documents, verify student submissions, and collaborate with colleagues.</p>
            </div>

            {/* First Row - Faculty Stats */}
            <div className="content-grid">
              <div className="card stat gradient">
                <div className="value">47</div>
                <div className="top">
                  <div>My Documents</div>
                  <i className="ri-file-3-line upto"></i>
                </div>
                <div className="delta">
                  <i className="ri-arrow-up-line"></i> +3 this week
                </div>
              </div>

              <div className="card stat">
                <div className="value">23</div>
                <div className="top">
                  <div>Shared with Me</div>
                  <i className="ri-share-line upto"></i>
                </div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> From colleagues
                </div>
              </div>

              <div className="card stat">
                <div className="value">12</div>
                <div className="top">
                  <div>Verification Requests</div>
                  <i className="ri-shield-check-line upto"></i>
                </div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-time-line"></i> Awaiting review
                </div>
              </div>

              <div className="card stat">
                <div className="value">156</div>
                <div className="top">
                  <div>My Students</div>
                  <i className="ri-graduation-cap-line upto"></i>
                </div>
                <div className="delta" style={{background:'#e9fff4',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-user-line"></i> Across sections
                </div>
              </div>
            </div>

            {/* Document Status Overview Heading */}
            <div className="section-heading">
              <h2 style={{fontSize: '20px', fontWeight: 700, margin: '32px 0 16px 0', color: 'var(--text)'}}>Faculty Activity Overview</h2>
            </div>

            {/* Document Status Overview Section */}
            <div className="content-grid">
              <div className="card stat">
                <div className="value">35</div>
                <div className="top">
                  <div>Verified Documents</div>
                  <i className="ri-checkbox-circle-line upto"></i>
                </div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> This semester
                </div>
              </div>

              <div className="card stat">
                <div className="value">89</div>
                <div className="top">
                  <div>Total Verifications</div>
                  <i className="ri-shield-check-line upto"></i>
                </div>
                <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                  <i className="ri-trophy-line"></i> All time
                </div>
              </div>

              <div className="card stat">
                <div className="value">8</div>
                <div className="top">
                  <div>Generated Certificates</div>
                  <i className="ri-award-line upto"></i>
                </div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-calendar-line"></i> This month
                </div>
              </div>

              <div className="card stat">
                <div className="value">5</div>
                <div className="top">
                  <div>Active Collaborations</div>
                  <i className="ri-team-line upto"></i>
                </div>
                <div className="delta" style={{background:'#e9fff4',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-links-line"></i> Research projects
                </div>
              </div>
            </div>

            {/* Recent Activities Section */}
            <div className="activity-section">
              <div className="activity-header">
                <h3>Recent Faculty Activity</h3>
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
                <div className="activity-item" onClick={() => alert('Activity Details:\n\nDocument Verification Request\n\nThis would open a detailed view of the verification request with student information and document details.')}>
                  <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                    <i className="ri-shield-check-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Verification Request Received</div>
                    <div className="activity-description">John Doe (CS2024001) submitted transcript for verification</div>
                  </div>
                  <div className="activity-time">2 hours ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nDocument Shared\n\nThis would show details about the document sharing activity and collaboration.')}>
                  <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                    <i className="ri-share-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Document Shared</div>
                    <div className="activity-description">Shared research paper with Dr. Sarah Smith (Mathematics Dept)</div>
                  </div>
                  <div className="activity-time">5 hours ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nCertificate Generated\n\nThis would show details about the generated certificate and student information.')}>
                  <div className="activity-icon" style={{background: '#e0e7ff', color: '#3730a3'}}>
                    <i className="ri-award-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Certificate Generated</div>
                    <div className="activity-description">Course completion certificate for Alice Johnson (MATH2024001)</div>
                  </div>
                  <div className="activity-time">1 day ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nChat Message\n\nThis would open the chat interface to view the conversation thread.')}>
                  <div className="activity-icon" style={{background: '#fef3c7', color: '#92400e'}}>
                    <i className="ri-chat-3-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">New Chat Message</div>
                    <div className="activity-description">Message from student regarding assignment submission</div>
                  </div>
                  <div className="activity-time">2 days ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nDocument Upload\n\nThis would show details about the uploaded document and its blockchain verification status.')}>
                  <div className="activity-icon" style={{background: '#d1fae5', color: '#065f46'}}>
                    <i className="ri-upload-cloud-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Document Uploaded</div>
                    <div className="activity-description">Uploaded lecture notes for Advanced Mathematics course</div>
                  </div>
                  <div className="activity-time">3 days ago</div>
                </div>

                <div className="activity-item" onClick={() => alert('Activity Details:\n\nCircular Published\n\nThis would show details about the published circular and its recipients.')}>
                  <div className="activity-icon" style={{background: '#e0e7ff', color: '#3730a3'}}>
                    <i className="ri-notification-4-line"></i>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">Circular Published</div>
                    <div className="activity-description">Published exam schedule circular to all students in section A & B</div>
                  </div>
                  <div className="activity-time">1 week ago</div>
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

export default FacultyDashboard;