import React, { useState, useEffect, useCallback } from 'react';
import './DocumentGenerator.css';
import TransactionLoader from '../../components/shared/TransactionLoader';
import pinataService from '../../services/pinataService';
import { connectWallet, uploadDocumentToBlockchain, isWalletConnected, getCurrentWalletAddress, requestApprovalOnBlockchain } from '../../utils/metamask';
import html2pdf from 'html2pdf.js';

const API_URL = 'http://localhost:5000';

export default function DocumentGenerator() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
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
  
  // Transaction loader state for blockchain animation
  const [showTransactionLoader, setShowTransactionLoader] = useState(false);
  const [transactionProgress, setTransactionProgress] = useState(0);
  const [transactionStep, setTransactionStep] = useState(0);
  const [transactionMessage, setTransactionMessage] = useState('');
  
  // Data from API
  const [templates, setTemplates] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [analytics, setAnalytics] = useState({ generated: 0, sentForApproval: 0, signedCompleted: 0, savedToFiles: 0 });
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
  const [approvalFlow, setApprovalFlow] = useState('sequential'); // sequential or parallel
  const [sharePermissions, setSharePermissions] = useState({}); // { recipientId: 'read' | 'write' }
  
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
        setAnalytics(data.data || { generated: 0, sentForApproval: 0, signedCompleted: 0, savedToFiles: 0 });
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

  // Filter templates based on search only (role filtering is done by backend)
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
    
    // Pre-fill form with user data automatically
    const initialData = {};
    if (userInfo && template.fields) {
      template.fields.forEach(field => {
        const fieldName = field.name.toLowerCase();
        const fieldLabel = (field.label || '').toLowerCase();
        
        // Auto-fill name fields
        if ((fieldName.includes('name') || fieldLabel.includes('name')) && 
            !fieldName.includes('guardian') && !fieldName.includes('institution') && 
            !fieldName.includes('father') && !fieldName.includes('mother')) {
          initialData[field.name] = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
        } 
        // Auto-fill email
        else if (fieldName.includes('email') || fieldLabel.includes('email')) {
          initialData[field.name] = userInfo.email || '';
        } 
        // Auto-fill department/class
        else if (fieldName.includes('department') || fieldName.includes('class') || 
                 fieldLabel.includes('department') || fieldLabel.includes('class')) {
          initialData[field.name] = userInfo.department || '';
        } 
        // Auto-fill ID fields (student ID, staff ID, roll number, etc.)
        else if (fieldName.includes('studentid') || fieldName.includes('staffid') || 
                 fieldName.includes('rollnumber') || fieldName.includes('roll') ||
                 fieldName.includes('enrollmentno') || fieldName.includes('uniqueid') ||
                 fieldLabel.includes('id') || fieldLabel.includes('roll') ||
                 fieldLabel.includes('enrollment')) {
          initialData[field.name] = userInfo.uniqueId || userInfo.rollNumber || '';
        } 
        // Auto-fill phone/contact
        else if (fieldName.includes('phone') || fieldName.includes('contact') || 
                 fieldName.includes('mobile') || fieldLabel.includes('phone') || 
                 fieldLabel.includes('contact') || fieldLabel.includes('mobile')) {
          initialData[field.name] = userInfo.phone || '';
        }
        // Auto-fill course/program
        else if (fieldName.includes('course') || fieldName.includes('program') ||
                 fieldLabel.includes('course') || fieldLabel.includes('program')) {
          initialData[field.name] = userInfo.course || userInfo.program || '';
        }
        // Auto-fill semester/year
        else if (fieldName.includes('semester') || fieldName.includes('currentyear') ||
                 fieldLabel.includes('semester') || fieldLabel.includes('current year')) {
          initialData[field.name] = userInfo.semester || userInfo.year || '';
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

  // Generate preview content with professional detailed templates
  const generatePreviewContent = () => {
    if (!selectedTemplate) return '';
    
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    const refNumber = `REF/${new Date().toISOString().slice(0,10).replace(/-/g,'')}/${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const instName = institutionInfo?.name || 'Institution Name';
    const instAddress = institutionInfo?.address || 'Institution Address';
    const instPhone = institutionInfo?.phone || '';
    const instEmail = institutionInfo?.email || '';
    const instWebsite = institutionInfo?.website || '';
    const instInitial = instName.charAt(0).toUpperCase();
    
    const userName = userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : 'Applicant Name';
    const userEmail = userInfo?.email || '';
    const userRole = userInfo?.role || 'student';
    
    const templateName = selectedTemplate.name.toLowerCase();
    
    // Common styles
    const styles = `
      <style>
        .doc-container {
          font-family: 'Georgia', 'Times New Roman', serif;
          max-width: 100%;
          padding: 40px;
          background: white;
          color: #1a1a1a;
          line-height: 1.8;
        }
        .doc-header {
          text-align: center;
          border-bottom: 3px double #1e3a5f;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .logo-circle {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #1e3a5f, #3b82f6);
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
        }
        .inst-name {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a5f;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .inst-address {
          font-size: 13px;
          color: #64748b;
          margin: 5px 0;
        }
        .inst-contact {
          font-size: 11px;
          color: #64748b;
          margin: 8px 0 0;
        }
        .doc-title {
          text-align: center;
          margin: 25px 0;
        }
        .doc-title h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e3a5f;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
          text-decoration: underline;
          text-underline-offset: 6px;
        }
        .ref-bar {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          background: #f8fafc;
          border-left: 3px solid #1e3a5f;
          margin: 20px 0;
          font-size: 12px;
        }
        .ref-bar span { color: #64748b; }
        .ref-bar strong { color: #1e3a5f; }
        .address-block {
          margin: 20px 0;
          line-height: 1.6;
        }
        .address-block p { margin: 3px 0; }
        .subject-line {
          margin: 20px 0;
          font-weight: 600;
        }
        .doc-body {
          margin: 20px 0;
          text-align: justify;
        }
        .doc-body p {
          margin: 12px 0;
          text-indent: 30px;
        }
        .doc-body p:first-child,
        .doc-body p.no-indent { text-indent: 0; }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .details-table td {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          vertical-align: top;
        }
        .details-table td:first-child {
          width: 35%;
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          text-align: center;
          min-width: 180px;
        }
        .signature-line {
          border-top: 1px solid #1e3a5f;
          margin-top: 50px;
          padding-top: 8px;
        }
        .signature-block p { margin: 3px 0; font-size: 12px; }
        .signature-block .name { font-weight: 600; color: #1e3a5f; }
        .doc-footer {
          margin-top: 40px;
          padding: 15px;
          background: linear-gradient(135deg, #1e3a5f, #2d5a87);
          border-radius: 6px;
          text-align: center;
          color: white;
        }
        .doc-footer p { margin: 3px 0; font-size: 10px; }
        .doc-footer .brand { font-weight: 600; font-size: 11px; }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(30, 58, 95, 0.04);
          font-weight: bold;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
        .seal-placeholder {
          width: 80px;
          height: 80px;
          border: 2px solid #1e3a5f;
          border-radius: 50%;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #1e3a5f;
          text-align: center;
        }
        .highlight-box {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 12px 15px;
          margin: 15px 0;
          font-size: 12px;
        }
        .success-badge {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
      </style>
    `;
    
    // Common header
    const header = `
      <div class="doc-header">
        <div class="logo-circle">${instInitial}</div>
        <h1 class="inst-name">${instName}</h1>
        <p class="inst-address">${instAddress}</p>
        <p class="inst-contact">
          ${instPhone ? `📞 ${instPhone}` : ''} 
          ${instPhone && instEmail ? ' | ' : ''}
          ${instEmail ? `📧 ${instEmail}` : ''}
          ${(instPhone || instEmail) && instWebsite ? ' | ' : ''}
          ${instWebsite ? `🌐 ${instWebsite}` : ''}
        </p>
      </div>
    `;
    
    // Common footer
    const footer = `
      <div class="doc-footer">
        <p class="brand">📋 DocuChain - Blockchain Verified Document System</p>
        <p>This document is digitally generated and secured with blockchain verification</p>
        <p>Reference: ${refNumber} | Verify at: verify.docuchain.io</p>
      </div>
    `;
    
    // Determine document type and generate appropriate content
    if (templateName.includes('leave')) {
      return generateLeaveApplication();
    } else if (templateName.includes('bonafide') || templateName.includes('bona fide')) {
      return generateBonafideCertificate();
    } else if (templateName.includes('noc') || templateName.includes('no objection')) {
      return generateNOC();
    } else if (templateName.includes('recommendation') || templateName.includes('lor')) {
      return generateRecommendationLetter();
    } else if (templateName.includes('transcript') || templateName.includes('grade')) {
      return generateTranscriptRequest();
    } else if (templateName.includes('fee') || templateName.includes('payment')) {
      return generateFeeDocument();
    } else if (templateName.includes('identity') || templateName.includes('id card')) {
      return generateIdentityCertificate();
    } else if (templateName.includes('event') || templateName.includes('permission')) {
      return generateEventPermission();
    } else if (templateName.includes('certificate')) {
      return generateCertificate();
    } else {
      return generateGenericDocument();
    }
    
    // ========== TEMPLATE GENERATORS ==========
    
    function generateLeaveApplication() {
      const reason = formData.reason || formData.leaveReason || formData.Reason || 'personal reasons';
      const fromDate = formData.fromDate || formData.from_date || formData.startDate || formData['From Date'] || today;
      const toDate = formData.toDate || formData.to_date || formData.endDate || formData['To Date'] || today;
      const leaveType = formData.leaveType || formData.type || formData['Leave Type'] || 'Leave';
      const details = formData.details || formData.additionalDetails || formData.remarks || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">LEAVE</div>
          ${header}
          
          <div class="ref-bar">
            <span>Reference No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="address-block">
            <p><strong>To,</strong></p>
            <p>The Head of Department / Principal / Dean</p>
            <p>${instName}</p>
            <p>${instAddress}</p>
          </div>
          
          <div class="subject-line">
            <strong>Subject:</strong> Application for ${leaveType}
          </div>
          
          <div class="doc-body">
            <p class="no-indent">Respected Sir/Madam,</p>
            
            <p>With due respect and humble submission, I, <strong>${userName}</strong>, would like to bring to your kind attention that I need to apply for leave from my regular duties for the period mentioned below.</p>
            
            <table class="details-table">
              <tr>
                <td>Applicant Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email Address</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Leave Type</td>
                <td>${leaveType}</td>
              </tr>
              <tr>
                <td>From Date</td>
                <td>${fromDate}</td>
              </tr>
              <tr>
                <td>To Date</td>
                <td>${toDate}</td>
              </tr>
              <tr>
                <td>Reason for Leave</td>
                <td>${reason}</td>
              </tr>
              ${details ? `<tr><td>Additional Details</td><td>${details}</td></tr>` : ''}
            </table>
            
            <p>I hereby assure you that I will complete all my pending work and responsibilities before proceeding on leave and will also ensure a smooth handover of duties if required. I shall remain available on phone for any urgent matters.</p>
            
            <p>I request you to kindly consider my application and grant me leave for the above-mentioned period. I shall be highly obliged for your kind consideration.</p>
            
            <p class="no-indent">Thanking you in anticipation.</p>
            
            <p class="no-indent">Yours faithfully,</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">${userName}</p>
                <p>Applicant</p>
                <p>Date: ${today}</p>
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">_____________________</p>
                <p>Sanctioning Authority</p>
                <p>(Signature & Stamp)</p>
              </div>
            </div>
          </div>
          
          <div class="highlight-box">
            <strong>For Office Use Only:</strong><br/>
            Leave Approved / Not Approved: _____________ | No. of Days: _____________ | Remarks: _____________
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateBonafideCertificate() {
      const purpose = formData.purpose || formData.certificatePurpose || formData.Purpose || 'official purposes';
      const course = formData.course || formData.program || formData.Course || 'the enrolled program';
      const year = formData.year || formData.academicYear || formData.Year || 'Current Academic Year';
      const department = formData.department || formData.Department || 'General';
      const enrollmentNo = formData.enrollmentNo || formData.rollNo || formData.studentId || 'N/A';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">BONAFIDE</div>
          ${header}
          
          <div class="doc-title">
            <h2>BONAFIDE CERTIFICATE</h2>
          </div>
          
          <div class="ref-bar">
            <span>Certificate No: <strong>${refNumber}</strong></span>
            <span>Date of Issue: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <p class="no-indent" style="font-size: 15px; text-align: center; margin: 30px 0; line-height: 2;">
              This is to certify that <strong style="color: #1e3a5f; font-size: 17px; border-bottom: 2px solid #1e3a5f;">${userName}</strong><br/>
              is a bonafide student of this institution.
            </p>
            
            <table class="details-table">
              <tr>
                <td>Full Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email ID</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Enrollment / Roll No.</td>
                <td>${enrollmentNo}</td>
              </tr>
              <tr>
                <td>Course / Program</td>
                <td>${course}</td>
              </tr>
              <tr>
                <td>Department</td>
                <td>${department}</td>
              </tr>
              <tr>
                <td>Academic Year</td>
                <td>${year}</td>
              </tr>
              <tr>
                <td>Current Status</td>
                <td><span class="success-badge">✓ Currently Enrolled & Active</span></td>
              </tr>
            </table>
            
            <p class="no-indent">This certificate is issued upon the request of the above-named student for the purpose of <strong>${purpose}</strong>.</p>
            
            <p class="no-indent">The student has maintained satisfactory academic progress and good conduct during their tenure at this institution. Their character and behavior have been found to be good.</p>
            
            <p class="no-indent">This certificate is issued without any liability on the part of the institution.</p>
          </div>
          
          <div class="signature-section" style="margin-top: 60px;">
            <div>
              <p style="margin: 0;">Place: ${instAddress.split(',')[0] || 'City'}</p>
              <p style="margin: 5px 0;">Date: ${today}</p>
            </div>
            <div class="signature-block">
              <div class="seal-placeholder">OFFICIAL<br/>SEAL</div>
              <div class="signature-line" style="margin-top: 10px;">
                <p class="name">Principal / Registrar</p>
                <p>${instName}</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateNOC() {
      const purpose = formData.purpose || formData.nocPurpose || 'the stated purpose';
      const eventName = formData.eventName || formData.activity || formData.event || '';
      const eventDate = formData.eventDate || formData.date || '';
      const venue = formData.venue || formData.location || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">N.O.C.</div>
          ${header}
          
          <div class="doc-title">
            <h2>NO OBJECTION CERTIFICATE</h2>
          </div>
          
          <div class="ref-bar">
            <span>NOC No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="address-block">
            <p><strong>TO WHOM IT MAY CONCERN</strong></p>
          </div>
          
          <div class="doc-body">
            <p class="no-indent">This is to certify that <strong>${userName}</strong> (${userEmail}) is associated with <strong>${instName}</strong>.</p>
            
            <p>We have <strong style="color: #059669; font-size: 16px;">NO OBJECTION</strong> to their participation / involvement in the following activity:</p>
            
            <table class="details-table">
              <tr>
                <td>Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Purpose of NOC</td>
                <td>${purpose}</td>
              </tr>
              ${eventName ? `<tr><td>Event / Activity</td><td>${eventName}</td></tr>` : ''}
              ${eventDate ? `<tr><td>Date</td><td>${eventDate}</td></tr>` : ''}
              ${venue ? `<tr><td>Venue / Location</td><td>${venue}</td></tr>` : ''}
            </table>
            
            <p class="no-indent">This No Objection Certificate is issued based on the request of the applicant and is valid only for the specific purpose mentioned above.</p>
            
            <div class="highlight-box">
              <strong>⚠️ Disclaimer:</strong> This certificate does not exempt the holder from any statutory requirements, legal obligations, or institutional regulations. The institution shall not be held responsible for any consequences arising from the activities undertaken by the applicant.
            </div>
          </div>
          
          <div class="signature-section">
            <div>
              <p style="margin: 0;">Date: ${today}</p>
              <p style="margin: 5px 0;">Place: ${instAddress.split(',')[0] || ''}</p>
            </div>
            <div class="signature-block">
              <div class="seal-placeholder">OFFICIAL<br/>SEAL</div>
              <div class="signature-line" style="margin-top: 10px;">
                <p class="name">Authorized Signatory</p>
                <p>${instName}</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateRecommendationLetter() {
      const purpose = formData.purpose || formData.lorPurpose || 'higher studies / employment';
      const relationship = formData.relationship || 'student';
      const duration = formData.duration || formData.knowingSince || '';
      const qualities = formData.qualities || formData.strengths || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">LOR</div>
          ${header}
          
          <div class="doc-title">
            <h2>LETTER OF RECOMMENDATION</h2>
          </div>
          
          <div class="ref-bar">
            <span>Reference: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="address-block">
            <p><strong>TO WHOM IT MAY CONCERN</strong></p>
          </div>
          
          <div class="doc-body">
            <p class="no-indent">Dear Sir/Madam,</p>
            
            <p>It gives me great pleasure to recommend <strong>${userName}</strong> who has been associated with <strong>${instName}</strong> as a ${relationship}.</p>
            
            <table class="details-table">
              <tr>
                <td>Candidate Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Purpose of Recommendation</td>
                <td>${purpose}</td>
              </tr>
              ${duration ? `<tr><td>Duration of Association</td><td>${duration}</td></tr>` : ''}
            </table>
            
            ${qualities ? `<p>During this period, I have observed that ${userName.split(' ')[0]} possesses several notable qualities including: <strong>${qualities}</strong>. These attributes have consistently demonstrated their dedication and capability.</p>` : ''}
            
            <p>${userName.split(' ')[0]} has shown exceptional commitment to their work/studies and has consistently performed above expectations. They possess excellent analytical skills, strong work ethic, and the ability to work both independently and as part of a team.</p>
            
            <p>Based on my experience and observations, I strongly and unreservedly recommend ${userName.split(' ')[0]} for ${purpose}. I am confident that they will prove to be a valuable asset to any organization or institution they choose to join.</p>
            
            <p class="no-indent">Should you require any additional information, please do not hesitate to contact me.</p>
            
            <p class="no-indent">With best regards,</p>
          </div>
          
          <div class="signature-section">
            <div></div>
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">_____________________</p>
                <p>Recommending Authority</p>
                <p>${instName}</p>
                <p style="font-size: 10px; color: #64748b;">Date: ${today}</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateTranscriptRequest() {
      const purpose = formData.purpose || 'official purposes';
      const copies = formData.copies || formData.numberOfCopies || '1';
      const semester = formData.semester || formData.term || 'All Semesters';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">TRANSCRIPT</div>
          ${header}
          
          <div class="doc-title">
            <h2>ACADEMIC TRANSCRIPT REQUEST</h2>
          </div>
          
          <div class="ref-bar">
            <span>Request No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <table class="details-table">
              <tr>
                <td>Student Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Semester / Term</td>
                <td>${semester}</td>
              </tr>
              <tr>
                <td>Number of Copies Required</td>
                <td>${copies}</td>
              </tr>
              <tr>
                <td>Purpose</td>
                <td>${purpose}</td>
              </tr>
              <tr>
                <td>Request Date</td>
                <td>${today}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td><span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 12px; font-size: 11px;">⏳ Pending Processing</span></td>
              </tr>
            </table>
            
            <div class="highlight-box">
              <strong>📋 Processing Information:</strong><br/>
              • Academic transcripts will be prepared by the Examination Section<br/>
              • Processing time: 5-7 working days<br/>
              • Collection: In person with valid ID proof<br/>
              • Fees: As per institution norms
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">${userName}</p>
                <p>Applicant Signature</p>
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">_____________________</p>
                <p>Registrar / Controller of Examinations</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateFeeDocument() {
      const feeType = formData.feeType || formData.paymentType || 'Tuition Fee';
      const amount = formData.amount || formData.feeAmount || '';
      const semester = formData.semester || formData.term || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">FEE</div>
          ${header}
          
          <div class="doc-title">
            <h2>FEE STRUCTURE / PAYMENT REQUEST</h2>
          </div>
          
          <div class="ref-bar">
            <span>Receipt/Request No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <table class="details-table">
              <tr>
                <td>Student Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${userEmail}</td>
              </tr>
              <tr>
                <td>Fee Type</td>
                <td>${feeType}</td>
              </tr>
              ${amount ? `<tr><td>Amount</td><td style="font-size: 16px; font-weight: bold; color: #1e3a5f;">₹ ${amount}</td></tr>` : ''}
              ${semester ? `<tr><td>Semester / Term</td><td>${semester}</td></tr>` : ''}
              <tr>
                <td>Request Date</td>
                <td>${today}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td><span class="success-badge">✓ Request Submitted</span></td>
              </tr>
            </table>
          </div>
          
          <div class="signature-section">
            <div>
              <p style="margin: 0;">Date: ${today}</p>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">Accounts Section</p>
                <p>${instName}</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateIdentityCertificate() {
      const purpose = formData.purpose || 'identity verification';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">ID CERT</div>
          ${header}
          
          <div class="doc-title">
            <h2>IDENTITY CERTIFICATE</h2>
          </div>
          
          <div class="ref-bar">
            <span>Certificate No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <p class="no-indent" style="text-align: center; margin: 25px 0;">
              This is to certify that the following person is officially associated with this institution:
            </p>
            
            <div style="display: flex; gap: 25px; margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="width: 100px; height: 120px; background: #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 11px; text-align: center; flex-shrink: 0;">
                Passport<br/>Photo
              </div>
              <table class="details-table" style="flex: 1; margin: 0;">
                <tr>
                  <td>Full Name</td>
                  <td><strong>${userName}</strong></td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>${userEmail}</td>
                </tr>
                <tr>
                  <td>Role / Designation</td>
                  <td>${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</td>
                </tr>
                <tr>
                  <td>Purpose</td>
                  <td>${purpose}</td>
                </tr>
              </table>
            </div>
            
            <p class="no-indent">This certificate is issued for the purpose of identity verification as requested by the applicant.</p>
          </div>
          
          <div class="signature-section">
            <div>
              <p style="margin: 0;">Valid Until: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-IN', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
            </div>
            <div class="signature-block">
              <div class="seal-placeholder">OFFICIAL<br/>SEAL</div>
              <div class="signature-line" style="margin-top: 10px;">
                <p class="name">Authorized Signatory</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateEventPermission() {
      const eventName = formData.eventName || formData.event || 'Event';
      const eventDate = formData.eventDate || formData.date || '';
      const venue = formData.venue || formData.location || '';
      const participants = formData.participants || formData.expectedAttendees || '';
      const description = formData.description || formData.eventDescription || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">EVENT</div>
          ${header}
          
          <div class="doc-title">
            <h2>EVENT PERMISSION REQUEST</h2>
          </div>
          
          <div class="ref-bar">
            <span>Request No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="address-block">
            <p><strong>To,</strong></p>
            <p>The Dean / Principal / Event Coordinator</p>
            <p>${instName}</p>
          </div>
          
          <div class="subject-line">
            <strong>Subject:</strong> Permission Request for Organizing "${eventName}"
          </div>
          
          <div class="doc-body">
            <p class="no-indent">Respected Sir/Madam,</p>
            
            <p>I am writing this letter to request your kind permission and approval to organize the following event under the aegis of this institution:</p>
            
            <table class="details-table">
              <tr>
                <td>Requested By</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Event Name</td>
                <td><strong>${eventName}</strong></td>
              </tr>
              ${eventDate ? `<tr><td>Proposed Date</td><td>${eventDate}</td></tr>` : ''}
              ${venue ? `<tr><td>Proposed Venue</td><td>${venue}</td></tr>` : ''}
              ${participants ? `<tr><td>Expected Participants</td><td>${participants}</td></tr>` : ''}
              ${description ? `<tr><td>Event Description</td><td>${description}</td></tr>` : ''}
            </table>
            
            <p>I hereby assure that all necessary arrangements regarding venue setup, security, cleanliness, and adherence to institutional guidelines will be strictly followed. All permissions from relevant authorities will be obtained prior to the event.</p>
            
            <p>I kindly request you to grant permission for the same and oblige.</p>
            
            <p class="no-indent">Thanking you,</p>
            <p class="no-indent">Yours faithfully,</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">${userName}</p>
                <p>Organizer / Applicant</p>
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">_____________________</p>
                <p>Approved / Not Approved</p>
                <p style="font-size: 10px;">Date: _______________</p>
              </div>
            </div>
          </div>
          
          <div class="highlight-box">
            <strong>For Office Use:</strong><br/>
            Recommendation: _____________ | Remarks: _____________
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateCertificate() {
      const certType = formData.certificateType || selectedTemplate.name;
      const details = formData.details || formData.description || '';
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">CERTIFICATE</div>
          ${header}
          
          <div class="doc-title">
            <h2>${certType.toUpperCase()}</h2>
          </div>
          
          <div class="ref-bar">
            <span>Certificate No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <p class="no-indent" style="text-align: center; font-size: 16px; margin: 40px 0;">
              This is to certify that<br/><br/>
              <strong style="font-size: 20px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 5px;">
                ${userName}
              </strong>
            </p>
            
            <table class="details-table">
              <tr>
                <td>Full Name</td>
                <td><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${userEmail}</td>
              </tr>
              ${details ? `<tr><td>Details</td><td>${details}</td></tr>` : ''}
            </table>
            
            <p class="no-indent">This certificate is awarded in recognition of the above and is valid for all official purposes.</p>
          </div>
          
          <div class="signature-section" style="margin-top: 60px;">
            <div>
              <p style="margin: 0;">Date: ${today}</p>
            </div>
            <div class="signature-block">
              <div class="seal-placeholder">OFFICIAL<br/>SEAL</div>
              <div class="signature-line" style="margin-top: 10px;">
                <p class="name">Authorized Signatory</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
    
    function generateGenericDocument() {
      let fieldsHtml = '';
      if (selectedTemplate.fields && selectedTemplate.fields.length > 0) {
        fieldsHtml = '<table class="details-table">';
        selectedTemplate.fields.forEach(field => {
          const value = formData[field.name];
          if (value) {
            if (field.type === 'textarea') {
              fieldsHtml += `
                <tr>
                  <td colspan="2" style="background: #f8fafc;">
                    <strong style="display: block; margin-bottom: 8px; color: #1e3a5f;">${field.label}</strong>
                    <p style="margin: 0; white-space: pre-wrap;">${value}</p>
                  </td>
                </tr>
              `;
            } else {
              fieldsHtml += `
                <tr>
                  <td>${field.label}</td>
                  <td>${value}</td>
                </tr>
              `;
            }
          }
        });
        fieldsHtml += '</table>';
      }
      
      return `
        ${styles}
        <div class="doc-container" style="position: relative;">
          <div class="watermark">DOCUMENT</div>
          ${header}
          
          <div class="doc-title">
            <h2>${selectedTemplate.name.toUpperCase()}</h2>
          </div>
          
          <div class="ref-bar">
            <span>Reference No: <strong>${refNumber}</strong></span>
            <span>Date: <strong>${today}</strong></span>
          </div>
          
          <div class="doc-body">
            <p class="no-indent" style="margin-bottom: 20px;">
              Document generated for <strong>${userName}</strong> (${userEmail})
            </p>
            
            ${fieldsHtml || '<p class="no-indent">No additional details provided.</p>'}
          </div>
          
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">
                <p class="name">${userName}</p>
                <p>Applicant</p>
                <p>Date: ${today}</p>
              </div>
            </div>
            <div class="signature-block">
              <div class="seal-placeholder">OFFICIAL<br/>SEAL</div>
              <div class="signature-line" style="margin-top: 10px;">
                <p class="name">Authorized Signatory</p>
                <p>${instName}</p>
              </div>
            </div>
          </div>
          
          ${footer}
        </div>
      `;
    }
  };

  // Check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    if (!selectedTemplate?.fields) return true;
    const requiredFields = selectedTemplate.fields.filter(f => f.required);
    return requiredFields.every(field => {
      const value = formData[field.name];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // Get missing required fields
  const getMissingFields = () => {
    if (!selectedTemplate?.fields) return [];
    return selectedTemplate.fields
      .filter(f => f.required)
      .filter(field => {
        const value = formData[field.name];
        return value === undefined || value === null || value === '';
      })
      .map(f => f.label);
  };

  // Handle preview
  const handlePreview = () => {
    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      // Validation error will be shown in preview panel, not as notification
      setPreviewContent('');
      setShowPreview(true);
      return;
    }
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

    // Only require recipients for non-save actions
    if (approvalType !== 'save' && selectedRecipients.length === 0) {
      showNotification('error', 'No Recipients', 'Please select at least one recipient for approval');
      return;
    }

    setIsSubmitting(true);
    
    // Show blockchain transaction loader
    setShowTransactionLoader(true);
    setTransactionStep(0);
    setTransactionProgress(10);
    setTransactionMessage('Preparing document...');
    
    try {
      // Step 1: Connect wallet if not connected
      if (!isWalletConnected()) {
        setTransactionMessage('Connecting wallet...');
        try {
          await connectWallet();
        } catch (walletError) {
          console.warn('Wallet connection failed, continuing without blockchain:', walletError);
          // Continue without blockchain if wallet fails
        }
      }

      // Step 2: Generate the document content
      setTransactionStep(1);
      setTransactionProgress(20);
      setTransactionMessage('Generating document...');
      
      const generateResponse = await fetch(`${API_URL}/api/document-generation/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          formData: formData,
          status: approvalType === 'save' ? 'completed' : 'pending'
        })
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        showNotification('error', 'Error', error.error || 'Failed to generate document');
        setShowTransactionLoader(false);
        setIsSubmitting(false);
        return;
      }

      const generateData = await generateResponse.json();
      console.log('📥 Full generate response:', generateData);
      const docId = generateData.data?.id;
      const generatedContent = generateData.data?.generatedContent;
      const fileManagerDocId = generateData.data?.fileManagerDocument?.id;
      const pdfFileName = `${selectedTemplate.name.replace(/\s+/g, '_')}_${generateData.data?.requestId || Date.now()}.pdf`;
      
      console.log('📄 Document generated, fileManagerDocId:', fileManagerDocId);
      console.log('📄 generatedContent exists:', !!generatedContent);
      console.log('📄 generatedContent type:', typeof generatedContent);
      console.log('📄 generatedContent length:', generatedContent?.length || 0);

      // Step 3: Convert HTML to PDF and Upload to IPFS
      setTransactionStep(2);
      setTransactionProgress(40);
      setTransactionMessage('Converting to PDF...');
      
      let ipfsHash = null;
      let blockchainTxHash = null;
      let blockchainDocId = null;
      let pdfFileSize = 0;

      try {
        // Verify we have content to convert
        if (!generatedContent || generatedContent.trim() === '') {
          console.error('❌ No generated content to convert to PDF');
          throw new Error('No document content available');
        }
        console.log('📄 Generated content length:', generatedContent.length);
        console.log('📄 Generated content preview:', generatedContent.substring(0, 500));

        // Create a temporary iframe to render the HTML properly
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);

        // Write content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Times New Roman', serif; 
                padding: 20px; 
                background: white;
                color: black;
              }
            </style>
          </head>
          <body>${generatedContent}</body>
          </html>
        `);
        iframeDoc.close();

        // Wait for iframe to fully render
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('📄 Iframe body content length:', iframeDoc.body.innerHTML.length);

        // Configure PDF options
        const pdfOptions = {
          margin: [10, 10, 10, 10],
          filename: pdfFileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF from iframe body
        setTransactionMessage('Generating PDF...');
        console.log('📄 Starting html2pdf conversion...');
        const pdfArrayBuffer = await html2pdf().from(iframeDoc.body).set(pdfOptions).outputPdf('arraybuffer');
        console.log('📄 PDF arraybuffer size:', pdfArrayBuffer?.byteLength);
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        
        // Remove iframe
        document.body.removeChild(iframe);

        // Verify PDF was generated properly
        if (!pdfBlob || pdfBlob.size === 0) {
          console.error('❌ PDF generation failed - empty blob');
          throw new Error('PDF generation failed - empty result');
        }

        // Create PDF file for upload
        const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
        pdfFileSize = pdfFile.size;
        console.log('✅ PDF generated, size:', pdfFile.size, 'bytes');

        // Upload to Pinata IPFS
        setTransactionMessage('Uploading to IPFS...');
        const ipfsResult = await pinataService.uploadFile(pdfFile, {
          name: pdfFileName,
          documentType: 'generated-pdf',
          templateName: selectedTemplate.name,
          requestId: generateData.data?.requestId
        });
        
        if (ipfsResult.success) {
          ipfsHash = ipfsResult.ipfsHash;
          console.log('✅ PDF uploaded to IPFS:', ipfsHash);
          
          // Step 4: Record on blockchain (only for 'save' mode, skip for approval/share modes)
          setTransactionStep(3);
          setTransactionProgress(60);
          
          // Only record document on blockchain if saving directly (no approval)
          // For approval workflows, the document info is included in the approval request
          if (approvalType === 'save' && isWalletConnected()) {
            setTransactionMessage('Recording on blockchain...');
            try {
              const blockchainResult = await uploadDocumentToBlockchain(
                ipfsHash,
                pdfFileName,
                'application/pdf',
                pdfFile.size
              );
              
              if (blockchainResult.success) {
                blockchainTxHash = blockchainResult.transactionHash;
                blockchainDocId = blockchainResult.documentId;
                console.log('✅ Document recorded on blockchain:', blockchainTxHash);
              }
            } catch (blockchainError) {
              console.warn('Blockchain recording failed, continuing:', blockchainError);
            }
          } else {
            setTransactionMessage('Preparing for submission...');
            console.log('⏭️ Skipping document blockchain record for approval workflow');
          }
          
          // Update document with IPFS hash and blockchain info
          try {
            console.log('📤 Updating blockchain info with fileSize:', pdfFile.size, 'fileManagerDocId:', fileManagerDocId);
            const updateResponse = await fetch(`${API_URL}/api/document-generation/update-blockchain/${docId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ipfsHash: ipfsHash,
                blockchainTxHash: blockchainTxHash,
                blockchainDocId: blockchainDocId,
                fileSize: pdfFile.size,
                fileManagerDocId: fileManagerDocId
              })
            });
            const updateResult = await updateResponse.json();
            console.log('✅ Blockchain update response:', updateResult);
          } catch (updateError) {
            console.warn('Failed to update document with blockchain info:', updateError);
          }
        } else {
          console.warn('IPFS upload failed:', ipfsResult.error);
        }
      } catch (ipfsError) {
        console.warn('IPFS/Blockchain integration error:', ipfsError);
        // Continue even if IPFS fails
      }

      // Step 5: Submit for approval or save
      setTransactionStep(4);
      setTransactionProgress(80);
      
      if (approvalType === 'save') {
        // Direct save - no approval needed
        setTransactionMessage('Saving to files...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setTransactionStep(5);
        setTransactionProgress(100);
        setTransactionMessage('Complete!');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setShowTransactionLoader(false);
        
        const successMsg = ipfsHash 
          ? `Document saved to blockchain! IPFS: ${ipfsHash.substring(0, 10)}...`
          : `Your ${selectedTemplate.name} has been saved to files!`;
        showNotification('success', 'Document Saved', successMsg);
        fetchMyDocuments();
        fetchAnalytics();
        
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else if (approvalType === 'share') {
        // SHARE: Use the shares API to share the document
        setTransactionMessage('Sharing document...');
        
        // Build recipients array for shares API
        const shareRecipients = selectedRecipients.map(recipientId => ({
          user_id: recipientId,
          permission: sharePermissions[recipientId] || 'read'
        }));
        
        console.log('📤 Sharing document with recipients:', shareRecipients);
        console.log('📄 File Manager Document ID:', fileManagerDocId);
        
        const shareResponse = await fetch(`${API_URL}/api/shares/document/${fileManagerDocId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            recipients: shareRecipients,
            transaction_hash: blockchainTxHash,
            block_number: null
          })
        });
        
        if (shareResponse.ok) {
          setTransactionStep(5);
          setTransactionProgress(100);
          setTransactionMessage('Complete!');
          
          await new Promise(resolve => setTimeout(resolve, 800));
          setShowTransactionLoader(false);
          
          showNotification('success', 'Document Shared', `Your ${selectedTemplate.name} has been shared with ${selectedRecipients.length} recipient(s)!`);
          
          fetchMyDocuments();
          fetchAnalytics();
          
          setTimeout(() => {
            closeModal();
          }, 1000);
        } else {
          setShowTransactionLoader(false);
          const error = await shareResponse.json();
          showNotification('error', 'Error', error.message || 'Failed to share document');
        }
      } else {
        // STANDARD/DIGITAL APPROVAL: Create blockchain approval request first
        setTransactionMessage('Creating approval request on blockchain...');
        
        // For standard/digital approval, first create approval request on blockchain
        let blockchainRequestId = null;
        if (isWalletConnected() && ipfsHash) {
          try {
            // Get wallet addresses of selected approvers
            const selectedApproverWallets = approvers
              .filter(a => selectedRecipients.includes(a.id) && a.walletAddress)
              .map(a => a.walletAddress);
            
            if (selectedApproverWallets.length > 0) {
              // Use blockchainDocId if available, otherwise generate from IPFS hash
              const docIdForApproval = blockchainDocId || 
                '0x' + Array.from(new TextEncoder().encode(ipfsHash))
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('')
                  .slice(0, 64)
                  .padEnd(64, '0');
              
              console.log('🔄 Creating blockchain approval request with:', {
                documentId: docIdForApproval,
                ipfsHash: ipfsHash,
                approvers: selectedApproverWallets
              });
              
              const approvalResult = await requestApprovalOnBlockchain(
                docIdForApproval,
                ipfsHash,
                selectedApproverWallets,
                approvalFlow === 'sequential' ? 'SEQUENTIAL' : 'PARALLEL',
                approvalType === 'digital' ? 'DIGITAL_SIGNATURE' : 'STANDARD',
                'NORMAL',
                0,
                'v1.0'
              );
              
              if (approvalResult.success) {
                blockchainRequestId = approvalResult.requestId;
                // Capture transaction hash from approval request
                if (approvalResult.transactionHash) {
                  blockchainTxHash = approvalResult.transactionHash;
                }
                console.log('✅ Blockchain approval request created:', blockchainRequestId, 'TX:', blockchainTxHash);
                // Store gas info for backend
                var gasUsed = approvalResult.gasUsed;
                var gasPrice = approvalResult.gasPrice;
                var blockNumber = approvalResult.blockNumber;
              }
            } else {
              console.warn('⚠️ No approvers with wallet addresses, skipping blockchain approval request');
            }
          } catch (blockchainError) {
            console.error('Blockchain approval request error:', blockchainError);
            // Continue without blockchain approval - will create database entry only
          }
        }
        
        setTransactionMessage('Sending for approval...');
        
        const submitResponse = await fetch(`${API_URL}/api/document-generation/submit/${docId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            recipientIds: selectedRecipients,
            approvalType: approvalType,
            ipfsHash: ipfsHash,
            blockchainTxHash: blockchainTxHash,
            blockchainRequestId: blockchainRequestId,
            fileSize: pdfFileSize,
            gasUsed: gasUsed,
            gasPrice: gasPrice,
            blockNumber: blockNumber
          })
        });

        if (submitResponse.ok) {
          setTransactionStep(5);
          setTransactionProgress(100);
          setTransactionMessage('Complete!');
          
          await new Promise(resolve => setTimeout(resolve, 800));
          setShowTransactionLoader(false);
          
          const actionText = approvalType === 'digital' ? 'sent for digital signature' : 'sent for approval';
          const txInfo = blockchainTxHash ? ` TX: ${blockchainTxHash.substring(0, 10)}...` : '';
          showNotification('success', 'Document Submitted', `Your ${selectedTemplate.name} has been ${actionText}!${txInfo}`);
          
          // Refresh data
          fetchMyDocuments();
          fetchAnalytics();
          
          // Close modal after delay
          setTimeout(() => {
            closeModal();
          }, 1000);
        } else {
          setShowTransactionLoader(false);
          const error = await submitResponse.json();
          showNotification('error', 'Error', error.error || 'Failed to submit document');
        }
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setShowTransactionLoader(false);
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
      {/* Blockchain Transaction Loader */}
      <TransactionLoader 
        isVisible={showTransactionLoader}
        variant={approvalType === 'digital' ? 'approval' : 'blockchain'}
        title={approvalType === 'save' ? 'Saving Document' : approvalType === 'share' ? 'Sharing Document' : 'Processing Transaction'}
        message={transactionMessage}
        progress={transactionProgress}
        currentStep={transactionStep}
        steps={
          approvalType === 'save' 
            ? ['Preparing', 'Generating', 'Recording', 'Saving', 'Complete']
            : approvalType === 'share'
            ? ['Preparing', 'Generating', 'Blockchain', 'Sharing', 'Complete']
            : ['Preparing', 'Generating', 'Blockchain', 'Submitting', 'Complete']
        }
      />
      
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
          <div className="stat-icon blue">
            <i className="ri-file-add-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.generated}</h4>
            <p>Documents Generated</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="ri-send-plane-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.sentForApproval}</h4>
            <p>Sent for Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="ri-quill-pen-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.signedCompleted}</h4>
            <p>Signed & Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="ri-folder-download-line"></i>
          </div>
          <div className="stat-info">
            <h4>{analytics.savedToFiles}</h4>
            <p>Saved to Files</p>
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
              return (
                <div key={template.id} className="template-list-item" onClick={() => handleTemplateSelect(template)}>
                  <div className="template-icon" style={{background: `${template.color}20`, color: template.color}}>
                    <span>{template.icon}</span>
                  </div>
                  <div className="template-content">
                    <div className="template-header-row">
                      <h3>{template.name}</h3>
                      <span className="template-category-badge" style={{background: `${template.color}15`, color: template.color}}>
                        {template.category === 'all' ? 'General' : template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                      </span>
                    </div>
                    <p className="template-description">{template.description || 'Official document template'}</p>
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
                  <div className="wizard-steps">
                    <div className={`wizard-step ${areRequiredFieldsFilled() ? 'completed' : 'active'}`}>
                      <div className="wizard-step-number">{areRequiredFieldsFilled() ? <i className="ri-check-line"></i> : '1'}</div>
                      <div className="wizard-step-label">Fill Details</div>
                    </div>
                    <div className={`wizard-step-line ${areRequiredFieldsFilled() ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${approvalType ? 'completed' : areRequiredFieldsFilled() ? 'active' : ''}`}>
                      <div className="wizard-step-number">{approvalType ? <i className="ri-check-line"></i> : '2'}</div>
                      <div className="wizard-step-label">Choose Action</div>
                    </div>
                    <div className={`wizard-step-line ${approvalType ? 'completed' : ''}`}></div>
                    <div className={`wizard-step ${(approvalType === 'save' || selectedRecipients.length > 0) ? 'completed' : approvalType ? 'active' : ''}`}>
                      <div className="wizard-step-number">{(approvalType === 'save' || selectedRecipients.length > 0) ? <i className="ri-check-line"></i> : '3'}</div>
                      <div className="wizard-step-label">{approvalType === 'save' ? 'Ready' : 'Select Recipients'}</div>
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

                  {/* Action Type Section - MOVED BEFORE RECIPIENTS */}
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
                            onChange={() => { setApprovalType('standard'); setSelectedRecipients([]); setSharePermissions({}); }}
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
                            onChange={() => { setApprovalType('digital'); setSelectedRecipients([]); setSharePermissions({}); }}
                          />
                          <div className="action-icon digital">
                            <i className="ri-quill-pen-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Digital Signature</strong>
                            <small>Requires digital signature verification</small>
                          </div>
                        </label>
                        
                        <label className={`action-option ${approvalType === 'share' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType"
                            checked={approvalType === 'share'}
                            onChange={() => { setApprovalType('share'); setSelectedRecipients([]); setSharePermissions({}); }}
                          />
                          <div className="action-icon share">
                            <i className="ri-share-forward-line"></i>
                          </div>
                          <div className="action-info">
                            <strong>Share Document</strong>
                            <small>Share with others with permissions</small>
                          </div>
                        </label>
                        
                        <label className={`action-option ${approvalType === 'save' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="approvalType"
                            checked={approvalType === 'save'}
                            onChange={() => { setApprovalType('save'); setSelectedRecipients([]); setSharePermissions({}); }}
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

                  {/* Recipients/Approvers Section - Only show if not 'save' */}
                  {approvalType !== 'save' && (
                    <div className="form-card">
                      <div className="form-card-header">
                        <i className={approvalType === 'share' ? 'ri-team-line' : 'ri-user-star-line'}></i>
                        <h3>{approvalType === 'share' ? 'Select Recipients' : 'Select Approvers'}</h3>
                        <span className="header-badge">{selectedRecipients.length} selected</span>
                      </div>
                      <div className="form-card-body">
                        {/* Approval Flow Type - Only for approval/signature */}
                        {(approvalType === 'standard' || approvalType === 'digital') && (
                          <div className="approval-flow-selector">
                            <label className="flow-label">Approval Flow:</label>
                            <div className="flow-options">
                              <button 
                                type="button"
                                className={`flow-btn ${approvalFlow === 'sequential' ? 'active' : ''}`}
                                onClick={() => setApprovalFlow('sequential')}
                              >
                                <i className="ri-sort-asc"></i>
                                Sequential
                              </button>
                              <button 
                                type="button"
                                className={`flow-btn ${approvalFlow === 'parallel' ? 'active' : ''}`}
                                onClick={() => setApprovalFlow('parallel')}
                              >
                                <i className="ri-git-branch-line"></i>
                                Parallel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Search */}
                        <div className="approver-search">
                          <i className="ri-search-line"></i>
                          <input 
                            type="text" 
                            placeholder={approvalType === 'share' ? 'Search recipients...' : 'Search approvers...'}
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                          />
                        </div>
                        
                        {/* Approvers/Recipients List */}
                        <div className="approvers-grid">
                          {filteredApprovers.length === 0 ? (
                            <div className="no-approvers">
                              <i className="ri-user-search-line"></i>
                              <p>No {approvalType === 'share' ? 'recipients' : 'approvers'} found</p>
                            </div>
                          ) : filteredApprovers.map((recipient) => {
                            const displayName = recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`;
                            const nameParts = displayName.split(' ');
                            const initials = nameParts.length > 1 
                              ? `${nameParts[0]?.[0] || ''}${nameParts[nameParts.length-1]?.[0] || ''}`.toUpperCase()
                              : (nameParts[0]?.[0] || 'U').toUpperCase();
                            const isSelected = selectedRecipients.includes(recipient.id);
                            const currentPermission = sharePermissions[recipient.id] || 'read';
                            
                            return (
                              <div 
                                key={recipient.id} 
                                className={`approver-card ${isSelected ? 'selected' : ''}`}
                              >
                                <div 
                                  className="approver-main"
                                  onClick={() => {
                                    toggleRecipient(recipient.id);
                                    if (!isSelected && approvalType === 'share') {
                                      setSharePermissions(prev => ({ ...prev, [recipient.id]: 'read' }));
                                    }
                                  }}
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
                                    <small>{recipient.role} • {recipient.department || 'General'}</small>
                                  </div>
                                </div>
                                
                                {/* Share Permission Selector */}
                                {approvalType === 'share' && isSelected && (
                                  <div className="permission-selector">
                                    <button
                                      type="button"
                                      className={`perm-btn ${currentPermission === 'read' ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSharePermissions(prev => ({ ...prev, [recipient.id]: 'read' }));
                                      }}
                                      title="Read Only"
                                    >
                                      <i className="ri-eye-line"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className={`perm-btn ${currentPermission === 'write' ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSharePermissions(prev => ({ ...prev, [recipient.id]: 'write' }));
                                      }}
                                      title="Read & Write"
                                    >
                                      <i className="ri-edit-line"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Selected Order Info for Sequential Approval */}
                        {(approvalType === 'standard' || approvalType === 'digital') && approvalFlow === 'sequential' && selectedRecipients.length > 1 && (
                          <div className="approval-order-info">
                            <i className="ri-information-line"></i>
                            <span>Approvers will be notified in the order selected: {selectedRecipients.map((id, idx) => {
                              const approver = approvers.find(a => a.id === id);
                              const name = approver?.name || `${approver?.firstName || ''} ${approver?.lastName || ''}`.trim();
                              return `${idx + 1}. ${name}`;
                            }).join(' → ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                ) : showPreview && !previewContent ? (
                  <div className="preview-placeholder validation-error">
                    <div className="placeholder-icon error">
                      <i className="ri-error-warning-line"></i>
                    </div>
                    <h3>Required Fields Missing</h3>
                    <p>Please fill in all required fields before generating the preview</p>
                    <ul className="missing-fields-list">
                      {getMissingFields().map((field, idx) => (
                        <li key={idx}><i className="ri-checkbox-blank-circle-line"></i> {field}</li>
                      ))}
                    </ul>
                    <button className="preview-generate-btn" onClick={() => setShowPreview(false)}>
                      <i className="ri-arrow-left-line"></i> Go Back to Form
                    </button>
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
                  disabled={isSubmitting || (approvalType !== 'save' && selectedRecipients.length === 0)}
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

      {/* My Documents Modal - Theme Compatible Design */}
      {showMyDocuments && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowMyDocuments(false)}>
          <div className="my-docs-modal">
            {/* Modal Header */}
            <div className="my-docs-header">
              <div className="my-docs-title">
                <div className="my-docs-icon">
                  <i className="ri-file-list-3-line"></i>
                </div>
                <div>
                  <h2>My Document Requests</h2>
                  <p className="my-docs-subtitle">{myDocuments.length} document{myDocuments.length !== 1 ? 's' : ''} found</p>
                </div>
              </div>
              <button className="my-docs-close-btn" onClick={() => setShowMyDocuments(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="my-docs-filters">
              <div className="my-docs-filter-select">
                <i className="ri-filter-3-line"></i>
                <select defaultValue="all">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="my-docs-search">
                <i className="ri-search-line"></i>
                <input
                  type="text"
                  placeholder="Search by request ID or document type..."
                />
              </div>
            </div>

            {/* Documents Content */}
            <div className="my-docs-content">
              {myDocuments.length === 0 ? (
                <div className="my-docs-empty">
                  <div className="my-docs-empty-icon">
                    <i className="ri-file-text-line"></i>
                  </div>
                  <h3>No documents yet</h3>
                  <p>Create your first document by selecting a template above</p>
                </div>
              ) : (
                <div className="my-docs-list">
                  {myDocuments.map(doc => {
                    const statusStyle = getStatusBadge(doc.status);
                    const statusLower = (doc.status || 'pending').toLowerCase();

                    return (
                      <div 
                        className="my-docs-card" 
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Left: Document Info */}
                        <div className="my-docs-card-left">
                          <div className="my-docs-card-icon">
                            <i className="ri-file-pdf-2-line"></i>
                          </div>
                          <div className="my-docs-card-info">
                            <div className="my-docs-card-id">{doc.requestId || 'REQ-XXXXX'}</div>
                            <div className="my-docs-card-type">{doc.templateName || 'Document'}</div>
                            <div className="my-docs-card-date">
                              <i className="ri-calendar-line"></i>
                              {formatDate(doc.submittedAt || doc.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Center: Status */}
                        <div className={`my-docs-status my-docs-status-${statusLower}`}>
                          <i className={statusStyle.icon}></i>
                          {doc.status || 'Pending'}
                        </div>

                        {/* Right: View Button */}
                        <div className="my-docs-actions">
                          <button 
                            className="my-docs-btn my-docs-btn-view"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                            }}
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDocument && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setSelectedDocument(null)}>
          <div className="doc-details-modal">
            {/* Header */}
            <div className="doc-details-header">
              <div className="doc-details-title">
                <i className="ri-file-text-line"></i>
                <span>Document Details</span>
              </div>
              <button className="doc-details-close" onClick={() => setSelectedDocument(null)}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Content */}
            <div className="doc-details-content">
              {/* Left: Document Info */}
              <div className="doc-details-info">
                {/* Document Information */}
                <div className="doc-info-section">
                  <h4><i className="ri-file-info-line"></i> Document Information</h4>
                  <div className="doc-info-grid">
                    <div className="doc-info-item">
                      <label>Request ID</label>
                      <span className="doc-info-value">{selectedDocument.requestId || 'N/A'}</span>
                    </div>
                    <div className="doc-info-item">
                      <label>Document Type</label>
                      <span className="doc-info-value">{selectedDocument.templateName || 'Document'}</span>
                    </div>
                    <div className="doc-info-item">
                      <label>Created Date</label>
                      <span className="doc-info-value">{formatDate(selectedDocument.createdAt)}</span>
                    </div>
                    <div className="doc-info-item">
                      <label>Submitted Date</label>
                      <span className="doc-info-value">{selectedDocument.submittedAt ? formatDate(selectedDocument.submittedAt) : 'Not submitted'}</span>
                    </div>
                    <div className="doc-info-item">
                      <label>Status</label>
                      <span className={`doc-status-badge doc-status-${(selectedDocument.status || 'pending').toLowerCase()}`}>
                        {selectedDocument.status || 'Pending'}
                      </span>
                    </div>
                    {selectedDocument.approvalType && (
                      <div className="doc-info-item">
                        <label>Approval Type</label>
                        <span className={`doc-approval-type ${selectedDocument.approvalType === 'digital' ? 'digital' : 'standard'}`}>
                          {selectedDocument.approvalType === 'digital' ? (
                            <><i className="ri-shield-keyhole-fill"></i> Digital Signature</>
                          ) : (
                            <><i className="ri-checkbox-circle-fill"></i> Standard</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blockchain Information */}
                <div className="doc-info-section">
                  <h4><i className="ri-links-line"></i> Blockchain Information</h4>
                  <div className="doc-info-grid">
                    {selectedDocument.pdfIpfsHash && (
                      <div className="doc-info-item full-width">
                        <label>IPFS Hash</label>
                        <code className="doc-hash">{selectedDocument.pdfIpfsHash}</code>
                      </div>
                    )}
                    {selectedDocument.txHash && (
                      <div className="doc-info-item full-width">
                        <label>Transaction Hash</label>
                        <code className="doc-hash">{selectedDocument.txHash}</code>
                      </div>
                    )}
                    {selectedDocument.verificationCode && (
                      <div className="doc-info-item">
                        <label>Verification Code</label>
                        <div className="doc-verify-code">
                          <code>{selectedDocument.verificationCode}</code>
                          <button 
                            className="doc-verify-btn"
                            onClick={() => window.open(`/verify/${selectedDocument.verificationCode}`, '_blank')}
                            title="Verify Document"
                          >
                            <i className="ri-qr-code-line"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Information */}
                {selectedDocument.approvers && selectedDocument.approvers.length > 0 && (
                  <div className="doc-info-section">
                    <h4><i className="ri-user-star-line"></i> Approval Chain</h4>
                    <div className="doc-approvers-list">
                      {selectedDocument.approvers.map((approver, idx) => (
                        <div className="doc-approver-item" key={idx}>
                          <div className="doc-approver-avatar">
                            <i className="ri-user-line"></i>
                          </div>
                          <div className="doc-approver-info">
                            <span className="doc-approver-name">{approver.name || approver}</span>
                            <span className="doc-approver-role">{approver.role || 'Approver'}</span>
                          </div>
                          <span className={`doc-approver-status ${approver.status || 'pending'}`}>
                            {approver.status === 'approved' ? (
                              <><i className="ri-check-line"></i> Approved</>
                            ) : approver.status === 'rejected' ? (
                              <><i className="ri-close-line"></i> Rejected</>
                            ) : (
                              <><i className="ri-time-line"></i> Pending</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="doc-details-actions">
                  {selectedDocument.pdfIpfsHash && (
                    <>
                      <button 
                        className="doc-action-btn primary"
                        onClick={() => {
                          const url = `https://gateway.pinata.cloud/ipfs/${selectedDocument.pdfIpfsHash}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <i className="ri-download-2-line"></i>
                        Download PDF
                      </button>
                      <button 
                        className="doc-action-btn secondary"
                        onClick={() => {
                          const url = `https://gateway.pinata.cloud/ipfs/${selectedDocument.pdfIpfsHash}`;
                          navigator.clipboard.writeText(url);
                          showNotification('success', 'Copied!', 'IPFS link copied to clipboard');
                        }}
                      >
                        <i className="ri-links-line"></i>
                        Copy Link
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div className="doc-details-preview">
                <div className="doc-preview-header">
                  <h4><i className="ri-eye-line"></i> Document Preview</h4>
                  {selectedDocument.stampedIpfsHash && (selectedDocument.status || '').toLowerCase() === 'approved' && (
                    <span className="doc-stamped-badge">
                      <i className="ri-shield-check-fill"></i> Certified
                    </span>
                  )}
                </div>
                <div className="doc-preview-frame">
                  {selectedDocument.pdfIpfsHash ? (
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(`https://gateway.pinata.cloud/ipfs/${selectedDocument.stampedIpfsHash || selectedDocument.pdfIpfsHash}`)}&embedded=true`}
                      title="Document Preview"
                      className="doc-preview-iframe"
                    />
                  ) : (
                    <div className="doc-preview-empty">
                      <i className="ri-file-pdf-line"></i>
                      <p>No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
