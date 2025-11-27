import React, { useState, useEffect } from 'react';
import './DocumentGenerator.css';

export default function DocumentGenerator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showMyDocuments, setShowMyDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [myDocuments, setMyDocuments] = useState([
    {
      id: 'REQ-2024-08-19-001',
      type: 'Leave Application',
      subType: 'Letter',
      approver: 'Class Teacher',
      approverName: 'Ms. Priya K.',
      approvalType: 'Standard Approval',
      submitted: '19/08/2024, 16:00:00',
      status: 'approved',
      blockchainHash: '0x8a3c2d1f...',
      timeline: [
        { stage: 'Draft Created', date: '19/08/2024, 15:30:00', status: 'completed', icon: 'ri-file-line' },
        { stage: 'Submitted for Approval', date: '19/08/2024, 16:00:00', status: 'completed', icon: 'ri-send-plane-line' },
        { stage: 'Pending Approval', date: 'Pending', status: 'pending', icon: 'ri-time-line' },
        { stage: 'Document Generation', date: 'Pending', status: 'pending', icon: 'ri-file-text-line' },
        { stage: 'Approved', date: '08/11/2025, 19:16:35', status: 'completed', icon: 'ri-checkbox-circle-line' }
      ]
    },
    {
      id: 'REQ-2024-08-18-002',
      type: 'Bonafide Certificate',
      subType: 'Certificate',
      approver: 'Head of Department',
      approverName: 'Prof. R. Nair',
      approvalType: 'Digital Signature',
      submitted: '18/08/2024, 20:15:00',
      status: 'approved',
      blockchainHash: '0x5b7a9c4d...',
      timeline: [
        { stage: 'Draft Created', date: '18/08/2024, 20:00:00', status: 'completed', icon: 'ri-file-line' },
        { stage: 'Submitted for Approval', date: '18/08/2024, 20:15:00', status: 'completed', icon: 'ri-send-plane-line' },
        { stage: 'Approved', date: '19/08/2024, 10:30:00', status: 'completed', icon: 'ri-checkbox-circle-line' }
      ]
    }
  ]);

  // Templates data
  const templates = [
    {
      id: 'leave',
      name: 'Leave Application',
      description: 'Apply for sick leave, casual leave, or vacation',
      category: 'student',
      icon: '📋',
      time: '5 min',
      color: '#3b82f6',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'leaveType', label: 'Leave Type', type: 'select', options: ['Sick Leave', 'Casual Leave', 'Vacation', 'Emergency'], required: true },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date', required: true },
        { name: 'reason', label: 'Reason', type: 'textarea', required: true },
        { name: 'contactNumber', label: 'Contact Number', type: 'tel', required: true }
      ],
      approvalChain: ['Class Teacher', 'HOD', 'Principal']
    },
    {
      id: 'bonafide',
      name: 'Bonafide Certificate',
      description: 'Request official bonafide certificate',
      category: 'student',
      icon: '📜',
      time: '3 min',
      color: '#10b981',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'purpose', label: 'Purpose', type: 'text', required: true },
        { name: 'academicYear', label: 'Academic Year', type: 'text', required: true },
        { name: 'requiredCopies', label: 'Number of Copies', type: 'number', required: true }
      ],
      approvalChain: ['HOD', 'Registrar']
    },
    {
      id: 'transcript',
      name: 'Transcript Request',
      description: 'Request official academic transcripts',
      category: 'student',
      icon: '📑',
      time: '4 min',
      color: '#f59e0b',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'program', label: 'Program', type: 'text', required: true },
        { name: 'graduationYear', label: 'Graduation Year', type: 'text', required: true },
        { name: 'deliveryMethod', label: 'Delivery Method', type: 'select', options: ['Pickup', 'Mail', 'Email'], required: true },
        { name: 'copies', label: 'Number of Copies', type: 'number', required: true },
        { name: 'purpose', label: 'Purpose', type: 'text', required: true }
      ],
      approvalChain: ['Registrar', 'Dean']
    },
    {
      id: 'transfer',
      name: 'Transfer Certificate',
      description: 'Request transfer certificate for institution change',
      category: 'student',
      icon: '🎓',
      time: '6 min',
      color: '#ef4444',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Current Class', type: 'text', required: true },
        { name: 'lastAttendance', label: 'Last Attendance Date', type: 'date', required: true },
        { name: 'reason', label: 'Reason for Transfer', type: 'textarea', required: true },
        { name: 'newInstitution', label: 'New Institution Name', type: 'text', required: true }
      ],
      approvalChain: ['Class Teacher', 'HOD', 'Principal']
    },
    {
      id: 'research',
      name: 'Research Proposal',
      description: 'Submit research proposal for approval',
      category: 'faculty',
      icon: '🔬',
      time: '15 min',
      color: '#8b5cf6',
      fields: [
        { name: 'facultyName', label: 'Faculty Name', type: 'text', required: true },
        { name: 'department', label: 'Department', type: 'text', required: true },
        { name: 'researchTitle', label: 'Research Title', type: 'text', required: true },
        { name: 'duration', label: 'Duration (months)', type: 'number', required: true },
        { name: 'budget', label: 'Estimated Budget', type: 'number', required: true },
        { name: 'abstract', label: 'Abstract', type: 'textarea', required: true },
        { name: 'methodology', label: 'Methodology', type: 'textarea', required: true }
      ],
      approvalChain: ['HOD', 'Dean', 'Research Committee']
    },
    {
      id: 'fee',
      name: 'Fee Receipt',
      description: 'Request duplicate fee receipt',
      category: 'student',
      icon: '💰',
      time: '2 min',
      color: '#06b6d4',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'semester', label: 'Semester', type: 'text', required: true },
        { name: 'receiptNumber', label: 'Original Receipt Number', type: 'text', required: true },
        { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
        { name: 'reason', label: 'Reason for Duplicate', type: 'textarea', required: true }
      ],
      approvalChain: ['Accounts Officer']
    },
    {
      id: 'noc',
      name: 'No Objection Certificate',
      description: 'Request NOC for various purposes',
      category: 'student',
      icon: '✅',
      time: '4 min',
      color: '#14b8a6',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'purpose', label: 'Purpose of NOC', type: 'text', required: true },
        { name: 'details', label: 'Additional Details', type: 'textarea', required: true },
        { name: 'validityPeriod', label: 'Validity Period', type: 'text', required: true }
      ],
      approvalChain: ['HOD', 'Principal']
    },
    {
      id: 'exam',
      name: 'Examination Form',
      description: 'Register for semester examinations',
      category: 'student',
      icon: '📝',
      time: '8 min',
      color: '#f97316',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'semester', label: 'Semester', type: 'text', required: true },
        { name: 'examType', label: 'Exam Type', type: 'select', options: ['Regular', 'Supplementary', 'Improvement'], required: true },
        { name: 'subjects', label: 'Subjects (comma separated)', type: 'text', required: true },
        { name: 'feePaid', label: 'Fee Payment Reference', type: 'text', required: true }
      ],
      approvalChain: ['Exam Controller']
    },
    {
      id: 'library',
      name: 'Library Card',
      description: 'Apply for new or renewal of library card',
      category: 'student',
      icon: '📚',
      time: '3 min',
      color: '#a855f7',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'cardType', label: 'Card Type', type: 'select', options: ['New', 'Renewal', 'Duplicate'], required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true }
      ],
      approvalChain: ['Librarian']
    },
    {
      id: 'hostel',
      name: 'Hostel Application',
      description: 'Apply for hostel accommodation',
      category: 'student',
      icon: '🏠',
      time: '10 min',
      color: '#ec4899',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'roomType', label: 'Room Type Preference', type: 'select', options: ['Single', 'Double', 'Triple'], required: true },
        { name: 'duration', label: 'Duration', type: 'text', required: true },
        { name: 'guardianName', label: 'Guardian Name', type: 'text', required: true },
        { name: 'guardianContact', label: 'Guardian Contact', type: 'tel', required: true },
        { name: 'address', label: 'Permanent Address', type: 'textarea', required: true }
      ],
      approvalChain: ['Hostel Warden', 'Dean']
    },
    {
      id: 'grievance',
      name: 'Grievance Form',
      description: 'Submit grievance or complaint',
      category: 'student',
      icon: '📢',
      time: '5 min',
      color: '#ef4444',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student/Staff ID', type: 'text', required: true },
        { name: 'category', label: 'Grievance Category', type: 'select', options: ['Academic', 'Administrative', 'Facility', 'Harassment', 'Other'], required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'details', label: 'Detailed Description', type: 'textarea', required: true },
        { name: 'anonymous', label: 'Submit Anonymously', type: 'checkbox', required: false }
      ],
      approvalChain: ['Grievance Cell']
    },
    {
      id: 'character',
      name: 'Character Certificate',
      description: 'Request character certificate',
      category: 'student',
      icon: '⭐',
      time: '3 min',
      color: '#10b981',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'academicYear', label: 'Academic Year', type: 'text', required: true },
        { name: 'purpose', label: 'Purpose', type: 'text', required: true }
      ],
      approvalChain: ['Class Teacher', 'Principal']
    },
    {
      id: 'sports',
      name: 'Sports Certificate',
      description: 'Request sports participation certificate',
      category: 'student',
      icon: '⚽',
      time: '4 min',
      color: '#3b82f6',
      fields: [
        { name: 'studentName', label: 'Full Name', type: 'text', required: true },
        { name: 'studentId', label: 'Student ID', type: 'text', required: true },
        { name: 'class', label: 'Class/Department', type: 'text', required: true },
        { name: 'sport', label: 'Sport/Game', type: 'text', required: true },
        { name: 'event', label: 'Event Name', type: 'text', required: true },
        { name: 'date', label: 'Event Date', type: 'date', required: true },
        { name: 'achievement', label: 'Achievement/Position', type: 'text', required: true }
      ],
      approvalChain: ['Sports Coordinator', 'Principal']
    }
  ];

  // Calculate analytics from myDocuments
  const analytics = {
    total: myDocuments.length,
    approved: myDocuments.filter(d => d.status === 'approved').length,
    pending: myDocuments.filter(d => d.status === 'pending').length,
    rejected: myDocuments.filter(d => d.status === 'rejected').length
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({});
  };

  // Handle form input change
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle submit with validation
  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = selectedTemplate.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.name]);
    
    if (missingFields.length > 0) {
      showNotification('error', 'Missing Fields', 'Please fill all required fields');
      return;
    }

    // Show success notification
    showNotification('success', 'Document Submitted', `Your ${selectedTemplate.name} has been submitted successfully!`);
    
    // Close modal
    setTimeout(() => {
      setSelectedTemplate(null);
      setFormData({});
    }, 1500);
  };

  // Show notification
  const showNotification = (type, title, message) => {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      time: new Date().toLocaleTimeString()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Close modal
  const closeModal = () => {
    setSelectedTemplate(null);
    setFormData({});
  };

  return (
    <div className="document-generation">
      {/* Header */}
      <div className="page-header">
        <h1>Document Generation</h1>
        <p>Create and manage official documents with blockchain verification</p>
      </div>

      {/* Analytics Bar */}
      <div className="analytics-bar">
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="ri-file-list-3-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.total}</h4>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="ri-checkbox-circle-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.approved}</h4>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="ri-time-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.pending}</h4>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="ri-close-circle-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.rejected}</h4>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="templates-section">
        <div className="section-header">
          <h2 className="section-title">Document Templates</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <div className="search-container-inline">
              <i className="ri-search-line search-icon"></i>
              <input
                type="text"
                className="search-input-inline"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="filter-select-inline"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrative</option>
            </select>
            <button className="btn-my-documents" onClick={() => setShowMyDocuments(true)}>
              <i className="ri-folder-user-line"></i> My Documents
            </button>
            <div className="chip success">
              <i className="ri-shield-check-line"></i>
              <span>{filteredTemplates.length}</span> Available
            </div>
          </div>
        </div>
        <div className="templates-list">
          {filteredTemplates.map(template => {
            const approver = template.approvalChain && template.approvalChain[0] ? template.approvalChain[0] : 'N/A';
            return (
              <div key={template.id} className="template-list-item" onClick={() => handleTemplateSelect(template)}>
                <div className="template-icon" style={{background: `${template.color}20`, color: template.color}}>
                  <span>{template.icon}</span>
                </div>
                <div className="template-content">
                  <div className="template-header-row">
                    <h3>{template.name}</h3>
                    {template.category === 'urgent' && (
                      <span className="badge-urgent">
                        <i className="ri-error-warning-line"></i> Urgent
                      </span>
                    )}
                  </div>
                  <p className="template-description">{template.description}</p>
                  <div className="template-meta">
                    <span className="meta-item">
                      <i className="ri-file-text-line"></i>
                      {template.category}
                    </span>
                    <span className="meta-item">
                      <i className="ri-user-line"></i>
                      Approver: {approver}
                    </span>
                    <span className="meta-item">
                      <i className="ri-list-check"></i>
                      {template.fields ? template.fields.length : 0} fields
                    </span>
                  </div>
                </div>
                <button className="template-action-btn">
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Form */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && closeModal()}>
          <div className="modal-fullscreen">
            {/* Modal Header */}
            <div className="modal-header-bar">
              <h2>{selectedTemplate.name}</h2>
              <button className="btn-close-modal" onClick={closeModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Toolbar */}
            <div className="modal-toolbar">
              <div className="toolbar-left">
                <button className="toolbar-btn active">
                  <i className="ri-file-text-line"></i> Document Preview
                </button>
              </div>
              <div className="toolbar-right">
                <button className="toolbar-btn">
                  <i className="ri-layout-line"></i> Template
                </button>
                <button className="toolbar-btn">
                  <i className="ri-fullscreen-line"></i> Expand
                </button>
                <button className="toolbar-btn">
                  <i className="ri-code-line"></i> Copy HTML
                </button>
                <button className="toolbar-btn">
                  <i className="ri-printer-line"></i> Print
                </button>
                <button className="toolbar-btn toolbar-btn-primary">
                  <i className="ri-download-line"></i> PDF
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="modal-content-area">
              {/* Left Panel - Form */}
              <div className="modal-form-panel">
                <div className="form-scroll-container">
                  {selectedTemplate.fields.map(field => (
                    <div key={field.name} className="form-field">
                      <label>
                        {field.label}
                        {field.required && <span className="required-star">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          rows="4"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.type === 'date' ? 'dd-mm-yyyy' : `Enter ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}

                  {/* Select Recipients Section */}
                  <div className="section-divider"></div>
                  <div className="recipients-section">
                    <div className="section-header-with-badge">
                      <h4>Select Recipients</h4>
                      <span className="badge-selected">1 selected</span>
                    </div>
                    <div className="search-box">
                      <i className="ri-search-line"></i>
                      <input type="text" placeholder="Search recipients..." />
                    </div>
                    <div className="recipients-list">
                      {['Ms. Priya K.|Class Teacher|Computer Science', 'Prof. R. Nair|Head of Department|Computer Science'].map((recipient, idx) => {
                        const [name, role, dept] = recipient.split('|');
                        const initials = name.split(' ').map(n => n[0]).join('');
                        return (
                          <div key={idx} className={`recipient-item ${idx === 0 ? 'selected' : ''}`}>
                            <input type="checkbox" checked={idx === 0} onChange={() => {}} />
                            <div className="recipient-avatar">{initials}</div>
                            <div className="recipient-info">
                              <strong>{name}</strong>
                              <small>{role} • {dept}</small>
                            </div>
                            {idx === 0 && <span className="default-badge">Default</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Approval Type Section */}
                  <div className="section-divider"></div>
                  <div className="approval-type-section">
                    <h4>Approval Type</h4>
                    <p className="section-description">Choose the type of approval required for this document.</p>
                    <div className="approval-options">
                      <label className="approval-option selected">
                        <input type="radio" name="approvalType" defaultChecked />
                        <div className="option-content">
                          <strong>Standard Approval</strong>
                          <small>Regular approval process</small>
                        </div>
                      </label>
                      <label className="approval-option">
                        <input type="radio" name="approvalType" />
                        <div className="option-content">
                          <strong>Digital Signature</strong>
                          <small>Requires digital signature</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="modal-footer-actions">
                  <button className="btn-footer-outline">
                    <i className="ri-save-line"></i> Save Draft
                  </button>
                  <button className="btn-footer-outline">
                    <i className="ri-eye-line"></i> Preview
                  </button>
                  <button className="btn-footer-primary" onClick={handleSubmit}>
                    <i className="ri-send-plane-line"></i> Generate & Request
                  </button>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="modal-preview-panel">
                <div className="preview-empty-state">
                  <div className="preview-icon">
                    <i className="ri-file-text-line"></i>
                  </div>
                  <h3>Document Preview</h3>
                  <p>Fill the form and click "Preview" to see your document</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Documents Modal */}
      {showMyDocuments && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowMyDocuments(false)}>
          <div className="my-documents-modal">
            <div className="my-documents-header">
              <h2>My Document Requests</h2>
              <button className="btn-close" onClick={() => setShowMyDocuments(false)}>
                <i className="ri-close-line"></i> Close
              </button>
            </div>

            <div className="my-documents-filters">
              <select className="filter-select-inline">
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <select className="filter-select-inline">
                <option>All Types</option>
                <option>Leave Application</option>
                <option>Bonafide Certificate</option>
                <option>Transcript Request</option>
              </select>
              <div className="search-container-inline" style={{flex: 1}}>
                <i className="ri-search-line search-icon"></i>
                <input
                  type="text"
                  className="search-input-inline"
                  placeholder="Search requests..."
                />
              </div>
            </div>

            <div className="documents-table-container">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>REQUEST ID</th>
                    <th>DOCUMENT TYPE</th>
                    <th>APPROVER</th>
                    <th>APPROVAL TYPE</th>
                    <th>SUBMITTED</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {myDocuments.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div className="request-id">
                          <strong>{doc.id}</strong>
                          <small>Blockchain: {doc.blockchainHash}</small>
                        </div>
                      </td>
                      <td>
                        <div className="doc-type">
                          <strong>{doc.type}</strong>
                          <small>{doc.subType}</small>
                        </div>
                      </td>
                      <td>
                        <div className="approver-info">
                          <strong>{doc.approver}</strong>
                          <small>{doc.approverName}</small>
                        </div>
                      </td>
                      <td>
                        <div className="approval-type">
                          <i className={`ri-${doc.approvalType.includes('Digital') ? 'fingerprint' : 'check'}-line`}></i>
                          {doc.approvalType}
                        </div>
                      </td>
                      <td>{doc.submitted}</td>
                      <td>
                        <span className={`status-badge ${doc.status}`}>
                          <i className="ri-checkbox-circle-line"></i> {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action" title="View">
                            <i className="ri-eye-line"></i>
                          </button>
                          <button className="btn-action" title="Timeline" onClick={() => {
                            setSelectedDocument(doc);
                            setShowTimeline(true);
                          }}>
                            <i className="ri-time-line"></i>
                          </button>
                          <button className="btn-action success" title="Download">
                            <i className="ri-download-line"></i>
                          </button>
                          {doc.status === 'pending' && (
                            <button className="btn-action danger" title="Cancel">
                              <i className="ri-close-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimeline && selectedDocument && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowTimeline(false)}>
          <div className="timeline-modal">
            <div className="timeline-header">
              <h2>Document Timeline</h2>
              <button className="btn-close" onClick={() => setShowTimeline(false)}>
                <i className="ri-close-line"></i> Close
              </button>
            </div>

            <div className="timeline-container">
              {selectedDocument.timeline.map((stage, index) => (
                <div key={index} className={`timeline-item ${stage.status}`}>
                  <div className="timeline-icon">
                    {stage.status === 'completed' ? (
                      <i className="ri-checkbox-circle-fill"></i>
                    ) : stage.status === 'pending' ? (
                      <i className="ri-time-line"></i>
                    ) : (
                      <i className="ri-checkbox-blank-circle-line"></i>
                    )}
                  </div>
                  <div className="timeline-content">
                    <h4>{stage.stage}</h4>
                    <p>{stage.date}</p>
                  </div>
                  <div className="timeline-time">
                    {stage.status === 'completed' && index < selectedDocument.timeline.length - 1 && (
                      <span>{Math.floor(Math.random() * 500)}d ago</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {notifications.map(notification => (
        <div key={notification.id} className={`toast ${notification.type}`}>
          <i className={`ri-${
            notification.type === 'success' ? 'checkbox-circle' :
            notification.type === 'error' ? 'close-circle' :
            'information'
          }-line`}></i>
          <div>
            <strong>{notification.title}</strong>
            <p style={{margin: '4px 0 0', fontSize: '13px', color: '#64748b'}}>{notification.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}