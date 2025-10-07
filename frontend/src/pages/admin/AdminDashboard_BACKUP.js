import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeChatItem, setActiveChatItem] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load RemixIcon CSS if not already loaded
    if (!document.querySelector('link[href*="remixicon"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleChatItemClick = (index) => {
    setActiveChatItem(index);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showProfileModal) {
        closeProfileModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileModal]);

  return (
    <div className="admin-container">
      <div className={`frame ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">A</div>
            <div className="info">
              <div className="name">EduChain Admin</div>
              <div className="role">ADMINISTRATOR</div>
            </div>
          </div>

          <div className="sidebar-content">
            <div className="section-title">Dashboard</div>
            <nav className="menu">
              <a 
                className={activeSection === 'overview' ? 'active' : ''} 
                onClick={() => handleSectionChange('overview')}
              >
                <i className="ri-dashboard-line"></i> <span>Overview</span>
              </a>
              <a 
                className={activeSection === 'my-files' ? 'active' : ''} 
                onClick={() => handleSectionChange('my-files')}
              >
                <i className="ri-folder-line"></i> <span>My Files</span>
                <span className="badge alert">24</span>
              </a>
              <a 
                className={activeSection === 'chat-messages' ? 'active' : ''} 
                onClick={() => handleSectionChange('chat-messages')}
              >
                <i className="ri-chat-3-line"></i> <span>Chat Messages</span>
                <span className="badge alert">5</span>
              </a>
              <a 
                className={activeSection === 'generate-document' ? 'active' : ''} 
                onClick={() => handleSectionChange('generate-document')}
              >
                <i className="ri-file-add-line"></i> <span>Generate Document</span>
              </a>
              <a 
                className={activeSection === 'document-verifier' ? 'active' : ''} 
                onClick={() => handleSectionChange('document-verifier')}
              >
                <i className="ri-shield-check-line"></i> <span>Document Verifier</span>
              </a>
            </nav>

            <div className="section-title">Administration</div>
            <nav className="menu">
              <a 
                className={activeSection === 'user-management' ? 'active' : ''} 
                onClick={() => handleSectionChange('user-management')}
              >
                <i className="ri-user-line"></i> <span>User Management</span>
              </a>
              <a 
                className={activeSection === 'account-requests' ? 'active' : ''} 
                onClick={() => handleSectionChange('account-requests')}
              >
                <i className="ri-user-settings-line"></i> <span>Account Requests</span>
                <span className="badge alert">7</span>
              </a>
              <a 
                className={activeSection === 'add-user' ? 'active' : ''} 
                onClick={() => handleSectionChange('add-user')}
              >
                <i className="ri-user-add-line"></i> <span>Add User</span>
              </a>
              <a 
                className={activeSection === 'institution-management' ? 'active' : ''} 
                onClick={() => handleSectionChange('institution-management')}
              >
                <i className="ri-building-4-line"></i> <span>Institution Management</span>
              </a>
              <a 
                className={activeSection === 'blockchain' ? 'active' : ''} 
                onClick={() => handleSectionChange('blockchain')}
              >
                <i className="ri-links-line"></i> <span>Blockchain Monitor</span>
              </a>
              <a 
                className={activeSection === 'circulars' ? 'active' : ''} 
                onClick={() => handleSectionChange('circulars')}
              >
                <i className="ri-broadcast-line"></i> <span>Circulars</span>
              </a>
            </nav>

            <div className="section-title">System</div>
            <nav className="menu">
              <a 
                className={activeSection === 'logs' ? 'active' : ''} 
                onClick={() => handleSectionChange('logs')}
              >
                <i className="ri-file-list-3-line"></i> <span>Activity Logs</span>
              </a>
              <a 
                className={activeSection === 'settings' ? 'active' : ''} 
                onClick={() => handleSectionChange('settings')}
              >
                <i className="ri-settings-3-line"></i> <span>System Settings</span>
              </a>
              <a onClick={() => {}}>
                <i className="ri-question-line"></i> <span>Help & Support</span>
              </a>
              <a onClick={handleLogout}>
                <i className="ri-logout-circle-line"></i> <span>Logout</span>
              </a>
            </nav>
          </div>

          <div className="download-card">
            <small style={{
              backgroundColor: 'rgba(255,255,255,.16)',
              borderColor: 'rgba(255,255,255,.25)',
              color: '#eafff6',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid',
              display: 'inline-block'
            }}>Admin Tools</small>
            <h4>Admin Mobile App</h4>
            <p>Manage your institution on the go with full administrative control.</p>
            <a href="#" className="btn">
              <i className="ri-download-2-line"></i> Download
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="hamburger-menu" onClick={toggleSidebar}>
              <i className="ri-menu-line"></i>
            </div>

            <div className="circle" title="Institution Apps">
              <i className="ri-apps-2-line"></i>
            </div>

            <div className="search">
              <i className="ri-search-line"></i>
              <input placeholder="Search files, documents, users..." />
              <span className="chip">
                <i className="ri-shield-check-line"></i> System: Operational
              </span>
            </div>

            <div className="top-actions">
              <button className="icon-btn has-alert" title="System Notifications">
                <i className="ri-notification-3-line"></i>
              </button>
              <button className="icon-btn" title="System Health Monitor">
                <i className="ri-pulse-line"></i>
              </button>
              <button className="icon-btn" title="Quick Actions">
                <i className="ri-flashlight-line"></i>
              </button>

              <div className="profile" onClick={() => setShowProfileModal(true)}>
                <div className="avatar">AD</div>
                <div className="who">
                  <b>Admin User</b>
                  <small className="muted">{user?.email || 'admin@university.edu'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Page Actions */}
          <div className="bar-actions">
            <button className="btn primary">
              <i className="ri-upload-line"></i> Upload File
            </button>
            <button className="btn success">
              <i className="ri-file-add-line"></i> Generate Document
            </button>
            <button className="btn">
              <i className="ri-shield-check-line"></i> Verify Document
            </button>
            <button className="btn" onClick={() => handleSectionChange('chat-messages')}>
              <i className="ri-chat-3-line"></i> Send Message
            </button>
            <button className="btn">
              <i className="ri-user-add-line"></i> Add User
            </button>
            <button className="btn" onClick={() => handleSectionChange('institution-management')}>
              <i className="ri-building-4-line"></i> Institution Management
            </button>
          </div>

          <div className="content">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="section active">
                <div className="page-title">
                  <h1>Administrative Dashboard</h1>
                  <p>Comprehensive management and oversight of your educational institution's blockchain document verification system.</p>
                </div>

                {/* Key Metrics */}
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
                    <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                      <i className="ri-check-line"></i> Active members
                    </div>
                  </div>

                  <div className="card stat">
                    <div className="top">
                      <div>Departments</div>
                      <i className="ri-building-line upto"></i>
                    </div>
                    <div className="value">12</div>
                    <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
                      <i className="ri-information-line"></i> Active departments
                    </div>
                  </div>

                  <div className="card stat">
                    <div className="top">
                      <div>Chat Messages</div>
                      <i className="ri-chat-3-line upto"></i>
                    </div>
                    <div className="value">5</div>
                    <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                      <i className="ri-message-line"></i> Unread messages
                    </div>
                  </div>

                  {/* Document Status Overview */}
                  <div className="card" style={{gridColumn: 'span 2'}}>
                    <h3>Document Status Overview</h3>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginTop:'16px'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'var(--g-600)'}}>2,847</div>
                        <div className="subtle">Verified</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'var(--warning)'}}>156</div>
                        <div className="subtle">Pending</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'var(--danger)'}}>23</div>
                        <div className="subtle">Rejected</div>
                      </div>
                    </div>
                  </div>

                  {/* System Health Overview */}
                  <div className="card" style={{gridColumn: 'span 2'}}>
                    <h3>System Health & Performance</h3>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'16px', marginTop:'16px'}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'var(--g-600)'}}>99.8%</div>
                        <div className="subtle">System Uptime</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'var(--info)'}}>1.2s</div>
                        <div className="subtle">Avg Response</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'var(--g-500)'}}>15.7k</div>
                        <div className="subtle">Blockchain Transactions</div>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'var(--warning)'}}>0.05 ETH</div>
                        <div className="subtle">Avg Gas Cost</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Administrative Activity */}
                  <div className="card" style={{gridColumn: 'span 4'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                      <h3>Recent Administrative Activity</h3>
                      <div style={{display:'flex', gap:'8px'}}>
                        <button className="btn btn-sm">
                          <i className="ri-refresh-line"></i> Refresh
                        </button>
                        <button className="btn btn-sm">
                          <i className="ri-external-link-line"></i> View All
                        </button>
                      </div>
                    </div>
                    <div>
                      <ActivityItem
                        icon="ri-file-check-line"
                        title="Document Approved"
                        description="Transcript_2024.pdf approved for John Doe (Computer Science)"
                        time="2 min ago"
                      />
                      <ActivityItem
                        icon="ri-user-add-line"
                        title="Account Request Approved"
                        description="New student account created for Jane Smith (Mathematics Department)"
                        time="8 min ago"
                      />
                      <ActivityItem
                        icon="ri-chat-3-line"
                        title="New Message Received"
                        description="Message from Dr. Smith regarding document verification process"
                        time="15 min ago"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages Section */}
            {activeSection === 'chat-messages' && (
              <div className="section">
                <div className="page-title">
                  <h1>Chat Messages</h1>
                  <p>Real-time communication with students, faculty, and staff. Manage institutional communications efficiently.</p>
                </div>

                <div className="content-grid">
                  <div className="card stat">
                    <div className="top">
                      <div>Unread Messages</div>
                      <i className="ri-message-line upto"></i>
                    </div>
                    <div className="value">5</div>
                    <div className="delta" style={{background:'#eef2ff',color:'#3949ab',borderColor:'#e5e7eb'}}>
                      <i className="ri-time-line"></i> Requires response
                    </div>
                  </div>

                  <div className="card stat">
                    <div className="top">
                      <div>Active Chats</div>
                      <i className="ri-chat-3-line upto"></i>
                    </div>
                    <div className="value">12</div>
                    <div className="delta">
                      <i className="ri-check-line"></i> Online now
                    </div>
                  </div>

                  <div className="card stat">
                    <div className="top">
                      <div>Today's Messages</div>
                      <i className="ri-send-plane-line upto"></i>
                    </div>
                    <div className="value">47</div>
                    <div className="delta">
                      <i className="ri-arrow-up-line"></i> +15 since morning
                    </div>
                  </div>

                  <div className="card stat">
                    <div className="top">
                      <div>Response Rate</div>
                      <i className="ri-time-line upto"></i>
                    </div>
                    <div className="value">95%</div>
                    <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
                      <i className="ri-check-line"></i> Excellent
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="card" style={{gridColumn: 'span 4'}}>
                    <h3 style={{marginBottom: '16px'}}>Messages</h3>
                    <ChatInterface activeChatItem={activeChatItem} onChatItemClick={handleChatItemClick} />
                  </div>
                </div>
              </div>
            )}

            {/* Account Requests Section */}
            {activeSection === 'account-requests' && (
              <AccountRequestsSection />
            )}

            {/* Institution Management Section */}
            {activeSection === 'institution-management' && (
              <InstitutionManagementSection />
            )}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        show={showProfileModal} 
        onClose={closeProfileModal}
        user={user}
      />
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ icon, title, description, time }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    padding: '12px',
    border: '1px solid var(--line)',
    borderRadius: '12px',
    marginBottom: '8px'
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'var(--g-200)',
      color: 'var(--g-700)',
      display: 'grid',
      placeItems: 'center',
      fontSize: '16px'
    }}>
      <i className={icon}></i>
    </div>
    <div style={{flex: 1}}>
      <div style={{fontWeight: 600, marginBottom: '2px'}}>{title}</div>
      <div style={{color: 'var(--muted)', fontSize: '13px'}}>{description}</div>
    </div>
    <div style={{color: 'var(--muted)', fontSize: '12px'}}>{time}</div>
  </div>
);

// Chat Interface Component
const ChatInterface = ({ activeChatItem, onChatItemClick }) => {
  const chatContacts = [
    { name: 'Dr. John Smith', avatar: 'JS', preview: 'Regarding the document verification...' },
    { name: 'Sarah Wilson', avatar: 'SW', preview: 'Can you help with the certificate...' },
    { name: 'Mike Brown', avatar: 'MB', preview: 'Thank you for approving my request' },
    { name: 'Alice Johnson', avatar: 'AJ', preview: 'When will my transcript be ready?' },
    { name: 'Robert Davis', avatar: 'RD', preview: 'System maintenance scheduled for...' },
  ];

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-search">
          <input type="text" placeholder="Search conversations..." />
        </div>
        <div className="chat-list">
          {chatContacts.map((contact, index) => (
            <div
              key={index}
              className={`chat-item ${activeChatItem === index ? 'active' : ''}`}
              onClick={() => onChatItemClick(index)}
            >
              <div className="chat-avatar">{contact.avatar}</div>
              <div className="chat-info">
                <div className="chat-name">{contact.name}</div>
                <div className="chat-preview">{contact.preview}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-avatar">JS</div>
          <div>
            <div style={{fontWeight: 600}}>Dr. John Smith</div>
            <div style={{fontSize: '12px', color: 'var(--muted)'}}>
              Computer Science Department • Online
            </div>
          </div>
          <div style={{marginLeft: 'auto', display: 'flex', gap: '8px'}}>
            <button className="btn btn-sm"><i className="ri-phone-line"></i></button>
            <button className="btn btn-sm"><i className="ri-video-line"></i></button>
            <button className="btn btn-sm"><i className="ri-more-line"></i></button>
          </div>
        </div>

        <div className="chat-messages">
          <div className="message">
            <div className="message-avatar">JS</div>
            <div>
              <div className="message-content">
                Hi Admin, I need help with the document verification process. Some of my students are facing issues with their transcript verification.
              </div>
              <div className="message-time">10:30 AM</div>
            </div>
          </div>

          <div className="message sent">
            <div className="message-avatar">AD</div>
            <div>
              <div className="message-content">
                Hello Dr. Smith! I'd be happy to help. Can you provide me with the specific student IDs or names so I can check their verification status?
              </div>
              <div className="message-time">10:32 AM</div>
            </div>
          </div>

          <div className="message">
            <div className="message-avatar">JS</div>
            <div>
              <div className="message-content">
                Sure! The students are: John Doe (CS2024001), Jane Smith (CS2024002), and Mike Johnson (CS2024003). They submitted their requests last week.
              </div>
              <div className="message-time">10:35 AM</div>
            </div>
          </div>

          <div className="message sent">
            <div className="message-avatar">AD</div>
            <div>
              <div className="message-content">
                I've checked their records. John Doe and Jane Smith's verifications are complete. Mike Johnson's transcript is pending - there's a missing signature. I'll process it manually today.
              </div>
              <div className="message-time">10:38 AM</div>
            </div>
          </div>

          <div className="message">
            <div className="message-avatar">JS</div>
            <div>
              <div className="message-content">
                Perfect! Thank you so much for the quick response. I'll let Mike know to expect his verified transcript today.
              </div>
              <div className="message-time">10:40 AM</div>
            </div>
          </div>
        </div>

        <div className="chat-input">
          <input type="text" placeholder="Type your message..." />
          <button type="button">
            <i className="ri-send-plane-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Account Requests Section Component
const AccountRequestsSection = () => {
  const approveRequest = (id) => {
    if (window.confirm('Approve this account request?')) {
      alert('Account request approved successfully! User credentials will be sent via email.');
    }
  };

  const rejectRequest = (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      alert('Account request rejected. Applicant will be notified via email.');
    }
  };

  const viewRequestDetails = (id) => {
    alert('Opening detailed view of account request...');
  };

  return (
    <div className="section">
      <div className="page-title">
        <h1>Account Requests Management</h1>
        <p>Review, approve, and manage new user registration requests with comprehensive verification.</p>
      </div>

      <div className="content-grid">
        <div className="card stat">
          <div className="top">
            <div>Pending Requests</div>
            <i className="ri-time-line upto"></i>
          </div>
          <div className="value">7</div>
          <div className="delta" style={{background:'#fff7e5',color:'#a36b00',borderColor:'#fde4b6'}}>
            <i className="ri-clock-line"></i> Awaiting review
          </div>
        </div>

        <div className="card stat">
          <div className="top">
            <div>Approved Today</div>
            <i className="ri-check-line upto"></i>
          </div>
          <div className="value">12</div>
          <div className="delta">
            <i className="ri-arrow-up-line"></i> +8 since yesterday
          </div>
        </div>

        <div className="card stat">
          <div className="top">
            <div>Rejected Requests</div>
            <i className="ri-close-line upto"></i>
          </div>
          <div className="value">3</div>
          <div className="delta" style={{background:'#ffe7e7',color:'#9b1c1c',borderColor:'#ffcaca'}}>
            <i className="ri-error-warning-line"></i> This week
          </div>
        </div>

        <div className="card stat">
          <div className="top">
            <div>Total Processed</div>
            <i className="ri-user-line upto"></i>
          </div>
          <div className="value">156</div>
          <div className="delta">
            <i className="ri-check-line"></i> This month
          </div>
        </div>

        <div className="card" style={{gridColumn: 'span 4'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
            <h3>Pending Account Requests</h3>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <select style={{padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '10px', background: '#fff'}}>
                <option value="">All Requests</option>
                <option value="student">Student Requests</option>
                <option value="faculty">Faculty Requests</option>
                <option value="staff">Staff Requests</option>
              </select>
              <button className="btn btn-sm success">
                <i className="ri-check-double-line"></i> Bulk Approve
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" /> Applicant Details</th>
                  <th>Requested Role</th>
                  <th>Department</th>
                  <th>Application Date</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <input type="checkbox" />
                      <div className="avatar" style={{width: '36px', height: '36px', fontSize: '12px'}}>AJ</div>
                      <div>
                        <strong>Alice Johnson</strong>
                        <div className="subtle">alice.johnson@email.com</div>
                        <div className="subtle">Phone: +1 (555) 234-5678</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status active">Student</span>
                    <div className="subtle">Undergraduate</div>
                  </td>
                  <td>
                    <div>Computer Science</div>
                    <div className="subtle">Preferred Section: A</div>
                  </td>
                  <td>
                    <div>Dec 18, 2024</div>
                    <div className="subtle">2 hours ago</div>
                  </td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      <span className="status verified" style={{fontSize: '11px'}}>ID Copy ✓</span>
                      <span className="status verified" style={{fontSize: '11px'}}>Application Form ✓</span>
                      <span className="status pending" style={{fontSize: '11px'}}>Transcript (Pending)</span>
                    </div>
                  </td>
                  <td><span className="status pending"><i className="ri-time-line"></i> Under Review</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm success" onClick={() => approveRequest('req1')}>
                        <i className="ri-check-line"></i>
                      </button>
                      <button className="btn btn-sm danger" onClick={() => rejectRequest('req1')}>
                        <i className="ri-close-line"></i>
                      </button>
                      <button className="btn btn-sm" onClick={() => viewRequestDetails('req1')}>
                        <i className="ri-eye-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <input type="checkbox" />
                      <div className="avatar" style={{width: '36px', height: '36px', fontSize: '12px'}}>MB</div>
                      <div>
                        <strong>Michael Brown</strong>
                        <div className="subtle">m.brown@email.com</div>
                        <div className="subtle">Phone: +1 (555) 345-6789</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status verified">Faculty</span>
                    <div className="subtle">Assistant Professor</div>
                  </td>
                  <td>
                    <div>Mathematics</div>
                    <div className="subtle">Teaching Position</div>
                  </td>
                  <td>
                    <div>Dec 17, 2024</div>
                    <div className="subtle">1 day ago</div>
                  </td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      <span className="status verified" style={{fontSize: '11px'}}>CV ✓</span>
                      <span className="status verified" style={{fontSize: '11px'}}>Certificates ✓</span>
                      <span className="status verified" style={{fontSize: '11px'}}>References ✓</span>
                    </div>
                  </td>
                  <td><span className="status pending"><i className="ri-time-line"></i> Under Review</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm success" onClick={() => approveRequest('req2')}>
                        <i className="ri-check-line"></i>
                      </button>
                      <button className="btn btn-sm danger" onClick={() => rejectRequest('req2')}>
                        <i className="ri-close-line"></i>
                      </button>
                      <button className="btn btn-sm" onClick={() => viewRequestDetails('req2')}>
                        <i className="ri-eye-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Institution Management Section Component
const InstitutionManagementSection = () => (
  <div className="section">
    <div className="page-title">
      <h1>Institution Management</h1>
      <p>Comprehensive management of institutional structure, departments, sections, and organizational hierarchy.</p>
    </div>

    <div className="content-grid">
      <div className="card stat gradient">
        <div className="top">
          <div>Total Departments</div>
          <i className="ri-building-line arrow"></i>
        </div>
        <div className="value">12</div>
        <div className="delta"><i className="ri-arrow-up-line"></i> +2 this year</div>
      </div>

      <div className="card stat">
        <div className="top">
          <div>Academic Sections</div>
          <i className="ri-grid-line upto"></i>
        </div>
        <div className="value">28</div>
        <div className="delta">
          <i className="ri-check-line"></i> All active
        </div>
      </div>

      <div className="card stat">
        <div className="top">
          <div>Faculty Members</div>
          <i className="ri-user-line upto"></i>
        </div>
        <div className="value">89</div>
        <div className="delta">
          <i className="ri-arrow-up-line"></i> +5 this month
        </div>
      </div>

      <div className="card stat">
        <div className="top">
          <div>Accredited Depts</div>
          <i className="ri-award-line upto"></i>
        </div>
        <div className="value">10</div>
        <div className="delta" style={{background:'#edfff6',color:'#0f6d4f',borderColor:'#c0f0d7'}}>
          <i className="ri-shield-check-line"></i> Certified
        </div>
      </div>

      {/* Create New Department */}
      <div className="card" style={{gridColumn: 'span 2'}}>
        <h3>Create New Department</h3>
        <form style={{marginTop: '16px'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              <label style={{fontSize: '13px', color: 'var(--text)', fontWeight: 600}}>Department Name</label>
              <input type="text" placeholder="e.g., Computer Science" style={{font: 'inherit', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '12px', background: '#fff'}} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              <label style={{fontSize: '13px', color: 'var(--text)', fontWeight: 600}}>Department Code</label>
              <input type="text" placeholder="e.g., CS" style={{font: 'inherit', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '12px', background: '#fff'}} />
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px'}}>
            <label style={{fontSize: '13px', color: 'var(--text)', fontWeight: 600}}>Head of Department</label>
            <select style={{font: 'inherit', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '12px', background: '#fff'}}>
              <option>Select Department Head</option>
              <option>Dr. Robert Wilson</option>
              <option>Prof. Sarah Smith</option>
              <option>Dr. Michael Johnson</option>
            </select>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px'}}>
            <label style={{fontSize: '13px', color: 'var(--text)', fontWeight: 600}}>Description</label>
            <textarea placeholder="Brief description of the department..." style={{font: 'inherit', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: '12px', background: '#fff', resize: 'vertical', minHeight: '80px'}}></textarea>
          </div>
          <button type="submit" className="btn primary" style={{width: '100%', marginTop: '16px'}}>
            <i className="ri-building-add-line"></i> Create Department
          </button>
        </form>
      </div>

      {/* Department Directory */}
      <div className="card" style={{gridColumn: 'span 2'}}>
        <h3>Department Directory</h3>
        <div style={{display: 'grid', gap: '12px', marginTop: '16px'}}>
          <div style={{padding: '16px', border: '1px solid var(--line)', borderRadius: '16px', background: '#fff'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
              <div>
                <div style={{fontWeight: 700, color: 'var(--g-700)', marginBottom: '4px'}}>Computer Science</div>
                <div style={{color: 'var(--muted)', fontSize: '13px'}}>3 sections • 245 students • 12 faculty</div>
              </div>
              <div style={{display: 'flex', gap: '6px'}}>
                <button className="btn btn-sm"><i className="ri-edit-line"></i></button>
                <button className="btn btn-sm"><i className="ri-settings-line"></i></button>
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <span className="status active">Active</span>
              <span className="status verified">Accredited</span>
            </div>
          </div>

          <div style={{padding: '16px', border: '1px solid var(--line)', borderRadius: '16px', background: '#fff'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px'}}>
              <div>
                <div style={{fontWeight: 700, color: 'var(--g-700)', marginBottom: '4px'}}>Mathematics</div>
                <div style={{color: 'var(--muted)', fontSize: '13px'}}>2 sections • 189 students • 8 faculty</div>
              </div>
              <div style={{display: 'flex', gap: '6px'}}>
                <button className="btn btn-sm"><i className="ri-edit-line"></i></button>
                <button className="btn btn-sm"><i className="ri-settings-line"></i></button>
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <span className="status active">Active</span>
              <span className="status verified">Accredited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Settings */}
      <div className="card" style={{gridColumn: 'span 4'}}>
        <h3>Institution Settings</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '16px'}}>
          <div style={{padding: '16px', border: '1px solid var(--line)', borderRadius: '12px', background: '#f8fafc', textAlign: 'center'}}>
            <i className="ri-building-4-line" style={{fontSize: '32px', color: 'var(--g-600)', marginBottom: '12px'}}></i>
            <div style={{fontWeight: 600, marginBottom: '4px'}}>Institution Profile</div>
            <div className="subtle">Update basic institution information</div>
            <button className="btn btn-sm" style={{marginTop: '12px'}}>
              <i className="ri-edit-line"></i> Edit Profile
            </button>
          </div>

          <div style={{padding: '16px', border: '1px solid var(--line)', borderRadius: '12px', background: '#f8fafc', textAlign: 'center'}}>
            <i className="ri-shield-check-line" style={{fontSize: '32px', color: 'var(--g-600)', marginBottom: '12px'}}></i>
            <div style={{fontWeight: 600, marginBottom: '4px'}}>Accreditation</div>
            <div className="subtle">Manage accreditation certificates</div>
            <button className="btn btn-sm" style={{marginTop: '12px'}}>
              <i className="ri-award-line"></i> View Certificates
            </button>
          </div>

          <div style={{padding: '16px', border: '1px solid var(--line)', borderRadius: '12px', background: '#f8fafc', textAlign: 'center'}}>
            <i className="ri-global-line" style={{fontSize: '32px', color: 'var(--g-600)', marginBottom: '12px'}}></i>
            <div style={{fontWeight: 600, marginBottom: '4px'}}>Global Settings</div>
            <div className="subtle">Configure system-wide preferences</div>
            <button className="btn btn-sm" style={{marginTop: '12px'}}>
              <i className="ri-settings-3-line"></i> Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Profile Modal Component
const ProfileModal = ({ show, onClose, user }) => (
  <div className={`profile-overlay ${show ? 'show' : ''}`} onClick={onClose}>
    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
      <div className="profile-header">
        <button className="profile-close" onClick={onClose}>
          <i className="ri-close-line"></i>
        </button>
        <div className="profile-avatar">AD</div>
        <div className="profile-name">Admin User</div>
        <div className="profile-role">SYSTEM ADMINISTRATOR</div>
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
              <div className="profile-detail-value">Administrator User</div>
            </div>
          </div>

          <div className="profile-detail">
            <div className="profile-detail-icon">
              <i className="ri-shield-user-line"></i>
            </div>
            <div className="profile-detail-content">
              <div className="profile-detail-label">Admin ID</div>
              <div className="profile-detail-value">ADM-2024-001</div>
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
              <div className="profile-detail-label">Security Level</div>
              <div className="profile-detail-value">Maximum Access</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="profile-actions">
          <button className="btn primary">
            <i className="ri-edit-line"></i> Edit Profile
          </button>
          <button className="btn">
            <i className="ri-settings-3-line"></i> Account Settings
          </button>
          <button className="btn">
            <i className="ri-key-2-line"></i> Change Password
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
