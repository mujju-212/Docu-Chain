import React, { useState, useEffect, useCallback, useRef } from 'react';
import './InstitutionManagement.css';

const InstitutionManagement = () => {
  // Tab state - like ChatInterface
  const [activeTab, setActiveTab] = useState('details');
  
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
  const [activeDeptMenu, setActiveDeptMenu] = useState(null);
  
  // Sections state
  const [selectedDeptForSections, setSelectedDeptForSections] = useState('');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '', classTeacherId: '', departmentId: '' });
  const [activeSectionMenu, setActiveSectionMenu] = useState(null);
  
  // User search for HOD/Class Teacher
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchFor, setSearchFor] = useState('');
  
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

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDeptMenu && !event.target.closest('.im-menu-container')) {
        setActiveDeptMenu(null);
      }
      if (activeSectionMenu && !event.target.closest('.im-menu-container')) {
        setActiveSectionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDeptMenu, activeSectionMenu]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch institution details - FIXED URL
  const fetchInstitution = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institutions/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Institution fetch response:', data);
      if (data.success) {
        setInstitution(data.institution);
        setInstitutionForm(data.institution);
      } else {
        console.error('Failed to fetch institution:', data.error);
      }
    } catch (err) {
      console.error('Error fetching institution:', err);
      showNotification('Failed to load institution details', 'error');
    }
  }, [API_URL]);

  // Fetch departments with sections - FIXED URL
  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institutions/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Departments fetch response:', data);
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

  // Search users - FIXED URL
  const searchUsers = async (term, role = '') => {
    if (!term || term.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const roleParam = role ? `&role=${role}` : '';
      const response = await fetch(`${API_URL}/institutions/search-users?search=${encodeURIComponent(term)}${roleParam}`, {
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

  // Update institution - FIXED URL
  const updateInstitution = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institutions/update`, {
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

  // Save department - FIXED URL
  const saveDepartment = async () => {
    if (!deptForm.name.trim()) {
      showNotification('Department name is required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingDepartment 
        ? `${API_URL}/institutions/departments/${editingDepartment.id}`
        : `${API_URL}/institutions/departments`;
      
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
      showNotification('Failed to save department', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete department - FIXED URL
  const deleteDepartment = async (deptId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institutions/departments/${deptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchDepartments();
        if (selectedDeptForSections === deptId.toString()) {
          setSelectedDeptForSections('');
        }
        showNotification('Department deleted successfully');
      } else {
        showNotification(data.error || 'Failed to delete department', 'error');
      }
    } catch (err) {
      showNotification('Failed to delete department', 'error');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Save section - FIXED URL
  const saveSection = async () => {
    if (!sectionForm.name.trim()) {
      showNotification('Section name is required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingSection 
        ? `${API_URL}/institutions/sections/${editingSection.id}`
        : `${API_URL}/institutions/sections`;
      
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
      showNotification('Failed to save section', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete section - FIXED URL
  const deleteSection = async (sectionId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/institutions/sections/${sectionId}`, {
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
    setActiveDeptMenu(null);
  };

  const closeDeptModal = () => {
    setShowDeptModal(false);
    setEditingDepartment(null);
    setDeptForm({ name: '', hodId: '' });
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  const openSectionModal = (section = null) => {
    setEditingSection(section);
    const deptId = section ? section.departmentId : selectedDeptForSections;
    setSectionForm(section 
      ? { name: section.name, classTeacherId: section.classTeacherId || '', departmentId: section.departmentId, teacherName: section.teacherName || '' }
      : { name: '', classTeacherId: '', departmentId: deptId, teacherName: '' }
    );
    setUserSearchTerm('');
    setUserSearchResults([]);
    setSearchFor('teacher');
    setShowSectionModal(true);
    setActiveSectionMenu(null);
  };

  const closeSectionModal = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ name: '', classTeacherId: '', departmentId: '' });
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  const showConfirmation = (title, message, action) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
  };

  const selectUser = (user) => {
    if (searchFor === 'hod') {
      setDeptForm(prev => ({ ...prev, hodId: user.id, hodName: `${user.firstName} ${user.lastName}` }));
    } else {
      setSectionForm(prev => ({ ...prev, classTeacherId: user.id, teacherName: `${user.firstName} ${user.lastName}` }));
    }
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  // Get sections for selected department
  const getFilteredSections = () => {
    if (!selectedDeptForSections) return [];
    const dept = departments.find(d => d.id.toString() === selectedDeptForSections);
    return dept?.sections || [];
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
        <h1><i className="ri-building-4-line"></i> Institution Management</h1>
        <p>Manage your institution profile, departments, and sections</p>
      </div>

      {/* Slide Tabs - Like ChatInterface */}
      <div className="im-tabs" data-active={activeTab}>
        <button 
          className={`im-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Institution Details
        </button>
        <button 
          className={`im-tab ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button 
          className={`im-tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Sections
        </button>
      </div>

      {/* Tab Content */}
      <div className="im-content">
        {/* Institution Details Tab */}
        {activeTab === 'details' && (
          <div className="im-tab-content">
            <div className="im-details-card">
              {isEditingInstitution ? (
                <div className="im-edit-form">
                  <div className="im-form-row">
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
                  </div>

                  <div className="im-form-row">
                    <div className="im-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={institutionForm.email || ''}
                        onChange={(e) => setInstitutionForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="institution@example.com"
                      />
                    </div>
                    <div className="im-form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={institutionForm.phone || ''}
                        onChange={(e) => setInstitutionForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div className="im-form-group full-width">
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

                  <div className="im-form-actions">
                    <button className="im-btn secondary" onClick={() => {
                      setInstitutionForm(institution);
                      setIsEditingInstitution(false);
                    }}>
                      <i className="ri-close-line"></i> Cancel
                    </button>
                    <button className="im-btn primary" onClick={updateInstitution} disabled={actionLoading}>
                      {actionLoading ? <span className="im-btn-spinner"></span> : <i className="ri-save-line"></i>}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="im-details-grid">
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-building-4-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Institution Name</span>
                        <span className="im-detail-value">{institution?.name || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-price-tag-3-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Type</span>
                        <span className="im-detail-value">{institutionTypes.find(t => t.value === institution?.type)?.label || institution?.type || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-fingerprint-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Institution ID</span>
                        <span className="im-detail-value id-value">{institution?.uniqueId || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-mail-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Email</span>
                        <span className="im-detail-value">{institution?.email || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-phone-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Phone</span>
                        <span className="im-detail-value">{institution?.phone || '-'}</span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item">
                      <div className="im-detail-icon"><i className="ri-global-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Website</span>
                        <span className="im-detail-value">
                          {institution?.website ? (
                            <a href={institution.website} target="_blank" rel="noopener noreferrer">{institution.website}</a>
                          ) : '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="im-detail-item full-width">
                      <div className="im-detail-icon"><i className="ri-map-pin-line"></i></div>
                      <div className="im-detail-content">
                        <span className="im-detail-label">Address</span>
                        <span className="im-detail-value">{institution?.address || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="im-edit-btn-wrapper">
                    <button className="im-btn primary" onClick={() => setIsEditingInstitution(true)}>
                      <i className="ri-edit-line"></i> Edit Details
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="im-tab-content">
            <div className="im-section-header">
              <div className="im-section-info">
                <span className="im-count-badge">{departments.length}</span>
                <span>Total Departments</span>
              </div>
              <button className="im-btn primary" onClick={() => openDeptModal()}>
                <i className="ri-add-line"></i> Add Department
              </button>
            </div>
            
            {departments.length === 0 ? (
              <div className="im-empty-state">
                <i className="ri-building-2-line"></i>
                <h3>No Departments</h3>
                <p>Add your first department to organize your institution</p>
                <button className="im-btn primary" onClick={() => openDeptModal()}>
                  <i className="ri-add-line"></i> Add Department
                </button>
              </div>
            ) : (
              <div className="im-list">
                {departments.map(dept => (
                  <div key={dept.id} className="im-list-item">
                    <div className="im-list-item-icon">
                      <i className="ri-building-2-line"></i>
                    </div>
                    <div className="im-list-item-info">
                      <span className="im-list-item-name">{dept.name}</span>
                      <div className="im-list-item-meta">
                        <span><i className="ri-user-star-line"></i> {dept.hodName || 'No HOD assigned'}</span>
                        <span className="im-separator">•</span>
                        <span><i className="ri-layout-grid-line"></i> {dept.sections?.length || 0} sections</span>
                      </div>
                    </div>
                    <div className="im-menu-container">
                      <button 
                        className="im-menu-trigger"
                        onClick={() => setActiveDeptMenu(activeDeptMenu === dept.id ? null : dept.id)}
                      >
                        <i className="ri-more-2-fill"></i>
                      </button>
                      {activeDeptMenu === dept.id && (
                        <div className="im-dropdown-menu">
                          <button onClick={() => openDeptModal(dept)}>
                            <i className="ri-edit-line"></i> Edit
                          </button>
                          <button className="danger" onClick={() => {
                            setActiveDeptMenu(null);
                            showConfirmation('Delete Department', `Delete "${dept.name}"? All sections in this department will also be deleted.`, () => deleteDepartment(dept.id));
                          }}>
                            <i className="ri-delete-bin-line"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="im-tab-content">
            <div className="im-section-header">
              <div className="im-filter-group">
                <label>Filter by Department</label>
                <select
                  value={selectedDeptForSections}
                  onChange={(e) => setSelectedDeptForSections(e.target.value)}
                  className="im-filter-select"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <button 
                className="im-btn primary" 
                onClick={() => openSectionModal()}
                disabled={!selectedDeptForSections}
                title={!selectedDeptForSections ? 'Select a department first' : ''}
              >
                <i className="ri-add-line"></i> Add Section
              </button>
            </div>

            {!selectedDeptForSections ? (
              <div className="im-empty-state">
                <i className="ri-filter-line"></i>
                <h3>Select a Department</h3>
                <p>Choose a department from the dropdown to view and manage its sections</p>
              </div>
            ) : getFilteredSections().length === 0 ? (
              <div className="im-empty-state">
                <i className="ri-layout-grid-line"></i>
                <h3>No Sections</h3>
                <p>Add sections to this department</p>
                <button className="im-btn primary" onClick={() => openSectionModal()}>
                  <i className="ri-add-line"></i> Add Section
                </button>
              </div>
            ) : (
              <div className="im-list">
                {getFilteredSections().map(section => (
                  <div key={section.id} className="im-list-item">
                    <div className="im-list-item-icon">
                      <i className="ri-layout-grid-line"></i>
                    </div>
                    <div className="im-list-item-info">
                      <span className="im-list-item-name">{section.name}</span>
                      <div className="im-list-item-meta">
                        <span><i className="ri-user-line"></i> {section.teacherName || 'No Class Teacher assigned'}</span>
                      </div>
                    </div>
                    <div className="im-menu-container">
                      <button 
                        className="im-menu-trigger"
                        onClick={() => setActiveSectionMenu(activeSectionMenu === section.id ? null : section.id)}
                      >
                        <i className="ri-more-2-fill"></i>
                      </button>
                      {activeSectionMenu === section.id && (
                        <div className="im-dropdown-menu">
                          <button onClick={() => openSectionModal(section)}>
                            <i className="ri-edit-line"></i> Edit
                          </button>
                          <button className="danger" onClick={() => {
                            setActiveSectionMenu(null);
                            showConfirmation('Delete Section', `Delete section "${section.name}"?`, () => deleteSection(section.id));
                          }}>
                            <i className="ri-delete-bin-line"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Department Modal */}
      {showDeptModal && (
        <div className="im-modal-overlay" onClick={closeDeptModal}>
          <div className="im-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal-header">
              <h2>{editingDepartment ? 'Edit Department' : 'Add Department'}</h2>
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
                    <div className="im-search-input">
                      <i className="ri-search-line"></i>
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search by name or email..."
                      />
                      {searchingUsers && <div className="im-search-spinner"></div>}
                    </div>
                  )}
                  
                  {userSearchResults.length > 0 && !deptForm.hodName && (
                    <div className="im-search-dropdown">
                      {userSearchResults.map(user => (
                        <div key={user.id} className="im-search-item" onClick={() => selectUser(user)}>
                          <span className="im-item-name">{user.firstName} {user.lastName}</span>
                          <span className="im-item-email">{user.email}</span>
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
                {actionLoading ? <span className="im-btn-spinner"></span> : null}
                {editingDepartment ? 'Update' : 'Create'}
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
              <h2>{editingSection ? 'Edit Section' : 'Add Section'}</h2>
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
                  placeholder="e.g., Section A, 1st Year"
                />
              </div>
              
              <div className="im-form-group">
                <label>Class Teacher</label>
                <div className="im-user-search">
                  {sectionForm.teacherName ? (
                    <div className="im-selected-user">
                      <span><i className="ri-user-line"></i> {sectionForm.teacherName}</span>
                      <button onClick={() => setSectionForm(prev => ({ ...prev, classTeacherId: '', teacherName: '' }))}>
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="im-search-input">
                      <i className="ri-search-line"></i>
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search faculty by name..."
                      />
                      {searchingUsers && <div className="im-search-spinner"></div>}
                    </div>
                  )}
                  
                  {userSearchResults.length > 0 && !sectionForm.teacherName && (
                    <div className="im-search-dropdown">
                      {userSearchResults.map(user => (
                        <div key={user.id} className="im-search-item" onClick={() => selectUser(user)}>
                          <span className="im-item-name">{user.firstName} {user.lastName}</span>
                          <span className="im-item-email">{user.email}</span>
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
                {actionLoading ? <span className="im-btn-spinner"></span> : null}
                {editingSection ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="im-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="im-modal im-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-confirm-icon">
              <i className="ri-error-warning-line"></i>
            </div>
            <h3>{confirmTitle}</h3>
            <p>{confirmMessage}</p>
            <div className="im-confirm-actions">
              <button className="im-btn secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="im-btn danger" onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading ? <span className="im-btn-spinner"></span> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionManagement;
