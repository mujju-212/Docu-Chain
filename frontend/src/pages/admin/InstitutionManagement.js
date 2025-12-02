import React, { useState, useEffect, useCallback } from 'react';
import './InstitutionManagement.css';

const InstitutionManagement = () => {
  const [activeTab, setActiveTab] = useState('institution');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Institution state
  const [institution, setInstitution] = useState(null);
  const [isEditingInstitution, setIsEditingInstitution] = useState(false);
  const [institutionForm, setInstitutionForm] = useState({});
  
  // Departments state
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', hodId: '' });
  
  // Sections state
  const [expandedDept, setExpandedDept] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '', classTeacherId: '', departmentId: '' });
  
  // User search for HOD/Class Teacher
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchFor, setSearchFor] = useState(''); // 'hod' or 'teacher'
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const institutionTypes = [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
    { value: 'school', label: 'School' },
    { value: 'coaching', label: 'Coaching Center' },
    { value: 'institute', label: 'Institute' },
    { value: 'academy', label: 'Academy' }
  ];

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch institution details
  const fetchInstitution = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institution/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInstitution(data.institution);
        setInstitutionForm(data.institution);
      }
    } catch (err) {
      console.error('Error fetching institution:', err);
      showNotification('Failed to load institution details', 'error');
    }
  }, [API_URL]);

  // Fetch departments with sections
  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institution/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      showNotification('Failed to load departments', 'error');
    }
  }, [API_URL]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchInstitution(), fetchDepartments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchInstitution, fetchDepartments]);

  // Search users (for HOD/Class Teacher assignment)
  const searchUsers = async (term, role = '') => {
    if (!term || term.length < 2) {
      setUserSearchResults([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const roleParam = role ? `&role=${role}` : '';
      const response = await fetch(`${API_URL}/institution/search-users?search=${encodeURIComponent(term)}${roleParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUserSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchTerm) {
        const role = searchFor === 'teacher' ? 'faculty' : '';
        searchUsers(userSearchTerm, role);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchTerm, searchFor]);

  // Update institution
  const updateInstitution = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institution/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(institutionForm)
      });
      const data = await response.json();
      if (data.success) {
        setInstitution(data.institution);
        setIsEditingInstitution(false);
        showNotification('Institution details updated successfully');
      } else {
        showNotification(data.error || 'Failed to update institution', 'error');
      }
    } catch (err) {
      console.error('Error updating institution:', err);
      showNotification('Failed to update institution', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create/Update department
  const saveDepartment = async () => {
    if (!deptForm.name.trim()) {
      showNotification('Department name is required', 'error');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingDepartment 
        ? `${API_URL}/institution/departments/${editingDepartment.id}`
        : `${API_URL}/institution/departments`;
      
      const response = await fetch(url, {
        method: editingDepartment ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deptForm)
      });
      const data = await response.json();
      if (data.success) {
        await fetchDepartments();
        closeDeptModal();
        showNotification(editingDepartment ? 'Department updated successfully' : 'Department created successfully');
      } else {
        showNotification(data.error || 'Failed to save department', 'error');
      }
    } catch (err) {
      console.error('Error saving department:', err);
      showNotification('Failed to save department', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete department
  const deleteDepartment = async (deptId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institution/departments/${deptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchDepartments();
        showNotification('Department deleted successfully');
      } else {
        showNotification(data.error || 'Failed to delete department', 'error');
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      showNotification('Failed to delete department', 'error');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Create/Update section
  const saveSection = async () => {
    if (!sectionForm.name.trim()) {
      showNotification('Section name is required', 'error');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingSection 
        ? `${API_URL}/institution/sections/${editingSection.id}`
        : `${API_URL}/institution/sections`;
      
      const response = await fetch(url, {
        method: editingSection ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectionForm)
      });
      const data = await response.json();
      if (data.success) {
        await fetchDepartments();
        closeSectionModal();
        showNotification(editingSection ? 'Section updated successfully' : 'Section created successfully');
      } else {
        showNotification(data.error || 'Failed to save section', 'error');
      }
    } catch (err) {
      console.error('Error saving section:', err);
      showNotification('Failed to save section', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete section
  const deleteSection = async (sectionId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institution/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchDepartments();
        showNotification('Section deleted successfully');
      } else {
        showNotification(data.error || 'Failed to delete section', 'error');
      }
    } catch (err) {
      console.error('Error deleting section:', err);
      showNotification('Failed to delete section', 'error');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Modal handlers
  const openDeptModal = (dept = null) => {
    setEditingDepartment(dept);
    setDeptForm(dept ? { name: dept.name, hodId: dept.hodId || '', hodName: dept.hodName || '' } : { name: '', hodId: '', hodName: '' });
    setUserSearchTerm('');
    setUserSearchResults([]);
    setSearchFor('hod');
    setShowDeptModal(true);
  };

  const closeDeptModal = () => {
    setShowDeptModal(false);
    setEditingDepartment(null);
    setDeptForm({ name: '', hodId: '' });
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  const openSectionModal = (deptId, section = null) => {
    setEditingSection(section);
    setSectionForm(section 
      ? { name: section.name, classTeacherId: section.classTeacherId || '', departmentId: section.departmentId, teacherName: section.teacherName || '' }
      : { name: '', classTeacherId: '', departmentId: deptId, teacherName: '' }
    );
    setUserSearchTerm('');
    setUserSearchResults([]);
    setSearchFor('teacher');
    setShowSectionModal(true);
  };

  const closeSectionModal = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ name: '', classTeacherId: '', departmentId: '' });
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  // Confirmation handlers
  const showConfirmation = (title, message, action) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
  };

  // Select user for HOD/Teacher
  const selectUser = (user) => {
    if (searchFor === 'hod') {
      setDeptForm(prev => ({ ...prev, hodId: user.id, hodName: `${user.firstName} ${user.lastName}` }));
    } else {
      setSectionForm(prev => ({ ...prev, classTeacherId: user.id, teacherName: `${user.firstName} ${user.lastName}` }));
    }
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  if (loading) {
    return (
      <div className="im-container">
        <div className="im-loading">
          <div className="im-spinner"></div>
          <p>Loading institution details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="im-container">
      {/* Notification */}
      {notification && (
        <div className={`im-notification ${notification.type}`}>
          <i className={notification.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="im-header">
        <div className="im-header-content">
          <h1><i className="ri-building-4-line"></i> Institution Management</h1>
          <p>Manage your institution details, departments, and sections</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="im-tabs">
        <button 
          className={`im-tab ${activeTab === 'institution' ? 'active' : ''}`}
          onClick={() => setActiveTab('institution')}
        >
          <i className="ri-building-line"></i>
          Institution Details
        </button>
        <button 
          className={`im-tab ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          <i className="ri-organization-chart"></i>
          Departments & Sections
        </button>
      </div>

      {/* Tab Content */}
      <div className="im-content">
        {activeTab === 'institution' ? (
          <div className="im-institution-tab">
            <div className="im-card">
              <div className="im-card-header">
                <div className="im-card-title">
                  <i className="ri-information-line"></i>
                  <h2>Institution Profile</h2>
                </div>
                {!isEditingInstitution && (
                  <button className="im-btn primary" onClick={() => setIsEditingInstitution(true)}>
                    <i className="ri-edit-line"></i> Edit Details
                  </button>
                )}
              </div>
              
              <div className="im-card-body">
                {isEditingInstitution ? (
                  <div className="im-form">
                    <div className="im-form-grid">
                      <div className="im-form-group">
                        <label>Institution Name *</label>
                        <input
                          type="text"
                          value={institutionForm.name || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter institution name"
                        />
                      </div>
                      
                      <div className="im-form-group">
                        <label>Institution Type *</label>
                        <select
                          value={institutionForm.type || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="">Select Type</option>
                          {institutionTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="im-form-group">
                        <label>Unique ID</label>
                        <input
                          type="text"
                          value={institutionForm.uniqueId || ''}
                          disabled
                          className="im-input-disabled"
                        />
                        <span className="im-field-hint">Institution ID cannot be changed</span>
                      </div>
                      
                      <div className="im-form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={institutionForm.email || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div className="im-form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          value={institutionForm.phone || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>
                      
                      <div className="im-form-group">
                        <label>Website</label>
                        <input
                          type="url"
                          value={institutionForm.website || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://www.example.com"
                        />
                      </div>
                      
                      <div className="im-form-group full-width">
                        <label>Address</label>
                        <textarea
                          value={institutionForm.address || ''}
                          onChange={(e) => setInstitutionForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter full address"
                          rows="3"
                        />
                      </div>
                    </div>
                    
                    <div className="im-form-actions">
                      <button className="im-btn primary" onClick={updateInstitution} disabled={actionLoading}>
                        {actionLoading ? <span className="im-btn-spinner"></span> : <i className="ri-save-line"></i>}
                        Save Changes
                      </button>
                      <button className="im-btn secondary" onClick={() => {
                        setInstitutionForm(institution);
                        setIsEditingInstitution(false);
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="im-profile-view">
                    <div className="im-profile-header">
                      <div className="im-profile-avatar">
                        <i className="ri-building-4-fill"></i>
                      </div>
                      <div className="im-profile-info">
                        <h3>{institution?.name}</h3>
                        <span className="im-badge">{institutionTypes.find(t => t.value === institution?.type)?.label || institution?.type}</span>
                        <span className={`im-status ${institution?.status}`}>{institution?.status}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-grid">
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-fingerprint-line"></i> Institution ID</span>
                        <span className="im-detail-value">{institution?.uniqueId || '-'}</span>
                      </div>
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-mail-line"></i> Email</span>
                        <span className="im-detail-value">{institution?.email || '-'}</span>
                      </div>
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-phone-line"></i> Phone</span>
                        <span className="im-detail-value">{institution?.phone || '-'}</span>
                      </div>
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-global-line"></i> Website</span>
                        <span className="im-detail-value">
                          {institution?.website ? (
                            <a href={institution.website} target="_blank" rel="noopener noreferrer">
                              {institution.website}
                            </a>
                          ) : '-'}
                        </span>
                      </div>
                      <div className="im-detail-item full-width">
                        <span className="im-detail-label"><i className="ri-map-pin-line"></i> Address</span>
                        <span className="im-detail-value">{institution?.address || '-'}</span>
                      </div>
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-calendar-line"></i> Created</span>
                        <span className="im-detail-value">
                          {institution?.created_at ? new Date(institution.created_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="im-detail-item">
                        <span className="im-detail-label"><i className="ri-refresh-line"></i> Last Updated</span>
                        <span className="im-detail-value">
                          {institution?.updated_at ? new Date(institution.updated_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="im-usage-notice">
                      <i className="ri-information-line"></i>
                      <p>These details are used in document templates, circulars, and official communications.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="im-departments-tab">
            {/* Create Department Button */}
            <div className="im-dept-actions">
              <button className="im-btn primary" onClick={() => openDeptModal()}>
                <i className="ri-add-line"></i> Create Department
              </button>
            </div>

            {/* Departments List */}
            <div className="im-dept-list">
              {departments.length === 0 ? (
                <div className="im-empty-state">
                  <i className="ri-organization-chart"></i>
                  <h3>No Departments Yet</h3>
                  <p>Create your first department to organize your institution</p>
                  <button className="im-btn primary" onClick={() => openDeptModal()}>
                    <i className="ri-add-line"></i> Create Department
                  </button>
                </div>
              ) : (
                departments.map(dept => (
                  <div key={dept.id} className="im-dept-card">
                    <div className="im-dept-header" onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}>
                      <div className="im-dept-info">
                        <div className="im-dept-icon">
                          <i className="ri-building-2-line"></i>
                        </div>
                        <div className="im-dept-details">
                          <h3>{dept.name}</h3>
                          <div className="im-dept-meta">
                            <span><i className="ri-user-star-line"></i> HOD: {dept.hodName || 'Not Assigned'}</span>
                            <span><i className="ri-group-line"></i> {dept.sections?.length || 0} Sections</span>
                          </div>
                        </div>
                      </div>
                      <div className="im-dept-actions-inline">
                        <button className="im-icon-btn" onClick={(e) => { e.stopPropagation(); openDeptModal(dept); }} title="Edit Department">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button className="im-icon-btn danger" onClick={(e) => { 
                          e.stopPropagation(); 
                          showConfirmation('Delete Department', `Are you sure you want to delete "${dept.name}"? All sections will also be deleted.`, () => deleteDepartment(dept.id));
                        }} title="Delete Department">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                        <i className={`ri-arrow-${expandedDept === dept.id ? 'up' : 'down'}-s-line im-expand-icon`}></i>
                      </div>
                    </div>
                    
                    {expandedDept === dept.id && (
                      <div className="im-dept-content">
                        <div className="im-sections-header">
                          <h4><i className="ri-layout-grid-line"></i> Sections</h4>
                          <button className="im-btn small primary" onClick={() => openSectionModal(dept.id)}>
                            <i className="ri-add-line"></i> Add Section
                          </button>
                        </div>
                        
                        {dept.sections && dept.sections.length > 0 ? (
                          <div className="im-sections-grid">
                            {dept.sections.map(section => (
                              <div key={section.id} className="im-section-card">
                                <div className="im-section-info">
                                  <h5>{section.name}</h5>
                                  <span className="im-section-teacher">
                                    <i className="ri-user-line"></i> 
                                    {section.teacherName || 'No Class Teacher'}
                                  </span>
                                </div>
                                <div className="im-section-actions">
                                  <button className="im-icon-btn small" onClick={() => openSectionModal(dept.id, section)} title="Edit Section">
                                    <i className="ri-edit-line"></i>
                                  </button>
                                  <button className="im-icon-btn small danger" onClick={() => 
                                    showConfirmation('Delete Section', `Are you sure you want to delete section "${section.name}"?`, () => deleteSection(section.id))
                                  } title="Delete Section">
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="im-no-sections">
                            <p>No sections in this department</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Department Modal */}
      {showDeptModal && (
        <div className="im-modal-overlay" onClick={closeDeptModal}>
          <div className="im-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal-header">
              <h2><i className="ri-building-2-line"></i> {editingDepartment ? 'Edit Department' : 'Create Department'}</h2>
              <button className="im-modal-close" onClick={closeDeptModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="im-modal-body">
              <div className="im-form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              
              <div className="im-form-group">
                <label>Head of Department (HOD)</label>
                <div className="im-user-search">
                  {deptForm.hodName ? (
                    <div className="im-selected-user">
                      <span><i className="ri-user-star-line"></i> {deptForm.hodName}</span>
                      <button onClick={() => setDeptForm(prev => ({ ...prev, hodId: '', hodName: '' }))}>
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search by name or email..."
                      />
                      {searchingUsers && <div className="im-search-spinner"></div>}
                    </>
                  )}
                  
                  {userSearchResults.length > 0 && !deptForm.hodName && (
                    <div className="im-search-results">
                      {userSearchResults.map(user => (
                        <div key={user.id} className="im-search-result" onClick={() => selectUser(user)}>
                          <div className="im-result-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                          <div className="im-result-info">
                            <span className="im-result-name">{user.firstName} {user.lastName}</span>
                            <span className="im-result-email">{user.email}</span>
                          </div>
                          <span className="im-result-role">{user.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="im-modal-footer">
              <button className="im-btn secondary" onClick={closeDeptModal}>Cancel</button>
              <button className="im-btn primary" onClick={saveDepartment} disabled={actionLoading}>
                {actionLoading ? <span className="im-btn-spinner"></span> : <i className="ri-save-line"></i>}
                {editingDepartment ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="im-modal-overlay" onClick={closeSectionModal}>
          <div className="im-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal-header">
              <h2><i className="ri-layout-grid-line"></i> {editingSection ? 'Edit Section' : 'Create Section'}</h2>
              <button className="im-modal-close" onClick={closeSectionModal}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="im-modal-body">
              <div className="im-form-group">
                <label>Section Name *</label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Section A, 1st Year, Batch 2024"
                />
              </div>
              
              <div className="im-form-group">
                <label>Class Teacher (Faculty Only)</label>
                <div className="im-user-search">
                  {sectionForm.teacherName ? (
                    <div className="im-selected-user">
                      <span><i className="ri-user-line"></i> {sectionForm.teacherName}</span>
                      <button onClick={() => setSectionForm(prev => ({ ...prev, classTeacherId: '', teacherName: '' }))}>
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search faculty by name or email..."
                      />
                      {searchingUsers && <div className="im-search-spinner"></div>}
                    </>
                  )}
                  
                  {userSearchResults.length > 0 && !sectionForm.teacherName && (
                    <div className="im-search-results">
                      {userSearchResults.map(user => (
                        <div key={user.id} className="im-search-result" onClick={() => selectUser(user)}>
                          <div className="im-result-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                          <div className="im-result-info">
                            <span className="im-result-name">{user.firstName} {user.lastName}</span>
                            <span className="im-result-email">{user.email}</span>
                          </div>
                          <span className="im-result-role">{user.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="im-modal-footer">
              <button className="im-btn secondary" onClick={closeSectionModal}>Cancel</button>
              <button className="im-btn primary" onClick={saveSection} disabled={actionLoading}>
                {actionLoading ? <span className="im-btn-spinner"></span> : <i className="ri-save-line"></i>}
                {editingSection ? 'Update Section' : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="im-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="im-modal im-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-confirm-icon danger">
              <i className="ri-error-warning-line"></i>
            </div>
            <h3>{confirmTitle}</h3>
            <p>{confirmMessage}</p>
            <div className="im-confirm-actions">
              <button className="im-btn secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="im-btn danger" onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading ? <span className="im-btn-spinner"></span> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionManagement;