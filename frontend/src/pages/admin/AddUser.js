import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AddUser.css';

const AddUser = () => {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dropdown data
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    uniqueId: '',
    department: '',
    section: '',
    walletAddress: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch departments when component mounts (using currentUser's institution)
  useEffect(() => {
    if (currentUser?.institution?.id) {
      fetchDepartments(currentUser.institution.id);
    }
  }, [currentUser]);

  // Fetch sections when department changes
  useEffect(() => {
    if (formData.department) {
      fetchSections(formData.department);
    } else {
      setSections([]);
    }
  }, [formData.department]);

  const fetchDepartments = async (institutionId) => {
    try {
      setLoadingDepartments(true);
      const response = await fetch(`${API_URL}/institutions/${institutionId}/departments`);
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchSections = async (departmentId) => {
    try {
      setLoadingSections(true);
      const response = await fetch(`${API_URL}/institutions/departments/${departmentId}/sections`);
      const data = await response.json();
      
      if (data.success) {
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccess('');
    // Reset form when switching roles
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      uniqueId: '',
      department: '',
      section: '',
      walletAddress: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const togglePassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.firstName.trim()) errors.push('First name is required.');
    if (!formData.lastName.trim()) errors.push('Last name is required.');
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Valid email is required.');
    }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) {
      errors.push('Phone must be 10 digits.');
    }
    if (!formData.password || formData.password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match.');
    }
    if (!formData.uniqueId.trim()) {
      errors.push(`${selectedRole === 'student' ? 'Student' : selectedRole === 'faculty' ? 'Staff' : 'Admin'} ID is required.`);
    }
    if (!currentUser?.institution) errors.push('Institution information not available. Please refresh the page.');
    
    if (selectedRole === 'student' || selectedRole === 'faculty') {
      if (!formData.department) errors.push('Department is required.');
    }
    if (selectedRole === 'student') {
      if (!formData.section) errors.push('Section is required.');
    }
    
    if (errors.length > 0) {
      setError(errors.join(' '));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        phone: formData.phone,
        uniqueId: formData.uniqueId,
        institutionId: currentUser?.institution?.id || '',
        institutionName: currentUser?.institution?.name || '',
        institutionUniqueId: currentUser?.institution?.uniqueId || currentUser?.institution?.unique_id || '',
        department: formData.department,
        section: formData.section || null,
        walletAddress: formData.walletAddress || null,
        createdByAdmin: true,
        isApproved: true
      };
      
      const response = await fetch(`${API_URL}/auth/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} account created successfully! User can now login with their credentials.`);
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            uniqueId: '',
            department: '',
            section: '',
            walletAddress: ''
          });
          setSelectedRole(null);
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to create user. Please try again.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return 'ri-admin-line';
      case 'faculty': return 'ri-user-star-line';
      case 'student': return 'ri-graduation-cap-line';
      default: return 'ri-user-line';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#ef4444';
      case 'faculty': return '#8b5cf6';
      case 'student': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getIdLabel = () => {
    switch(selectedRole) {
      case 'admin': return 'Admin ID';
      case 'faculty': return 'Staff/Teacher ID';
      case 'student': return 'Student ID / Roll Number';
      default: return 'Unique ID';
    }
  };

  return (
    <div className="add-user-container">
      <div className="add-user-header">
        <h1>
          <i className="ri-user-add-line"></i>
          Add New User
        </h1>
        <p>Create a new user account directly. Users will be able to login immediately after creation.</p>
      </div>

      {/* Role Selection Cards */}
      {!selectedRole ? (
        <div className="role-selection">
          <h2>Select User Role</h2>
          <div className="role-cards">
            <div 
              className="role-card admin-card"
              onClick={() => handleRoleSelect('admin')}
            >
              <div className="role-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <i className="ri-admin-line"></i>
              </div>
              <h3>Administrator</h3>
              <p>Full system access with user management capabilities</p>
              <div className="role-features">
                <span><i className="ri-check-line"></i> User Management</span>
                <span><i className="ri-check-line"></i> System Settings</span>
                <span><i className="ri-check-line"></i> All Permissions</span>
              </div>
            </div>

            <div 
              className="role-card faculty-card"
              onClick={() => handleRoleSelect('faculty')}
            >
              <div className="role-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <i className="ri-user-star-line"></i>
              </div>
              <h3>Faculty / Staff</h3>
              <p>Teachers and staff members with document management</p>
              <div className="role-features">
                <span><i className="ri-check-line"></i> Document Approval</span>
                <span><i className="ri-check-line"></i> Generate Documents</span>
                <span><i className="ri-check-line"></i> Verify Documents</span>
              </div>
            </div>

            <div 
              className="role-card student-card"
              onClick={() => handleRoleSelect('student')}
            >
              <div className="role-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <i className="ri-graduation-cap-line"></i>
              </div>
              <h3>Student</h3>
              <p>Students with document submission and request access</p>
              <div className="role-features">
                <span><i className="ri-check-line"></i> Upload Documents</span>
                <span><i className="ri-check-line"></i> Request Approval</span>
                <span><i className="ri-check-line"></i> Verify Documents</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* User Creation Form */
        <div className="user-form-container">
          <div className="form-header">
            <button className="back-btn" onClick={() => setSelectedRole(null)}>
              <i className="ri-arrow-left-line"></i>
              Back to Role Selection
            </button>
            <div className="selected-role-badge" style={{ 
              background: `linear-gradient(135deg, ${getRoleColor(selectedRole)}, ${getRoleColor(selectedRole)}dd)` 
            }}>
              <i className={getRoleIcon(selectedRole)}></i>
              <span>Creating {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <i className="ri-checkbox-circle-line"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            {/* Personal Information Section */}
            <div className="form-section">
              <h3><i className="ri-user-line"></i> Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-user-line"></i>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-user-line"></i>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{getIdLabel()} <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-id-card-line"></i>
                    <input
                      type="text"
                      placeholder={`Enter ${getIdLabel().toLowerCase()}`}
                      value={formData.uniqueId}
                      onChange={(e) => handleInputChange('uniqueId', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <div className="input-wrapper phone-input">
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      placeholder="10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Section */}
            <div className="form-section">
              <h3><i className="ri-building-line"></i> Institution Details</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Institution</label>
                  <div className="input-wrapper">
                    <i className="ri-building-4-line"></i>
                    <input
                      type="text"
                      value={currentUser?.institution?.name || 'Your Institution'}
                      disabled
                      className="institution-readonly"
                    />
                  </div>
                  <span className="field-hint">Users will be added to your institution automatically</span>
                </div>

                {(selectedRole === 'student' || selectedRole === 'faculty') && (
                  <div className="form-group">
                    <label>Department <span className="required">*</span></label>
                    <div className="input-wrapper select-wrapper">
                      <i className="ri-community-line"></i>
                      <select
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={loadingDepartments}
                      >
                        <option value="">
                          {loadingDepartments ? 'Loading...' : 'Select Department'}
                        </option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedRole === 'student' && (
                  <div className="form-group">
                    <label>Section <span className="required">*</span></label>
                    <div className="input-wrapper select-wrapper">
                      <i className="ri-group-line"></i>
                      <select
                        value={formData.section}
                        onChange={(e) => handleInputChange('section', e.target.value)}
                        disabled={loadingSections || !formData.department}
                      >
                        <option value="">
                          {loadingSections ? 'Loading...' : 'Select Section'}
                        </option>
                        {sections.map(sec => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Credentials Section */}
            <div className="form-section">
              <h3><i className="ri-lock-line"></i> Account Credentials</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Email Address <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-mail-line"></i>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-lock-password-line"></i>
                    <input
                      type={showPasswords.password ? 'text' : 'password'}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => togglePassword('password')}
                    >
                      <i className={showPasswords.password ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <i className="ri-lock-password-line"></i>
                    <input
                      type={showPasswords.confirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => togglePassword('confirmPassword')}
                    >
                      <i className={showPasswords.confirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Section */}
            <div className="form-section optional">
              <h3><i className="ri-wallet-3-line"></i> Optional Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Wallet Address <span className="optional-tag">Optional</span></label>
                  <div className="input-wrapper">
                    <i className="ri-wallet-3-line"></i>
                    <input
                      type="text"
                      placeholder="MetaMask wallet address (0x...)"
                      value={formData.walletAddress}
                      onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                    />
                  </div>
                  <small className="helper-text">User can add this later from their profile settings</small>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setSelectedRole(null)}
              >
                <i className="ri-close-line"></i>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating User...
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line"></i>
                    Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddUser;