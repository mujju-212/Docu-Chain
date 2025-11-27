import React, { useState, useEffect, useCallback } from 'react';
import './DocumentGenerator.css';

const API_URL = 'http://localhost:5000';

export default function DocumentGenerator() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showMyDocuments, setShowMyDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  // Data from API
  const [templates, setTemplates] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, drafts: 0 });
  const [userInfo, setUserInfo] = useState(null);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  // Initialize with fallback approvers so list is never empty
  const [approvers, setApprovers] = useState([
    { id: 'default-1', name: 'Class Teacher', role: 'staff', department: 'Academic' },
    { id: 'default-2', name: 'Head of Department', role: 'staff', department: 'Academic' },
    { id: 'default-3', name: 'Principal', role: 'admin', department: 'Administration' }
  ]);
  
  // Recipient selection
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [approvalType, setApprovalType] = useState('standard');
  const [recipientSearch, setRecipientSearch] = useState('');
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'student';
  
  // Auth headers helper
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Show notification helper
  const showNotification = useCallback((type, title, message) => {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      time: new Date().toLocaleTimeString()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Fetch user and institution info
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        if (data.user?.institution) {
          setInstitutionInfo(data.user.institution);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, []);

  // Fetch approvers list
  const fetchApprovers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/document-generation/institution/approvers`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const approversList = data.data || [];
        // If no approvers from API, use fallback
        if (approversList.length === 0) {
          setApprovers([
            { id: '1', name: 'Class Teacher', role: 'staff', department: 'Academic' },
            { id: '2', name: 'Head of Department', role: 'staff', department: 'Academic' },
            { id: '3', name: 'Principal', role: 'admin', department: 'Administration' }
          ]);
        } else {
          setApprovers(approversList);
        }
      } else {
        // Fallback approvers if API fails
        setApprovers([
          { id: '1', name: 'Class Teacher', role: 'staff', department: 'Academic' },
          { id: '2', name: 'Head of Department', role: 'staff', department: 'Academic' },
          { id: '3', name: 'Principal', role: 'admin', department: 'Administration' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      // Fallback approvers for demo
      setApprovers([
        { id: '1', name: 'Class Teacher', role: 'staff', department: 'Academic' },
        { id: '2', name: 'Head of Department', role: 'staff', department: 'Academic' },
        { id: '3', name: 'Principal', role: 'admin', department: 'Administration' }
      ]);
    }
  }, []);

  // Fetch templates from backend
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/document-generation/templates`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      } else {
        console.error('Failed to fetch templates');
        showNotification('error', 'Error', 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('error', 'Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Fetch user's documents
  const fetchMyDocuments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/document-generation/my-documents`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, []);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/document-generation/analytics`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data || { total: 0, approved: 0, pending: 0, rejected: 0, drafts: 0 });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUserInfo();
    fetchTemplates();
    fetchMyDocuments();
    fetchAnalytics();
    fetchApprovers();
  }, [fetchUserInfo, fetchTemplates, fetchMyDocuments, fetchAnalytics, fetchApprovers]);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter approvers based on search
  const filteredApprovers = approvers.filter(approver => {
    const fullName = (approver.name || `${approver.firstName || ''} ${approver.lastName || ''}`).toLowerCase();
    return fullName.includes(recipientSearch.toLowerCase()) ||
           (approver.role || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
           (approver.department || '').toLowerCase().includes(recipientSearch.toLowerCase());
  });

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowPreview(false);
    setPreviewContent('');
    
    // Pre-fill form with user data
    const initialData = {};
    if (userInfo && template.fields) {
      template.fields.forEach(field => {
        const fieldName = field.name.toLowerCase();
        if (fieldName.includes('name') && !fieldName.includes('guardian') && !fieldName.includes('institution')) {
          initialData[field.name] = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
        } else if (fieldName.includes('email')) {
          initialData[field.name] = userInfo.email || '';
        } else if (fieldName.includes('department') || fieldName.includes('class')) {
          initialData[field.name] = userInfo.department || '';
        } else if (fieldName.includes('studentid') || fieldName.includes('staffid') || fieldName.includes('id')) {
          initialData[field.name] = userInfo.uniqueId || '';
        } else if (fieldName.includes('phone') || fieldName.includes('contact')) {
          initialData[field.name] = userInfo.phone || '';
        }
      });
    }
    setFormData(initialData);
    
    // Auto-select first approver based on approval chain
    if (template.approvalChain && template.approvalChain.length > 0) {
      const firstApproverRole = template.approvalChain[0];
      const matchingApprover = approvers.find(a => 
        (a.role || '').toLowerCase().includes(firstApproverRole.toLowerCase())
      );
      if (matchingApprover) {
        setSelectedRecipients([matchingApprover.id]);
      }
    }
  };

  // Handle form input change
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Toggle recipient selection
  const toggleRecipient = (recipientId) => {
    setSelectedRecipients(prev => {
      if (prev.includes(recipientId)) {
        return prev.filter(id => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  // Generate preview content
  const generatePreviewContent = () => {
    if (!selectedTemplate || !institutionInfo) return '';
    
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    let content = `
      <div class="preview-document">
        <div class="preview-header">
          <h2>${institutionInfo.name || 'Institution Name'}</h2>
          <p>${institutionInfo.address || 'Institution Address'}</p>
          ${institutionInfo.phone ? `<p>Phone: ${institutionInfo.phone}</p>` : ''}
          ${institutionInfo.email ? `<p>Email: ${institutionInfo.email}</p>` : ''}
        </div>
        <hr class="preview-divider" />
        <div class="preview-title">
          <h3>${selectedTemplate.name}</h3>
          <p class="preview-date">Date: ${today}</p>
        </div>
        <div class="preview-body">
    `;
    
    // Add form data to preview
    if (selectedTemplate.fields) {
      selectedTemplate.fields.forEach(field => {
        const value = formData[field.name] || '<em>Not provided</em>';
        content += `<p><strong>${field.label}:</strong> ${value}</p>`;
      });
    }
    
    content += `
        </div>
        <div class="preview-footer">
          <p>This is a system-generated document.</p>
          <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
    `;
    
    return content;
  };

  // Handle preview
  const handlePreview = () => {
    const content = generatePreviewContent();
    setPreviewContent(content);
    setShowPreview(true);
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/document-generation/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          formData: formData,
          status: 'draft'
        })
      });

      if (response.ok) {
        showNotification('success', 'Draft Saved', 'Your document has been saved as draft!');
        fetchMyDocuments();
        fetchAnalytics();
      } else {
        const error = await response.json();
        showNotification('error', 'Error', error.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('error', 'Error', 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate and send for approval
  const handleGenerateAndSubmit = async () => {
    if (!selectedTemplate) return;
    
    // Validate required fields
    const requiredFields = selectedTemplate.fields?.filter(f => f.required) || [];
    const missingFields = requiredFields.filter(f => !formData[f.name]);
    
    if (missingFields.length > 0) {
      showNotification('error', 'Missing Fields', `Please fill: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    if (selectedRecipients.length === 0) {
      showNotification('error', 'No Recipients', 'Please select at least one recipient for approval');
      return;
    }

    setIsSubmitting(true);
    try {
      // First generate the document
      const generateResponse = await fetch(`${API_URL}/api/document-generation/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          formData: formData
        })
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        showNotification('error', 'Error', error.error || 'Failed to generate document');
        return;
      }

      const generateData = await generateResponse.json();
      const docId = generateData.data?.id;

      // Then submit for approval
      const submitResponse = await fetch(`${API_URL}/api/document-generation/submit/${docId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          approvalType: approvalType
        })
      });

      if (submitResponse.ok) {
        showNotification('success', 'Document Submitted', `Your ${selectedTemplate.name} has been sent for approval!`);
        
        // Refresh data
        fetchMyDocuments();
        fetchAnalytics();
        
        // Close modal after delay
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        const error = await submitResponse.json();
        showNotification('error', 'Error', error.error || 'Failed to submit document');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      showNotification('error', 'Error', 'Failed to generate document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setSelectedTemplate(null);
    setFormData({});
    setSelectedRecipients([]);
    setApprovalType('standard');
    setShowPreview(false);
    setPreviewContent('');
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: '#e0e7ff', color: '#3730a3', icon: 'ri-draft-line' },
      pending: { bg: '#fef3c7', color: '#92400e', icon: 'ri-time-line' },
      approved: { bg: '#d1fae5', color: '#065f46', icon: 'ri-checkbox-circle-line' },
      rejected: { bg: '#fee2e2', color: '#991b1b', icon: 'ri-close-circle-line' },
      cancelled: { bg: '#f3f4f6', color: '#374151', icon: 'ri-forbid-line' }
    };
    return styles[status?.toLowerCase()] || styles.draft;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="document-generation">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <div className="notification-icon">
              <i className={notification.type === 'success' ? 'ri-checkbox-circle-fill' : 
                           notification.type === 'error' ? 'ri-error-warning-fill' : 'ri-information-fill'}></i>
            </div>
            <div className="notification-content">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}>
              <i className="ri-close-line"></i>
            </button>
          </div>
        ))}
      </div>

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
            <i className="ri-draft-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.drafts}</h4>
            <p>Drafts</p>
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
        
        {isLoading ? (
          <div className="loading-state">
            <i className="ri-loader-4-line spinning"></i>
            <p>Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty-state-inline">
            <i className="ri-file-search-line"></i>
            <p>No templates found</p>
          </div>
        ) : (
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
                      <span className="meta-item">
                        <i className="ri-time-line"></i>
                        {template.estimatedTime || '5 min'}
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
        )}
      </div>

      {/* Full Screen Template Form Modal - Redesigned */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && closeModal()}>
          <div className="template-modal">
            {/* Modal Header */}
            <div className="template-modal-header">
              <div className="template-modal-title">
                <span className="template-modal-icon" style={{background: `${selectedTemplate.color}15`, color: selectedTemplate.color}}>
                  {selectedTemplate.icon}
                </span>
                <div className="template-modal-info">
                  <h2>{selectedTemplate.name}</h2>
                  <p>{selectedTemplate.description}</p>
                </div>
              </div>
              <div className="template-modal-actions">
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${!showPreview ? 'active' : ''}`} 
                    onClick={() => setShowPreview(false)}
                  >
                    <i className="ri-edit-line"></i> Form
                  </button>
                  <button 
                    className={`toggle-btn ${showPreview ? 'active' : ''}`} 
                    onClick={handlePreview}
                  >
                    <i className="ri-eye-line"></i> Preview
                  </button>
                </div>
                <button className="close-modal-btn" onClick={closeModal}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="template-modal-body">
              {/* Left Side - Form */}
              <div className={`template-form-section ${showPreview ? 'collapsed' : ''}`}>
                <div className="form-container">
                  {/* Step Indicator */}
                  <div className="form-steps">
                    <div className="step active">
                      <span className="step-number">1</span>
                      <span className="step-label">Fill Details</span>
                    </div>
                    <span className="step-connector"></span>
                    <div className={`step ${selectedRecipients.length > 0 ? 'active' : ''}`}>
                      <span className="step-number">2</span>
                      <span className="step-label">Select Approvers</span>
                    </div>
                    <span className="step-connector"></span>
                    <div className={`step ${approvalType ? 'active' : ''}`}>
                      <span className="step-number">3</span>
                      <span className="step-label">Choose Action</span>
                    </div>
                  </div>

                  {/* Form Fields Section */}
                  <div className="form-card">
                    <div className="form-card-header">
                      <i className="ri-file-list-3-line"></i>
                      <h3>Document Details</h3>
                    </div>
                    <div className="form-card-body">
                      {(!selectedTemplate.fields || selectedTemplate.fields.length === 0) ? (
                        <div className="empty-form-state">
                          <i className="ri-information-line"></i>
                          <p>No form fields configured for this template</p>
                        </div>
                      ) : (
                        <div className="form-grid">
                          {selectedTemplate.fields.map(field => (
                            <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                              <label className="form-label">
                                {field.label}
                                {field.required && <span className="required">*</span>}
                              </label>
                              {field.type === 'textarea' ? (
                                <textarea
                                  className="form-textarea"
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                  rows="3"
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  className="form-select"
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options?.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              ) : field.type === 'checkbox' ? (
                                <label className="form-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={formData[field.name] || false}
                                    onChange={(e) => handleInputChange(field.name, e.target.checked)}
                                  />
                                  <span className="checkmark"></span>
                                  <span className="checkbox-label">{field.label}</span>
                                </label>
                              ) : (
                                <input
                                  className="form-input"
                                  type={field.type || 'text'}
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                  placeholder={field.type === 'date' ? '' : `Enter ${field.label.toLowerCase()}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recipients/Approvers Section */}
                  <div className="form-card">
                    <div className="form-card-header">
                      <i className="ri-user-star-line"></i>
                      <h3>Select Approvers</h3>
                      <span className="header-badge">{selectedRecipients.length} selected</span>
                    </div>
                    <div className="form-card-body">
                      {/* Approval Chain Info */}
                      {selectedTemplate.approvalChain && selectedTemplate.approvalChain.length > 0 && (
                        <div className="chain-info">
                          <i className="ri-flow-chart"></i>
                          <span>Approval Chain: {selectedTemplate.approvalChain.join(' → ')}</span>
                        </div>
                      )}
                      
                      {/* Search */}
                      <div className="approver-search">
                        <i className="ri-search-line"></i>
                        <input 
                          type="text" 
                          placeholder="Search approvers..." 
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                        />
                      </div>
                      
                      {/* Approvers List */}
                      <div className="approvers-grid">
                        {filteredApprovers.length === 0 ? (
                          <div className="no-approvers">
                            <i className="ri-user-search-line"></i>
                            <p>No approvers found</p>
                          </div>
                        ) : filteredApprovers.map((recipient) => {
                          const displayName = recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`;
                          const nameParts = displayName.split(' ');
                          const initials = nameParts.length > 1 
                            ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length-1]?.[0] || ''}`.toUpperCase()
                            : (nameParts[0]?.[0] || 'U').toUpperCase();
                          const isSelected = selectedRecipients.includes(recipient.id);
                          const isSuggested = selectedTemplate.approvalChain?.[0]?.toLowerCase().includes((recipient.role || '').toLowerCase());
                          return (
                            <div 
                              key={recipient.id} 
                              className={`approver-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleRecipient(recipient.id)}
                            >
                              <div className="approver-checkbox">
                                <input type="checkbox" checked={isSelected} onChange={() => {}} />
                                <span className="custom-checkbox"></span>
                              </div>
                              <div className="approver-avatar" style={{background: isSelected ? '#10b981' : '#e2e8f0'}}>
                                {initials}
                              </div>
                              <div className="approver-details">
                                <strong>{displayName}</strong>
                                <small>{recipient.role} • {recipient.department || 'Department'}</small>
                              </div>
                              {isSuggested && <span className="suggested-tag">Suggested</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Type Section */}
                  <div className="form-card">
                    <div className="form-card-header">
                      <i className="ri-shield-check-line"></i>
                      <h3>Choose Action</h3>
                    </div>
                    <div className="form-card-body">
                      <div className="action-options">
                        <label className={`action-option ${approvalType === 'standard' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType" 
                            checked={approvalType === 'standard'}
                            onChange={() => setApprovalType('standard')}
                          />
                          <div className="action-icon standard">
                            <i className="ri-checkbox-circle-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Standard Approval</strong>
                            <small>Send for regular approval process</small>
                          </div>
                        </label>
                        
                        <label className={`action-option ${approvalType === 'digital' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType"
                            checked={approvalType === 'digital'}
                            onChange={() => setApprovalType('digital')}
                          />
                          <div className="action-icon digital">
                            <i className="ri-quill-pen-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Digital Signature</strong>
                            <small>Requires digital signature verification</small>
                          </div>
                        </label>
                        
                        <label className={`action-option ${approvalType === 'blockchain' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType"
                            checked={approvalType === 'blockchain'}
                            onChange={() => setApprovalType('blockchain')}
                          />
                          <div className="action-icon blockchain">
                            <i className="ri-links-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Blockchain Verified</strong>
                            <small>Permanently stored on blockchain</small>
                          </div>
                        </label>
                        
                        <label className={`action-option ${approvalType === 'save' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType"
                            checked={approvalType === 'save'}
                            onChange={() => setApprovalType('save')}
                          />
                          <div className="action-icon save">
                            <i className="ri-folder-add-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Save to Files</strong>
                            <small>Save directly to File Manager</small>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className={`template-preview-section ${showPreview ? 'expanded' : ''}`}>
                {showPreview && previewContent ? (
                  <div className="preview-wrapper">
                    <div className="preview-header">
                      <span><i className="ri-file-text-line"></i> Document Preview</span>
                      <div className="preview-actions">
                        <button className="preview-btn" title="Print">
                          <i className="ri-printer-line"></i>
                        </button>
                        <button className="preview-btn" title="Download PDF">
                          <i className="ri-download-line"></i>
                        </button>
                      </div>
                    </div>
                    <div 
                      className="preview-content"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <div className="placeholder-icon">
                      <i className="ri-file-text-line"></i>
                    </div>
                    <h3>Document Preview</h3>
                    <p>Fill the form and click "Preview" to see your document</p>
                    <button className="preview-generate-btn" onClick={handlePreview}>
                      <i className="ri-eye-line"></i> Generate Preview
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="template-modal-footer">
              <div className="footer-left">
                <button className="footer-btn outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                  <i className="ri-save-line"></i> Save as Draft
                </button>
              </div>
              <div className="footer-right">
                <button className="footer-btn outline" onClick={handlePreview}>
                  <i className="ri-eye-line"></i> Preview
                </button>
                <button 
                  className="footer-btn primary" 
                  onClick={handleGenerateAndSubmit} 
                  disabled={isSubmitting || selectedRecipients.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line spinning"></i> Processing...
                    </>
                  ) : approvalType === 'save' ? (
                    <>
                      <i className="ri-folder-add-line"></i> Save to Files
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line"></i> Generate & Submit
                    </>
                  )}
                </button>
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
                <option>Draft</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
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

            {myDocuments.length === 0 ? (
              <div className="empty-state-modal">
                <i className="ri-file-text-line"></i>
                <h3>No documents yet</h3>
                <p>Create your first document by selecting a template</p>
              </div>
            ) : (
              <div className="documents-table-container">
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>REQUEST ID</th>
                      <th>DOCUMENT TYPE</th>
                      <th>SUBMITTED</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDocuments.map(doc => {
                      const statusStyle = getStatusBadge(doc.status);
                      return (
                        <tr key={doc.id}>
                          <td className="request-id-cell">{doc.requestId}</td>
                          <td>{doc.templateName}</td>
                          <td>{formatDate(doc.submittedAt || doc.createdAt)}</td>
                          <td>
                            <span 
                              className="status-badge-table"
                              style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                              <i className={statusStyle.icon}></i>
                              {doc.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button className="action-btn" title="View">
                                <i className="ri-eye-line"></i>
                              </button>
                              {doc.status === 'draft' && (
                                <>
                                  <button className="action-btn" title="Edit">
                                    <i className="ri-edit-line"></i>
                                  </button>
                                  <button className="action-btn danger" title="Delete">
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </>
                              )}
                              {doc.pdfIpfsHash && (
                                <a 
                                  href={`https://gateway.pinata.cloud/ipfs/${doc.pdfIpfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-btn"
                                  title="Download"
                                >
                                  <i className="ri-download-line"></i>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
