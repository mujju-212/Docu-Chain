import React, { useState } from 'react';
import './DocumentApproval.css';

const DocumentApproval = ({ userRole = 'faculty' }) => {
  // State Management
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'receive'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [approvalType, setApprovalType] = useState('standard'); // 'standard' or 'digital'
  const [approvalProcess, setApprovalProcess] = useState('parallel'); // 'parallel' or 'sequential'
  const [purpose, setPurpose] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample blockchain documents (from File Manager)
  const blockchainDocuments = [
    {
      id: 'doc1',
      name: 'Leave_Application_March_2025.pdf',
      size: '245 KB',
      ipfsHash: 'QmXyZ...abc123',
      txId: '0x7a8b9c1d2e3f4a5b...',
      uploadDate: '2025-03-15',
      status: 'verified'
    },
    {
      id: 'doc2',
      name: 'Student_Bonafide_Certificate.pdf',
      size: '180 KB',
      ipfsHash: 'QmAbc...def456',
      txId: '0x9f8e7d6c5b4a3e2f...',
      uploadDate: '2025-03-10',
      status: 'verified'
    },
    {
      id: 'doc3',
      name: 'Salary_Increment_Request.pdf',
      size: '320 KB',
      ipfsHash: 'QmDef...ghi789',
      txId: '0x1a2b3c4d5e6f7g8h...',
      uploadDate: '2025-03-08',
      status: 'verified'
    }
  ];

  // Sample users for recipient selection
  const availableUsers = [
    { id: 'user1', name: 'Dr. Rajesh Kumar', role: 'HOD', department: 'Computer Science', email: 'rajesh.k@edu.in' },
    { id: 'user2', name: 'Prof. Priya Sharma', role: 'Principal', department: 'Administration', email: 'priya.s@edu.in' },
    { id: 'user3', name: 'Mr. Anil Desai', role: 'Dean', department: 'Academic Affairs', email: 'anil.d@edu.in' },
    { id: 'user4', name: 'Ms. Meera Patel', role: 'Class Teacher', department: 'Mathematics', email: 'meera.p@edu.in' }
  ];

  // Sample incoming approval requests
  const [incomingRequests, setIncomingRequests] = useState([
    {
      id: 'req1',
      documentName: 'Leave_Application_Staff.pdf',
      documentSize: '210 KB',
      ipfsHash: 'QmPqr...stu012',
      txId: '0x3c4d5e6f7g8h9i0j...',
      requestorName: 'Mr. Suresh Nair',
      requestorId: 'FAC-2401',
      requestorDepartment: 'Physics',
      requestorEmail: 'suresh.n@edu.in',
      requestorPhone: '+91 98765 43210',
      purpose: 'Medical leave approval required from HOD',
      approvalType: 'digital',
      status: 'pending',
      submittedDate: '2025-03-16 10:30 AM',
      currentApprovers: ['Dr. Rajesh Kumar (HOD)'],
      approvedBy: [],
      pendingWith: ['Dr. Rajesh Kumar (HOD)']
    },
    {
      id: 'req2',
      documentName: 'Budget_Proposal_2025.pdf',
      documentSize: '450 KB',
      ipfsHash: 'QmVwx...yz345',
      txId: '0x6g7h8i9j0k1l2m3n...',
      requestorName: 'Dr. Anita Verma',
      requestorId: 'FAC-2305',
      requestorDepartment: 'Chemistry',
      requestorEmail: 'anita.v@edu.in',
      requestorPhone: '+91 98123 45678',
      purpose: 'Budget approval for lab equipment',
      approvalType: 'standard',
      status: 'pending',
      submittedDate: '2025-03-15 02:15 PM',
      currentApprovers: ['Prof. Priya Sharma (Principal)', 'Mr. Anil Desai (Dean)'],
      approvedBy: [],
      pendingWith: ['Prof. Priya Sharma (Principal)', 'Mr. Anil Desai (Dean)']
    }
  ]);

  // Sample sent requests
  const [sentRequests, setSentRequests] = useState([
    {
      id: 'sent1',
      documentName: 'Conference_Travel_Request.pdf',
      recipients: ['Prof. Priya Sharma (Principal)'],
      status: 'approved',
      submittedDate: '2025-03-14',
      approvedDate: '2025-03-15',
      approvalType: 'digital'
    },
    {
      id: 'sent2',
      documentName: 'Research_Grant_Application.pdf',
      recipients: ['Dr. Rajesh Kumar (HOD)', 'Mr. Anil Desai (Dean)'],
      status: 'partial',
      submittedDate: '2025-03-13',
      approvedBy: ['Dr. Rajesh Kumar'],
      pendingWith: ['Mr. Anil Desai'],
      approvalType: 'standard'
    }
  ]);

  // Handlers
  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
    setShowFileSelector(false);
  };

  const handleAddRecipient = (user, customRole) => {
    if (!recipients.find(r => r.id === user.id)) {
      setRecipients([...recipients, { ...user, customRole: customRole || user.role }]);
    }
  };

  const handleRemoveRecipient = (userId) => {
    setRecipients(recipients.filter(r => r.id !== userId));
  };

  const handleMoveRecipient = (index, direction) => {
    const newRecipients = [...recipients];
    if (direction === 'up' && index > 0) {
      [newRecipients[index], newRecipients[index - 1]] = [newRecipients[index - 1], newRecipients[index]];
    } else if (direction === 'down' && index < recipients.length - 1) {
      [newRecipients[index], newRecipients[index + 1]] = [newRecipients[index + 1], newRecipients[index]];
    }
    setRecipients(newRecipients);
  };

  const handleSaveDraft = () => {
    alert('✅ Draft saved successfully!\n\nYou can continue this approval request later from "My Drafts" section.');
  };

  const handleGenerateRequest = () => {
    if (!selectedDocument) {
      alert('⚠️ Please select a document first.');
      return;
    }
    if (recipients.length === 0) {
      alert('⚠️ Please add at least one recipient.');
      return;
    }
    if (!purpose.trim()) {
      alert('⚠️ Please enter the purpose of approval request.');
      return;
    }

    alert(`✅ Approval Request Generated!\n\n📄 Document: ${selectedDocument.name}\n👥 Recipients: ${recipients.length}\n🔐 Type: ${approvalType === 'digital' ? 'Digital Signature' : 'Standard Approval'}\n📋 Process: ${recipients.length > 1 ? (approvalProcess === 'sequential' ? 'Sequential' : 'Parallel') : 'Single Approver'}\n\n⛓️ Blockchain transaction initiated...\nRequest sent to all recipients!`);

    // Reset form
    setSelectedDocument(null);
    setRecipients([]);
    setPurpose('');
  };

  const handleApproveRequest = (requestId) => {
    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) return;

    const isDigital = request.approvalType === 'digital';
    const confirmMsg = isDigital 
      ? `🔐 Digitally Sign & Approve Document?\n\n✍️ This will:\n• Add your digital signature to the document\n• Generate new version with QR code and hash\n• Update blockchain with approval record\n• Move to next approver (if sequential)\n• Notify requestor of progress\n\nProceed with digital signature?`
      : `✅ Approve Document?\n\n📝 This will:\n• Record your approval on blockchain\n• Generate new version with approval stamp\n• Move to next approver (if sequential)\n• Notify requestor of progress\n\nProceed with approval?`;

    if (confirm(confirmMsg)) {
      alert(`⏳ Processing ${isDigital ? 'Digital Signature' : 'Approval'}...\n\n🔄 Status:\n• Generating document version\n• Creating QR code with approval details\n• Updating blockchain smart contract\n• Calculating new document hash\n• Uploading to IPFS\n\n✅ ${isDigital ? 'Document signed and approved!' : 'Document approved!'}\n\nRequestor will be notified of the progress.`);

      // Update request status
      setIncomingRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', approvedBy: [...req.approvedBy, 'You'] }
          : req
      ));
      setShowRequestModal(false);
    }
  };

  const handleRejectRequest = (requestId) => {
    const reason = prompt('❌ Reject Approval Request\n\nPlease provide a reason for rejection:\n(This will be sent to the requestor)');
    
    if (reason && reason.trim()) {
      alert(`❌ Request Rejected\n\n📋 Details:\n• Rejection reason sent to requestor\n• Blockchain record updated\n• No document version generated\n• Requestor can revise and resubmit\n\n✅ Rejection recorded successfully.`);

      setIncomingRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', rejectionReason: reason }
          : req
      ));
      setShowRequestModal(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const filteredIncomingRequests = incomingRequests.filter(req => {
    const matchesSearch = req.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.requestorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="document-approval">
      {/* Header */}
      <div className="approval-header">
        <div className="header-left">
          <h1>
            <i className="ri-shield-check-line"></i>
            Document Approval System
          </h1>
          <p>Blockchain-based secure document approval and digital signature workflow</p>
        </div>
        <div className="header-right">
          <div className="blockchain-status connected">
            <i className="ri-links-line"></i>
            <span>Blockchain Connected</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation (Hide for students) */}
      {userRole !== 'student' && (
        <div className="approval-tabs">
          <button 
            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            <i className="ri-send-plane-line"></i>
            Send Request
            <span className="tab-badge">{sentRequests.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`}
            onClick={() => setActiveTab('receive')}
          >
            <i className="ri-inbox-line"></i>
            Receive Request
            <span className="tab-badge alert">{incomingRequests.filter(r => r.status === 'pending').length}</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="approval-content">
        {/* SEND REQUEST TAB */}
        {(activeTab === 'send' || userRole === 'student') && (
          <div className="send-request-section">
            {/* Step 1: Select Document */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <span className="step-number">1</span>
                  Select Document from Blockchain Storage
                </h3>
                <button className="btn-primary" onClick={() => setShowFileSelector(!showFileSelector)}>
                  <i className="ri-file-search-line"></i>
                  Browse Files
                </button>
              </div>
              
              {selectedDocument ? (
                <div className="selected-document">
                  <div className="doc-icon">
                    <i className="ri-file-pdf-line"></i>
                  </div>
                  <div className="doc-info">
                    <h4>{selectedDocument.name}</h4>
                    <div className="doc-meta">
                      <span><i className="ri-database-2-line"></i> {selectedDocument.size}</span>
                      <span><i className="ri-shield-check-line"></i> Verified on Blockchain</span>
                      <span><i className="ri-calendar-line"></i> {selectedDocument.uploadDate}</span>
                    </div>
                    <div className="doc-hashes">
                      <div className="hash-item">
                        <small>IPFS Hash:</small>
                        <code>{selectedDocument.ipfsHash}</code>
                      </div>
                      <div className="hash-item">
                        <small>Transaction ID:</small>
                        <code>{selectedDocument.txId}</code>
                      </div>
                    </div>
                  </div>
                  <button className="btn-icon-remove" onClick={() => setSelectedDocument(null)}>
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="ri-file-search-line"></i>
                  <p>No document selected</p>
                  <small>Click "Browse Files" to select a document from blockchain storage</small>
                </div>
              )}

              {showFileSelector && (
                <div className="file-selector">
                  <div className="selector-header">
                    <h4>Blockchain Documents</h4>
                    <button className="btn-close" onClick={() => setShowFileSelector(false)}>
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                  <div className="file-list">
                    {blockchainDocuments.map(doc => (
                      <div key={doc.id} className="file-item" onClick={() => handleDocumentSelect(doc)}>
                        <i className="ri-file-pdf-line"></i>
                        <div className="file-details">
                          <strong>{doc.name}</strong>
                          <small>{doc.size} • {doc.uploadDate}</small>
                        </div>
                        <span className="status-badge verified">
                          <i className="ri-checkbox-circle-line"></i> Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Select Recipients */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <span className="step-number">2</span>
                  Select Recipients & Assign Roles
                </h3>
                <button className="btn-primary" onClick={() => setShowRecipientModal(true)}>
                  <i className="ri-user-add-line"></i>
                  Add Recipient
                </button>
              </div>

              {recipients.length > 0 ? (
                <div className="recipients-list">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="recipient-item">
                      <div className="recipient-order">
                        {approvalProcess === 'sequential' && (
                          <>
                            <button 
                              className="btn-order" 
                              onClick={() => handleMoveRecipient(index, 'up')}
                              disabled={index === 0}
                            >
                              <i className="ri-arrow-up-line"></i>
                            </button>
                            <span className="order-number">{index + 1}</span>
                            <button 
                              className="btn-order" 
                              onClick={() => handleMoveRecipient(index, 'down')}
                              disabled={index === recipients.length - 1}
                            >
                              <i className="ri-arrow-down-line"></i>
                            </button>
                          </>
                        )}
                      </div>
                      <div className="recipient-avatar">
                        {recipient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="recipient-info">
                        <strong>{recipient.name}</strong>
                        <span className="role-badge">{recipient.customRole}</span>
                        <small>{recipient.department} • {recipient.email}</small>
                      </div>
                      <button className="btn-remove" onClick={() => handleRemoveRecipient(recipient.id)}>
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="ri-user-add-line"></i>
                  <p>No recipients added</p>
                  <small>Add recipients who need to approve or sign this document</small>
                </div>
              )}
            </div>

            {/* Step 3: Approval Configuration */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <span className="step-number">3</span>
                  Approval Configuration
                </h3>
              </div>

              <div className="config-grid">
                {/* Approval Type */}
                <div className="config-section">
                  <label className="config-label">Approval Type</label>
                  <div className="radio-group">
                    <label className={`radio-option ${approvalType === 'standard' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="approvalType" 
                        value="standard"
                        checked={approvalType === 'standard'}
                        onChange={(e) => setApprovalType(e.target.value)}
                      />
                      <div className="radio-content">
                        <i className="ri-checkbox-circle-line"></i>
                        <div>
                          <strong>Standard Approval</strong>
                          <small>Simple approval stamp without digital signature</small>
                        </div>
                      </div>
                    </label>
                    <label className={`radio-option ${approvalType === 'digital' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="approvalType" 
                        value="digital"
                        checked={approvalType === 'digital'}
                        onChange={(e) => setApprovalType(e.target.value)}
                      />
                      <div className="radio-content">
                        <i className="ri-shield-keyhole-line"></i>
                        <div>
                          <strong>Digital Signature</strong>
                          <small>Cryptographically signed approval with blockchain verification</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Approval Process (only if multiple recipients) */}
                {recipients.length > 1 && (
                  <div className="config-section">
                    <label className="config-label">Approval Process</label>
                    <div className="radio-group">
                      <label className={`radio-option ${approvalProcess === 'parallel' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="approvalProcess" 
                          value="parallel"
                          checked={approvalProcess === 'parallel'}
                          onChange={(e) => setApprovalProcess(e.target.value)}
                        />
                        <div className="radio-content">
                          <i className="ri-node-tree"></i>
                          <div>
                            <strong>Parallel Approval</strong>
                            <small>All approvers receive request simultaneously, any order</small>
                          </div>
                        </div>
                      </label>
                      <label className={`radio-option ${approvalProcess === 'sequential' ? 'selected' : ''}`}>
                        <input 
                          type="radio" 
                          name="approvalProcess" 
                          value="sequential"
                          checked={approvalProcess === 'sequential'}
                          onChange={(e) => setApprovalProcess(e.target.value)}
                        />
                        <div className="radio-content">
                          <i className="ri-git-branch-line"></i>
                          <div>
                            <strong>Sequential Approval</strong>
                            <small>Approvers must approve in specific order (drag to reorder above)</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Purpose */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <span className="step-number">4</span>
                  Purpose of Approval Request
                </h3>
              </div>
              <textarea 
                className="purpose-input"
                placeholder="Enter the purpose or reason for this approval request..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows="4"
              />
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-outline" onClick={handleSaveDraft}>
                <i className="ri-save-line"></i>
                Save Draft
              </button>
              <button className="btn-outline">
                <i className="ri-eye-line"></i>
                Preview Request
              </button>
              <button className="btn-success" onClick={handleGenerateRequest}>
                <i className="ri-send-plane-fill"></i>
                Generate & Send Request
              </button>
            </div>

            {/* Sent Requests History */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <i className="ri-history-line"></i>
                  My Sent Requests
                </h3>
              </div>
              <div className="requests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Recipients</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentRequests.map(req => (
                      <tr key={req.id}>
                        <td>
                          <div className="doc-cell">
                            <i className="ri-file-pdf-line"></i>
                            {req.documentName}
                          </div>
                        </td>
                        <td>
                          <div className="recipients-cell">
                            {req.recipients.map((r, i) => (
                              <span key={i} className="recipient-tag">{r}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`}>
                            {req.status === 'approved' && <i className="ri-checkbox-circle-fill"></i>}
                            {req.status === 'partial' && <i className="ri-time-line"></i>}
                            {req.status === 'pending' && <i className="ri-loader-line"></i>}
                            {req.status}
                          </span>
                        </td>
                        <td>{req.submittedDate}</td>
                        <td>
                          <button className="btn-sm">
                            <i className="ri-eye-line"></i> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RECEIVE REQUEST TAB (Faculty & Admin only) */}
        {activeTab === 'receive' && userRole !== 'student' && (
          <div className="receive-request-section">
            {/* Search and Filter Bar */}
            <div className="approval-card">
              <div className="search-filter-bar">
                <div className="search-box">
                  <i className="ri-search-line"></i>
                  <input 
                    type="text" 
                    placeholder="Search by document name or requestor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Filter:</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Requests</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <button className="btn-outline">
                  <i className="ri-sort-desc"></i>
                  Sort
                </button>
              </div>
            </div>

            {/* Incoming Requests */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  <i className="ri-inbox-line"></i>
                  Pending Approval Requests
                </h3>
                <span className="request-count">{filteredIncomingRequests.length} requests</span>
              </div>

              {filteredIncomingRequests.length > 0 ? (
                <div className="requests-grid">
                  {filteredIncomingRequests.map(request => (
                    <div key={request.id} className="request-card" onClick={() => handleViewRequest(request)}>
                      <div className="request-header">
                        <div className="doc-icon-large">
                          <i className="ri-file-pdf-line"></i>
                        </div>
                        <div className="request-title-area">
                          <h4>{request.documentName}</h4>
                          <span className={`status-badge ${request.status}`}>
                            {request.status === 'pending' ? <i className="ri-time-line"></i> : <i className="ri-checkbox-circle-fill"></i>}
                            {request.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="request-details">
                        <div className="detail-row">
                          <i className="ri-user-line"></i>
                          <span><strong>From:</strong> {request.requestorName}</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-building-line"></i>
                          <span><strong>Department:</strong> {request.requestorDepartment}</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-calendar-line"></i>
                          <span><strong>Submitted:</strong> {request.submittedDate}</span>
                        </div>
                        <div className="detail-row">
                          <i className="ri-shield-keyhole-line"></i>
                          <span><strong>Type:</strong> {request.approvalType === 'digital' ? 'Digital Signature' : 'Standard Approval'}</span>
                        </div>
                      </div>

                      <div className="request-purpose">
                        <strong>Purpose:</strong>
                        <p>{request.purpose}</p>
                      </div>

                      <button className="btn-view-full">
                        <i className="ri-eye-line"></i>
                        View Full Details & Take Action
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="ri-inbox-line"></i>
                  <p>No approval requests found</p>
                  <small>All caught up! No pending approval requests at the moment.</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowRecipientModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Recipient</h3>
              <button className="btn-close" onClick={() => setShowRecipientModal(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="users-list">
                {availableUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      <small>{user.department} • {user.email}</small>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Role (e.g., HOD, Principal)"
                      className="role-input"
                      id={`role-${user.id}`}
                    />
                    <button 
                      className="btn-add"
                      onClick={() => {
                        const roleInput = document.getElementById(`role-${user.id}`);
                        const customRole = roleInput.value.trim() || user.role;
                        handleAddRecipient(user, customRole);
                      }}
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowRequestModal(false)}>
          <div className="modal-box large">
            <div className="modal-header">
              <h3>
                <i className="ri-file-text-line"></i>
                Approval Request Details
              </h3>
              <button className="btn-close" onClick={() => setShowRequestModal(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* Document Info */}
              <div className="detail-section">
                <h4><i className="ri-file-info-line"></i> Document Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Document Name:</label>
                    <span>{selectedRequest.documentName}</span>
                  </div>
                  <div className="detail-item">
                    <label>File Size:</label>
                    <span>{selectedRequest.documentSize}</span>
                  </div>
                  <div className="detail-item">
                    <label>IPFS Hash:</label>
                    <code className="hash-code">{selectedRequest.ipfsHash}</code>
                  </div>
                  <div className="detail-item">
                    <label>Transaction ID:</label>
                    <code className="hash-code">{selectedRequest.txId}</code>
                  </div>
                </div>
              </div>

              {/* Requestor Info */}
              <div className="detail-section">
                <h4><i className="ri-user-line"></i> Requestor Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedRequest.requestorName}</span>
                  </div>
                  <div className="detail-item">
                    <label>ID:</label>
                    <span>{selectedRequest.requestorId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Department:</label>
                    <span>{selectedRequest.requestorDepartment}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedRequest.requestorEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedRequest.requestorPhone}</span>
                  </div>
                </div>
              </div>

              {/* Blockchain Status */}
              <div className="detail-section">
                <h4><i className="ri-links-line"></i> Blockchain Status</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedRequest.status}`}>
                      {selectedRequest.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted Date:</label>
                    <span>{selectedRequest.submittedDate}</span>
                  </div>
                  <div className="detail-item">
                    <label>Approved By:</label>
                    <span>{selectedRequest.approvedBy.length > 0 ? selectedRequest.approvedBy.join(', ') : 'None yet'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Pending With:</label>
                    <span>{selectedRequest.pendingWith.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="detail-section">
                <h4><i className="ri-message-3-line"></i> Purpose</h4>
                <p className="purpose-text">{selectedRequest.purpose}</p>
              </div>

              {/* Preview Section */}
              <div className="detail-section">
                <h4><i className="ri-eye-line"></i> Document Preview</h4>
                <div className="preview-placeholder">
                  <i className="ri-file-pdf-line"></i>
                  <p>PDF Preview will appear here</p>
                  <button className="btn-primary">
                    <i className="ri-eye-line"></i>
                    Open Full Preview
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => alert('⬇️ Downloading from IPFS...')}>
                <i className="ri-download-line"></i>
                Download
              </button>
              <button className="btn-danger" onClick={() => handleRejectRequest(selectedRequest.id)}>
                <i className="ri-close-circle-line"></i>
                Reject
              </button>
              <button className="btn-success" onClick={() => handleApproveRequest(selectedRequest.id)}>
                {selectedRequest.approvalType === 'digital' ? (
                  <>
                    <i className="ri-shield-keyhole-line"></i>
                    Sign & Approve
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line"></i>
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval;