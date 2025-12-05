import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WalletProvider, useWallet } from '../../contexts/WalletContext';
import { API_URL } from '../../services/api';
import Settings from '../shared/Settings';
import FileManager from '../shared/FileManagerNew';
import ChatInterface from '../shared/ChatInterface';
import DocumentGenerator from '../shared/DocumentGenerator';
import DocumentApproval from '../shared/DocumentApproval';
import VerificationTool from '../shared/VerificationTool';
import BlockchainMonitor from '../shared/BlockchainMonitor';
import ActivityLog from '../shared/ActivityLog';
import HelpSupport from '../shared/HelpSupport';
import Profile from '../../components/shared/Profile';
import AddUser from './AddUser';
import UserManagement from './UserManagement';
import InstitutionManagement from './InstitutionManagement';
import AccountRequests from './AccountRequests';
import NotificationDropdown from '../../components/shared/NotificationDropdown';
import GlobalSearch from '../../components/shared/GlobalSearch';
import './AdminDashboard.css';
import '../shared/dashboard.mobile.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Persist current page in sessionStorage so refresh stays on same page
  const [currentPage, setCurrentPage] = useState(() => {
    return sessionStorage.getItem('adminCurrentPage') || 'dashboard';
  });
  
  // Save page to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('adminCurrentPage', currentPage);
  }, [currentPage]);
  
  // Sidebar badge counts
  const [chatCount, setChatCount] = useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  
  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    users: { total: 0, students: 0, faculty: 0, admins: 0 },
    documents: { total: 0, approved: 0, pending: 0, rejected: 0 },
    approvals: { pending: 0, approved: 0, rejected: 0 },
    blockchain: { transactions: 0 },
    shares: { total: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setStatsLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/recent-activity?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setDashboardStats(statsData.stats);
        }
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) {
          setRecentActivity(activityData.activities || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [API_URL]);

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fetch sidebar counts
  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch unread message count
        const chatRes = await fetch(`${API_URL}/chat/unread`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChatCount(chatData.unread || 0);
        }

        // Fetch pending approval requests count
        const approvalRes = await fetch(`${API_URL}/approvals/my-tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (approvalRes.ok) {
          const approvalData = await approvalRes.json();
          const pendingCount = approvalData.tasks?.filter(r => r.status === 'PENDING')?.length || 0;
          setPendingApprovalsCount(pendingCount);
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

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
              </a>
              <a
                onClick={() => setCurrentPage('chat')}
                className={currentPage === 'chat' ? 'active' : ''}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-chat-3-line"></i> <span>Chat Messages</span>
                {chatCount > 0 && <span className="badge alert">{chatCount}</span>}
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
                {pendingApprovalsCount > 0 && <span className="badge alert">{pendingApprovalsCount}</span>}
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
              <a
                className={currentPage === 'user-management' ? 'active' : ''}
                onClick={() => setCurrentPage('user-management')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-user-line"></i> <span>User Management</span>
              </a>
              <a
                className={currentPage === 'account-requests' ? 'active' : ''}
                onClick={() => setCurrentPage('account-requests')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-user-settings-line"></i> <span>Account Requests</span>
              </a>
              <a 
                className={currentPage === 'add-user' ? 'active' : ''}
                onClick={() => setCurrentPage('add-user')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-user-add-line"></i> <span>Add User</span>
              </a>
              <a 
                className={currentPage === 'institution-management' ? 'active' : ''}
                onClick={() => setCurrentPage('institution-management')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-building-4-line"></i> <span>Institution Management</span>
              </a>
              <a
                className={currentPage === 'blockchain-monitor' ? 'active' : ''}
                onClick={() => setCurrentPage('blockchain-monitor')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-links-line"></i> <span>Blockchain Monitor</span>
              </a>
            </nav>

            <div className="section-title">System</div>
            <nav className="menu">
              <a
                className={currentPage === 'activity-log' ? 'active' : ''}
                onClick={() => setCurrentPage('activity-log')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-file-list-3-line"></i> <span>Activity Logs</span>
              </a>
              <a 
                className={currentPage === 'settings' ? 'active' : ''}
                onClick={() => setCurrentPage('settings')}
                style={{cursor: 'pointer'}}
              >
                <i className="ri-settings-3-line"></i> <span>System Settings</span>
              </a>
              <a
                className={currentPage === 'help-support' ? 'active' : ''}
                onClick={() => setCurrentPage('help-support')}
                style={{cursor: 'pointer'}}
              >
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

            <GlobalSearch 
              onNavigate={setCurrentPage} 
              currentPage={currentPage}
            />

            <div className="top-actions">
              <NotificationDropdown />
              
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
            ) : currentPage === 'help-support' ? (
              <HelpSupport />
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
            ) : currentPage === 'add-user' ? (
              <AddUser />
            ) : currentPage === 'user-management' ? (
              <UserManagement />
            ) : currentPage === 'institution-management' ? (
              <InstitutionManagement />
            ) : currentPage === 'account-requests' ? (
              <AccountRequests />
            ) : currentPage === 'blockchain-monitor' ? (
              <BlockchainMonitor userRole="admin" />
            ) : currentPage === 'activity-log' ? (
              <ActivityLog userRole="admin" />
            ) : (
              <div className="dashboard-content">
            {/* Welcome Header */}
            <div className="page-title">
              <h1 style={{fontWeight: 800, fontSize: '28px'}}>Welcome back, {getUserName()}!</h1>
              <p>Here's what's happening with your institution today.</p>
            </div>

            {/* First Row - Main Stats (Users, Faculty, Students, Admins) */}
            <div className="content-grid">
              <div className="card stat gradient">
                <div className="top">
                  <div>Total Users</div>
                  <i className="ri-team-line arrow"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.users?.total?.toLocaleString() || 0}</div>
                <div className="delta">
                  <i className="ri-group-line"></i> All users
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Faculty & Staff</div>
                  <i className="ri-user-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.users?.faculty?.toLocaleString() || 0}</div>
                <div className="delta">
                  <i className="ri-check-line"></i> Active members
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Total Students</div>
                  <i className="ri-graduation-cap-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.users?.students?.toLocaleString() || 0}</div>
                <div className="delta">
                  <i className="ri-user-line"></i> Registered students
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Total Admins</div>
                  <i className="ri-admin-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.users?.admins?.toLocaleString() || 0}</div>
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
                <div className="value">{statsLoading ? '...' : dashboardStats.documents?.total?.toLocaleString() || 0}</div>
                <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                  <i className="ri-file-line"></i> All documents
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Approved</div>
                  <i className="ri-checkbox-circle-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.approvals?.approved?.toLocaleString() || 0}</div>
                <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                  <i className="ri-check-line"></i> Verified
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Pending</div>
                  <i className="ri-time-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.approvals?.pending?.toLocaleString() || 0}</div>
                <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                  <i className="ri-hourglass-line"></i> In review
                </div>
              </div>

              <div className="card stat">
                <div className="top">
                  <div>Rejected</div>
                  <i className="ri-close-circle-line upto"></i>
                </div>
                <div className="value">{statsLoading ? '...' : dashboardStats.approvals?.rejected?.toLocaleString() || 0}</div>
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
                    fetchDashboardStats().then(() => {
                      btn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
                      btn.disabled = false;
                    });
                  }}>
                    <i className="ri-refresh-line"></i> Refresh
                  </button>
                  <button className="btn btn-sm" id="viewAllActivity" onClick={() => setCurrentPage('activity-log')}>
                    <i className="ri-external-link-line"></i> View All
                  </button>
                </div>
              </div>

              <div className="activity-feed" id="activityFeed">
                {statsLoading ? (
                  <div className="activity-item">
                    <div className="activity-content">
                      <div className="activity-title">Loading activities...</div>
                    </div>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="activity-item">
                    <div className="activity-icon" style={{background: 'var(--g-200)', color: 'var(--g-700)'}}>
                      <i className="ri-information-line"></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">No recent activity</div>
                      <div className="activity-description">Your recent activities will appear here</div>
                    </div>
                  </div>
                ) : (
                  recentActivity.map((activity) => {
                    // Get icon and color based on activity type
                    const getActivityIcon = (type) => {
                      const icons = {
                        'document_upload': 'ri-upload-cloud-line',
                        'upload': 'ri-upload-cloud-line',
                        'document_view': 'ri-eye-line',
                        'document_download': 'ri-download-line',
                        'document_share': 'ri-share-line',
                        'share': 'ri-share-line',
                        'document_approval': 'ri-checkbox-circle-line',
                        'approve': 'ri-checkbox-circle-line',
                        'document_generate': 'ri-file-add-line',
                        'folder_create': 'ri-folder-add-line',
                        'login': 'ri-login-box-line',
                        'logout': 'ri-logout-box-line',
                        'circular_create': 'ri-megaphone-line',
                        'message_send': 'ri-chat-3-line',
                        'approval_request': 'ri-shield-check-line',
                        'request_approval': 'ri-shield-check-line',
                        'approval_response': 'ri-checkbox-circle-line'
                      };
                      return icons[type] || 'ri-file-line';
                    };

                    const getActivityColor = (type) => {
                      const colors = {
                        'document_upload': { bg: '#e0e7ff', text: '#3730a3' },
                        'upload': { bg: '#e0e7ff', text: '#3730a3' },
                        'document_view': { bg: '#ecfdf5', text: '#065f46' },
                        'document_download': { bg: '#dbeafe', text: '#1e40af' },
                        'document_share': { bg: '#fef3c7', text: '#92400e' },
                        'share': { bg: '#fef3c7', text: '#92400e' },
                        'document_approval': { bg: '#d1fae5', text: '#065f46' },
                        'approve': { bg: '#d1fae5', text: '#065f46' },
                        'document_generate': { bg: '#e0e7ff', text: '#3730a3' },
                        'login': { bg: '#ecfdf5', text: '#065f46' },
                        'logout': { bg: '#fee2e2', text: '#991b1b' },
                        'circular_create': { bg: '#fef3c7', text: '#92400e' },
                        'message_send': { bg: '#e0e7ff', text: '#3730a3' },
                        'request_approval': { bg: '#dbeafe', text: '#1e40af' },
                        'approval_request': { bg: '#dbeafe', text: '#1e40af' }
                      };
                      return colors[type] || { bg: 'var(--g-200)', text: 'var(--g-700)' };
                    };

                    const formatTimeAgo = (timestamp) => {
                      const now = new Date();
                      const time = new Date(timestamp);
                      const diffMs = now - time;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);

                      if (diffMins < 1) return 'Just now';
                      if (diffMins < 60) return `${diffMins} min ago`;
                      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                      return time.toLocaleDateString();
                    };

                    const color = getActivityColor(activity.activity_type);
                    
                    return (
                      <div className="activity-item" key={activity.id}>
                        <div className="activity-icon" style={{background: color.bg, color: color.text}}>
                          <i className={getActivityIcon(activity.activity_type)}></i>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title || activity.activity_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                          <div className="activity-description">{activity.description}</div>
                        </div>
                        <div className="activity-time">{formatTimeAgo(activity.created_at)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-brand">
            <div className="logo">D</div>
            <div className="info">
              <div className="name">DocuChain</div>
              <div className="role">ADMIN</div>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
            <i className="ri-close-line"></i>
          </button>
        </div>
        
        <div className="mobile-wallet-section">
          <CustomWalletButton />
        </div>
        
        <nav className="mobile-nav-menu">
          <div className="mobile-section-title">Dashboard</div>
          <a className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }}>
            <i className="ri-dashboard-line"></i> <span>Overview</span>
          </a>
          <a className={currentPage === 'filemanager' ? 'active' : ''} onClick={() => { setCurrentPage('filemanager'); setMobileMenuOpen(false); }}>
            <i className="ri-folder-line"></i> <span>My Files</span>
          </a>
          <a className={currentPage === 'chat' ? 'active' : ''} onClick={() => { setCurrentPage('chat'); setMobileMenuOpen(false); }}>
            <i className="ri-chat-3-line"></i> <span>Chat Messages</span>
            {chatCount > 0 && <span className="badge">{chatCount}</span>}
          </a>
          <a className={currentPage === 'document-generator' ? 'active' : ''} onClick={() => { setCurrentPage('document-generator'); setMobileMenuOpen(false); }}>
            <i className="ri-file-add-line"></i> <span>Generate Document</span>
          </a>
          <a className={currentPage === 'document-approval' ? 'active' : ''} onClick={() => { setCurrentPage('document-approval'); setMobileMenuOpen(false); }}>
            <i className="ri-shield-check-line"></i> <span>Document Approval</span>
            {pendingApprovalsCount > 0 && <span className="badge">{pendingApprovalsCount}</span>}
          </a>
          <a className={currentPage === 'verification-tool' ? 'active' : ''} onClick={() => { setCurrentPage('verification-tool'); setMobileMenuOpen(false); }}>
            <i className="ri-qr-scan-2-line"></i> <span>Verify Document</span>
          </a>
          
          <div className="mobile-section-title">Administration</div>
          <a className={currentPage === 'user-management' ? 'active' : ''} onClick={() => { setCurrentPage('user-management'); setMobileMenuOpen(false); }}>
            <i className="ri-user-line"></i> <span>User Management</span>
          </a>
          <a className={currentPage === 'account-requests' ? 'active' : ''} onClick={() => { setCurrentPage('account-requests'); setMobileMenuOpen(false); }}>
            <i className="ri-user-settings-line"></i> <span>Account Requests</span>
          </a>
          <a className={currentPage === 'add-user' ? 'active' : ''} onClick={() => { setCurrentPage('add-user'); setMobileMenuOpen(false); }}>
            <i className="ri-user-add-line"></i> <span>Add User</span>
          </a>
          <a className={currentPage === 'institution-management' ? 'active' : ''} onClick={() => { setCurrentPage('institution-management'); setMobileMenuOpen(false); }}>
            <i className="ri-building-4-line"></i> <span>Institutions</span>
          </a>
          
          <div className="mobile-section-title">System</div>
          <a className={currentPage === 'activity-log' ? 'active' : ''} onClick={() => { setCurrentPage('activity-log'); setMobileMenuOpen(false); }}>
            <i className="ri-file-list-3-line"></i> <span>Activity Logs</span>
          </a>
          <a className={currentPage === 'blockchain-monitor' ? 'active' : ''} onClick={() => { setCurrentPage('blockchain-monitor'); setMobileMenuOpen(false); }}>
            <i className="ri-links-line"></i> <span>Blockchain Monitor</span>
          </a>
          <a className={currentPage === 'settings' ? 'active' : ''} onClick={() => { setCurrentPage('settings'); setMobileMenuOpen(false); }}>
            <i className="ri-settings-3-line"></i> <span>Settings</span>
          </a>
          <a className={currentPage === 'help-support' ? 'active' : ''} onClick={() => { setCurrentPage('help-support'); setMobileMenuOpen(false); }}>
            <i className="ri-question-line"></i> <span>Help & Support</span>
          </a>
          <a onClick={logout} className="logout-link">
            <i className="ri-logout-circle-line"></i> <span>Logout</span>
          </a>
        </nav>
      </div>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <i className="ri-menu-line"></i>
        </button>
        
        <div className="mobile-brand-mini">
          <span className="logo">D</span>
          <span className="name">DocuChain</span>
        </div>
        
        <div className="mobile-header-actions">
          <button className="mobile-search-btn" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <i className="ri-search-line"></i>
          </button>
          <NotificationDropdown />
          <div className="mobile-avatar" onClick={() => setProfileModalOpen(true)}>
            {getUserName().charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay">
          <GlobalSearch 
            onNavigate={(page) => { setCurrentPage(page); setMobileSearchOpen(false); }} 
            currentPage={currentPage}
          />
          <button className="mobile-search-close" onClick={() => setMobileSearchOpen(false)}>
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <a 
          className={currentPage === 'dashboard' ? 'active' : ''} 
          onClick={() => setCurrentPage('dashboard')}
        >
          <i className="ri-home-5-line"></i>
          <span>Home</span>
        </a>
        <a 
          className={currentPage === 'filemanager' ? 'active' : ''} 
          onClick={() => setCurrentPage('filemanager')}
        >
          <i className="ri-folder-line"></i>
          <span>Files</span>
        </a>
        <a 
          className={currentPage === 'chat' ? 'active' : ''} 
          onClick={() => setCurrentPage('chat')}
        >
          <i className="ri-chat-3-line"></i>
          <span>Chat</span>
          {chatCount > 0 && <span className="nav-badge">{chatCount}</span>}
        </a>
        <a 
          className={currentPage === 'document-approval' ? 'active' : ''} 
          onClick={() => setCurrentPage('document-approval')}
        >
          <i className="ri-shield-check-line"></i>
          <span>Approval</span>
          {pendingApprovalsCount > 0 && <span className="nav-badge">{pendingApprovalsCount}</span>}
        </a>
        <a 
          className={currentPage === 'settings' ? 'active' : ''} 
          onClick={() => setCurrentPage('settings')}
        >
          <i className="ri-settings-3-line"></i>
          <span>Settings</span>
        </a>
      </nav>

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