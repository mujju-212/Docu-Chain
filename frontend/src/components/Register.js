import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';
import '../pages/auth/auth.css';
import '../pages/auth/auth.mobile.css';
// 🔍 DEBUG: Uncomment the line below to enable debug mode for field/icon positioning
// import '../pages/auth/auth.debug.css';

function Register() {
  const { register: registerUser } = useAuth();
  const [currentRole, setCurrentRole] = useState('student');
  const [formData, setFormData] = useState({
    // Personal Info - Role Specific Fields
    studentFirstName: '',
    studentLastName: '',
    staffFirstName: '',
    staffLastName: '',
    adminFirstName: '',
    adminLastName: '',
    
    // Role-specific ID
    studentId: '',      // For students
    staffId: '',        // For faculty
    adminId: '',        // For admin
    
    // Institution & Department
    institutionId: '',
    collegeUniqueId: '', // Auto-populated after institution selection
    department: '',
    section: '',         // Only for students
    
    // Email Verification
    email: '',
    emailVerified: false,
    
    // Contact & Security
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    
    // Optional MetaMask
    wallet: '',
    
    // Institution Registration Fields
    institutionName: '',
    institutionType: '',
    institutionUniqueId: '',
    institutionAddress: '',
    institutionEmail: '',
    institutionPhone: '',
    institutionCountryCode: '+91',
    institutionWebsite: '',
    
    // Institution Admin Fields
    institutionAdminFirstName: '',
    institutionAdminLastName: '',
    institutionAdminId: '',
    institutionAdminEmail: '',
    institutionAdminPhone: '',
    institutionAdminCountryCode: '+91',
    institutionAdminPassword: '',
    institutionAdminConfirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
    institutionAdminPassword: false,
    institutionAdminConfirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isInstitutionFlow, setIsInstitutionFlow] = useState(false);
  const [institutionStep, setInstitutionStep] = useState(1); // For institution registration flow
  const [showUserPreview, setShowUserPreview] = useState(false); // For user registration preview
  
  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [otpVerificationLoading, setOtpVerificationLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [emailVerificationError, setEmailVerificationError] = useState('');
  
  // Admin email verification states (for institution registration step 2)
  const [adminEmailVerificationLoading, setAdminEmailVerificationLoading] = useState(false);
  const [adminEmailVerified, setAdminEmailVerified] = useState(false);
  const [showAdminOtpInput, setShowAdminOtpInput] = useState(false);
  const [adminOtpValue, setAdminOtpValue] = useState('');
  
  // Dynamic dropdown state
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  
  const navigate = useNavigate();

  // Validation helpers
  const isAlphabetic = value => /^[A-Za-z\s]+$/.test(value?.trim() || '');
  const isAlphaNumeric = value => /^[A-Za-z0-9]+$/.test(value?.trim() || '');
  const isNumeric = value => /^[0-9]+$/.test(value?.trim() || '');
  const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim() || '');
  const isPasswordStrong = value => /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(value || '');
  const isPhone = value => /^[0-9]{10}$/.test(value?.trim() || '');
  const isPhoneInstitution = value => /^[0-9]{10,15}$/.test(value?.trim() || '');

  // API functions for dynamic dropdowns with retry logic
  const fetchInstitutions = async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      setLoadingInstitutions(true);
      
      const response = await fetch(`${API_URL}/institutions/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      const data = await response.json();
      
      if (data.success && data.institutions && data.institutions.length > 0) {
        setInstitutions(data.institutions);
        setLoadingInstitutions(false);
        return;
      }
      
      if (retryCount < maxRetries) {
        setTimeout(() => fetchInstitutions(retryCount + 1), 2000);
        return;
      } else {
        setInstitutions([]);
        setError('Error loading institutions after multiple attempts.');
      }
      
    } catch (error) {
      if (retryCount < maxRetries) {
        setTimeout(() => fetchInstitutions(retryCount + 1), 2000);
        return;
      } else {
        setInstitutions([]);
        setError('Error loading institutions. Please try again.');
      }
    } finally {
      if (retryCount >= maxRetries) {
        setLoadingInstitutions(false);
      }
    }
  };

  // Email verification functions
  const handleEmailVerification = async () => {
    if (!formData.email || !isEmail(formData.email)) {
      setEmailVerificationError('Please enter a valid email address.');
      return;
    }

    try {
      setEmailVerificationLoading(true);
      setEmailVerificationError('');
      
      const response = await fetch(`${API_URL}/auth/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowOtpInput(true);
        setSuccess('OTP sent to your email. Please check and verify.');
        // For development - show OTP in UI
        if (data.otp) {
          setSuccess(`OTP sent to your email. Development OTP: ${data.otp}`);
        }
      } else {
        setEmailVerificationError(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setEmailVerificationError('Failed to send verification email. Please try again.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setEmailVerificationError('Please enter a valid 6-digit OTP.');
      return;
    }

    // Use institution email if in institution flow, otherwise use regular email
    const emailToVerify = isInstitutionFlow ? formData.institutionEmail : formData.email;

    try {
      setOtpVerificationLoading(true);
      setEmailVerificationError('');
      
      const response = await fetch(`${API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToVerify,
          otp: otpValue
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEmailVerified(true);
        setShowOtpInput(false);
        setSuccess('Email verified successfully!');
      } else {
        setEmailVerificationError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setEmailVerificationError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpVerificationLoading(false);
    }
  };

  const fetchDepartments = async (institutionId) => {
    if (!institutionId) {
      setDepartments([]);
      setSections([]);
      return;
    }

    try {
      setLoadingDepartments(true);
      const response = await fetch(`${API_URL}/institutions/${institutionId}/departments`);
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.departments || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchSections = async (departmentId) => {
    if (!departmentId) {
      setSections([]);
      return;
    }

    try {
      setLoadingSections(true);
      const response = await fetch(`${API_URL}/institutions/departments/${departmentId}/sections`);
      const data = await response.json();
      
      if (data.success) {
        setSections(data.sections || []);
      } else {
        setSections([]);
      }
    } catch (error) {
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  // Add auth-page class to body for proper styling isolation
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  // Load institutions on component mount
  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    setIsInstitutionFlow(currentRole === 'institution');
    setError('');
    setSuccess('');
    // Reset department/section data when role changes
    setDepartments([]);
    setSections([]);
  }, [currentRole]);

  // Handle institution selection and department loading
  useEffect(() => {
    if (formData.institutionId) {
      fetchDepartments(formData.institutionId);
    } else {
      setDepartments([]);
      setSections([]);
    }
  }, [formData.institutionId]);

  // Fetch sections when department changes
  useEffect(() => {
    if (formData.department) {
      fetchSections(formData.department);
    } else {
      setSections([]);
    }
  }, [formData.department]);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setError('');
    setSuccess('');
    setShowUserPreview(false); // Reset preview when changing role
  };

  // Helper functions to get display names from IDs
  const getDepartmentName = () => {
    const dept = departments.find(d => d.id === formData.department || d.id === parseInt(formData.department));
    return dept?.name || formData.department || 'Not Selected';
  };

  const getSectionName = () => {
    const section = sections.find(s => s.id === formData.section || s.id === parseInt(formData.section));
    return section?.name || formData.section || 'Not Selected';
  };

  const handleShowPreview = () => {
    if (!validateForm()) return;
    setShowUserPreview(true);
  };

  const handleBackFromPreview = () => {
    setShowUserPreview(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleInstitutionChange = (institutionId) => {
    const selectedInst = institutions.find(inst => inst.id === institutionId);
    setSelectedInstitution(selectedInst);
    
    setFormData(prev => ({ 
      ...prev, 
      institutionId: institutionId,
      collegeUniqueId: selectedInst?.unique_id || selectedInst?.uniqueId || '', // Auto-populate college unique ID
      department: '', // Reset department and section when institution changes
      section: ''
    }));
    
    // Clear and refetch departments for new institution
    setDepartments([]);
    setSections([]);
    if (selectedInst) {
      fetchDepartments(institutionId);
    }
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      department: value,
      section: '' // Reset section when department changes
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const togglePassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateCommonFields = () => {
    const errors = [];
    const { email, password, confirmPassword, phone } = formData;

    if (!isEmail(email)) errors.push("Please enter a valid email address.");
    if (!isPasswordStrong(password)) errors.push("Password must be at least 6 characters, with uppercase, lowercase, and a number.");
    if (password !== confirmPassword) errors.push("Passwords do not match.");
    if (!isPhone(phone)) errors.push("Phone number must be exactly 10 digits.");

    return errors;
  };

  const validateRoleSpecificFields = () => {
    const errors = [];
    const role = currentRole;

    if (role === 'student') {
      if (!isAlphabetic(formData.studentFirstName)) errors.push("First name must only contain letters and spaces.");
      if (!isAlphabetic(formData.studentLastName)) errors.push("Last name must only contain letters and spaces.");
      if (!isAlphaNumeric(formData.studentId)) errors.push("Student ID must be alphanumeric.");
      if (!formData.institutionId) errors.push("Please select an institution.");
      if (!formData.department) errors.push("Please select a department.");
      if (!formData.section) errors.push("Please select a section.");
    } else if (role === 'staff') {
      if (!isAlphabetic(formData.staffFirstName)) errors.push("First name must only contain letters and spaces.");
      if (!isAlphabetic(formData.staffLastName)) errors.push("Last name must only contain letters and spaces.");
      if (!isAlphaNumeric(formData.staffId)) errors.push("Teacher ID must be alphanumeric.");
      if (!formData.institutionId) errors.push("Please select an institution.");
      if (!formData.department) errors.push("Please select a department.");
    } else if (role === 'admin') {
      if (!isAlphabetic(formData.adminFirstName)) errors.push("First name must only contain letters and spaces.");
      if (!isAlphabetic(formData.adminLastName)) errors.push("Last name must only contain letters and spaces.");
      if (!isAlphaNumeric(formData.adminId)) errors.push("Admin ID must be alphanumeric.");
      if (!formData.institutionId) errors.push("Please select an institution.");
    }

    return errors;
  };

  const validateForm = () => {
    const commonErrors = validateCommonFields();
    const roleErrors = validateRoleSpecificFields();
    const allErrors = [...commonErrors, ...roleErrors];

    if (allErrors.length > 0) {
      setError(allErrors.join(' '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Handle institution registration separately
    if (currentRole === 'institution') {
      await handleCreateInstitutionAndAdmin();
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Prepare registration data based on role
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: currentRole === 'student' ? formData.studentFirstName : 
                  currentRole === 'staff' ? formData.staffFirstName : 
                  formData.adminFirstName,
        lastName: currentRole === 'student' ? formData.studentLastName : 
                 currentRole === 'staff' ? formData.staffLastName : 
                 formData.adminLastName,
        role: currentRole === 'staff' ? 'faculty' : currentRole, // Map 'staff' to 'faculty'
        phone: formData.phone,
        uniqueId: currentRole === 'student' ? formData.studentId : 
                 currentRole === 'staff' ? formData.staffId : 
                 formData.adminId,
        institutionId: formData.institutionId,
        institutionName: selectedInstitution?.name || '',
        institutionUniqueId: selectedInstitution?.unique_id || '',
        department: formData.department,
        section: formData.section,
        walletAddress: formData.wallet
      };
      
      // Use AuthContext register
      const response = await registerUser(registrationData);
      
      if (response.success) {
        const role = currentRole;
        setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully! Please wait for admin approval.`);
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            studentFirstName: '', studentLastName: '', studentId: '',
            staffFirstName: '', staffLastName: '', staffId: '',
            adminFirstName: '', adminLastName: '', adminId: '',
            email: '', password: '', confirmPassword: '', phone: '', countryCode: '+91',
            institutionId: '', department: '', section: '', wallet: ''
          });
          setSuccess('');
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
      
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Institution-specific handlers
  const handleSendOtp = () => {
    setError('');
    let errors = [];
    
    if (!isAlphabetic(formData.institutionName)) errors.push("Institution Name must be alphabetic.");
    if (!isNumeric(formData.institutionId)) errors.push("Institution ID must be numeric.");
    if (!isAlphabetic(formData.institutionType)) errors.push("Type of Institute must be alphabetic.");
    if (!isEmail(formData.institutionEmail)) errors.push("Invalid official email address.");
    if (!formData.institutionWebsite.trim()) errors.push("Website cannot be empty.");
    if (!formData.institutionAddress.trim()) errors.push("Address cannot be empty.");
    if (!isPasswordStrong(formData.institutionPassword)) errors.push("Password is not strong enough.");
    if (formData.institutionPassword !== formData.institutionConfirmPassword) errors.push("Passwords do not match.");
    if (!isPhoneInstitution(formData.institutionPhone)) errors.push("Phone number must be 10 to 15 digits.");
    
    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }
    
    setInstitutionStep(2);
    setSuccess("OTP has been sent to your email!");
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleVerifyOtp = () => {
    const otpInput = document.getElementById('otpInput').value;
    if (/^\d{6}$/.test(otpInput)) {
      setInstitutionStep(3);
      setSuccess("OTP Verified Successfully!");
      setError('');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError('Invalid OTP. Please enter the 6-digit code.');
      setSuccess('');
    }
  };

  // Institution Registration Flow Handlers
  const handleInstitutionEmailVerification = async () => {
    if (!formData.institutionEmail || !isEmail(formData.institutionEmail)) {
      setError('Please enter a valid institution email address.');
      return;
    }

    try {
      setEmailVerificationLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.institutionEmail,
          skipUserCheck: true  // Institution email doesn't need user check
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEmailVerificationSent(true);
        setShowOtpInput(true);
        setSuccess('Verification code sent to your institution email!');
        // For development - OTP shown in UI if returned
        if (data.otp) {
          setSuccess(`Verification code sent! Development OTP: ${data.otp}`);
        }
      } else {
        setError(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Admin Email Verification (for institution registration step 2)
  const handleAdminEmailVerification = async () => {
    if (!formData.institutionAdminEmail || !isEmail(formData.institutionAdminEmail)) {
      setError('Please enter a valid admin email address.');
      return;
    }

    try {
      setAdminEmailVerificationLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.institutionAdminEmail,
          skipUserCheck: true  // New admin account, skip user check
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowAdminOtpInput(true);
        setSuccess('Verification code sent to admin email!');
        // For development - OTP shown in UI if returned
        if (data.otp) {
          setSuccess(`Verification code sent! Development OTP: ${data.otp}`);
        }
      } else {
        setError(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setAdminEmailVerificationLoading(false);
    }
  };

  const handleAdminOtpVerification = async () => {
    if (!adminOtpValue || adminOtpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setAdminEmailVerificationLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.institutionAdminEmail,
          otp: adminOtpValue
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAdminEmailVerified(true);
        setShowAdminOtpInput(false);
        setSuccess('Admin email verified successfully!');
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setAdminEmailVerificationLoading(false);
    }
  };

  const validateInstitutionForm = () => {
    let errors = [];
    
    // Institution Details Validation
    if (!isAlphabetic(formData.institutionName)) errors.push("Institution name must contain only letters and spaces.");
    if (!formData.institutionType) errors.push("Please select institution type.");
    if (!formData.institutionUniqueId.trim()) errors.push("Institution unique ID is required.");
    if (!formData.institutionAddress.trim()) errors.push("Institution address is required.");
    if (!isEmail(formData.institutionEmail)) errors.push("Invalid institution email address.");
    if (!isPhoneInstitution(formData.institutionPhone)) errors.push("Institution phone must be 10-15 digits.");
    if (formData.institutionWebsite && !formData.institutionWebsite.startsWith('http')) {
      errors.push("Website must start with http:// or https://");
    }
    
    // Admin Details Validation (when on step 2 or 3)
    if (institutionStep >= 2) {
      if (!isAlphabetic(formData.institutionAdminFirstName)) errors.push("Admin first name must contain only letters.");
      if (!isAlphabetic(formData.institutionAdminLastName)) errors.push("Admin last name must contain only letters.");
      if (!isAlphaNumeric(formData.institutionAdminId)) errors.push("Admin ID must be alphanumeric.");
      if (!isEmail(formData.institutionAdminEmail)) errors.push("Invalid admin email address.");
      if (!isPhone(formData.institutionAdminPhone)) errors.push("Admin phone must be 10 digits.");
      if (!isPasswordStrong(formData.institutionAdminPassword)) {
        errors.push("Admin password must be at least 6 characters with uppercase, lowercase, and numbers.");
      }
      if (formData.institutionAdminPassword !== formData.institutionAdminConfirmPassword) {
        errors.push("Admin passwords do not match.");
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join(' '));
      return false;
    }
    
    setError('');
    return true;
  };

  const handleCreateInstitutionAndAdmin = async () => {
    if (!validateInstitutionForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const institutionData = {
        // Institution details
        institutionName: formData.institutionName,
        institutionType: formData.institutionType,
        institutionUniqueId: formData.institutionUniqueId,
        institutionAddress: formData.institutionAddress,
        institutionEmail: formData.institutionEmail,
        institutionPhone: formData.institutionPhone,
        institutionCountryCode: formData.institutionCountryCode,
        institutionWebsite: formData.institutionWebsite,
        
        // Admin details
        adminFirstName: formData.institutionAdminFirstName,
        adminLastName: formData.institutionAdminLastName,
        adminId: formData.institutionAdminId,
        adminEmail: formData.institutionAdminEmail,
        adminPhone: formData.institutionAdminPhone,
        adminCountryCode: formData.institutionAdminCountryCode,
        adminPassword: formData.institutionAdminPassword
      };
      
      const response = await fetch(`${API_URL}/institutions/create-with-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(institutionData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Institution and admin account created successfully! Please wait for system admin approval.');
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            institutionName: '', institutionType: '', institutionUniqueId: '', institutionAddress: '',
            institutionEmail: '', institutionPhone: '', institutionWebsite: '',
            institutionAdminFirstName: '', institutionAdminLastName: '', institutionAdminId: '',
            institutionAdminEmail: '', institutionAdminPhone: '', institutionAdminPassword: '',
            institutionAdminConfirmPassword: ''
          }));
          setInstitutionStep(1);
          setSuccess('');
          navigate('/login');
        }, 4000);
      } else {
        setError(data.message || 'Failed to create institution and admin account.');
      }
    } catch (error) {
      setError('Failed to create institution and admin account. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="shell">
      <div className="card">
        <section className="left">
          <div className="brand">
            <div className="logo">D</div>
            <div className="name">DocuChain</div>
          </div>
          
          <h1 id="main-heading">
            {currentRole === 'institution' ? 'Institution Registration' : 'Create Account'}
          </h1>
          <p className="sub" id="main-sub">
            {currentRole === 'institution' 
              ? 'Register your institution to get started with DocChain.' 
              : 'Choose a role from the dropdown; fields adjust automatically.'}
          </p>

          {/* Scrollable content container */}
          <div className="form-scroll-container">
          
          <div className="field">
            <i className="ri-user-settings-line"></i>
            <select id="role" value={currentRole} onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="student">Student</option>
              <option value="staff">Teacher</option>
              <option value="admin">Admin</option>
              <option value="institution">Institution</option>
            </select>
          </div>

          <div className={`error ${error ? 'show' : ''}`}>
            <i className="ri-error-warning-line"></i> {error}
          </div>
          <div className={`success ${success ? 'show' : ''}`}>
            <i className="ri-checkbox-circle-line"></i> {success}
          </div>

          {/* Form for Student, Staff, Admin */}
          {!isInstitutionFlow && !showUserPreview && (
            <form id="regForm" className={`show-${currentRole}`} onSubmit={(e) => { e.preventDefault(); handleShowPreview(); }} noValidate>
              {/* Student Fields - New Structure */}
              {currentRole === 'student' && (
                <div className="role-student">
                  {/* Step 1: Basic Information */}
                  <div className="grid-2">
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="First name"
                        value={formData.studentFirstName}
                        onChange={(e) => handleInputChange('studentFirstName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={formData.studentLastName}
                        onChange={(e) => handleInputChange('studentLastName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                  </div>
                  
                  {/* Step 2: Student ID (provided by college) */}
                  <div className="field">
                    <i className="ri-bank-card-line"></i>
                    <input
                      type="text"
                      placeholder="Student ID (provided by college)"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      required
                      pattern="[A-Za-z0-9]+"
                    />
                  </div>
                  
                  {/* Step 3: Institution Selection */}
                  <div className="field">
                    <i className="ri-school-line"></i>
                    <select
                      value={formData.institutionId}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      required
                      disabled={loadingInstitutions}
                    >
                      <option value="">
                        {loadingInstitutions ? 'Loading institutions...' : 'Select Institution'}
                      </option>
                      {institutions.map((institution) => (
                        <option key={institution.id} value={institution.id}>
                          {institution.name}
                        </option>
                      ))}
                    </select>
                    {loadingInstitutions && (
                      <div className="field-status loading">
                        <i className="ri-loader-4-line spin"></i> Loading...
                      </div>
                    )}
                  </div>
                  
                  {/* Step 4: Auto-populate College Unique ID */}
                  {selectedInstitution && (
                    <div className="field">
                      <i className="ri-bank-card-line"></i>
                      <input
                        type="text"
                        placeholder="College Unique ID"
                        value={selectedInstitution.unique_id}
                        readOnly
                        className="readonly"
                      />
                      <div className="field-status success">
                        <i className="ri-checkbox-circle-line"></i> Auto-populated
                      </div>
                    </div>
                  )}
                  
                  {/* Step 5: Department Selection */}
                  <div className="field">
                    <i className="ri-building-4-line"></i>
                    <select 
                      value={formData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      required
                      disabled={!formData.institutionId || loadingDepartments}
                    >
                      <option value="">
                        {loadingDepartments ? 'Loading departments...' : 
                         !formData.institutionId ? 'Select institution first' : 
                         'Choose Department'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Step 6: Section Selection (Student only) */}
                  <div className="field">
                    <i className="ri-group-line"></i>
                    <select 
                      value={formData.section}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                      required
                      disabled={!formData.department || loadingSections}
                    >
                      <option value="">
                        {loadingSections ? 'Loading sections...' : 
                         !formData.department ? 'Select department first' : 
                         'Choose Section'}
                      </option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Step 7: Email with Verification */}
                  <div className="field email-verification-container">
                    <div className="email-input-group">
                      <i className="ri-at-line"></i>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled={emailVerified}
                      />
                      <button 
                        type="button" 
                        className={`verify-email-btn ${emailVerified ? 'verified' : ''}`}
                        onClick={handleEmailVerification}
                        disabled={!formData.email || emailVerificationLoading || emailVerified}
                      >
                        {emailVerificationLoading ? 'Sending...' : emailVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                    {showOtpInput && (
                      <div className="otp-input-group">
                        <i className="ri-shield-keyhole-line"></i>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          maxLength="6"
                          required
                        />
                        <button 
                          type="button" 
                          className="verify-otp-btn"
                          onClick={handleOtpVerification}
                          disabled={!otpValue || otpVerificationLoading}
                        >
                          {otpVerificationLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    )}
                    {emailVerificationError && (
                      <div className="verification-error">{emailVerificationError}</div>
                    )}
                  </div>
                  
                  {/* Step 8: Phone Number */}
                  <div className="phone-field field">
                    <i className="ri-smartphone-line"></i>
                    <select 
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      style={{width: '100px', paddingRight: '14px'}}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone (10 digits)"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Step 9: Password Fields */}
                  <div className="field">
                    <i className="ri-shield-keyhole-line"></i>
                    <input
                      type={showPasswords.password ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      title="At least 6 characters, with uppercase, lowercase, and numbers."
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    />
                    <button
                      className="icon"
                      type="button"
                      onClick={() => togglePassword('password')}
                      aria-label={showPasswords.password ? "Hide password" : "Show password"}
                    >
                      <i className={showPasswords.password ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
                    </button>
                  </div>
                  <div className="field">
                    <i className="ri-shield-check-line"></i>
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      placeholder="Re-type password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                    <button
                      className="icon"
                      type="button"
                      onClick={() => togglePassword('confirmPassword')}
                      aria-label={showPasswords.confirmPassword ? "Hide password" : "Show password"}
                    >
                      <i className={showPasswords.confirmPassword ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
                    </button>
                  </div>
                  
                  {/* Step 10: Optional MetaMask Address */}
                  <div className="field">
                    <i className="ri-wallet-3-line"></i>
                    <input
                      type="text"
                      placeholder="0x… MetaMask address (optional)"
                      value={formData.wallet}
                      onChange={(e) => handleInputChange('wallet', e.target.value)}
                      pattern="^0x[a-fA-F0-9]{40}$"
                    />
                  </div>
                </div>
              )}

              {/* Faculty Fields - Same as Student but Staff ID, no Section */}
              {currentRole === 'staff' && (
                <div className="role-staff">
                  {/* Step 1: Basic Information */}
                  <div className="grid-2">
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="First name"
                        value={formData.staffFirstName}
                        onChange={(e) => handleInputChange('staffFirstName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={formData.staffLastName}
                        onChange={(e) => handleInputChange('staffLastName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                  </div>
                  
                  {/* Step 2: Staff ID (provided by college) */}
                  <div className="field">
                    <i className="ri-bank-card-line"></i>
                    <input
                      type="text"
                      placeholder="Staff ID (provided by college)"
                      value={formData.staffId}
                      onChange={(e) => handleInputChange('staffId', e.target.value)}
                      required
                      pattern="[A-Za-z0-9]+"
                    />
                  </div>
                  
                  {/* Step 3: Institution Selection */}
                  <div className="field">
                    <i className="ri-school-line"></i>
                    <select
                      value={formData.institutionId}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      required
                      disabled={loadingInstitutions}
                    >
                      <option value="">
                        {loadingInstitutions ? 'Loading institutions...' : 'Select Institution'}
                      </option>
                      {institutions.map((institution) => (
                        <option key={institution.id} value={institution.id}>
                          {institution.name}
                        </option>
                      ))}
                    </select>
                    {loadingInstitutions && (
                      <div className="field-status loading">
                        <i className="ri-loader-4-line spin"></i> Loading...
                      </div>
                    )}
                  </div>
                  
                  {/* Step 4: Auto-populate College Unique ID */}
                  {selectedInstitution && (
                    <div className="field">
                      <i className="ri-bank-card-line"></i>
                      <input
                        type="text"
                        placeholder="College Unique ID"
                        value={selectedInstitution.unique_id}
                        readOnly
                        className="readonly"
                      />
                      <div className="field-status success">
                        <i className="ri-checkbox-circle-line"></i> Auto-populated
                      </div>
                    </div>
                  )}
                  
                  {/* Step 5: Department Selection (No Section for Faculty) */}
                  <div className="field">
                    <i className="ri-building-4-line"></i>
                    <select 
                      value={formData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      required
                      disabled={!formData.institutionId || loadingDepartments}
                    >
                      <option value="">
                        {loadingDepartments ? 'Loading departments...' : 
                         !formData.institutionId ? 'Select institution first' : 
                         'Choose Department'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Step 6: Email with Verification */}
                  <div className="field email-verification-container">
                    <div className="email-input-group">
                      <i className="ri-at-line"></i>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled={emailVerified}
                      />
                      <button 
                        type="button" 
                        className={`verify-email-btn ${emailVerified ? 'verified' : ''}`}
                        onClick={handleEmailVerification}
                        disabled={!formData.email || emailVerificationLoading || emailVerified}
                      >
                        {emailVerificationLoading ? 'Sending...' : emailVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                    {showOtpInput && (
                      <div className="otp-input-group">
                        <i className="ri-shield-keyhole-line"></i>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          maxLength="6"
                          required
                        />
                        <button 
                          type="button" 
                          className="verify-otp-btn"
                          onClick={handleOtpVerification}
                          disabled={!otpValue || otpVerificationLoading}
                        >
                          {otpVerificationLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    )}
                    {emailVerificationError && (
                      <div className="verification-error">{emailVerificationError}</div>
                    )}
                  </div>
                  
                  {/* Step 7: Phone Number */}
                  <div className="phone-field field">
                    <i className="ri-smartphone-line"></i>
                    <select 
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      style={{width: '100px', paddingRight: '14px'}}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone (10 digits)"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Step 8: Password Fields */}
                  <div className="field">
                    <i className="ri-shield-keyhole-line"></i>
                    <input
                      type={showPasswords.password ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      title="At least 6 characters, with uppercase, lowercase, and numbers."
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    />
                    <i 
                      className={`${showPasswords.password ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('password')}
                    ></i>
                  </div>
                  <div className="field">
                    <i className="ri-shield-check-line"></i>
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      placeholder="Re-type password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                    <i 
                      className={`${showPasswords.confirmPassword ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('confirmPassword')}
                    ></i>
                  </div>
                  
                  {/* Step 9: Optional MetaMask Address */}
                  <div className="field">
                    <i className="ri-wallet-3-line"></i>
                    <input
                      type="text"
                      placeholder="0x… MetaMask address (optional)"
                      value={formData.wallet}
                      onChange={(e) => handleInputChange('wallet', e.target.value)}
                      pattern="^0x[a-fA-F0-9]{40}$"
                    />
                  </div>
                </div>
              )}

              {/* Admin Fields - Same as Faculty but Admin ID, no Section */}
              {currentRole === 'admin' && (
                <div className="role-admin">
                  {/* Step 1: Basic Information */}
                  <div className="grid-2">
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="First name"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                  </div>
                  
                  {/* Step 2: Admin ID (provided by college) */}
                  <div className="field">
                    <i className="ri-bank-card-line"></i>
                    <input
                      type="text"
                      placeholder="Admin ID (provided by college)"
                      value={formData.adminId}
                      onChange={(e) => handleInputChange('adminId', e.target.value)}
                      required
                      pattern="[A-Za-z0-9]+"
                    />
                  </div>
                  
                  {/* Step 3: Institution Selection */}
                  <div className="field">
                    <i className="ri-school-line"></i>
                    <select
                      value={formData.institutionId}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      required
                      disabled={loadingInstitutions}
                    >
                      <option value="">
                        {loadingInstitutions ? 'Loading institutions...' : 'Select Institution'}
                      </option>
                      {institutions.map((institution) => (
                        <option key={institution.id} value={institution.id}>
                          {institution.name}
                        </option>
                      ))}
                    </select>
                    {loadingInstitutions && (
                      <div className="field-status loading">
                        <i className="ri-loader-4-line spin"></i> Loading...
                      </div>
                    )}
                  </div>
                  
                  {/* Step 4: Auto-populate College Unique ID */}
                  {selectedInstitution && (
                    <div className="field">
                      <i className="ri-bank-card-line"></i>
                      <input
                        type="text"
                        placeholder="College Unique ID"
                        value={selectedInstitution.unique_id}
                        readOnly
                        className="readonly"
                      />
                      <div className="field-status success">
                        <i className="ri-checkbox-circle-line"></i> Auto-populated
                      </div>
                    </div>
                  )}
                  
                  {/* Step 5: Department Selection (No Section for Admin) */}
                  <div className="field">
                    <i className="ri-building-4-line"></i>
                    <select 
                      value={formData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      required
                      disabled={!formData.institutionId || loadingDepartments}
                    >
                      <option value="">
                        {loadingDepartments ? 'Loading departments...' : 
                         !formData.institutionId ? 'Select institution first' : 
                         'Choose Department'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Step 6: Email with Verification */}
                  <div className="field email-verification-container">
                    <div className="email-input-group">
                      <i className="ri-at-line"></i>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        disabled={emailVerified}
                      />
                      <button 
                        type="button" 
                        className={`verify-email-btn ${emailVerified ? 'verified' : ''}`}
                        onClick={handleEmailVerification}
                        disabled={!formData.email || emailVerificationLoading || emailVerified}
                      >
                        {emailVerificationLoading ? 'Sending...' : emailVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                    {showOtpInput && (
                      <div className="otp-input-group">
                        <i className="ri-shield-keyhole-line"></i>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          maxLength="6"
                          required
                        />
                        <button 
                          type="button" 
                          className="verify-otp-btn"
                          onClick={handleOtpVerification}
                          disabled={!otpValue || otpVerificationLoading}
                        >
                          {otpVerificationLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    )}
                    {emailVerificationError && (
                      <div className="verification-error">{emailVerificationError}</div>
                    )}
                  </div>
                  
                  {/* Step 7: Phone Number */}
                  <div className="phone-field field">
                    <i className="ri-smartphone-line"></i>
                    <select 
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      style={{width: '100px', paddingRight: '14px'}}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone (10 digits)"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Step 8: Password Fields */}
                  <div className="field">
                    <i className="ri-shield-keyhole-line"></i>
                    <input
                      type={showPasswords.password ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      title="At least 6 characters, with uppercase, lowercase, and numbers."
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    />
                    <i 
                      className={`${showPasswords.password ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('password')}
                    ></i>
                  </div>
                  <div className="field">
                    <i className="ri-shield-check-line"></i>
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      placeholder="Re-type password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                    <i 
                      className={`${showPasswords.confirmPassword ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('confirmPassword')}
                    ></i>
                  </div>
                  
                  {/* Step 9: Optional MetaMask Address */}
                  <div className="field">
                    <i className="ri-wallet-3-line"></i>
                    <input
                      type="text"
                      placeholder="0x… MetaMask address (optional)"
                      value={formData.wallet}
                      onChange={(e) => handleInputChange('wallet', e.target.value)}
                      pattern="^0x[a-fA-F0-9]{40}$"
                    />
                  </div>
                </div>
              )}


              <button className="btn primary" type="button" onClick={handleShowPreview} disabled={loading}>
                <i className="ri-eye-line"></i> Preview & Submit
              </button>
              
              <div className="foot">
                Already have an account? <Link to="/login" style={{color:'var(--b-700)'}}>Sign In</Link>
              </div>
            </form>
          )}

          {/* User Registration Preview */}
          {!isInstitutionFlow && showUserPreview && (
            <div id="userPreviewSection" style={{display: 'grid', gap: '20px'}}>
              <h3 style={{color: 'var(--b-600)', marginBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <i className="ri-eye-line"></i> Preview Your Details
              </h3>
              <p className="sub" style={{marginBottom: '20px', textAlign: 'center'}}>
                Review all your information before submitting
              </p>
              
              <div style={{backgroundColor: 'var(--b-50)', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left', border: '1px solid var(--b-200)'}}>
                {/* Personal Information */}
                <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="ri-user-line"></i> Personal Information
                </h4>
                <div style={{display: 'grid', gap: '10px', marginLeft: '24px', marginBottom: '20px'}}>
                  <p style={{margin: 0}}>
                    <strong>Full Name:</strong> {
                      currentRole === 'student' ? `${formData.studentFirstName} ${formData.studentLastName}` :
                      currentRole === 'staff' ? `${formData.staffFirstName} ${formData.staffLastName}` :
                      `${formData.adminFirstName} ${formData.adminLastName}`
                    }
                  </p>
                  <p style={{margin: 0}}>
                    <strong>{currentRole === 'student' ? 'Student' : currentRole === 'staff' ? 'Staff' : 'Admin'} ID:</strong> {
                      currentRole === 'student' ? formData.studentId :
                      currentRole === 'staff' ? formData.staffId :
                      formData.adminId
                    }
                  </p>
                  <p style={{margin: 0}}>
                    <strong>Role:</strong> {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                  </p>
                </div>

                <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--b-200)'}} />

                {/* Institution & Academic Info */}
                <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="ri-building-2-line"></i> Institution & Academic Info
                </h4>
                <div style={{display: 'grid', gap: '10px', marginLeft: '24px', marginBottom: '20px'}}>
                  <p style={{margin: 0}}><strong>Institution:</strong> {selectedInstitution?.name || 'Not Selected'}</p>
                  <p style={{margin: 0}}><strong>Institution ID:</strong> {selectedInstitution?.unique_id || 'N/A'}</p>
                  <p style={{margin: 0}}><strong>Department:</strong> {getDepartmentName()}</p>
                  {currentRole === 'student' && (
                    <p style={{margin: 0}}><strong>Section:</strong> {getSectionName()}</p>
                  )}
                </div>

                <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--b-200)'}} />

                {/* Contact Information */}
                <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="ri-contacts-line"></i> Contact Information
                </h4>
                <div style={{display: 'grid', gap: '10px', marginLeft: '24px', marginBottom: '20px'}}>
                  <p style={{margin: 0}}>
                    <strong>Email:</strong> {formData.email} {emailVerified && <span style={{color: 'var(--success-color)', fontSize: '12px'}}>✓ Verified</span>}
                  </p>
                  <p style={{margin: 0}}><strong>Phone:</strong> {formData.countryCode} {formData.phone}</p>
                </div>

                <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--b-200)'}} />

                {/* Security Information */}
                <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="ri-shield-keyhole-line"></i> Security
                </h4>
                <div style={{display: 'grid', gap: '10px', marginLeft: '24px'}}>
                  <p style={{margin: 0}}><strong>Password:</strong> {'•'.repeat(formData.password?.length || 8)}</p>
                  {formData.wallet && (
                    <p style={{margin: 0}}><strong>Wallet Address:</strong> {formData.wallet.slice(0, 6)}...{formData.wallet.slice(-4)}</p>
                  )}
                </div>
              </div>

              <div className="grid-2" style={{gap: '16px'}}>
                <button 
                  type="button" 
                  className="btn secondary"
                  onClick={handleBackFromPreview}
                  style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
                >
                  <i className="ri-arrow-left-line"></i> Edit Details
                </button>
                <button 
                  type="button" 
                  className="btn primary" 
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div> Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="ri-user-add-line"></i> Submit Registration
                    </>
                  )}
                </button>
              </div>
              
              <div className="foot">
                Already have an account? <Link to="/login" style={{color:'var(--b-700)'}}>Sign In</Link>
              </div>
            </div>
          )}
          
          {/* Institution Registration Form - Dual Structure */}
          {isInstitutionFlow && (
            <div id="institutionForm" style={{display: 'grid', gap: '20px'}}>
              {institutionStep === 1 && (
                <div id="institutionDetailsStep">
                  <h3 style={{color: 'var(--b-600)', marginBottom: '20px', textAlign: 'center'}}>
                    Institution Details
                  </h3>
                  
                  {/* Institution Name */}
                  <div className="field">
                    <i className="ri-government-line"></i>
                    <input
                      type="text"
                      placeholder="Institution Name"
                      value={formData.institutionName}
                      onChange={(e) => handleInputChange('institutionName', e.target.value)}
                      required
                      pattern="[A-Za-z\s]+"
                    />
                  </div>
                  
                  {/* Institution Type */}
                  <div className="field">
                    <i className="ri-building-4-line"></i>
                    <select
                      value={formData.institutionType}
                      onChange={(e) => handleInputChange('institutionType', e.target.value)}
                      required
                    >
                      <option value="">Select Institution Type</option>
                      <option value="university">University</option>
                      <option value="college">College</option>
                      <option value="school">School</option>
                      <option value="coaching">Coaching Institute</option>
                      <option value="research">Research Institute</option>
                      <option value="vocational">Vocational Training Center</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {/* Create Unique ID */}
                  <div className="field">
                    <i className="ri-bank-card-line"></i>
                    <input
                      type="text"
                      placeholder="Create Unique Institution ID (e.g., MU2024, IIT001)"
                      value={formData.institutionUniqueId}
                      onChange={(e) => handleInputChange('institutionUniqueId', e.target.value)}
                      required
                      pattern="[A-Za-z0-9]+"
                    />
                  </div>
                  
                  {/* Institution Address */}
                  <div className="field ta">
                    <i className="ri-map-pin-line"></i>
                    <textarea
                      placeholder="Institution Address"
                      value={formData.institutionAddress}
                      onChange={(e) => handleInputChange('institutionAddress', e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  {/* Institution Email with Verification */}
                  <div className="field email-verification-container">
                    <div className="email-input-group">
                      <i className="ri-at-line"></i>
                      <input
                        type="email"
                        placeholder="Official Institution Email"
                        value={formData.institutionEmail}
                        onChange={(e) => handleInputChange('institutionEmail', e.target.value)}
                        required
                        disabled={emailVerified}
                      />
                      <button 
                        type="button" 
                        className={`verify-email-btn ${emailVerified ? 'verified' : ''}`}
                        onClick={handleInstitutionEmailVerification}
                        disabled={!formData.institutionEmail || emailVerificationLoading || emailVerified}
                      >
                        {emailVerificationLoading ? 'Sending...' : emailVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                    {showOtpInput && (
                      <div className="otp-input-group">
                        <i className="ri-shield-keyhole-line"></i>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          maxLength="6"
                          required
                        />
                        <button 
                          type="button" 
                          className="verify-otp-btn"
                          onClick={handleOtpVerification}
                          disabled={!otpValue || otpVerificationLoading}
                        >
                          {otpVerificationLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    )}
                    {emailVerificationError && (
                      <div className="verification-error">{emailVerificationError}</div>
                    )}
                  </div>
                  
                  {/* Institution Phone */}
                  <div className="phone-field field">
                    <i className="ri-smartphone-line"></i>
                    <select 
                      value={formData.institutionCountryCode}
                      onChange={(e) => handleInputChange('institutionCountryCode', e.target.value)}
                      style={{width: '100px', paddingRight: '14px'}}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Institution Phone"
                      value={formData.institutionPhone}
                      onChange={(e) => handleInputChange('institutionPhone', e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Institution Website */}
                  <div className="field">
                    <i className="ri-global-line"></i>
                    <input
                      type="url"
                      placeholder="Institution Website (optional)"
                      value={formData.institutionWebsite}
                      onChange={(e) => handleInputChange('institutionWebsite', e.target.value)}
                    />
                  </div>
                  
                  <button 
                    className="btn primary" 
                    type="button" 
                    onClick={() => setInstitutionStep(2)}
                    disabled={!emailVerified}
                  >
                    <i className="ri-arrow-right-line"></i> Next: Admin Details
                  </button>
                </div>
              )}

              {institutionStep === 2 && (
                <div id="adminDetailsStep">
                  <h3 style={{color: 'var(--b-600)', marginBottom: '20px', textAlign: 'center'}}>
                    Admin Account Details
                  </h3>
                  <p className="sub" style={{marginBottom: '20px', textAlign: 'center'}}>
                    Create the primary admin account for this institution
                  </p>
                  
                  {/* Admin First and Last Name */}
                  <div className="grid-2">
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.institutionAdminFirstName}
                        onChange={(e) => handleInputChange('institutionAdminFirstName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                    <div className="field">
                      <i className="ri-user-line"></i>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.institutionAdminLastName}
                        onChange={(e) => handleInputChange('institutionAdminLastName', e.target.value)}
                        required
                        pattern="[A-Za-z\s]+"
                      />
                    </div>
                  </div>
                  
                  {/* Admin ID */}
                  <div className="field">
                    <i className="ri-bank-card-line"></i>
                    <input
                      type="text"
                      placeholder="Admin ID (provided by institution)"
                      value={formData.institutionAdminId}
                      onChange={(e) => handleInputChange('institutionAdminId', e.target.value)}
                      required
                      pattern="[A-Za-z0-9]+"
                    />
                  </div>
                  
                  {/* Note: No Institution selection since this admin is creating the institution */}
                  
                  {/* Admin Email with Verification */}
                  <div className="field email-verification-container">
                    <div className="email-input-group">
                      <i className="ri-at-line"></i>
                      <input
                        type="email"
                        placeholder="Admin Email Address"
                        value={formData.institutionAdminEmail}
                        onChange={(e) => handleInputChange('institutionAdminEmail', e.target.value)}
                        required
                        disabled={adminEmailVerified}
                      />
                      {!adminEmailVerified && !showAdminOtpInput && (
                        <button 
                          type="button" 
                          className="verify-email-btn"
                          onClick={handleAdminEmailVerification}
                          disabled={adminEmailVerificationLoading}
                        >
                          {adminEmailVerificationLoading ? 'Sending...' : 'Verify'}
                        </button>
                      )}
                      {adminEmailVerified && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                    </div>
                    {/* Admin OTP Input */}
                    {showAdminOtpInput && !adminEmailVerified && (
                      <div className="otp-verification-section">
                        <div className="otp-input-group">
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={adminOtpValue}
                            onChange={(e) => setAdminOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                          />
                          <button 
                            type="button" 
                            className="verify-otp-btn"
                            onClick={handleAdminOtpVerification}
                            disabled={adminEmailVerificationLoading || adminOtpValue.length !== 6}
                          >
                            {adminEmailVerificationLoading ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Admin Phone */}
                  <div className="phone-field field">
                    <i className="ri-smartphone-line"></i>
                    <select 
                      value={formData.institutionAdminCountryCode}
                      onChange={(e) => handleInputChange('institutionAdminCountryCode', e.target.value)}
                      style={{width: '100px', paddingRight: '14px'}}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Admin Phone (10 digits)"
                      value={formData.institutionAdminPhone}
                      onChange={(e) => handleInputChange('institutionAdminPhone', e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Admin Password Fields */}
                  <div className="field">
                    <i className="ri-shield-keyhole-line"></i>
                    <input
                      type={showPasswords.institutionAdminPassword ? "text" : "password"}
                      placeholder="Admin Password"
                      value={formData.institutionAdminPassword}
                      onChange={(e) => handleInputChange('institutionAdminPassword', e.target.value)}
                      required
                      title="At least 6 characters, with uppercase, lowercase, and numbers."
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    />
                    <i 
                      className={`${showPasswords.institutionAdminPassword ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('institutionAdminPassword')}
                    ></i>
                  </div>
                  <div className="field">
                    <i className="ri-shield-check-line"></i>
                    <input
                      type={showPasswords.institutionAdminConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Admin Password"
                      value={formData.institutionAdminConfirmPassword}
                      onChange={(e) => handleInputChange('institutionAdminConfirmPassword', e.target.value)}
                      required
                    />
                    <i 
                      className={`${showPasswords.institutionAdminConfirmPassword ? 'ri-eye-line' : 'ri-eye-off-line'} toggle-password`}
                      onClick={() => togglePassword('institutionAdminConfirmPassword')}
                    ></i>
                  </div>
                  
                  {/* Form Navigation */}
                  <div className="grid-2" style={{marginTop: '20px'}}>
                    <button 
                      type="button" 
                      className="btn secondary"
                      onClick={() => setInstitutionStep(1)}
                    >
                      <i className="ri-arrow-left-line"></i> Back
                    </button>
                    <button 
                      type="button" 
                      className="btn primary"
                      onClick={() => setInstitutionStep(3)}
                    >
                      Next <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
              )}

              {institutionStep === 3 && (
                <div id="institutionFinalStep" style={{textAlign: 'center'}}>
                  <h3 style={{color: 'var(--b-600)', marginBottom: '20px'}}>
                    <i className="ri-eye-line" style={{marginRight: '8px'}}></i>
                    Preview & Confirm
                  </h3>
                  <p className="sub" style={{marginBottom: '30px'}}>
                    Review all your information before submitting
                  </p>
                  
                  <div style={{backgroundColor: 'var(--b-50)', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left', border: '1px solid var(--b-200)'}}>
                    <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <i className="ri-building-2-line"></i> Institution Details
                    </h4>
                    <div style={{display: 'grid', gap: '10px', marginLeft: '24px'}}>
                      <p style={{margin: 0}}><strong>Name:</strong> {formData.institutionName}</p>
                      <p style={{margin: 0}}><strong>Type:</strong> {formData.institutionType?.charAt(0).toUpperCase() + formData.institutionType?.slice(1)}</p>
                      <p style={{margin: 0}}><strong>Unique ID:</strong> {formData.institutionUniqueId}</p>
                      <p style={{margin: 0}}><strong>Address:</strong> {formData.institutionAddress}</p>
                      <p style={{margin: 0}}><strong>Email:</strong> {formData.institutionEmail} <span style={{color: 'var(--success-color)', fontSize: '12px'}}>✓ Verified</span></p>
                      <p style={{margin: 0}}><strong>Phone:</strong> {formData.institutionCountryCode} {formData.institutionPhone}</p>
                      {formData.institutionWebsite && (
                        <p style={{margin: 0}}><strong>Website:</strong> {formData.institutionWebsite}</p>
                      )}
                    </div>
                    
                    <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--b-200)'}} />
                    
                    <h4 style={{color: 'var(--b-700)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <i className="ri-admin-line"></i> Admin Account Details
                    </h4>
                    <div style={{display: 'grid', gap: '10px', marginLeft: '24px'}}>
                      <p style={{margin: 0}}><strong>Full Name:</strong> {formData.institutionAdminFirstName} {formData.institutionAdminLastName}</p>
                      <p style={{margin: 0}}><strong>Admin ID:</strong> {formData.institutionAdminId}</p>
                      <p style={{margin: 0}}><strong>Email:</strong> {formData.institutionAdminEmail} {adminEmailVerified && <span style={{color: 'var(--success-color)', fontSize: '12px'}}>✓ Verified</span>}</p>
                      <p style={{margin: 0}}><strong>Phone:</strong> {formData.institutionAdminCountryCode} {formData.institutionAdminPhone}</p>
                      <p style={{margin: 0}}><strong>Password:</strong> {'•'.repeat(formData.institutionAdminPassword?.length || 8)}</p>
                    </div>
                  </div>
                  
                  <div className="grid-2">
                    <button 
                      type="button" 
                      className="btn secondary"
                      onClick={() => setInstitutionStep(2)}
                    >
                      <i className="ri-arrow-left-line"></i> Edit Details
                    </button>
                    <button 
                      type="button" 
                      className="btn primary" 
                      onClick={handleCreateInstitutionAndAdmin}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <i className="ri-loader-4-line ri-spin"></i> Creating...
                        </>
                      ) : (
                        <>
                          <i className="ri-building-line"></i> Submit Registration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="foot">
                Already have an account? <Link to="/login" style={{color:'var(--b-700)'}}>Sign In</Link>
              </div>
            </div>
          )}
          
          </div> {/* Close form-scroll-container */}
        </section>

        <section className="right" aria-hidden="true">
          {/* Floating elements */}
          <div className="bubble"><i className="ri-check-line"></i> Verified</div>
          <div className="lock"><i className="ri-lock-2-fill"></i></div>
          <div className="cloud c1"></div>
          <div className="cloud c2"></div>
          <div className="cloud c3"></div>
          <div className="cloud c4"></div>

          {/* Stylized phone with fingerprint (inline SVG) */}
          <svg className="phone" viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Secure phone">
            <defs>
              <linearGradient id="screenGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#c7ffe9"/>
                <stop offset="50%" stopColor="#8ae2be"/>
                <stop offset="100%" stopColor="#19a571"/>
              </linearGradient>
              <linearGradient id="bodyGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0b2330"/>
                <stop offset="100%" stopColor="#12343b"/>
              </linearGradient>
              <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feOffset dx="0" dy="-6"/>
                <feGaussianBlur stdDeviation="10" result="b"/>
                <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/>
                <feBlend in2="SourceGraphic"/>
              </filter>
            </defs>

            {/* Phone body */}
            <g transform="translate(30,20)">
              <rect rx="36" ry="36" width="360" height="520" fill="url(#bodyGrad)"/>
              <rect x="14" y="16" rx="28" ry="28" width="332" height="488" fill="url(#screenGrad)" filter="url(#innerShadow)"/>
              {/* Camera punch */}
              <rect x="160" y="6" width="40" height="10" rx="5" fill="#0b1a1f" opacity="0.85"/>

              {/* Fingerprint rings */}
              <g transform="translate(180,260)" fill="none" stroke="#0f4031" strokeWidth="4" opacity="0.55">
                <circle r="18"/>
                <circle r="34" opacity="0.45"/>
                <circle r="50" opacity="0.35"/>
              </g>
              {/* Progress bar */}
              <rect x="90" y="360" width="180" height="10" rx="5" fill="#0f4031" opacity=".35"/>
              <rect x="90" y="360" width="108" height="10" rx="5" fill="#0f4031"/>
              {/* Small gear icon */}
              <g transform="translate(298,66)" fill="none" stroke="#0f4031" strokeWidth="4">
                <circle cx="0" cy="0" r="10"/>
                <path d="M0 -15V-22M0 15V22M-15 0H-22M15 0H22M-11 -11L-16 -16M11 11L16 16M-11 11L-16 16M11 -11L16 -16"/>
              </g>
            </g>
          </svg>
        </section>
      </div>
    </div>
  );
}

export default Register;
