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
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState('all'); // 'all', 'approved', 'pending', 'rejected', 'draft'
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortBy, setHistorySortBy] = useState('date'); // 'date', 'name', 'status'
  
  // Receive tab states
  const [activeReceiveTab, setActiveReceiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [receiveSearchQuery, setReceiveSearchQuery] = useState('');
  const [receiveSortBy, setReceiveSortBy] = useState('date'); // 'date', 'name', 'requester'
  const [receiveFilterType, setReceiveFilterType] = useState('all'); // 'all', 'digital', 'standard'
  const [receiveFilterDepartment, setReceiveFilterDepartment] = useState('all');

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
    },
    {
      id: 'req3',
      documentName: 'Research_Paper_Publication.pdf',
      documentSize: '580 KB',
      ipfsHash: 'QmAbc...xyz789',
      txId: '0x8h9i0j1k2l3m4n5o...',
      requestorName: 'Ms. Priya Reddy',
      requestorId: 'FAC-2210',
      requestorDepartment: 'Computer Science',
      requestorEmail: 'priya.r@edu.in',
      requestorPhone: '+91 98765 12345',
      purpose: 'Approval for international conference publication',
      approvalType: 'digital',
      status: 'approved',
      submittedDate: '2025-03-14 11:00 AM',
      approvedDate: '2025-03-15 09:30 AM',
      currentApprovers: ['Dr. Rajesh Kumar (HOD)'],
      approvedBy: ['Dr. Rajesh Kumar (HOD)'],
      pendingWith: []
    },
    {
      id: 'req4',
      documentName: 'Salary_Increment_Request.pdf',
      documentSize: '320 KB',
      ipfsHash: 'QmDef...abc456',
      txId: '0x1a2b3c4d5e6f7g8h...',
      requestorName: 'Mr. Amit Sharma',
      requestorId: 'FAC-2108',
      requestorDepartment: 'Mathematics',
      requestorEmail: 'amit.s@edu.in',
      requestorPhone: '+91 98123 67890',
      purpose: 'Annual salary increment approval',
      approvalType: 'standard',
      status: 'approved',
      submittedDate: '2025-03-12 03:45 PM',
      approvedDate: '2025-03-13 10:15 AM',
      currentApprovers: ['Prof. Priya Sharma (Principal)'],
      approvedBy: ['Prof. Priya Sharma (Principal)'],
      pendingWith: []
    },
    {
      id: 'req5',
      documentName: 'Equipment_Purchase_Proposal.pdf',
      documentSize: '690 KB',
      ipfsHash: 'QmGhi...jkl123',
      txId: '0x9i0j1k2l3m4n5o6p...',
      requestorName: 'Dr. Kavita Menon',
      requestorId: 'FAC-2015',
      requestorDepartment: 'Physics',
      requestorEmail: 'kavita.m@edu.in',
      requestorPhone: '+91 98234 56789',
      purpose: 'Purchase of new lab equipment for research',
      approvalType: 'digital',
      status: 'rejected',
      submittedDate: '2025-03-10 01:30 PM',
      rejectedDate: '2025-03-11 11:00 AM',
      rejectionReason: 'Budget constraints. Please revise the proposal with lower cost alternatives.',
      currentApprovers: ['Mr. Anil Desai (Dean)'],
      approvedBy: [],
      pendingWith: []
    },
    {
      id: 'req6',
      documentName: 'Conference_Attendance_Request.pdf',
      documentSize: '290 KB',
      ipfsHash: 'QmJkl...mno567',
      txId: '0x2b3c4d5e6f7g8h9i...',
      requestorName: 'Ms. Neha Gupta',
      requestorId: 'FAC-2312',
      requestorDepartment: 'Computer Science',
      requestorEmail: 'neha.g@edu.in',
      requestorPhone: '+91 98345 78901',
      purpose: 'Permission to attend national conference',
      approvalType: 'standard',
      status: 'rejected',
      submittedDate: '2025-03-09 09:15 AM',
      rejectedDate: '2025-03-09 04:30 PM',
      rejectionReason: 'Department already has two representatives attending this conference.',
      currentApprovers: ['Dr. Rajesh Kumar (HOD)'],
      approvedBy: [],
      pendingWith: []
    }
  ]);

  // Sample sent requests
  const [sentRequests, setSentRequests] = useState([
    {
      id: 'sent1',
      documentName: 'Conference_Travel_Request.pdf',
      documentId: 'doc1',
      recipients: ['Prof. Priya Sharma (Principal)'],
      status: 'approved',
      submittedDate: '2025-03-14',
      approvedDate: '2025-03-15',
      approvalType: 'digital',
      purpose: 'Attending International Conference on AI',
      currentVersion: 'v2.0',
      versions: [
        { version: 'v1.0', date: '2025-03-14', hash: 'QmXyZ...abc123', status: 'draft' },
        { version: 'v2.0', date: '2025-03-15', hash: 'QmAbc...def456', status: 'approved', approvedBy: 'Prof. Priya Sharma' }
      ],
      ipfsHash: 'QmAbc...def456',
      txId: '0x7a8b9c1d2e3f4a5b...'
    },
    {
      id: 'sent2',
      documentName: 'Research_Grant_Application.pdf',
      documentId: 'doc2',
      recipients: ['Dr. Rajesh Kumar (HOD)', 'Mr. Anil Desai (Dean)'],
      status: 'partial',
      submittedDate: '2025-03-13',
      approvedBy: ['Dr. Rajesh Kumar'],
      pendingWith: ['Mr. Anil Desai'],
      approvalType: 'standard',
      purpose: 'Research grant for AI lab equipment',
      currentVersion: 'v1.5',
      versions: [
        { version: 'v1.0', date: '2025-03-13', hash: 'QmDef...ghi789', status: 'submitted' },
        { version: 'v1.5', date: '2025-03-14', hash: 'QmGhi...jkl012', status: 'partial', approvedBy: 'Dr. Rajesh Kumar' }
      ],
      ipfsHash: 'QmGhi...jkl012',
      txId: '0x9f8e7d6c5b4a3e2f...'
    },
    {
      id: 'sent3',
      documentName: 'Leave_Application_May.pdf',
      documentId: 'doc3',
      recipients: ['Dr. Rajesh Kumar (HOD)'],
      status: 'pending',
      submittedDate: '2025-03-16',
      approvalType: 'standard',
      purpose: 'Medical leave for 5 days',
      currentVersion: 'v1.0',
      versions: [
        { version: 'v1.0', date: '2025-03-16', hash: 'QmJkl...mno345', status: 'pending' }
      ],
      ipfsHash: 'QmJkl...mno345',
      txId: '0x1a2b3c4d5e6f7g8h...'
    },
    {
      id: 'sent4',
      documentName: 'Budget_Proposal_Draft.pdf',
      documentId: 'doc4',
      recipients: [],
      status: 'draft',
      submittedDate: '2025-03-12',
      approvalType: 'digital',
      purpose: 'Annual budget proposal for department',
      currentVersion: 'v0.1',
      versions: [
        { version: 'v0.1', date: '2025-03-12', hash: 'QmMno...pqr678', status: 'draft' }
      ],
      ipfsHash: 'QmMno...pqr678',
      txId: null
    },
    {
      id: 'sent5',
      documentName: 'Academic_Certificate_Request.pdf',
      documentId: 'doc5',
      recipients: ['Ms. Meera Patel (Class Teacher)'],
      status: 'rejected',
      submittedDate: '2025-03-11',
      rejectedDate: '2025-03-11',
      approvalType: 'standard',
      purpose: 'Certificate for scholarship application',
      currentVersion: 'v1.0',
      rejectionReason: 'Incomplete information, please add attendance records',
      versions: [
        { version: 'v1.0', date: '2025-03-11', hash: 'QmPqr...stu901', status: 'rejected' }
      ],
      ipfsHash: 'QmPqr...stu901',
      txId: '0x3c4d5e6f7g8h9i0j...'
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

  const handleViewDocumentDetails = (doc) => {
    setSelectedDocForDetails(doc);
    setShowDocumentDetails(true);
  };

  const handleDownloadVersion = (version) => {
    alert(`⬇️ Downloading Version ${version.version}...\n\n📦 IPFS Hash: ${version.hash}\n📅 Date: ${version.date}\n✅ Status: ${version.status}\n\nFile will be downloaded from IPFS...`);
  };

  const handleContinueDraft = (doc) => {
    // Pre-fill form with draft data
    alert(`📝 Continuing Draft...\n\nDocument: ${doc.documentName}\nPurpose: ${doc.purpose}\n\nForm will be pre-filled with saved data.`);
    setActiveTab('send');
    // Here you would actually populate the form fields
  };

  const handleCancelApproval = (docId) => {
    if (confirm('❌ Cancel Approval Request?\n\nThis will:\n• Withdraw the request from all approvers\n• Update blockchain status\n• Notify all recipients\n\nAre you sure?')) {
      alert('✅ Approval request cancelled successfully!');
      setSentRequests(prev => prev.map(req => 
        req.id === docId ? { ...req, status: 'cancelled' } : req
      ));
    }
  };

  const filteredSentRequests = sentRequests.filter(req => {
    if (activeHistoryTab === 'all') return true;
    return req.status === activeHistoryTab;
  }).filter(req => {
    // Search filter
    if (!historySearchQuery) return true;
    const query = historySearchQuery.toLowerCase();
    return (
      req.documentName.toLowerCase().includes(query) ||
      req.purpose.toLowerCase().includes(query) ||
      req.recipients.some(r => r.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    // Sort functionality
    switch (historySortBy) {
      case 'name':
        return a.documentName.localeCompare(b.documentName);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'date':
      default:
        return new Date(b.submittedDate) - new Date(a.submittedDate);
    }
  });

  const filteredIncomingRequests = incomingRequests.filter(req => {
    // Status filter based on active tab
    if (activeReceiveTab === 'pending' && req.status !== 'pending') return false;
    if (activeReceiveTab === 'approved' && req.status !== 'approved') return false;
    if (activeReceiveTab === 'rejected' && req.status !== 'rejected') return false;

    // Search filter
    if (receiveSearchQuery) {
      const query = receiveSearchQuery.toLowerCase();
      const matchesSearch = 
        req.documentName.toLowerCase().includes(query) ||
        req.requestorName.toLowerCase().includes(query) ||
        req.requestorDepartment.toLowerCase().includes(query) ||
        req.purpose.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (receiveFilterType !== 'all' && req.approvalType !== receiveFilterType) return false;

    // Department filter
    if (receiveFilterDepartment !== 'all' && req.requestorDepartment !== receiveFilterDepartment) return false;

    return true;
  }).sort((a, b) => {
    // Sort logic
    switch (receiveSortBy) {
      case 'name':
        return a.documentName.localeCompare(b.documentName);
      case 'requester':
        return a.requestorName.localeCompare(b.requestorName);
      case 'date':
      default:
        return new Date(b.submittedDate) - new Date(a.submittedDate);
    }
  });

  // Get unique departments for filter
  const departments = ['all', ...new Set(incomingRequests.map(r => r.requestorDepartment))];

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
                  Document Approval History
                </h3>
                <span className="request-count">{filteredSentRequests.length} documents</span>
              </div>

              {/* Search and Filter Bar */}
              <div className="history-search-bar">
                <div className="search-box">
                  <i className="ri-search-line"></i>
                  <input 
                    type="text" 
                    placeholder="Search by document name, purpose, or recipient..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                  />
                  {historySearchQuery && (
                    <button 
                      className="clear-search"
                      onClick={() => setHistorySearchQuery('')}
                      title="Clear search"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
                <div className="filter-group">
                  <label>Sort by:</label>
                  <select value={historySortBy} onChange={(e) => setHistorySortBy(e.target.value)}>
                    <option value="date">Latest First</option>
                    <option value="name">Document Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              {/* History Filter Tabs */}
              <div className="history-tabs">
                <button 
                  className={`history-tab ${activeHistoryTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('all')}
                >
                  All <span className="count">{sentRequests.length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('approved')}
                >
                  <i className="ri-checkbox-circle-line"></i> Approved <span className="count">{sentRequests.filter(r => r.status === 'approved').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('pending')}
                >
                  <i className="ri-time-line"></i> Pending <span className="count">{sentRequests.filter(r => r.status === 'pending').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'partial' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('partial')}
                >
                  <i className="ri-progress-3-line"></i> Partial <span className="count">{sentRequests.filter(r => r.status === 'partial').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'draft' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('draft')}
                >
                  <i className="ri-draft-line"></i> Drafts <span className="count">{sentRequests.filter(r => r.status === 'draft').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('rejected')}
                >
                  <i className="ri-close-circle-line"></i> Rejected <span className="count">{sentRequests.filter(r => r.status === 'rejected').length}</span>
                </button>
              </div>

              <div className="requests-table-wrapper">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Purpose</th>
                      <th>Recipients</th>
                      <th>Status</th>
                      <th>Version</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSentRequests.map(req => (
                      <tr key={req.id}>
                        <td>
                          <div className="doc-cell">
                            <i className="ri-file-pdf-line"></i>
                            <span>{req.documentName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="purpose-cell">
                            {req.purpose}
                          </div>
                        </td>
                        <td>
                          <div className="recipients-cell">
                            {req.recipients.length > 0 ? (
                              req.recipients.slice(0, 2).map((r, i) => (
                                <span key={i} className="recipient-tag">{r}</span>
                              ))
                            ) : (
                              <span className="no-recipients">Not sent yet</span>
                            )}
                            {req.recipients.length > 2 && (
                              <span className="more-count">+{req.recipients.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`}>
                            {req.status === 'approved' && <i className="ri-checkbox-circle-fill"></i>}
                            {req.status === 'partial' && <i className="ri-progress-3-line"></i>}
                            {req.status === 'pending' && <i className="ri-time-line"></i>}
                            {req.status === 'draft' && <i className="ri-draft-line"></i>}
                            {req.status === 'rejected' && <i className="ri-close-circle-fill"></i>}
                            {req.status}
                          </span>
                          {req.status === 'partial' && req.approvedBy && (
                            <div className="sub-status">
                              {req.approvedBy.length} of {req.recipients.length} approved
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="version-badge">{req.currentVersion}</span>
                        </td>
                        <td>
                          <div className="date-cell">
                            {req.submittedDate}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button 
                              className="btn-icon" 
                              onClick={() => handleViewDocumentDetails(req)}
                              title="View Details"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            {req.status === 'approved' && (
                              <button 
                                className="btn-icon success" 
                                onClick={() => handleDownloadVersion(req.versions[req.versions.length - 1])}
                                title="Download Approved Version"
                              >
                                <i className="ri-download-cloud-line"></i>
                              </button>
                            )}
                            {req.status === 'draft' && (
                              <button 
                                className="btn-icon primary" 
                                onClick={() => handleContinueDraft(req)}
                                title="Continue Draft"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                            )}
                            {(req.status === 'pending' || req.status === 'partial') && (
                              <button 
                                className="btn-icon danger" 
                                onClick={() => handleCancelApproval(req.id)}
                                title="Cancel Request"
                              >
                                <i className="ri-close-circle-line"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSentRequests.length === 0 && (
                  <div className="empty-table-state">
                    <i className="ri-folder-open-line"></i>
                    <p>No documents in this category</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECEIVE REQUEST TAB (Faculty & Admin only) */}
        {activeTab === 'receive' && userRole !== 'student' && (
          <div className="receive-request-section">
            {/* Section Header with Tabs */}
            <div className="approval-card">
              <div className="receive-tabs-container">
                <div className="receive-tabs">
                  <button 
                    className={`receive-tab ${activeReceiveTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveReceiveTab('pending')}
                  >
                    <i className="ri-time-line"></i>
                    <div className="tab-content">
                      <span className="tab-title">Pending Requests</span>
                      <span className="tab-count">{incomingRequests.filter(r => r.status === 'pending').length}</span>
                    </div>
                  </button>
                  <button 
                    className={`receive-tab ${activeReceiveTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveReceiveTab('approved')}
                  >
                    <i className="ri-checkbox-circle-line"></i>
                    <div className="tab-content">
                      <span className="tab-title">Approved</span>
                      <span className="tab-count">{incomingRequests.filter(r => r.status === 'approved').length}</span>
                    </div>
                  </button>
                  <button 
                    className={`receive-tab ${activeReceiveTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveReceiveTab('rejected')}
                  >
                    <i className="ri-close-circle-line"></i>
                    <div className="tab-content">
                      <span className="tab-title">Rejected</span>
                      <span className="tab-count">{incomingRequests.filter(r => r.status === 'rejected').length}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Search and Filters */}
            <div className="approval-card">
              <div className="advanced-filters">
                {/* Search Bar */}
                <div className="filter-row">
                  <div className="search-box large">
                    <i className="ri-search-line"></i>
                    <input 
                      type="text" 
                      placeholder="Search by document, requester, department, or purpose..."
                      value={receiveSearchQuery}
                      onChange={(e) => setReceiveSearchQuery(e.target.value)}
                    />
                    {receiveSearchQuery && (
                      <button 
                        className="clear-search"
                        onClick={() => setReceiveSearchQuery('')}
                        title="Clear search"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Options Row */}
                <div className="filter-row multi-filter">
                  <div className="filter-group">
                    <label><i className="ri-sort-desc"></i> Sort by:</label>
                    <select value={receiveSortBy} onChange={(e) => setReceiveSortBy(e.target.value)}>
                      <option value="date">Latest First</option>
                      <option value="name">Document Name</option>
                      <option value="requester">Requester Name</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label><i className="ri-shield-keyhole-line"></i> Type:</label>
                    <select value={receiveFilterType} onChange={(e) => setReceiveFilterType(e.target.value)}>
                      <option value="all">All Types</option>
                      <option value="digital">Digital Signature</option>
                      <option value="standard">Standard Approval</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label><i className="ri-building-line"></i> Department:</label>
                    <select value={receiveFilterDepartment} onChange={(e) => setReceiveFilterDepartment(e.target.value)}>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(receiveSearchQuery || receiveFilterType !== 'all' || receiveFilterDepartment !== 'all') && (
                    <button 
                      className="btn-clear-filters"
                      onClick={() => {
                        setReceiveSearchQuery('');
                        setReceiveFilterType('all');
                        setReceiveFilterDepartment('all');
                      }}
                    >
                      <i className="ri-filter-off-line"></i> Clear Filters
                    </button>
                  )}
                </div>

                {/* Results Summary */}
                <div className="results-summary">
                  <span className="results-count">
                    Showing <strong>{filteredIncomingRequests.length}</strong> of <strong>{incomingRequests.filter(r => {
                      if (activeReceiveTab === 'pending') return r.status === 'pending';
                      if (activeReceiveTab === 'approved') return r.status === 'approved';
                      if (activeReceiveTab === 'rejected') return r.status === 'rejected';
                      return true;
                    }).length}</strong> requests
                  </span>
                </div>
              </div>
            </div>

            {/* Requests List */}
            <div className="approval-card">
              {filteredIncomingRequests.length > 0 ? (
                <div className="requests-list">
                  {filteredIncomingRequests.map(request => (
                    <div key={request.id} className="request-list-item">
                      <div className="request-list-header">
                        <div className="request-icon">
                          <i className="ri-file-text-line"></i>
                        </div>
                        <div className="request-main-info">
                          <div className="request-title-row">
                            <h4 className="request-doc-name">{request.documentName}</h4>
                            <div className="request-badges">
                              <span className={`type-badge ${request.approvalType}`}>
                                {request.approvalType === 'digital' ? (
                                  <><i className="ri-shield-keyhole-line"></i> Digital</>
                                ) : (
                                  <><i className="ri-checkbox-circle-line"></i> Standard</>
                                )}
                              </span>
                              <span className="size-badge">{request.documentSize}</span>
                            </div>
                          </div>
                          <div className="request-meta-row">
                            <span className="meta-item">
                              <i className="ri-user-line"></i>
                              <strong>From:</strong> {request.requestorName}
                            </span>
                            <span className="meta-separator">•</span>
                            <span className="meta-item">
                              <i className="ri-building-line"></i>
                              {request.requestorDepartment}
                            </span>
                            <span className="meta-separator">•</span>
                            <span className="meta-item">
                              <i className="ri-calendar-line"></i>
                              {request.submittedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="request-list-body">
                        <div className="request-purpose">
                          <strong>Purpose:</strong>
                          <p>{request.purpose}</p>
                        </div>

                        {request.status === 'approved' && (
                          <div className="request-status-info approved">
                            <i className="ri-checkbox-circle-fill"></i>
                            <span>Approved on {request.approvedDate}</span>
                          </div>
                        )}

                        {request.status === 'rejected' && (
                          <div className="request-status-info rejected">
                            <i className="ri-close-circle-fill"></i>
                            <div>
                              <span>Rejected on {request.rejectedDate}</span>
                              <p className="rejection-reason">Reason: {request.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="request-list-footer">
                        <div className="request-blockchain-info">
                          <span className="blockchain-item">
                            <i className="ri-link"></i>
                            <code>{request.ipfsHash}</code>
                          </span>
                        </div>
                        <div className="request-actions">
                          <button 
                            className="btn-action view"
                            onClick={() => handleViewRequest(request)}
                          >
                            <i className="ri-eye-line"></i>
                            View Details
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button 
                                className="btn-action approve"
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                <i className="ri-checkbox-circle-line"></i>
                                {request.approvalType === 'digital' ? 'Sign & Approve' : 'Approve'}
                              </button>
                              <button 
                                className="btn-action reject"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <i className="ri-close-circle-line"></i>
                                Reject
                              </button>
                            </>
                          )}
                          {(request.status === 'approved' || request.status === 'rejected') && (
                            <button 
                              className="btn-action download"
                              onClick={() => alert('⬇️ Downloading from IPFS...')}
                            >
                              <i className="ri-download-line"></i>
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state large">
                  <i className={
                    activeReceiveTab === 'pending' ? 'ri-time-line' :
                    activeReceiveTab === 'approved' ? 'ri-checkbox-circle-line' :
                    'ri-close-circle-line'
                  }></i>
                  <h3>No {activeReceiveTab} requests found</h3>
                  {(receiveSearchQuery || receiveFilterType !== 'all' || receiveFilterDepartment !== 'all') ? (
                    <p>Try adjusting your search or filter criteria</p>
                  ) : (
                    <p>
                      {activeReceiveTab === 'pending' && 'All caught up! No pending approval requests at the moment.'}
                      {activeReceiveTab === 'approved' && 'No approved requests yet.'}
                      {activeReceiveTab === 'rejected' && 'No rejected requests yet.'}
                    </p>
                  )}
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

      {/* Document Details Modal with Version History */}
      {showDocumentDetails && selectedDocForDetails && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowDocumentDetails(false)}>
          <div className="modal-box large document-details-modal">
            <div className="modal-header">
              <h3>
                <i className="ri-file-list-3-line"></i>
                Document Details & Version History
              </h3>
              <button className="btn-close" onClick={() => setShowDocumentDetails(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* Document Overview */}
              <div className="detail-section">
                <h4><i className="ri-file-info-line"></i> Document Overview</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Document Name:</label>
                    <span>{selectedDocForDetails.documentName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Current Version:</label>
                    <span className="version-badge large">{selectedDocForDetails.currentVersion}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedDocForDetails.status}`}>
                      {selectedDocForDetails.status === 'approved' && <i className="ri-checkbox-circle-fill"></i>}
                      {selectedDocForDetails.status === 'partial' && <i className="ri-progress-3-line"></i>}
                      {selectedDocForDetails.status === 'pending' && <i className="ri-time-line"></i>}
                      {selectedDocForDetails.status === 'draft' && <i className="ri-draft-line"></i>}
                      {selectedDocForDetails.status === 'rejected' && <i className="ri-close-circle-fill"></i>}
                      {selectedDocForDetails.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Approval Type:</label>
                    <span>
                      {selectedDocForDetails.approvalType === 'digital' ? (
                        <><i className="ri-shield-keyhole-line"></i> Digital Signature</>
                      ) : (
                        <><i className="ri-checkbox-circle-line"></i> Standard Approval</>
                      )}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Purpose:</label>
                    <p className="purpose-text">{selectedDocForDetails.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Recipients & Approval Status */}
              {selectedDocForDetails.recipients && selectedDocForDetails.recipients.length > 0 && (
                <div className="detail-section">
                  <h4><i className="ri-team-line"></i> Approval Progress</h4>
                  <div className="approval-progress-list">
                    {selectedDocForDetails.recipients.map((recipient, idx) => {
                      const isApproved = selectedDocForDetails.approvedBy?.includes(recipient);
                      const isPending = selectedDocForDetails.pendingWith?.includes(recipient);
                      return (
                        <div key={idx} className={`approval-progress-item ${isApproved ? 'approved' : isPending ? 'pending' : ''}`}>
                          <div className="progress-icon">
                            {isApproved ? (
                              <i className="ri-checkbox-circle-fill"></i>
                            ) : isPending ? (
                              <i className="ri-time-line"></i>
                            ) : (
                              <i className="ri-radio-button-line"></i>
                            )}
                          </div>
                          <div className="progress-info">
                            <strong>{recipient}</strong>
                            <span className={`progress-status ${isApproved ? 'approved' : isPending ? 'pending' : 'waiting'}`}>
                              {isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Waiting'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rejection Info */}
              {selectedDocForDetails.status === 'rejected' && selectedDocForDetails.rejectionReason && (
                <div className="detail-section rejection-section">
                  <h4><i className="ri-error-warning-line"></i> Rejection Details</h4>
                  <div className="rejection-info">
                    <p><strong>Reason:</strong> {selectedDocForDetails.rejectionReason}</p>
                    <p><strong>Date:</strong> {selectedDocForDetails.rejectedDate}</p>
                  </div>
                </div>
              )}

              {/* Blockchain Information */}
              <div className="detail-section">
                <h4><i className="ri-links-line"></i> Blockchain Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Current IPFS Hash:</label>
                    <code className="hash-code">{selectedDocForDetails.ipfsHash}</code>
                  </div>
                  {selectedDocForDetails.txId && (
                    <div className="detail-item">
                      <label>Transaction ID:</label>
                      <code className="hash-code">{selectedDocForDetails.txId}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Version History */}
              <div className="detail-section">
                <h4><i className="ri-history-line"></i> Version History</h4>
                <div className="version-history-container">
                  {selectedDocForDetails.versions?.map((version, idx) => (
                    <div 
                      key={idx} 
                      className={`version-history-item ${idx === 0 ? 'current-version' : ''}`}
                    >
                      <div className="version-header-row">
                        <div className="version-title">
                          <strong>Version {version.version}</strong>
                          {idx === 0 && <span className="current-badge">(Current)</span>}
                        </div>
                        <span className="version-size">{version.size || '---'}</span>
                      </div>
                      
                      <div className="version-action-text">
                        {version.status === 'approved' && version.approvedBy 
                          ? `Approved by ${version.approvedBy}` 
                          : version.status === 'draft' 
                          ? 'Draft version - Not submitted'
                          : version.status === 'rejected'
                          ? 'Version rejected'
                          : version.status === 'submitted'
                          ? 'Submitted for approval'
                          : 'File updated'
                        }
                      </div>
                      
                      <div className="version-meta">
                        <span>By {selectedDocForDetails.requestorName || 'You'}</span>
                        <span>•</span>
                        <span>{version.date}</span>
                      </div>

                      <div className="version-hash-info">
                        <small>IPFS:</small>
                        <code>{version.hash}</code>
                      </div>
                      
                      <div className="version-actions-row">
                        <button 
                          className="version-btn download-btn"
                          onClick={() => handleDownloadVersion(version)}
                        >
                          <i className="ri-download-line"></i> Download
                        </button>
                        {idx !== 0 && (
                          <button 
                            className="version-btn restore-btn"
                            onClick={() => {
                              if (confirm(`Restore version ${version.version}? This will create a new version with the old file content.`)) {
                                alert('🔄 Restore functionality will create a new version based on this one.');
                              }
                            }}
                          >
                            <i className="ri-restart-line"></i> Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {selectedDocForDetails.status === 'draft' && (
                <button className="btn-primary" onClick={() => handleContinueDraft(selectedDocForDetails)}>
                  <i className="ri-edit-line"></i>
                  Continue Editing
                </button>
              )}
              {selectedDocForDetails.status === 'approved' && (
                <button className="btn-success" onClick={() => handleDownloadVersion(selectedDocForDetails.versions[selectedDocForDetails.versions.length - 1])}>
                  <i className="ri-download-cloud-line"></i>
                  Download Approved Version
                </button>
              )}
              {(selectedDocForDetails.status === 'pending' || selectedDocForDetails.status === 'partial') && (
                <button className="btn-danger" onClick={() => handleCancelApproval(selectedDocForDetails.id)}>
                  <i className="ri-close-circle-line"></i>
                  Cancel Approval Request
                </button>
              )}
              <button className="btn-outline" onClick={() => setShowDocumentDetails(false)}>
                <i className="ri-close-line"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval;