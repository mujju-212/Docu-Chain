import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WalletProvider, useWallet } from '../../contexts/WalletContext';
import Settings from '../shared/Settings';
import FileManager from '../shared/FileManagerNew';
import ChatInterface from '../shared/ChatInterface';
import DocumentGenerator from '../shared/DocumentGenerator';
import DocumentApproval from '../shared/DocumentApproval';
import VerificationTool from '../shared/VerificationTool';
import Profile from '../../components/shared/Profile';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Custom Wallet Component with dropdown
  const CustomWalletButton = () => {
    const { 
      isConnected, 
      address, 
      isLoading, 
      isMetaMaskInstalled, 
      networkInfo,
      connect, 
      disconnect, 
      getFormattedAddress 
    } = useWallet();
    
    const [showDropdown, setShowDropdown] = useState(false);

    const handleConnect = async () => {
      try {
        await connect();
      } catch (error) {
        console.error('Connect wallet error:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    };

    const handleDisconnect = () => {
      try {
        disconnect();
        setShowDropdown(false);
      } catch (error) {
        console.error('Disconnect wallet error:', error);
      }
    };

    const handleSwitchWallet = async () => {
      setShowDropdown(false);
      try {
        console.log('🔀 Switch Wallet clicked');
        const accounts = await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        }).then(() => window.ethereum.request({
          method: 'eth_requestAccounts'
        }));
        
        console.log('✅ Switched to account:', accounts[0]);
      } catch (error) {
        console.error('❌ Error switching wallet:', error);
        if (error.code !== 4001) {
          alert('Failed to switch wallet');
        }
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-wallet-dropdown]') && !e.target.closest('.wallet-dropdown-btn')) {
          setShowDropdown(false);
        }
      };
      
      if (showDropdown) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [showDropdown]);

    if (!isMetaMaskInstalled) {
      return (
        <button 
          className="btn primary" 
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
        >
          <i className="ri-download-line"></i> Install MetaMask
        </button>
      );
    }

    if (isLoading) {
      return (
        <button className="btn primary" disabled>
          <i className="ri-loader-4-line"></i> Connecting...
        </button>
      );
    }

    if (isConnected) {
      return (
        <div style={{ position: 'relative' }}>
          <button 
            className="btn success wallet-dropdown-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <i className="ri-wallet-3-line" style={{ fontSize: '16px', color: '#10b981' }}></i> 
            <span style={{ fontWeight: '500' }}>{getFormattedAddress()}</span>
            <i className={`ri-arrow-${showDropdown ? 'up' : 'down'}-s-line`} style={{ fontSize: '16px' }}></i>
          </button>

          {showDropdown && (
            <div 
              data-wallet-dropdown
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '-50px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 9999,
                minWidth: '280px',
                overflow: 'hidden'
              }}
            >
              {/* Wallet Address Section */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                  Wallet Address:
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#111827',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  marginBottom: '8px'
                }}>
                  {address}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  <i className="ri-user-line"></i> {user?.username || 'Admin'}
                </div>
              </div>

              {/* Network Info */}
              <div style={{
                padding: '8px 16px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: networkInfo?.isCorrectNetwork ? '#22c55e' : '#ef4444'
                }}></div>
                <span style={{ 
                  fontSize: '12px', 
                  color: networkInfo?.isCorrectNetwork ? '#059669' : '#dc2626', 
                  fontWeight: '500' 
                }}>
                  {networkInfo?.networkName || 'Unknown Network'}
                </span>
              </div>

              {/* Warning if wrong network */}
              {networkInfo && !networkInfo.isCorrectNetwork && (
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: '#fef2f2',
                  borderBottom: '1px solid #fecaca',
                  fontSize: '11px',
                  color: '#991b1b'
                }}>
                  ⚠️ Please switch to Sepolia Testnet
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ padding: '8px' }}>
                {/* Switch Wallet */}
                <button
                  onClick={handleSwitchWallet}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    transition: 'background-color 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <i className="ri-arrow-left-right-line" style={{ fontSize: '16px', color: '#6b7280' }}></i>
                  <span>Switch Wallet</span>
                </button>

                {/* Disconnect Wallet */}
                <button
                  onClick={handleDisconnect}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <i className="ri-logout-box-r-line" style={{ fontSize: '16px' }}></i>
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <button className="btn primary" onClick={handleConnect}>
        <i className="ri-wallet-3-line"></i> Connect Wallet
      </button>
    );
  };

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

  const getUserName = () => {
    // Try fullName first (if it exists)
    if (user?.fullName) return user.fullName;
    
    // Try firstName + lastName
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Try just firstName
    if (user?.firstName) return user.firstName;
    
    // Try name field (fallback)
    if (user?.name) return user.name;
    
    // Extract from email as last resort
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return 'Admin User';
  };

  return (
    <WalletProvider>
      <div className="admin-container admin-dashboard">
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
              <div className="role">ADMIN</div>
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
                <span className="badge alert">24</span>
              </a>
              <a
                onClick={() => setCurrentPage('chat')}
                className={currentPage === 'chat' ? 'active' : ''}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-chat-3-line"></i> <span>Chat Messages</span>
                <span className="badge alert">5</span>
              </a>
              <a
                onClick={() => setCurrentPage('document-generator')}
                className={currentPage === 'document-generator' ? 'active' : ''}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-file-add-line"></i> <span>Generate Document</span>
              </a>
              <a
                onClick={() => setCurrentPage('document-approval')}
                className={currentPage === 'document-approval' ? 'active' : ''}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-shield-check-line"></i> <span>Document Approval</span>
              </a>
              <a
                onClick={() => setCurrentPage('verification-tool')}
                className={currentPage === 'verification-tool' ? 'active' : ''}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-qr-scan-2-line"></i> <span>Verify Document</span>
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
              <a 
                className={currentPage === 'settings' ? 'active' : ''}
                onClick={() => setCurrentPage('settings')}
                style={{cursor: 'pointer'}}
              >
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
            <CustomWalletButton />

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
          <div className={`content ${currentPage === 'chat' ? 'chat-content' : ''}`}>
            {currentPage === 'settings' ? (
              <Settings />
            ) : currentPage === 'filemanager' ? (
              <FileManager />
            ) : currentPage === 'chat' ? (
              <ChatInterface />
            ) : currentPage === 'document-generator' ? (
              <DocumentGenerator />
            ) : currentPage === 'document-approval' ? (
              <DocumentApproval userRole="admin" />
            ) : currentPage === 'verification-tool' ? (
              <VerificationTool />
            ) : (
              <div className="dashboard-content">
            {/* Welcome Header */}
            <div className="page-title">
              <h1 style={{fontWeight: 800, fontSize: '28px'}}>Welcome back, {getUserName()}!</h1>
              <p>Here's what's happening with your institution today.</p>
            </div>

            {/* First Row - Main Stats (Students, Faculty, Departments, Admins) */}
            <div className="content-grid">
              <div className="card stat gradient">
                <div className="top">
                  <div>Total Students</div>
                  <i className="ri-graduation-cap-line arrow"></i>
                </div>
                <div className="value">1,247</div>
                <div className="delta">
                  <i className="ri-arrow-up-line"></i> +23 this month
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Faculty & Staff</div>
                  <i className="ri-user-line upto"></i>
                </div>
                <div className="value">89</div>
                <div className="delta">
                  <i className="ri-check-line"></i> Active members
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Departments</div>
                  <i className="ri-building-line upto"></i>
                </div>
                <div className="value">12</div>
                <div className="delta">
                  <i className="ri-information-line"></i> Active departments
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Total Admins</div>
                  <i className="ri-admin-line upto"></i>
                </div>
                <div className="value">5</div>
                <div className="delta">
                  <i className="ri-shield-check-line"></i> System admins
                </div>
              </div>
            </div>

            {/* Document Status Overview Section */}
            <div className="content-grid">
              <div className="card stat">
                <div className="top">
                  <div>Total Documents</div>
                  <i className="ri-file-list-line upto"></i>
                </div>
                <div className="value">3,026</div>
                <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                  <i className="ri-file-line"></i> All documents
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Approved</div>
                  <i className="ri-checkbox-circle-line upto"></i>
                </div>
                <div className="value">2,847</div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> Verified
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Pending</div>
                  <i className="ri-time-line upto"></i>
                </div>
                <div className="value">156</div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-hourglass-line"></i> In review
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Rejected</div>
                  <i className="ri-close-circle-line upto"></i>
                </div>
                <div className="value">23</div>
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
    </WalletProvider>
  );
};

export default AdminDashboard;