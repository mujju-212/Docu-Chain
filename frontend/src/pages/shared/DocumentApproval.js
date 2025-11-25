import React, { useState, useEffect } from 'react';
import './DocumentApproval.css';
import {
  requestApprovalOnBlockchain,
  approveDocumentOnBlockchain,
  rejectDocumentOnBlockchain,
  getApprovalRequestFromBlockchain,
  getApprovalStatusFromBlockchain,
  getMyApprovalRequests,
  getMyApprovalTasks
} from '../../utils/metamask';
import Web3 from 'web3';

const DocumentApproval = ({ userRole = 'faculty' }) => {
  // Utility function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 'N/A') return 'N/A';
    const numBytes = parseInt(bytes);
    if (isNaN(numBytes)) return bytes;
    
    if (numBytes < 1024) return numBytes + ' B';
    if (numBytes < 1024 * 1024) return (numBytes / 1024).toFixed(2) + ' KB';
    if (numBytes < 1024 * 1024 * 1024) return (numBytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (numBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

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
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Confirmation modal states
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [confirmRequestId, setConfirmRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Real data states (replacing dummy data)
  const [blockchainDocuments, setBlockchainDocuments] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  // API Configuration
  const API_URL = 'http://localhost:5000';
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // Fetch blockchain documents from backend (ALL documents from all folders)
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        // Add 'all=true' to get documents from ALL folders recursively
        const response = await fetch(`${API_URL}/api/documents?all=true`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📄 Fetched documents:', data.documents?.length || 0, 'documents');
          console.log('Documents data:', data.documents);
          setBlockchainDocuments(data.documents || []);
        } else {
          console.error('Failed to fetch documents:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Fetch available users for approval
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/institution`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('👥 Fetched users:', data.users?.length || 0, 'users');
          setAvailableUsers(data.users || []);
        } else {
          console.error('Failed to fetch users:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Load drafts from localStorage on mount
  useEffect(() => {
    const savedDrafts = JSON.parse(localStorage.getItem('approvalDrafts') || '[]');
    setDrafts(savedDrafts);
    
    // CHECK: Verify localStorage has required user data
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('='.repeat(60));
    console.log('🔐 LOCALSTORAGE CHECK');
    console.log('='.repeat(60));
    console.log('userId:', userId || '❌ NOT SET - PLEASE RE-LOGIN');
    console.log('userEmail:', userEmail || '❌ NOT SET - PLEASE RE-LOGIN');
    console.log('='.repeat(60));
    
    if (!userId || !userEmail) {
      console.error('⚠️ CRITICAL: localStorage not set! Approval status will not display correctly.');
      console.error('👉 Solution: LOGOUT and LOGIN again to populate localStorage.');
    }
  }, []);

  // Fetch incoming approval requests (my tasks)
  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_URL}/api/approvals/my-tasks?t=${timestamp}`, {
          headers: getAuthHeaders(),
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('📥 Raw backend response:', result);
          console.log('📥 My userId from localStorage:', localStorage.getItem('userId'));
          console.log('📥 Number of requests:', result.data?.length || 0);
          
          // Transform backend format to match UI expectations
          const transformedRequests = (result.data || []).map(req => {
            console.log('🔍 Processing request:', req.id);
            console.log('🔍 Request steps:', req.steps);
            console.log('🔍 Requester data:', req.requester);
            console.log('🔍 Document size:', req.documentSize, req.documentFileSize);
            
            // Find my step (where I'm the approver) - compare as strings
            const myUserId = localStorage.getItem('userId');
            console.log('🆔 My userId from localStorage:', myUserId);
            console.log('📋 Available steps:', req.steps?.map(s => ({ approverId: s.approverId, approverName: s.approver?.name })));
            const myStep = req.steps?.find(s => {
              console.log('🔍 Comparing:', s.approverId, 'with', myUserId, '→ Match:', s.approverId === myUserId);
              return s.approverId === myUserId || String(s.approverId) === String(myUserId);
            });
            
            console.log('🔍 My step found:', myStep);
            console.log('🔍 Status from backend:', req.status);
            console.log('🔍 hasApproved:', myStep?.hasApproved, 'hasRejected:', myStep?.hasRejected);
            
            // Use backend status directly (like sentRequests does)
            const overallStatus = (req.status || '').toLowerCase();
            const myStepStatus = myStep?.hasApproved ? 'approved' : (myStep?.hasRejected ? 'rejected' : 'pending');
            console.log('🔍 Overall Status:', overallStatus, 'My Step Status:', myStepStatus);
            
            return {
              id: req.id,
              requestId: req.requestId, // Blockchain request ID
              documentName: req.documentName,
              documentSize: formatFileSize(req.documentSize || req.documentFileSize),
              documentSizeRaw: req.documentSize || req.documentFileSize,
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              requestorName: req.requester ? (req.requester.name || `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim()) : 'Unknown',
              requestorId: req.requesterId,
              requestorDepartment: req.requester?.department || 'N/A',
              requestorEmail: req.requester?.email || 'N/A',
              purpose: req.purpose || '',
              approvalType: req.approvalType || 'standard',
              status: overallStatus, // Use backend status directly
              myStepStatus: myStepStatus, // Keep for individual step tracking
              submittedDate: new Date(req.createdAt).toLocaleDateString(),
              approvedBy: req.steps?.filter(s => s.hasApproved).map(s => s.approver?.name || 'Unknown') || [],
              pendingWith: req.steps?.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approver?.name || 'Unknown') || [],
              myStep: myStep,
              approvedDate: myStep?.hasApproved ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectedDate: myStep?.hasRejected ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectionReason: myStep?.reason || ''
            };
          });
          
          console.log('✅ Transformed incoming requests:', transformedRequests);
          setIncomingRequests(transformedRequests);
        } else {
          console.error('Failed to fetch incoming requests:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching incoming requests:', error);
      }
    };

    fetchIncomingRequests();
  }, []);

  // Refresh incoming requests when switching to receive tab
  useEffect(() => {
    if (activeTab === 'receive') {
      const fetchIncomingRequests = async () => {
        try {
          const timestamp = new Date().getTime();
          const response = await fetch(`${API_URL}/api/approvals/my-tasks?t=${timestamp}`, {
            headers: getAuthHeaders(),
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('🔄 Refreshing incoming requests on tab switch');
            
            const transformedRequests = (result.data || []).map(req => {
              const myUserId = localStorage.getItem('userId');
              const myStep = req.steps?.find(s => {
                return s.approverId === myUserId || String(s.approverId) === String(myUserId);
              });
              
              return {
                id: req.id,
                requestId: req.requestId, // Blockchain request ID
                documentName: req.documentName,
                documentSize: formatFileSize(req.documentSize || req.documentFileSize),
                documentSizeRaw: req.documentSize || req.documentFileSize,
                ipfsHash: req.documentIpfsHash,
                txId: req.blockchainTxHash,
                requestorName: req.requester ? (req.requester.name || `${req.requester.firstName || ''} ${req.requester.lastName || ''}`.trim()) : 'Unknown',
                requestorId: req.requesterId,
                requestorDepartment: req.requester?.department || 'N/A',
                requestorEmail: req.requester?.email || 'N/A',
                purpose: req.purpose || '',
                approvalType: req.approvalType || 'standard',
                status: req.status,
                submittedDate: new Date(req.createdAt).toLocaleDateString(),
                approvedBy: req.steps?.filter(s => s.hasApproved).map(s => s.approver?.name || 'Unknown') || [],
                pendingWith: req.steps?.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approver?.name || 'Unknown') || [],
                myStep: myStep,
                myStepStatus: myStep?.hasApproved ? 'approved' : (myStep?.hasRejected ? 'rejected' : 'pending'),
                approvedDate: myStep?.hasApproved ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
                rejectedDate: myStep?.hasRejected ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
                rejectionReason: myStep?.reason || ''
              };
            });
            
            console.log('✅ Refreshed incoming requests:', transformedRequests);
            setIncomingRequests(transformedRequests);
          }
        } catch (error) {
          console.error('Error refreshing incoming requests:', error);
        }
      };
      
      fetchIncomingRequests();
    }
  }, [activeTab]);

  // Fetch sent approval requests
  useEffect(() => {
    const fetchSentRequests = async () => {
      try {
        const response = await fetch(`${API_URL}/api/approvals/my-requests`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched sent requests:', data); // Debug
          console.log('✅ Response structure:', JSON.stringify(data, null, 2)); // Debug
          
          // Backend returns 'data' array with camelCase fields
          const transformedRequests = (data.data || []).map(req => {
            console.log('📄 Transforming request:', req.documentName); // Debug
            const steps = req.steps || [];
            console.log('👥 Steps found:', steps.length, steps); // Debug
            
            // Extract recipient names with full details
            let recipientNames = ['No recipients'];
            if (steps.length > 0) {
              recipientNames = steps.map(s => {
                console.log('🔍 Step approver:', s.approver); // Debug
                if (s.approver && s.approver.name) {
                  return `${s.approver.name} (${s.approver.department || s.approverRole || 'Unknown'})`;
                }
                return s.approverRole || 'Unknown Approver';
              });
              console.log('✅ Recipient names:', recipientNames); // Debug
            } else {
              console.warn('⚠️ No steps found for request:', req.documentName);
            }
            
            return {
              id: req.id,
              documentName: req.documentName,
              documentId: req.documentId,
              documentSize: req.documentFileSize || 'N/A',
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              purpose: req.metadata?.purpose || req.purpose || 'No purpose specified',
              approvalType: (req.approvalType || '').toLowerCase(),
              approvalProcess: (req.processType || '').toLowerCase(),
              priority: (req.priority || '').toLowerCase(),
              status: (req.status || '').toLowerCase(),
              submittedDate: req.createdAt,
              approvalSteps: steps,
              approvedBy: steps.filter(s => s.hasApproved).map(s => s.approverRole || 'Unknown'),
              pendingWith: steps.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approverRole || 'Unknown'),
              recipients: recipientNames,
              currentVersion: req.version || 'v1.0',
              versions: [{ version: req.version || 'v1.0', date: req.createdAt, hash: req.documentIpfsHash }]
            };
          });
          setSentRequests(transformedRequests);
        } else {
          console.error('Failed to fetch sent requests:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching sent requests:', error);
      }
    };

    fetchSentRequests();
  }, []);

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

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveDraft = () => {
    if (!selectedDocument) {
      showNotification('Please select a document first.', 'warning');
      return;
    }
    
    const existingDrafts = JSON.parse(localStorage.getItem('approvalDrafts') || '[]');
    
    // Check if we're updating an existing draft
    if (currentDraftId) {
      const draftIndex = existingDrafts.findIndex(d => d.id === currentDraftId);
      if (draftIndex !== -1) {
        // Update existing draft
        existingDrafts[draftIndex] = {
          id: currentDraftId,
          document: selectedDocument,
          recipients: recipients,
          approvalType: approvalType,
          approvalProcess: approvalProcess,
          purpose: purpose,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('approvalDrafts', JSON.stringify(existingDrafts));
        setDrafts(existingDrafts);
        showNotification('Draft updated successfully!');
        return;
      }
    }
    
    // Create new draft
    const newDraftId = Date.now().toString();
    const draft = {
      id: newDraftId,
      document: selectedDocument,
      recipients: recipients,
      approvalType: approvalType,
      approvalProcess: approvalProcess,
      purpose: purpose,
      savedAt: new Date().toISOString()
    };
    
    existingDrafts.push(draft);
    localStorage.setItem('approvalDrafts', JSON.stringify(existingDrafts));
    setDrafts(existingDrafts);
    setCurrentDraftId(newDraftId);
    showNotification('Draft saved successfully!');
  };
  
  const handlePreview = () => {
    if (!selectedDocument) {
      showNotification('Please select a document first.', 'warning');
      return;
    }
    if (recipients.length === 0) {
      showNotification('Please add at least one recipient.', 'warning');
      return;
    }
    
    setPreviewData({
      document: selectedDocument,
      recipients: recipients,
      approvalType: approvalType,
      approvalProcess: approvalProcess,
      purpose: purpose
    });
    setShowPreview(true);
  };
  
  const handleLoadDraft = (draft) => {
    setSelectedDocument(draft.document);
    setRecipients(draft.recipients);
    setApprovalType(draft.approvalType);
    setApprovalProcess(draft.approvalProcess);
    setPurpose(draft.purpose);
    setCurrentDraftId(draft.id);
    setActiveHistoryTab('all');
    showNotification('Draft loaded successfully! You can now continue and generate the request.');
  };
  
  const handleDeleteDraft = (draftId) => {
    const existingDrafts = JSON.parse(localStorage.getItem('approvalDrafts') || '[]');
    const updatedDrafts = existingDrafts.filter(d => d.id !== draftId);
    localStorage.setItem('approvalDrafts', JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    
    // Clear current draft ID if deleting the active draft
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }
    
    showNotification('Draft deleted successfully!', 'success');
  };

  const handleGenerateRequest = async () => {
    // Validation
    if (!selectedDocument) {
      showNotification('Please select a document first.', 'warning');
      return;
    }
    if (recipients.length === 0) {
      showNotification('Please add at least one recipient.', 'warning');
      return;
    }
    if (!purpose.trim()) {
      showNotification('Please enter the purpose of approval request.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Step 1: Generate unique document ID (bytes32) for blockchain
      const web3Instance = new Web3(window.ethereum);
      const documentId = web3Instance.utils.randomHex(32);
      
      // Step 2: Get current user's wallet address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentWallet = accounts[0];
      
      // Get actual wallet addresses from recipients
      // If recipient doesn't have wallet, use a placeholder
      const approverWallets = recipients.map((recipient, index) => {
        // Use recipient's actual wallet if they have one
        if (recipient.walletAddress || recipient.wallet_address) {
          return recipient.walletAddress || recipient.wallet_address;
        }
        // If no wallet, use placeholder (but this shouldn't happen in production)
        const placeholders = [
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
          '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
        ];
        console.warn(`⚠️ Recipient ${recipient.name || recipient.fullName} has no wallet address, using placeholder`);
        return placeholders[index % placeholders.length];
      });
      
      console.log('📍 Approver wallets:', approverWallets);
      console.log('📍 Recipients data:', recipients);
      
      // Step 3: Call blockchain contract
      showNotification('Please confirm the blockchain transaction in MetaMask...', 'warning');
      
      // Convert process type to string format expected by blockchain function
      const processTypeStr = approvalProcess === 'sequential' ? 'SEQUENTIAL' : 'PARALLEL';
      const approvalTypeStr = approvalType === 'digital' ? 'DIGITAL_SIGNATURE' : 'STANDARD';
      
      const result = await requestApprovalOnBlockchain(
        documentId,                                                  // documentId (bytes32) - blockchain will generate requestId
        selectedDocument.ipfsHash || selectedDocument.ipfs_hash,     // ipfsHash
        approverWallets,                                             // approverAddresses array
        processTypeStr,                                              // processType: 'SEQUENTIAL' or 'PARALLEL'
        approvalTypeStr,                                             // approvalType: 'STANDARD' or 'DIGITAL_SIGNATURE'
        'NORMAL',                                                    // priority: 'LOW', 'NORMAL', 'HIGH', 'URGENT'
        0,                                                           // expiryTimestamp (0 = no expiry)
        'v1.0'                                                       // version
      );
      
      // Step 4: Get the blockchain-generated request ID from the result
      const requestId = result.requestId;  // This is the ACTUAL blockchain request ID
      const txHash = result.transactionHash;
      
      if (!requestId) {
        throw new Error('Blockchain did not return a request ID. Transaction may have failed.');
      }
      
      showNotification('✅ Blockchain transaction confirmed! Saving to database...', 'success');
      console.log('📦 Blockchain TX Hash:', txHash);
      console.log('📦 Request ID from blockchain:', requestId);
      console.log('📦 Document ID:', documentId);
      
      // Step 5: ONLY save to database AFTER blockchain confirmation with CORRECT requestId
      const response = await fetch(`${API_URL}/api/approvals/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestId: requestId,  // Use the blockchain-generated request ID
          documentId: documentId,  // Also save the document ID
          documentName: selectedDocument.name || selectedDocument.fileName,
          documentIpfsHash: selectedDocument.ipfsHash || selectedDocument.ipfs_hash,
          documentFileSize: selectedDocument.fileSize || selectedDocument.file_size,
          documentFileType: selectedDocument.documentType || 'application/pdf',
          requesterWallet: currentWallet,
          approvers: recipients.map((recipient, index) => ({
            userId: recipient.id,  // Send actual user ID
            wallet: approverWallets[index],  // Test wallet for blockchain
            role: recipient.customRole || recipient.role,
            stepOrder: index + 1
          })),
          processType: approvalProcess.toUpperCase(),
          approvalType: approvalType === 'digital' ? 'DIGITAL_SIGNATURE' : 'STANDARD',
          priority: 'NORMAL',
          version: 'v1.0',
          expiryTimestamp: 0,
          purpose: purpose || 'Approval request',
          blockchainTxHash: txHash,
          metadata: {
            purpose: purpose,
            document_size: selectedDocument.fileSize || selectedDocument.file_size,
            recipients: recipients.map(r => ({ id: r.id, name: r.fullName || r.name, email: r.email }))
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Delete draft if this was from a loaded draft
        if (currentDraftId) {
          const existingDrafts = JSON.parse(localStorage.getItem('approvalDrafts') || '[]');
          const updatedDrafts = existingDrafts.filter(d => d.id !== currentDraftId);
          localStorage.setItem('approvalDrafts', JSON.stringify(updatedDrafts));
          setDrafts(updatedDrafts);
          setCurrentDraftId(null);
        }
        
        showNotification(`Approval request generated successfully! Blockchain TX: ${txHash.substring(0, 20)}...`, 'success');
        
        // Refresh sent requests
        const refreshResponse = await fetch(`${API_URL}/api/approvals/my-requests`, {
          headers: getAuthHeaders()
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Backend returns 'data' array with camelCase fields
          const transformedRequests = (refreshData.data || []).map(req => {
            const steps = req.steps || [];
            
            // Extract recipient names with full details
            const recipientNames = steps.length > 0 
              ? steps.map(s => {
                  if (s.approver && s.approver.name) {
                    return `${s.approver.name} (${s.approver.department || s.approverRole || 'Unknown'})`;
                  }
                  return s.approverRole || 'Unknown Approver';
                })
              : ['No recipients'];
            
            return {
              id: req.id,
              documentName: req.documentName,
              documentId: req.documentId,
              documentSize: req.documentFileSize || 'N/A',
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              purpose: req.metadata?.purpose || req.purpose || 'No purpose specified',
              approvalType: (req.approvalType || '').toLowerCase(),
              approvalProcess: (req.processType || '').toLowerCase(),
              priority: (req.priority || '').toLowerCase(),
              status: (req.status || '').toLowerCase(),
              submittedDate: req.createdAt,
              approvalSteps: steps,
              approvedBy: steps.filter(s => s.hasApproved).map(s => s.approverRole || 'Unknown'),
              pendingWith: steps.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approverRole || 'Unknown'),
              recipients: recipientNames,
              currentVersion: req.version || 'v1.0',
              versions: [{ version: req.version || 'v1.0', date: req.createdAt, hash: req.documentIpfsHash }]
            };
          });
          setSentRequests(transformedRequests);
        }
        
        // Reset form
        setSelectedDocument(null);
        setRecipients([]);
        setPurpose('');
      } else {
        const errorData = await response.json();
        showNotification(`Error saving to database: ${errorData.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('Error creating approval request:', error);
      if (error.message && error.message.includes('User denied')) {
        showNotification('Transaction cancelled by user.', 'warning');
      } else if (error.message && error.message.includes('insufficient funds')) {
        showNotification('Insufficient gas funds. Please add ETH to your wallet.', 'error');
      } else {
        showNotification(`Failed to create approval request: ${error.message || 'Unknown error'}. Check console for details.`, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    // Show confirmation modal instead of browser confirm
    setConfirmRequestId(requestId);
    setShowApproveConfirm(true);
  };

  const confirmApproveRequest = async () => {
    const requestId = confirmRequestId;
    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('❌ Request not found in incoming requests');
      return;
    }

    if (!request.requestId) {
      console.error('❌ Request missing blockchain requestId:', request);
      showNotification('❌ This request is missing blockchain ID. Please create a new approval request.', 'error');
      return;
    }

    setShowApproveConfirm(false);
    setIsLoading(true);

    try {
      console.log('🔍 Approving request:', request);
      console.log('🔍 Database ID:', request.id);
      console.log('🔍 Blockchain requestId:', request.requestId);
      console.log('🔍 Full request object:', JSON.stringify(request, null, 2));
      
      if (!request.requestId) {
        console.error('❌ requestId is missing:', request.requestId);
      }
      
      // Step 1: Generate signature hash
      const web3Instance = new Web3(window.ethereum);
      const signatureHash = web3Instance.utils.randomHex(32); // In production, use actual signature
      
      // Step 2: Approve on blockchain FIRST
      showNotification('Please confirm blockchain transaction in MetaMask...', 'info');
      
      const result = await approveDocumentOnBlockchain(request.requestId, '', signatureHash);
      const txHash = result.transactionHash;
      showNotification('✅ Blockchain approval confirmed! Updating database...', 'success');
      
      // Step 3: ONLY update database AFTER blockchain success
      const response = await fetch(`${API_URL}/api/approvals/approve/${request.requestId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          signatureHash: signatureHash,
          blockchainTxHash: txHash
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const isDigital = request.approvalType === 'digital';
        showNotification(`${isDigital ? 'Document signed and approved!' : 'Document approved!'} TX: ${txHash.substring(0, 20)}...`, 'success');
      
        // Refresh both incoming and sent requests to update counts
        const timestamp = new Date().getTime();
        
        // Refresh incoming requests
        const refreshResponse = await fetch(`${API_URL}/api/approvals/my-tasks?t=${timestamp}`, {
          headers: getAuthHeaders(),
          cache: 'no-cache'
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          const transformedRequests = (result.data || []).map(req => {
            const myStep = req.steps?.find(s => s.approverId === localStorage.getItem('userId'));
            return {
              id: req.id,
              requestId: req.requestId,
              documentName: req.documentName,
              documentSize: formatFileSize(req.documentSize || req.documentFileSize),
              documentSizeRaw: req.documentSize || req.documentFileSize,
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              requestorName: req.requester?.name || `${req.requester?.firstName || ''} ${req.requester?.lastName || ''}`.trim() || 'Unknown',
              requestorId: req.requesterId,
              requestorDepartment: req.requester?.department || 'N/A',
              requestorEmail: req.requester?.email,
              purpose: req.purpose || '',
              approvalType: req.approvalType || 'standard',
              status: req.status,
              submittedDate: new Date(req.createdAt).toLocaleDateString(),
              approvedBy: req.steps?.filter(s => s.hasApproved).map(s => s.approver?.name || 'Unknown') || [],
              pendingWith: req.steps?.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approver?.name || 'Unknown') || [],
              myStep: myStep,
              myStepStatus: myStep?.hasApproved ? 'approved' : (myStep?.hasRejected ? 'rejected' : 'pending'),
              approvedDate: myStep?.hasApproved ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectedDate: myStep?.hasRejected ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectionReason: myStep?.reason || ''
            };
          });
          setIncomingRequests(transformedRequests);
        }
        
        // Refresh sent requests
        const sentResponse = await fetch(`${API_URL}/api/approvals/my-requests?t=${timestamp}`, {
          headers: getAuthHeaders(),
          cache: 'no-cache'
        });
        if (sentResponse.ok) {
          const sentData = await sentResponse.json();
          const transformedSentRequests = (sentData.data || []).map(req => {
            const steps = req.steps || [];
            let recipientNames = ['No recipients'];
            if (steps.length > 0) {
              recipientNames = steps.map(s => {
                if (s.approver && s.approver.name) {
                  return `${s.approver.name} (${s.approver.department || s.approverRole || 'Unknown'})`;
                }
                return s.approverRole || 'Unknown Approver';
              });
            }
            
            return {
              id: req.id,
              documentName: req.documentName,
              documentId: req.documentId,
              documentSize: req.documentFileSize || 'N/A',
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              purpose: req.metadata?.purpose || req.purpose || 'No purpose specified',
              approvalType: (req.approvalType || '').toLowerCase(),
              approvalProcess: (req.processType || '').toLowerCase(),
              priority: (req.priority || '').toLowerCase(),
              status: (req.status || '').toLowerCase(),
              submittedDate: req.createdAt,
              approvalSteps: steps,
              approvedBy: steps.filter(s => s.hasApproved).map(s => s.approverRole || 'Unknown'),
              pendingWith: steps.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approverRole || 'Unknown'),
              recipients: recipientNames,
              currentVersion: req.version || 'v1.0',
              versions: [{ version: req.version || 'v1.0', date: req.createdAt, hash: req.documentIpfsHash }]
            };
          });
          setSentRequests(transformedSentRequests);
        }
        
        setShowRequestModal(false);
      } else {
        const errorData = await response.json();
        showNotification(`Error updating database: ${errorData.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('Error approving document:', error);
      if (error.message && error.message.includes('User denied')) {
        showNotification('Transaction cancelled by user', 'warning');
      } else if (error.message && error.message.includes('Request not active')) {
        showNotification('❌ Request not found on blockchain. Please create a new approval request.', 'error');
      } else {
        showNotification(`Failed to approve: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    // Show rejection modal instead of browser prompt
    setConfirmRequestId(requestId);
    setRejectionReason('');
    setShowRejectConfirm(true);
  };

  const confirmRejectRequest = async () => {
    const requestId = confirmRequestId;
    const reason = rejectionReason.trim();
    
    if (!reason) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }

    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('❌ Request not found in incoming requests');
      return;
    }

    if (!request.requestId) {
      console.error('❌ Request missing blockchain requestId:', request);
      showNotification('❌ This request is missing blockchain ID. Please create a new approval request.', 'error');
      return;
    }

    setShowRejectConfirm(false);
    setIsLoading(true);

    try {
      console.log('🔍 Rejecting request:', request);
      console.log('🔍 Database ID:', request.id);
      console.log('🔍 Blockchain requestId:', request.requestId);
      
      // Step 1: Reject on blockchain FIRST
      showNotification('Please confirm blockchain transaction in MetaMask...', 'info');
      
      const result = await rejectDocumentOnBlockchain(request.requestId, reason);
      const txHash = result.transactionHash;
      showNotification('✅ Blockchain rejection confirmed! Updating database...', 'success');
      
      // Step 2: ONLY update database AFTER blockchain success
      const response = await fetch(`${API_URL}/api/approvals/reject/${request.requestId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reason: reason,
          blockchainTxHash: txHash
        })
      });
      
      if (response.ok) {
        showNotification(`Request rejected successfully. TX: ${txHash.substring(0, 20)}...`, 'success');
        
        // Refresh both incoming and sent requests to update counts
        const timestamp = new Date().getTime();
        
        // Refresh incoming requests
        const refreshResponse = await fetch(`${API_URL}/api/approvals/my-tasks?t=${timestamp}`, {
          headers: getAuthHeaders(),
          cache: 'no-cache'
        });
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          const transformedRequests = (result.data || []).map(req => {
            const myStep = req.steps?.find(s => s.approverId === localStorage.getItem('userId'));
            return {
              id: req.id,
              requestId: req.requestId,
              documentName: req.documentName,
              documentSize: formatFileSize(req.documentSize || req.documentFileSize),
              documentSizeRaw: req.documentSize || req.documentFileSize,
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              requestorName: req.requester?.name || `${req.requester?.firstName || ''} ${req.requester?.lastName || ''}`.trim() || 'Unknown',
              requestorId: req.requesterId,
              requestorDepartment: req.requester?.department || 'N/A',
              requestorEmail: req.requester?.email,
              purpose: req.purpose || '',
              approvalType: req.approvalType || 'standard',
              status: req.status,
              submittedDate: new Date(req.createdAt).toLocaleDateString(),
              approvedBy: req.steps?.filter(s => s.hasApproved).map(s => s.approver?.name || 'Unknown') || [],
              pendingWith: req.steps?.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approver?.name || 'Unknown') || [],
              myStep: myStep,
              myStepStatus: myStep?.hasApproved ? 'approved' : (myStep?.hasRejected ? 'rejected' : 'pending'),
              approvedDate: myStep?.hasApproved ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectedDate: myStep?.hasRejected ? new Date(myStep.actionTimestamp * 1000).toLocaleDateString() : null,
              rejectionReason: myStep?.reason || ''
            };
          });
          setIncomingRequests(transformedRequests);
        }
        
        // Refresh sent requests
        const sentResponse = await fetch(`${API_URL}/api/approvals/my-requests?t=${timestamp}`, {
          headers: getAuthHeaders(),
          cache: 'no-cache'
        });
        if (sentResponse.ok) {
          const sentData = await sentResponse.json();
          const transformedSentRequests = (sentData.data || []).map(req => {
            const steps = req.steps || [];
            let recipientNames = ['No recipients'];
            if (steps.length > 0) {
              recipientNames = steps.map(s => {
                if (s.approver && s.approver.name) {
                  return `${s.approver.name} (${s.approver.department || s.approverRole || 'Unknown'})`;
                }
                return s.approverRole || 'Unknown Approver';
              });
            }
            
            return {
              id: req.id,
              documentName: req.documentName,
              documentId: req.documentId,
              documentSize: req.documentFileSize || 'N/A',
              ipfsHash: req.documentIpfsHash,
              txId: req.blockchainTxHash,
              purpose: req.metadata?.purpose || req.purpose || 'No purpose specified',
              approvalType: (req.approvalType || '').toLowerCase(),
              approvalProcess: (req.processType || '').toLowerCase(),
              priority: (req.priority || '').toLowerCase(),
              status: (req.status || '').toLowerCase(),
              submittedDate: req.createdAt,
              approvalSteps: steps,
              approvedBy: steps.filter(s => s.hasApproved).map(s => s.approverRole || 'Unknown'),
              pendingWith: steps.filter(s => !s.hasApproved && !s.hasRejected).map(s => s.approverRole || 'Unknown'),
              recipients: recipientNames,
              currentVersion: req.version || 'v1.0',
              versions: [{ version: req.version || 'v1.0', date: req.createdAt, hash: req.documentIpfsHash }]
            };
          });
          setSentRequests(transformedSentRequests);
        }
        
        setShowRequestModal(false);
      } else {
        const errorData = await response.json();
        showNotification(`Error updating database: ${errorData.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('Error rejecting document:', error);
      if (error.message && error.message.includes('User denied')) {
        showNotification('Transaction cancelled by user', 'warning');
      } else if (error.message && error.message.includes('Request not active')) {
        showNotification('❌ Request not found on blockchain. Please create a new approval request.', 'error');
      } else {
        showNotification(`Failed to reject: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleViewDocumentDetails = (doc) => {
    console.log('Document details:', doc); // Debug log
    setSelectedDocForDetails(doc);
    setShowDocumentDetails(true);
  };

  const handlePreviewDocument = (ipfsHash) => {
    if (!ipfsHash) {
      showNotification('No IPFS hash available for preview', 'error');
      return;
    }
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, '_blank');
  };

  const handleDownloadVersion = async (version) => {
    try {
      const ipfsHash = version.hash || version.ipfsHash;
      if (!ipfsHash) {
        showNotification('No IPFS hash available for download', 'error');
        return;
      }
      
      showNotification(`Downloading from IPFS: ${ipfsHash.substring(0, 20)}...`, 'success');
      
      // Download from IPFS gateway
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      window.open(ipfsUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('Failed to download document', 'error');
    }
  };

  const handleDownloadDocument = async (ipfsHash, fileName) => {
    try {
      if (!ipfsHash) {
        showNotification('No IPFS hash available for download', 'error');
        return;
      }
      
      showNotification('Downloading document...', 'info');
      
      // Use IPFS gateway to download
      const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      
      // Create invisible link and trigger download
      const link = document.createElement('a');
      link.href = ipfsUrl;
      link.download = fileName || 'document.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Download started', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showNotification('Failed to download document', 'error');
    }
  };

  const handleContinueDraft = (doc) => {
    // Pre-fill form with draft data
    showNotification(`Continuing draft: ${doc.documentName}`, 'info');
    setActiveTab('send');
    // Here you would actually populate the form fields
  };

  const handleCancelApproval = async (docId) => {
    if (confirm('❌ Cancel Approval Request?\n\nThis will:\n• Withdraw the request from all approvers\n• Update blockchain status\n• Notify all recipients\n\nAre you sure?')) {
      try {
        // TODO: Add backend API call here when backend endpoint is ready
        // const response = await fetch(`${API_URL}/api/approvals/${docId}/cancel`, {
        //   method: 'POST',
        //   headers: getAuthHeaders()
        // });
        
        // For now, update frontend state
        const cancelledDate = new Date().toLocaleString();
        setSentRequests(prev => prev.map(req => 
          req.id === docId ? { 
            ...req, 
            status: 'cancelled',
            cancelledDate: cancelledDate
          } : req
        ));
        
        // Close details modal if open
        if (showDocumentDetails && selectedDocForDetails?.id === docId) {
          setShowDocumentDetails(false);
        }
        
        showNotification('✅ Approval request canceled successfully!', 'success');
      } catch (error) {
        console.error('Error canceling approval:', error);
        showNotification('❌ Failed to cancel approval request', 'error');
      }
    }
  };

  const filteredSentRequests = sentRequests.filter(req => {
    if (activeHistoryTab === 'all') return true;
    if (activeHistoryTab === 'draft') return false; // Drafts are handled separately
    return req.status === activeHistoryTab;
  }).filter(req => {
    // Search filter
    if (!historySearchQuery) return true;
    const query = historySearchQuery.toLowerCase();
    return (
      req.documentName.toLowerCase().includes(query) ||
      (req.purpose || '').toLowerCase().includes(query) ||
      (req.recipients || []).some(r => r.toLowerCase().includes(query))
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
    // Status filter based on active tab - case insensitive
    const reqStatus = req.status?.toLowerCase();
    if (activeReceiveTab === 'pending' && reqStatus !== 'pending') return false;
    if (activeReceiveTab === 'approved' && reqStatus !== 'approved') return false;
    if (activeReceiveTab === 'rejected' && reqStatus !== 'rejected') return false;

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
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <i className={`ri-${notification.type === 'success' ? 'checkbox-circle' : notification.type === 'warning' ? 'alert' : 'information'}-line`}></i>
          <span>{notification.message}</span>
          <button className="close-notification" onClick={() => setNotification(null)}>
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
      
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
                    <h4>{selectedDocument.name || selectedDocument.fileName}</h4>
                    <div className="doc-meta">
                      <span><i className="ri-database-2-line"></i> {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}</span>
                      <span><i className="ri-shield-check-line"></i> Verified on Blockchain</span>
                      <span><i className="ri-calendar-line"></i> {selectedDocument.createdAt ? new Date(selectedDocument.createdAt).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <div className="doc-hashes">
                      <div className="hash-item">
                        <small>IPFS Hash:</small>
                        <code>{selectedDocument.ipfsHash || 'N/A'}</code>
                      </div>
                      <div className="hash-item">
                        <small>Transaction Hash:</small>
                        <code>{selectedDocument.transactionHash || 'N/A'}</code>
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
                    <h4>📄 Select Blockchain Document ({blockchainDocuments.filter(doc => {
                      const searchLower = documentSearchQuery.toLowerCase();
                      return (doc.name || doc.fileName || doc.filename || '').toLowerCase().includes(searchLower) ||
                             (doc.ipfsHash || '').toLowerCase().includes(searchLower);
                    }).length} available)</h4>
                    <button className="btn-close" onClick={() => setShowFileSelector(false)}>
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                  <div className="search-bar" style={{padding: '0 20px 15px'}}>
                    <i className="ri-search-line"></i>
                    <input 
                      type="text" 
                      placeholder="Search documents by name or IPFS hash..."
                      value={documentSearchQuery}
                      onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    />
                    {documentSearchQuery && (
                      <button className="clear-search" onClick={() => setDocumentSearchQuery('')}>
                        <i className="ri-close-line"></i>
                      </button>
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-state">
                      <i className="ri-loader-4-line spinning"></i>
                      <p>Loading documents...</p>
                    </div>
                  ) : blockchainDocuments.length === 0 ? (
                    <div className="empty-state">
                      <i className="ri-file-list-line"></i>
                      <p>No documents found. Please upload a document first in File Manager.</p>
                    </div>
                  ) : (
                    <div className="file-list">
                      {blockchainDocuments.filter(doc => {
                        const searchLower = documentSearchQuery.toLowerCase();
                        return (doc.name || doc.fileName || doc.filename || '').toLowerCase().includes(searchLower) ||
                               (doc.ipfsHash || '').toLowerCase().includes(searchLower);
                      }).map(doc => (
                        <div key={doc.id} className="file-item" onClick={() => handleDocumentSelect(doc)}>
                          <i className="ri-file-pdf-line file-icon"></i>
                          <div className="file-details">
                            <strong>{doc.name || doc.fileName || doc.filename || 'Untitled Document'}</strong>
                            <small>
                              {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'} • 
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'No date'}
                            </small>
                            {doc.ipfsHash ? (
                              <small className="ipfs-hash">
                                IPFS: {doc.ipfsHash.substring(0, 20)}...
                              </small>
                            ) : null}
                          </div>
                          <span className="status-badge verified">
                            <i className="ri-checkbox-circle-line"></i> Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
                        {(recipient.fullName || recipient.name || 'U').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="recipient-info">
                        <strong>{recipient.fullName || recipient.name || recipient.email}</strong>
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
              <button className="btn-outline" onClick={handlePreview}>
                <i className="ri-eye-line"></i>
                Preview Request
              </button>
              <button className="btn-success" onClick={handleGenerateRequest} disabled={isGenerating}>
                <i className="ri-send-plane-fill"></i>
                {isGenerating ? 'Generating...' : 'Generate & Send Request'}
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
                  <i className="ri-draft-line"></i> Drafts <span className="count">{JSON.parse(localStorage.getItem('approvalDrafts') || '[]').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('rejected')}
                >
                  <i className="ri-close-circle-line"></i> Rejected <span className="count">{sentRequests.filter(r => r.status === 'rejected').length}</span>
                </button>
                <button 
                  className={`history-tab ${activeHistoryTab === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('cancelled')}
                >
                  <i className="ri-indeterminate-circle-line"></i> Canceled <span className="count">{sentRequests.filter(r => r.status === 'cancelled').length}</span>
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
                            {req.status === 'approved' && <span className="status-dot green"></span>}
                            {req.status === 'partial' && <i className="ri-progress-3-line"></i>}
                            {req.status === 'pending' && <i className="ri-time-line"></i>}
                            {req.status === 'draft' && <i className="ri-draft-line"></i>}
                            {req.status === 'rejected' && <i className="ri-close-circle-fill"></i>}
                            {req.status === 'cancelled' && <i className="ri-indeterminate-circle-line"></i>}
                            {(req.status || '').toUpperCase()}
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
                
                {/* Show drafts when draft tab is active */}
                {activeHistoryTab === 'draft' ? (
                  (() => {
                    const savedDrafts = JSON.parse(localStorage.getItem('approvalDrafts') || '[]');
                    return savedDrafts.length === 0 ? (
                      <div className="empty-table-state">
                        <i className="ri-draft-line"></i>
                        <p>No saved drafts found</p>
                        <small>Save a draft from the approval request form to continue later</small>
                      </div>
                    ) : (
                      <div className="drafts-list" style={{ padding: '20px' }}>
                        {savedDrafts.map(draft => (
                          <div key={draft.id} className="draft-card">
                            <div className="draft-header">
                              <h4>{draft.document.name || draft.document.fileName}</h4>
                              <small>Saved: {new Date(draft.savedAt).toLocaleString()}</small>
                            </div>
                            <div className="draft-details">
                              <span><i className="ri-user-line"></i> {draft.recipients.length} approvers</span>
                              <span><i className="ri-settings-line"></i> {draft.approvalType}</span>
                              <span><i className="ri-flow-chart"></i> {draft.approvalProcess}</span>
                              {draft.purpose && <span><i className="ri-chat-quote-line"></i> {draft.purpose.substring(0, 50)}...</span>}
                            </div>
                            <div className="draft-actions">
                              <button className="btn-primary" onClick={() => { handleLoadDraft(draft); setActiveTab('send'); }}>
                                <i className="ri-edit-line"></i> Continue Editing
                              </button>
                              <button className="btn-danger" onClick={() => handleDeleteDraft(draft.id)}>
                                <i className="ri-delete-bin-line"></i> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : filteredSentRequests.length === 0 ? (
                  <div className="empty-table-state">
                    <i className="ri-folder-open-line"></i>
                    <p>No documents in this category</p>
                  </div>
                ) : null}
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
                      <span className="tab-count">{incomingRequests.filter(r => r.status?.toLowerCase() === 'pending').length}</span>
                    </div>
                  </button>
                  <button 
                    className={`receive-tab ${activeReceiveTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveReceiveTab('approved')}
                  >
                    <i className="ri-checkbox-circle-line"></i>
                    <div className="tab-content">
                      <span className="tab-title">Approved</span>
                      <span className="tab-count">{incomingRequests.filter(r => r.status?.toLowerCase() === 'approved').length}</span>
                    </div>
                  </button>
                  <button 
                    className={`receive-tab ${activeReceiveTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveReceiveTab('rejected')}
                  >
                    <i className="ri-close-circle-line"></i>
                    <div className="tab-content">
                      <span className="tab-title">Rejected</span>
                      <span className="tab-count">{incomingRequests.filter(r => r.status?.toLowerCase() === 'rejected').length}</span>
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
                      const status = r.status?.toLowerCase();
                      if (activeReceiveTab === 'pending') return status === 'pending';
                      if (activeReceiveTab === 'approved') return status === 'approved';
                      if (activeReceiveTab === 'rejected') return status === 'rejected';
                      return true;
                    }).length}</strong> requests
                  </span>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="approval-card">
              <div className="card-header">
                <h3>
                  {activeReceiveTab === 'pending' && <><i className="ri-time-line"></i> Pending Requests</>}
                  {activeReceiveTab === 'approved' && <><i className="ri-checkbox-circle-line"></i> Approved Requests</>}
                  {activeReceiveTab === 'rejected' && <><i className="ri-close-circle-line"></i> Rejected Requests</>}
                  {activeReceiveTab === 'all' && <><i className="ri-inbox-line"></i> All Requests</>}
                </h3>
                <span className="request-count">{filteredIncomingRequests.length} requests</span>
              </div>

              <div className="requests-table-wrapper">
                {filteredIncomingRequests.length > 0 ? (
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>From</th>
                        <th>Purpose</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncomingRequests.map(request => (
                        <tr key={request.id} className={`request-row ${request.status}`}>
                          <td>
                            <div className="document-cell">
                              <div className="doc-icon">
                                <i className="ri-file-text-line"></i>
                              </div>
                              <div className="doc-info">
                                <div className="doc-name">{request.documentName}</div>
                                <div className="doc-meta">
                                  <span className="doc-size">{request.documentSize}</span>
                                  {request.ipfsHash && (
                                    <>
                                      <span className="separator">•</span>
                                      <span className="ipfs-badge" title={request.ipfsHash}>
                                        <i className="ri-link"></i> IPFS
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="requestor-cell">
                              <div className="requestor-name">
                                <i className="ri-user-line"></i>
                                {request.requestorName}
                              </div>
                              <div className="requestor-dept">{request.requestorDepartment}</div>
                            </div>
                          </td>
                          <td>
                            <div className="purpose-cell" title={request.purpose}>
                              {request.purpose ? (
                                request.purpose.length > 50 
                                  ? `${request.purpose.substring(0, 50)}...` 
                                  : request.purpose
                              ) : 'No purpose specified'}
                            </div>
                          </td>
                          <td>
                            <span className={`type-badge ${request.approvalType}`}>
                              {request.approvalType === 'DIGITAL_SIGNATURE' || request.approvalType === 'digital' ? (
                                <><i className="ri-shield-keyhole-line"></i> Digital</>
                              ) : (
                                <><i className="ri-checkbox-circle-line"></i> Standard</>
                              )}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${request.status}`}>
                              {request.status === 'approved' && <span className="status-dot green"></span>}
                              {request.status === 'rejected' && <i className="ri-close-circle-fill"></i>}
                              {request.status === 'pending' && <i className="ri-time-line"></i>}
                              {(request.status || 'pending').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="date-cell">
                              {request.submittedDate}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              <button 
                                className="btn-icon" 
                                onClick={() => handleViewRequest(request)}
                                title="View Details"
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              {(request.status || '').toLowerCase() === 'pending' && (
                                <>
                                  <button 
                                    className="btn-icon success" 
                                    onClick={() => handleApproveRequest(request.id)}
                                    title={request.approvalType === 'DIGITAL_SIGNATURE' ? 'Sign & Approve' : 'Approve'}
                                  >
                                    <i className="ri-checkbox-circle-line"></i>
                                  </button>
                                  <button 
                                    className="btn-icon danger" 
                                    onClick={() => handleRejectRequest(request.id)}
                                    title="Reject Request"
                                  >
                                    <i className="ri-close-circle-line"></i>
                                  </button>
                                </>
                              )}
                              {(request.status || '').toLowerCase() !== 'pending' && (
                                <button 
                                  className="btn-icon primary" 
                                  onClick={() => handleDownloadDocument(request.ipfsHash, request.documentName)}
                                  title="Download Document"
                                >
                                  <i className="ri-download-line"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-table-state">
                    <i className="ri-inbox-line"></i>
                    <p>No {activeReceiveTab} requests found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowRecipientModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Recipient (Faculty & Admin Only)</h3>
              <button className="btn-close" onClick={() => setShowRecipientModal(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="search-bar" style={{marginBottom: '20px'}}>
                <i className="ri-search-line"></i>
                <input 
                  type="text" 
                  placeholder="Search by name, email or department..."
                  value={recipientSearchQuery}
                  onChange={(e) => setRecipientSearchQuery(e.target.value)}
                />
                {recipientSearchQuery && (
                  <button className="clear-search" onClick={() => setRecipientSearchQuery('')}>
                    <i className="ri-close-line"></i>
                  </button>
                )}
              </div>
              <div className="users-list">
                {availableUsers.filter(user => {
                  // Filter out students - only show faculty and admin
                  const role = (user.role || '').toLowerCase();
                  if (role === 'student') return false;
                  
                  // Apply search filter
                  const searchLower = recipientSearchQuery.toLowerCase();
                  return (user.fullName || user.name || '').toLowerCase().includes(searchLower) ||
                         (user.email || '').toLowerCase().includes(searchLower) ||
                         (user.department || '').toLowerCase().includes(searchLower);
                }).map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      {(user.fullName || user.name || 'U').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-info">
                      <strong>{user.fullName || user.name || user.email}</strong>
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
                      {selectedRequest.status === 'approved' && <span className="status-dot green"></span>}
                      {selectedRequest.status === 'rejected' && <i className="ri-close-circle-fill"></i>}
                      {selectedRequest.status === 'pending' && <i className="ri-time-line"></i>}
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
                <div className="preview-container">
                  {selectedRequest.ipfsHash ? (
                    <>
                      <div className="pdf-preview-frame">
                        <iframe
                          src={`https://ipfs.io/ipfs/${selectedRequest.ipfsHash}`}
                          title="Document Preview"
                          className="pdf-iframe"
                        />
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => window.open(`https://ipfs.io/ipfs/${selectedRequest.ipfsHash}`, '_blank')}
                      >
                        <i className="ri-external-link-line"></i>
                        Open Full Preview
                      </button>
                    </>
                  ) : (
                    <div className="preview-placeholder">
                      <i className="ri-file-pdf-line"></i>
                      <p>No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => handleDownloadDocument(selectedRequest.ipfsHash, selectedRequest.documentName)}>
                <i className="ri-download-line"></i>
                Download
              </button>
              {(selectedRequest.status || '').toLowerCase() === 'pending' && (
                <>
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
                </>
              )}
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
                      {selectedDocForDetails.status === 'cancelled' && <i className="ri-indeterminate-circle-line"></i>}
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

              {/* Recipients & Approval Timeline */}
              <div className="detail-section">
                <h4><i className="ri-team-line"></i> Approval Timeline</h4>
                {selectedDocForDetails.approvalSteps && selectedDocForDetails.approvalSteps.length > 0 ? (
                  <div className="approval-timeline">
                    {selectedDocForDetails.approvalSteps.map((step, idx) => {
                      const isApproved = step.hasApproved;
                      const isRejected = step.hasRejected;
                      const isPending = !isApproved && !isRejected;
                      const approver = step.approver || {};
                      
                      // Determine display name
                      let displayName = 'Unknown Approver';
                      if (approver.name) {
                        displayName = approver.name;
                      } else if (step.approverRole) {
                        displayName = step.approverRole;
                      }
                      
                      // Determine department
                      let department = approver.department || 'Department not specified';
                      
                      // Determine role
                      let role = approver.role || step.approverRole || 'Approver';
                      
                      return (
                        <div key={idx} className={`timeline-item ${isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}`}>
                          <div className="timeline-marker">
                            <div className={`timeline-dot ${isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}`}>
                              {isApproved ? (
                                <i className="ri-checkbox-circle-fill"></i>
                              ) : isRejected ? (
                                <i className="ri-close-circle-fill"></i>
                              ) : (
                                <i className="ri-time-line"></i>
                              )}
                            </div>
                            {idx < selectedDocForDetails.approvalSteps.length - 1 && (
                              <div className={`timeline-line ${isApproved ? 'completed' : ''}`}></div>
                            )}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <div className="timeline-header-info">
                                <strong>{displayName}</strong>
                                {approver.email && (
                                  <span className="timeline-email">{approver.email}</span>
                                )}
                                {!approver.name && step.approverWallet && (
                                  <span className="timeline-wallet">
                                    <code>{step.approverWallet.substring(0, 10)}...{step.approverWallet.substring(step.approverWallet.length - 8)}</code>
                                  </span>
                                )}
                              </div>
                              <span className={`timeline-badge ${isApproved ? 'success' : isRejected ? 'danger' : 'warning'}`}>
                                {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                            <div className="timeline-meta">
                              <span className="timeline-dept">
                                <i className="ri-building-line"></i>
                                {department}
                              </span>
                              <span>•</span>
                              <span className="timeline-role">
                                <i className="ri-shield-user-line"></i>
                                {role}
                              </span>
                              <span>•</span>
                              <span>Step {step.stepOrder}</span>
                            </div>
                            {step.actionTimestamp && (
                              <div className="timeline-timestamp">
                                <i className="ri-time-line"></i>
                                {isApproved ? 'Approved' : 'Rejected'} on {new Date(step.actionTimestamp * 1000).toLocaleString()}
                              </div>
                            )}
                            {step.reason && (
                              <div className="timeline-reason">
                                <i className="ri-chat-quote-line"></i>
                                <em>"{step.reason}"</em>
                              </div>
                            )}
                            {step.blockchainTxHash && (
                              <div className="timeline-tx">
                                <i className="ri-links-line"></i>
                                <code>{step.blockchainTxHash.substring(0, 20)}...</code>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-timeline-data">
                    <div className="no-data-icon">
                      <i className="ri-user-search-line"></i>
                    </div>
                    <p className="no-data-title">No Recipients Found</p>
                    <p className="no-data-message">
                      This approval request doesn't have any assigned recipients yet. 
                      This might be an old request created before the approval system was fully configured.
                    </p>
                    {selectedDocForDetails.recipients && selectedDocForDetails.recipients.length > 0 && 
                     selectedDocForDetails.recipients[0] !== 'No recipients' && (
                      <div className="fallback-recipients">
                        <p><strong>Expected Recipients:</strong></p>
                        <ul>
                          {selectedDocForDetails.recipients.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

              {/* Cancellation Info */}
              {selectedDocForDetails.status === 'cancelled' && (
                <div className="detail-section cancellation-section">
                  <h4><i className="ri-indeterminate-circle-line"></i> Request Canceled</h4>
                  <div className="cancellation-info">
                    <p>This approval request was canceled by the requestor.</p>
                    {selectedDocForDetails.cancelledDate && (
                      <p><strong>Canceled on:</strong> {selectedDocForDetails.cancelledDate}</p>
                    )}
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
                <div className="blockchain-actions">
                  <button 
                    className="btn-outline" 
                    onClick={() => handlePreviewDocument(selectedDocForDetails.ipfsHash)}
                  >
                    <i className="ri-eye-line"></i>
                    Preview Document
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => handleDownloadVersion({ hash: selectedDocForDetails.ipfsHash, version: selectedDocForDetails.currentVersion })}
                  >
                    <i className="ri-download-line"></i>
                    Download
                  </button>
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
                              showNotification('Restore functionality will create a new version based on this one.', 'info');
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

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="ri-eye-line"></i> Preview Approval Request</h3>
              <button className="btn-close" onClick={() => setShowPreview(false)}>
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-section">
                <h4>📄 Document Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Document Name:</label>
                    <span>{previewData.document.name || previewData.document.fileName}</span>
                  </div>
                  <div className="info-item">
                    <label>File Size:</label>
                    <span>{previewData.document.fileSize ? `${(previewData.document.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>IPFS Hash:</label>
                    <code>{previewData.document.ipfsHash || 'N/A'}</code>
                  </div>
                  <div className="info-item">
                    <label>Transaction Hash:</label>
                    <code>{previewData.document.transactionHash || 'N/A'}</code>
                  </div>
                </div>
              </div>

              <div className="preview-section">
                <h4>👥 Approvers ({previewData.recipients.length})</h4>
                <div className="approvers-list">
                  {previewData.recipients.map((recipient, index) => (
                    <div key={recipient.id} className="approver-card">
                      <div className="approver-number">#{index + 1}</div>
                      <div className="approver-avatar">
                        {(recipient.fullName || recipient.name || 'U').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="approver-info">
                        <strong>{recipient.fullName || recipient.name}</strong>
                        <span className="role-badge">{recipient.customRole}</span>
                        <small>{recipient.email}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="preview-section">
                <h4>⚙️ Approval Configuration</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Approval Type:</label>
                    <span className="badge">{previewData.approvalType === 'digital' ? '🔐 Digital Signature' : '✅ Standard Approval'}</span>
                  </div>
                  <div className="info-item">
                    <label>Process Type:</label>
                    <span className="badge">{previewData.approvalProcess === 'sequential' ? '📋 Sequential' : '🔄 Parallel'}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Purpose:</label>
                    <p>{previewData.purpose || 'No purpose specified'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowPreview(false)}>
                <i className="ri-close-line"></i> Close
              </button>
              <button className="btn-success" onClick={() => { setShowPreview(false); handleGenerateRequest(); }}>
                <i className="ri-send-plane-fill"></i> Confirm & Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="modal-overlay" onClick={() => setShowApproveConfirm(false)}>
          <div className="modal-box confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="ri-checkbox-circle-line"></i>
                Approve Document?
              </h3>
            </div>
            <div className="modal-body">
              <div className="confirmation-content">
                <p className="confirmation-icon">✅</p>
                <p className="confirmation-text">This will:</p>
                <ul className="confirmation-list">
                  <li>• Record your approval on blockchain</li>
                  <li>• Generate new version with approval stamp</li>
                  <li>• Move to next approver (if sequential)</li>
                  <li>• Notify requestor of progress</li>
                </ul>
                <p className="confirmation-question">Proceed with approval?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowApproveConfirm(false)}>
                <i className="ri-close-line"></i>
                Cancel
              </button>
              <button className="btn-success" onClick={confirmApproveRequest}>
                <i className="ri-checkbox-circle-line"></i>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="modal-overlay" onClick={() => setShowRejectConfirm(false)}>
          <div className="modal-box confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="ri-close-circle-line"></i>
                Reject Approval Request
              </h3>
            </div>
            <div className="modal-body">
              <div className="confirmation-content">
                <p className="confirmation-icon">❌</p>
                <p className="confirmation-text">Please provide a reason for rejection:</p>
                <p className="confirmation-subtext">(This will be sent to the requestor)</p>
                <textarea
                  className="rejection-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowRejectConfirm(false)}>
                <i className="ri-close-line"></i>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmRejectRequest}>
                <i className="ri-close-circle-line"></i>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentApproval;